---
title: "从零跑通 AnatoMask：医学图像分割模型的部署与训练全记录"
published: 2025-04-28
description: "自监督预训练 + nnUNet 体系的医学分割模型 AnatoMask，部署和训练全是硬骨头。从环境安装、数据集转换到 STUNet 预训练、权重加载、3D U-Net 训练，我把完整流程和踩过的坑压缩成一篇实操笔记，照着跑就行。"
tags: ["AnatoMask", "医学图像分割", "nnUNet", "STUNet", "PyTorch"]
category: "AI"
draft: false
image: "/images/covers/wall-02.webp"
---

# 从零跑通 AnatoMask：部署与训练全记录

AnatoMask 是"利用重建引导自掩蔽增强医学图像分割"的模型，整体构建在 nnUNet 体系之上，核心模块是 STUNet（在 nnUNet 的训练器变体里做自监督预训练）。我这次在云端 GPU 环境完整跑了一遍：装环境 → 转数据集 → 预处理 → 预训练 → 加载权重 → 训练，把每一步的实操记录合并成一篇，踩过的坑也一并写上。

## 一、安装与依赖

项目解压后以可编辑模式安装，再单独装两个关键依赖（版本要锁死，太新的 torch 容易和 nnUNet 这套老代码打架）：

```bash
unzip AnatoMask-main.zip
cd AnatoMask-main
pip install -e .
pip install torch==2.0.1 simpleitk==2.3.1
```

![安装过程记录图](/images/posts/anatomask-deploy-and-training/01.webp)

## 二、设置 nnUNet 环境变量

nnUNet 靠三个环境变量定位数据，缺一不可。一次性建好目录并写进 `.bashrc`：

```bash
mkdir -p ~/work/nnUNet/nnUNet_raw ~/work/nnUNet/nnUNet_preprocessed ~/work/nnUNet/nnUNet_results

export nnUNet_raw=~/work/nnUNet/nnUNet_raw
export nnUNet_preprocessed=~/work/nnUNet/nnUNet_preprocessed
export nnUNet_results=~/work/nnUNet/nnUNet_results

echo 'export nnUNet_raw=~/work/nnUNet/nnUNet_raw' >> ~/.bashrc
echo 'export nnUNet_preprocessed=~/work/nnUNet/nnUNet_preprocessed' >> ~/.bashrc
echo 'export nnUNet_results=~/work/nnUNet/nnUNet_results' >> ~/.bashrc
source ~/.bashrc
```

三个目录各管一摊：

- `nnUNet_raw`：原始数据集，按 `DatasetXXX_Name/imagesTr + labelsTr + dataset.json` 的约定组织；
- `nnUNet_preprocessed`：预处理后的数据，按 `DatasetXXX_Name/nnUNetPlans_3d_fullres` 存放，含 `nnUNetPlans.json` 计划文件和 `splits_final.json` 划分文件；
- `nnUNet_results`：训练测试结果，路径形如 `nnUNet/3d_fullres/TaskXXX/STUNetTrainer__nnUNetPlans__3d_fullres/fold_0/`，里面有 `model_final_checkpoint.model` 权重、`validation.json` 评估报告、`training_log.txt` 日志。

## 三、准备 TotalSegmentator 数据集

数据集解压后，我写了一个转换脚本，把它转成 nnUNet 要求的格式。核心逻辑几条：

1. **划分**：随机打乱后按 8:2 切训练集和测试集（`np.random.seed(42)` 固定随机种子）；
2. **合并标签**：TotalSegmentator 每个器官是一张独立的分割图，需要扫描所有病例收集唯一的标签名，建 `label_map`，然后把同一病例的所有分割合并成一张多标签图，写进 `labelsTr/labelsTs`；
3. **配准**：合并时以 CT 图像为参考，`nibabel` 读取 shape 和 affine，维度不匹配的标签直接跳过并打印警告；
4. **生成 dataset.json**：写上模态（CT）、标签字典、训练/测试数量。

```bash
pip install nibabel
python convert_totalsegmentator.py
```

注意转换完的 `dataset.json` 里 `numTraining` 和 `numTest` 要按实际情况改，我这份数据集是 765 训练 / 246 测试。

![数据集转换过程记录图](/images/posts/anatomask-deploy-and-training/02.webp)

## 四、nnUNet 预处理

```bash
./run_nnunet.sh nnUNetv2_plan_and_preprocess -d 201 --verify_dataset_integrity
```

`--verify_dataset_integrity` 会先做数据完整性检查，有问题早暴露，别等训练跑一半才炸。`-d 201` 对应 Dataset201。

## 五、用 AnatoMask 做预训练

AnatoMask 的自监督预训练是挂在 nnUNet 训练器上的：STUNet 模块位于 `nnunetv2/training/nnUNetTrainer/variants/pretrain/STUNet.py`。直接用 nnUNet 的训练入口启动：

```bash
./run_nnunet.sh nnUNetv2_train 201 3d_fullres 0 --npz
```

`0` 是 fold 号，`--npz` 保存预测结果。预训练结束会得到包含 teacher 权重（预训练模型）的 checkpoint。

## 六、自定义加载预训练权重

这是最需要小心的环节：nnUNet 自带的加载逻辑和 AnatoMask 的权重文件对不上，直接 load 会报 key 不匹配。我写了一个自定义加载函数——从 checkpoint 里取 `teacher` 键，按"键存在且形状一致"过滤一遍再灌进网络，能加载多少算多少：

```python
def load_anatomask_weights(network, fname, verbose=False):
    """加载 AnatoMask 预训练权重到 nnUNet 模型"""
    import torch

    saved_model = torch.load(fname)
    pretrained_dict = saved_model['teacher']

    model_dict = network.state_dict()
    pretrained_dict = {k: v for k, v in pretrained_dict.items()
                       if k in model_dict and v.shape == model_dict[k].shape}

    if verbose:
        print(f"加载了 {len(pretrained_dict)} 个参数")

    model_dict.update(pretrained_dict)
    network.load_state_dict(model_dict)
    return network
```

形状过滤很关键：网络结构不完全一致时，只有匹配的层会被迁移，剩下的是冷启动。

## 七、训练：从冒烟测试到完整管线

训练阶段我分了两步走，先验证管线，再上正式训练，这个习惯救了我好几次。

### 第一步：MiniUNet3D 冒烟测试

先用一个极简的 3D U-Net（单编码器单解码器）跑通整个流程：加载真实数据 → 裁剪到 64³ → 归一化 → 前向 → 算损失 → 反向。这一步的目的是确认数据加载、张量形状、损失计算都没问题，模型再小也没关系。当时标签唯一值有 118 个，所以输出通道数设成 118，损失用 `CrossEntropyLoss(ignore_index=-1)`。

![训练过程记录图](/images/posts/anatomask-deploy-and-training/06.webp)

### 第二步：SimpleUNet3D 正式训练

管线验证通过后，换成完整的 3D U-Net：三层编码器、三层解码器、跳跃连接、BatchNorm、Dropout(0.3)，输出 118 类。配套的数据类 `MedicalDataset3D` 做了几件事：

- 自动配对图像和标签（按 case_id 对应 `xxx_0000.nii.gz` 和 `xxx.nii.gz`）；
- 随机裁剪 64³ 块（图像不够大就截前 64 像素）；
- 简单的均值方差归一化；
- 支持 `max_items` 限量，先用 10 个样本调试，避免一开始就在全量数据上烧钱。

训练配置：

- 优化器 Adam，初始学习率 1e-3；
- `ReduceLROnPlateau` 按验证损失减半学习率（factor=0.5, patience=3）；
- 20 个 epoch，每 5 个 batch 打印一次 loss；
- 每个 epoch 存最佳模型（`best_model.pth`），每 5 个 epoch 存完整 checkpoint（含优化器、调度器状态和历史）；
- 训练结束后自动画损失曲线和学习率曲线。

![训练结果图](/images/posts/anatomask-deploy-and-training/05.webp)

## 复盘：几个值得记住的点

1. **版本锁死**：nnUNet 系的代码对 torch 版本敏感，`torch==2.0.1` 是踩出来的稳定组合；
2. **先验证再烧钱**：无论数据集多大，先用 `max_items=10` 加小模型跑通全流程，确认 shape 和 loss 都对，再放开跑全量；
3. **权重加载别硬来**：预训练权重和下游网络结构不完全一致是常态，按 key + shape 过滤后再加载，比报错后手动删 key 高效得多；
4. **数据转换是重头戏**：多标签合并、affine 对齐、dataset.json 的 `numTraining/numTest` 改对，这步省下来的时间够训练跑好几个 epoch。

整套流程跑下来，AnatoMask 从"装环境"到"模型能训"的路径就完全清晰了，之后换数据集、调结构都只是参数活。
