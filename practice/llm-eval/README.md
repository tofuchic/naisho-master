# LLM比較評価実験（Ollama: gpt-oss, phi4, gemma, deepseek）

## 目的

Ollamaを用いて、gpt-oss、phi4、gemma、deepseekの4つの大規模言語モデル（LLM）について、パフォーマンス（推論速度・リソース消費）および回答精度（ベンチマークスコア・主観評価）を比較する。

## 評価項目

- 推論速度（レスポンスタイム、トークン毎秒など）
- メモリ・CPU/GPU使用量
- 回答精度（ベンチマークスコア、主観評価）

## 使用ツール・ベンチマーク

- [Ollama](https://ollama.com/)：ローカルLLM実行環境
- [lm-eval-harness](https://github.com/EleutherAI/lm-eval-harness)：LLMベンチマークツール
- [Open LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard)：参考指標
- [llm-bench](https://github.com/llm-bench/llm-bench)（任意）：追加ベンチマーク
- `time`コマンドや`htop`等：リソース計測

## 実験計画

1. **モデル準備**

   - Ollamaで各モデル（gpt-oss, phi4, gemma, deepseek）をpullし、動作確認

2. **ベンチマーク実施**

   - lm-eval-harness等を用いて、各モデルに同一のベンチマーク（例：MMLU, HellaSwag, TruthfulQA等）を実施
   - 推論速度・リソース消費も同時に計測

3. **主観評価**

   - 代表的なプロンプトを用意し、各モデルの出力を比較
   - 複数人でブラインド評価（任意）

4. **結果集計・比較**
   - ベンチマークスコア、速度、リソース消費、主観評価を表やグラフでまとめる

## 実験手順

### 1. モデルの準備

```sh
# 例: モデルのpull
ollama pull gpt-oss
ollama pull phi4
ollama pull gemma
ollama pull deepseek
```

### 2. ベンチマークの実行

- lm-eval-harnessのセットアップ

```sh
git clone https://github.com/EleutherAI/lm-eval-harness.git
cd lm-eval-harness
pip install -e .
```

- 各モデルでベンチマーク実行例

```sh
# 例: gpt-ossでMMLUを評価
python main.py \
  --model hf \
  --model_args "pretrained=ollama/gpt-oss" \
  --tasks mmlu \
  --device cuda
```

- 推論速度・リソース消費の計測
  - `time`コマンドや`htop`、`nvidia-smi`等で計測

### 3. 主観評価

- 代表的なプロンプトを複数用意し、各モデルで回答を生成
- 回答をランダム化・匿名化し、複数人で評価

### 4. 結果の集計・比較

- ベンチマークスコア、推論速度、リソース消費を表やグラフでまとめる
- 主観評価の集計（例：5段階評価の平均など）

## 結果のまとめ方（例）

| モデル名 | MMLUスコア | HellaSwag | TruthfulQA | 推論速度 (tok/s) | メモリ使用量 | 主観評価(平均) |
| -------- | ---------- | --------- | ---------- | ---------------- | ------------ | -------------- |
| gpt-oss  |            |           |            |                  |              |                |
| phi4     |            |           |            |                  |              |                |
| gemma    |            |           |            |                  |              |                |
| deepseek |            |           |            |                  |              |                |

- グラフや考察を追記

## 参考

- [Ollama公式ドキュメント](https://ollama.com/docs)
- [lm-eval-harness](https://github.com/EleutherAI/lm-eval-harness)
- [Open LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard)
