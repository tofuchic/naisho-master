# シークレットNG Discord Bot

このBotは「シークレットNG」ゲームのゲームマスターとして機能します。

## 機能

- ゲーム開始コマンド (`/start`) に反応し、ボイスチャンネルに参加します。
- プレイヤーの音声を文字起こしし、「NGワード」を検出します。
- プレイヤーが一定回数「NGワード」を発すると脱落します。
- 最後の1人が勝者となり、ゲームが終了します。
- ゲーム終了コマンド (`/stop`) に反応し、ボイスチャンネルから退出します。

## ゲームルール

- ゲーム開始時にゲームマスターがいくつかの「NGワード」を設定します。
- プレイヤーが発した言葉の中に「NGワード」が含まれていた場合、ゲームマスターはゲームを一時中断し、「NGワード」が発せられたことを全プレイヤーに通知します。その後、ゲームを再開します。
- プレイヤーが一定回数「NGワード」を発すると脱落します。
- 脱落しなかった最後の1人が勝者となり、ゲームは終了します。

## Botの仕様

- 「シークレットNG」ゲームのゲームマスターとして機能します。
- 「ゲーム開始」を意図する特定のコマンド (`/start`) に反応し、Discordサーバのボイスチャンネルに入室します。
  - その後、ゲームスタートの合図を出します。
- 「ゲーム終了」を意図する特定のコマンド (`/stop`) に反応し、ボイスチャンネルから退室します。
  - 「シークレットNG」ゲームで勝者が決まった場合にも、ボイスチャンネルから退室します。
- ボイスチャンネルに入室中は全てのプレイヤーの音声を文字起こしし、内部に記録します。

## セットアップ

2. 必要な依存関係をインストールします:
   ```bash
   npm install
   ```
1. Discord Developer PortalでBotを作成し、トークンを取得します。
1. `.env` ファイルにトークンを設定します。
1. Botをビルドします:
   ```bash
   npm run build
   ```
1. 実行できるかテストします。
   ```bash
   sudo apt update
   sudo apt install cmake
   ```
   ```bash
   npm test
   ```
1. Botを起動します:
   ```bash
   npm start
   ```

## 使用方法

1. DiscordサーバーにBotを招待します。
   - `APPLICATION_ID`を作成したDISCORDアプリケーションのIDに上書きして、アクセスします
     - https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&permissions=3214336&scope=bot%20applications.commands
1. 追加したBotにスラッシュコマンドを設定します
   ```bash
   node dist/registerCommands.js
   ```
1. ボイスチャンネルに参加し、`/start` コマンドを送信してゲームを開始します。
1. `/stop` コマンドでゲームを終了します。
