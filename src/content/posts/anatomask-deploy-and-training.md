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

## 先认识一下 AnatoMask

开跑之前，先搞清楚我们要装的到底是什么。AnatoMask 官方的假设简单得可爱：**蒙版图像建模 + ConvNet 主干 = 医学图像分割的成功**。

它的核心是一种重建引导的掩蔽策略：让模型通过重建损失去学习那些有解剖学意义的区域。具体靠自我蒸馏实现——教师网络先识别出需要掩蔽的重要区域，生成一个更难的掩蔽区域，再交给学生网络去解。为了防止网络在训练初期就收敛到次优解，还设计了一个由易到难的掩蔽动态函数来控制掩码图像建模任务的难度，相当于给模型安排"先做简单题、再做难题"的渐进式练习，数据增强的快乐它也有份。

目前项目提供两种预训练路线：一是 SparK，CNN 版的掩码自编码器；二是 AnatoMask，它通过引导困难区域来细化 SparK，得到更难的预训练掩码。骨干网络全部是 CNN，官方说这样能保证分割的最佳性能。预训练完成后，权重可以迁移到下游分割任务做微调。论文引用：Li, Y., Luan, T., Wu, Y., Pan, S., Chen, Y., & Yang, X. (2024). AnatoMask: Enhancing Medical Image Segmentation with Reconstruction-guided Self-masking. arXiv:2407.06468。

## 一、安装与依赖

项目解压后以可编辑模式安装，再单独装两个关键依赖（版本要锁死，太新的 torch 容易和 nnUNet 这套老代码打架）：

```bash
unzip AnatoMask-main.zip
cd AnatoMask-main
pip install -e .
pip install torch==2.0.1 simpleitk==2.3.1
```

![安装过程记录图](/images/posts/anatomask-deploy-and-training/01.webp)

官方 README 给出的软件包组合是 `cuda==12.1 torch==2.0.1 simpleitk==2.3.1`，照着这个来基本不会出幺蛾子。如果是在 Arch 系的机器上，还要先装系统依赖：

```bash
sudo pacman -S python python-pip cuda nvidia-utils
```

建议建一个虚拟环境隔离依赖，别污染系统 Python：

```bash
python -m venv anatomask_env
source anatomask_env/bin/activate
pip install --upgrade pip

# 用清华镜像加速下载
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
pip config set global.extra-index-url https://download.pytorch.org/whl/cu121
```

装完先验证三件套，确认 CUDA 可用再继续：

```bash
python -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}')"
python -c "import SimpleITK; print(f'SimpleITK version: {SimpleITK.__version__}')"
```

![安装验证输出：PyTorch 版本、CUDA 可用性与 SimpleITK 版本检查](/images/posts/anatomask-deploy-and-training/07.webp)

另一份部署记录里装的是 `SimpleITK==2.4.1`，也能正常跑，版本上不必太纠结，认准 README 锁定的 2.3.1 最稳。

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

顺手验证一下环境变量是否真的生效：

```bash
python -c "import os; print('nnUNet_raw:', os.environ.get('nnUNet_raw')); print('nnUNet_preprocessed:', os.environ.get('nnUNet_preprocessed')); print('nnUNet_results:', os.environ.get('nnUNet_results'))"
```

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

注意转换完的 `dataset.json` 里 `numTraining` 和 `numTest` 要按实际情况改，我这份数据集是 765 训练 / 246 测试。nnUNetv2 还要求补上 `channel_names`（`"0": "CT"`）和 `file_ending`（`.nii.gz`）这两个键，缺了会报错。转换后的目录结构长这样：

```
nnUNet_raw/
└── Dataset201_Totalsegmentator
    ├── imagesTr   # 训练集图像
    ├── labelsTr   # 训练集标签
    ├── imagesTs   # 测试集图像
    ├── labelsTs   # 测试集标签
    └── dataset.json
```

![数据集转换过程记录图](/images/posts/anatomask-deploy-and-training/02.webp)

![数据转换脚本运行输出：病例处理、标签合并与 dataset.json 生成日志](/images/posts/anatomask-deploy-and-training/08.webp)

小插曲：最早我先把 TotalSegmentator 转成了只含脾脏的 `Dataset009_Spleen`（标签就两个：背景 0、脾脏 1，`numTest` 填 0），跑通之后再升级成多器官的 Dataset201。如果只想快速验证流程，单器官版本更省事。

## 四、备选数据集：KiTS19

如果不想用 TotalSegmentator，笔记里还记录了另一条路——KiTS19 肾脏肿瘤数据集。先克隆仓库拉数据：

```bash
cd downloads
git clone https://github.com/neheller/kits19
cd kits19
pip install -r requirements.txt
python -m starter_code.get_imaging
```

然后写脚本转成 nnUNet 格式：把每个病例的 `imaging.nii.gz` 复制成 `imagesTr/case_XXXXX_0000.nii.gz`，`segmentation.nii.gz` 复制成 `labelsTr/case_XXXXX.nii.gz`，再生成 `dataset.json`（KiTS 声明的是 210 训练 / 90 测试，标签 kidney=1、tumor=2，同样要带 `channel_names` 和 `file_ending` 键）。转换后重新预处理，注意先把旧的预处理目录删掉再跑，避免脏数据：

```bash
rm -rf $nnUNet_preprocessed/Dataset020_KiTS
nnUNetv2_plan_and_preprocess -d 20 --verify_dataset_integrity -np 8 --verbose
```

## 五、nnUNet 预处理

```bash
./run_nnunet.sh nnUNetv2_plan_and_preprocess -d 201 --verify_dataset_integrity
```

`--verify_dataset_integrity` 会先做数据完整性检查，有问题早暴露，别等训练跑一半才炸。`-d 201` 对应 Dataset201。显存充足的话还可以加 `-np 4 --verbose -gpu_memory_target 14000 -preprocessor_name DefaultPreprocessor -c 3d_fullres 3d_lowres 2d` 这类完整参数，多进程并行预处理，顺便把三个分辨率配置一次规划出来。

![nnUNet 预处理执行输出](/images/posts/anatomask-deploy-and-training/09.webp)

![预处理进度日志](/images/posts/anatomask-deploy-and-training/10.webp)

![预处理完成输出](/images/posts/anatomask-deploy-and-training/11.webp)

## 六、用 AnatoMask 做预训练

AnatoMask 的自监督预训练是挂在 nnUNet 训练器上的：STUNet 模块位于 `nnunetv2/training/nnUNetTrainer/variants/pretrain/STUNet.py`。直接用 nnUNet 的训练入口启动：

![STUNet 模块与预训练脚本位置](/images/posts/anatomask-deploy-and-training/03.webp)

![预训练代码目录结构](/images/posts/anatomask-deploy-and-training/04.webp)

```bash
./run_nnunet.sh nnUNetv2_train 201 3d_fullres 0 --npz
```

`0` 是 fold 号，`--npz` 保存预测结果。预训练结束会得到包含 teacher 权重（预训练模型）的 checkpoint。

![预训练启动输出](/images/posts/anatomask-deploy-and-training/06.webp)

![预训练运行日志](/images/posts/anatomask-deploy-and-training/05.webp)

如果走官方推荐的 `pretrain_AnatoMask.py` 脚本，有五个地方要按自己的环境改：

- `output_folder`：保存模型权重的目录；
- `preprocessed_dataset_folder`：指向 `nnUNet_preprocessed/DatasetXXX_Name/nnUNetPlans_3d_fullres`，注意数据集要先按 nnUNet 教程预处理好；
- `splits_file`：nnUNet 的划分文件 `splits_final.json`，没跑过一次 nnUNet 的话不会生成，可以先跑一遍拿它；
- `dataset_json`：数据集目录下的 `dataset.json`；
- `plans`：预处理目录里的 `nnUNetPlans.json`。

改完直接 `python pretrain_AnatoMask.py` 开跑。想用 SparK 的话步骤一模一样，换成 `pretrain.py` 就行。

## 七、自定义加载预训练权重

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

微调的时候，把自定义函数导入并替换 nnUNet 默认的 `load_pretrained_weights`（在 `nnunetv2/run/run_training.py` 里），然后照常跑 nnUNet 训练命令，只是多加一个参数：

```bash
nnUNetv2_train 201 3d_fullres 0 -pretrained_weights PATH_TO_YOUR_WEIGHTS
```

官方工作流目前支持 STUNetTrainer，想用自己的模型，就照着 STUNetTrainer 的样子写自己的训练器类。

## 八、训练：从冒烟测试到完整管线

训练阶段我分了两步走，先验证管线，再上正式训练，这个习惯救了我好几次。

### 第一步：MiniUNet3D 冒烟测试

先用一个极简的 3D U-Net（单编码器单解码器）跑通整个流程：加载真实数据 → 裁剪到 64³ → 归一化 → 前向 → 算损失 → 反向。编码器就一个 `Conv3d(1→8) + ReLU + MaxPool3d`，解码器一个 `Conv3d + ReLU + 最近邻上采样`，输出层 1x1 卷积。这一步的目的是确认数据加载、张量形状、损失计算都没问题，模型再小也没关系。当时标签唯一值有 118 个，所以输出通道数设成 118，损失用 `CrossEntropyLoss(ignore_index=-1)`。

脚本里还留了一个随机数据兜底：如果真实数据加载失败，就用 5 个 32³ 的随机样本先跑 3 个 epoch，不至于卡死在环境问题上。真实数据裁剪有个小坑：`crop_size = min(64, *img_data.shape)`，图像某维不足 64 就取整张；前向输出和标签形状对不上时，用 `interpolate(..., mode='nearest')` 调一下尺寸再算损失。

![冒烟测试训练输出：真实数据加载、张量形状与损失计算日志](/images/posts/anatomask-deploy-and-training/12.webp)

### 第二步：SimpleUNet3D 正式训练

管线验证通过后，换成完整的 3D U-Net：三层编码器（16→32→64 通道）、瓶颈 128 通道、三层解码器，每层都是"两个 Conv3d + BatchNorm + ReLU"的组合块，上采样用 `ConvTranspose3d`，解码器靠 `torch.cat` 拼接跳跃连接，瓶颈后加 `Dropout3d(0.3)`，输出 118 类。配套的数据类 `MedicalDataset3D` 做了几件事：

- 自动配对图像和标签（按 case_id 对应 `xxx_0000.nii.gz` 和 `xxx.nii.gz`）；
- 随机裁剪 64³ 块（图像不够大就截前 64 像素）；
- 简单的均值方差归一化；
- 支持 `max_items` 限量，先用 10 个样本调试，避免一开始就在全量数据上烧钱。

训练配置：

- 优化器 Adam，初始学习率 1e-3；
- `ReduceLROnPlateau` 按验证损失减半学习率（factor=0.5, patience=3）；
- 20 个 epoch，每 5 个 batch 打印一次 loss；
- 每个 epoch 存最佳模型（`best_model.pth`），每 5 个 epoch 存完整 checkpoint（含优化器、调度器状态和历史）；
- 训练结束后自动画损失曲线和学习率曲线，存成 `training_history.png`；
- 最后再存一份 `final_model.pth` 收尾。

![正式训练输出：逐 epoch 损失、学习率与模型保存日志](/images/posts/anatomask-deploy-and-training/13.webp)

## 复盘：几个值得记住的点

1. **版本锁死**：nnUNet 系的代码对 torch 版本敏感，`cuda==12.1` + `torch==2.0.1` + `simpleitk==2.3.1` 是踩出来的稳定组合；
2. **先验证再烧钱**：无论数据集多大，先用 `max_items=10` 加小模型跑通全流程，确认 shape 和 loss 都对，再放开跑全量；
3. **权重加载别硬来**：预训练权重和下游网络结构不完全一致是常态，按 key + shape 过滤后再加载，比报错后手动删 key 高效得多；
4. **数据转换是重头戏**：多标签合并、affine 对齐、`dataset.json` 的 `numTraining/numTest` 改对，别忘了 `channel_names` 和 `file_ending` 这两个键，这步省下来的时间够训练跑好几个 epoch；
5. **掩码由易到难**：AnatoMask 用教师网络引导出更难的重建任务，学生跟着学解剖上有意义的区域——理解这个设计，后面调预训练参数心里才有底。

整套流程跑下来，AnatoMask 从"装环境"到"模型能训"的路径就完全清晰了，之后换数据集、调结构都只是参数活。
