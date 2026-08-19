---
title: "vLLM 本地推理调试实录：QwQ-32B-AWQ 和 FuseO1 双模型踩坑记"
published: 2025-03-10
description: "想在本地用 vLLM 跑 32B 量化模型？tensor_parallel 开几卡、stop_token_ids 为什么是这三个、推理速度怎么测？我把 QwQ-32B-AWQ 和 FuseO1 两个模型的完整调试脚本记了下来，全程第一视角。"
tags: ["vLLM", "大模型推理", "AWQ", "量化", "调试"]
category: "折腾"
draft: false
---

# vLLM 本地推理调试实录

最近在折腾 vLLM 本地推理，一口气调了两个 32B 的 AWQ 量化模型：Qwen 的 QwQ-32B-AWQ 和 FuseO1-DeepSeekR1-QwQ-SkyT1-32B-Preview-AWQ（名字长到像在报菜名）。这篇把我踩过的配置点和调试脚本完整记下来，包括 tensor parallel 怎么设、终止符为什么是这几个、推理速度怎么算。

## 环境准备

两个脚本开头都做了一件事：设置 `VLLM_USE_MODELSCOPE=True`，让 vLLM 直接从 ModelScope 拉模型——国内网络环境下比 HuggingFace 稳得多。

```python
import os
os.environ['VLLM_USE_MODELSCOPE'] = 'True'
```

## 调试 QwQ-32B-AWQ

QwQ-32B 的 4bit 量化版，我用了 4 卡张量并行（`tensor_parallel_size=4`）来摊内存。这里有个细节：分词器要显式指定路径，并且 `use_fast=False`——QwQ 的 tokenizer 用慢速版加载更稳，我实测快速版在某些情况下会出问题。

```python
from vllm import LLM, SamplingParams
from transformers import AutoTokenizer
import os
import time

os.environ['VLLM_USE_MODELSCOPE'] = 'True'

def get_completion(llm, prompts, sampling_params):
    start_time = time.time()
    outputs = llm.generate(prompts, sampling_params)
    end_time = time.time()
    return outputs, end_time - start_time

if __name__ == "__main__":
    model_path = '/data/ModelSpace/Qwen/QwQ-32B-AWQ'
    tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=False)

    llm = LLM(
        model=model_path,
        tokenizer=model_path,
        max_model_len=2048,
        trust_remote_code=True,
        tensor_parallel_size=4
    )

    prompts = ["请写一个冒泡排序的 C++ 代码："]

    sampling_params = SamplingParams(
        temperature=0.6,
        top_p=0.95,
        max_tokens=8192,
        stop_token_ids=[151329, 151336, 151338]
    )

    outputs, total_time = get_completion(llm, prompts, sampling_params)
    output = outputs[0]

    token_count = len(tokenizer.encode(output.outputs[0].text))
    tps = token_count / total_time if total_time > 0 else 0.0

    print(f"\n推理速度：{tps:.2f} tokens/s")
    print(f"总耗时: {total_time:.4f}s，生成 Token 数: {token_count}")
    print(f"\n生成的 C++ 代码：\n{output.outputs[0].text}")
```

几个值得记的参数：

- `stop_token_ids=[151329, 151336, 151338]`：这三个是这类模型特有的特殊 token id，用来在生成到思考结束、回答结束时及时停下来，不然模型会一直往外蹦符号；
- `max_tokens=8192`：推理链模型生成很长，上限给足；
- `temperature=0.6, top_p=0.95`：代码生成场景下偏保守的采样配置，兼顾多样性和稳定性。

## 调试 FuseO1-DeepSeekR1-QwQ-SkyT1-32B-Preview-AWQ

第二个模型是融合了几个推理模型的 32B 预训练版，配置上有几处明显不同：张量并行降到了 2 卡（`tensor_parallel_size=2`），显式指定了 `dtype="float16"`，分词器改用 `use_fast=True`——同一个框架，不同模型就是得各自试。

另外这版脚本我用 `tokenizer.decode(output.outputs[0].token_ids, skip_special_tokens=True)` 来还原生成文本，而不是直接取 `.text`，这样能更干净地跳过特殊 token。

```python
from vllm import LLM, SamplingParams
from transformers import AutoTokenizer
import os
import time

os.environ['VLLM_USE_MODELSCOPE'] = 'True'

def get_completion(llm, prompts, sampling_params):
    start_time = time.time()
    outputs = llm.generate(prompts, sampling_params)
    end_time = time.time()
    return outputs, end_time - start_time

if __name__ == "__main__":
    model_path = '/data/ModelSpace/Qwen/FuseO1-DeepSeekR1-QwQ-SkyT1-32B-Preview-AWQ'
    tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=True)

    llm = LLM(
        model=model_path,
        tokenizer=model_path,
        max_model_len=2048,
        trust_remote_code=True,
        tensor_parallel_size=2,
        dtype="float16"
    )

    prompts = ["请写一个冒泡排序的 C++ 代码："]

    sampling_params = SamplingParams(
        temperature=0.6,
        top_p=0.95,
        max_tokens=8192,
        stop_token_ids=[151329, 151336, 151338]
    )

    outputs, total_time = get_completion(llm, prompts, sampling_params)
    output = outputs[0]

    generated_text = tokenizer.decode(output.outputs[0].token_ids, skip_special_tokens=True)

    token_count = len(tokenizer.encode(output.outputs[0].text))
    tps = token_count / total_time if total_time > 0 else 0.0

    print(f"\n推理速度：{tps:.2f} tokens/s")
    print(f"总耗时: {total_time:.4f}s，生成 Token 数: {token_count}")
    print(f"\n生成的 C++ 代码：\n{generated_text}")
```

## 调试小结

两个模型跑下来，几个经验可以沉淀：

1. **模型名越杂，配置越不能抄**。同样是 32B AWQ，QwQ 用 4 卡、慢速分词器，FuseO1 用 2 卡、float16、快速分词器——每个模型都得单独试一遍才知道哪种组合稳定；
2. **推理速度用 tokenizer 自己数**。`tokenizer.encode` 统计生成文本的 token 数，再除以耗时就是 TPS，比看日志里的数字更直观；
3. **`stop_token_ids` 是这类推理模型的命门**。不设对的话，思考链模型会一直输出直到撞上 max_tokens，既浪费算力又污染结果；
4. 本地测推理，`VLLM_USE_MODELSCOPE=True` 基本是标配，配合国内网络下载模型快很多。

代码都是真实跑过的，直接改模型路径和采样参数就能复用。
