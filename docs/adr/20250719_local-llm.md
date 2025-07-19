# ADR: NGワード検出におけるローカルLLM選定

## 概要

DiscordボットのNGワード検出機能において、クラウドLLM（AzureOpenAI等）への都度リクエストはレスポンス遅延の懸念があるため、ローカルLLMの導入を検討した。

## 選定理由

- 日本語対応モデルが複数存在し、NGワード検出用途に十分な精度が期待できる
- オープンソースであり、無料で利用可能
- CPU/GPU両対応で、特にllama.cppはOpenCL経由でAMD GPU（Radeon RX6900XT）も利用可能
- 軽量かつローカル環境で完結するため、プライバシー・レスポンス速度の面で有利

## 比較検討したモデル

- OpenCALM（日本語特化、PyTorch/Transformers、ROCm未対応）
- ELYZA Japanese LLM（日本語特化、PyTorch/Transformers、ROCm未対応）
- StableLM Japanese（日本語対応、PyTorch/Transformers、ROCm未対応）
- llama.cpp + Japanese LLaMA系モデル（OpenCL対応、AMD GPU利用可能）

## 採用モデル

- llama.cpp + Japanese LLaMA系モデル

## 利用方法（概要）

1. 日本語学習済みモデル（.gguf等）をダウンロード
2. llama.cppをOpenCL対応でビルド
3. Discord BotからAPI経由でNGワード検出プロンプトを送信

## 今後の課題

- モデル精度の検証と最適化
- プロンプト設計の改善
- GPU推論の安定性・速度検証

---

このADRは将来の技術選定・運用方針の参考とする。
