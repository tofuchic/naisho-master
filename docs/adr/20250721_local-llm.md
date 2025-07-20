# ADR: NGワード検出におけるローカルLLM選定（Ollama採用）

## 概要

DiscordボットのNGワード検出機能において、クラウドLLM（AzureOpenAI等）への都度リクエストはレスポンス遅延の懸念があるため、ローカルLLMの導入を検討した。

## 選定理由

- CPU/GPU両対応だが、私の環境（AMD Radeon RX6900XT）ではllama.cppのOpenCL/ROCmサポートが不十分だった

## 比較検討したモデル・方式

- llama.cpp + Japanese LLaMA系モデル（OpenCL対応だが、AMD GPU環境で動作せず）
- Ollama + gemma3（CPU/GPU両対応、セットアップ容易、WSL2環境でも動作）

## 採用モデル・方式

- Ollama + gemma3モデル

## 利用方法（概要）

1. Ollamaをインストール（WSL2/Linux/Windows/Mac対応）
2. gemma3など日本語対応モデルをOllamaでpull
3. Discord BotからOllama API経由でNGワード検出プロンプトを送信

## 今後の課題

- モデル精度の検証と最適化
- プロンプト設計の改善
- WSL2環境でのAPI接続安定性

---

このADRは将来の技術選定・運用方針の参考とする。
