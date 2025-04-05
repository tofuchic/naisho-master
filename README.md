# シークレットNG Discord Bot

このBotは「シークレットNG」ゲームのゲームマスターとして機能します。

## 機能
- ゲーム開始コマンド (`!start`) に反応し、ボイスチャンネルに参加します。
- プレイヤーの音声を文字起こしし、「NGワード」を検出します。
- プレイヤーが一定回数「NGワード」を発すると脱落します。
- 最後の1人が勝者となり、ゲームが終了します。
- ゲーム終了コマンド (`!stop`) に反応し、ボイスチャンネルから退出します。

## セットアップ
1. Discord Developer PortalでBotを作成し、トークンを取得します。
2. 必要な依存関係をインストールします:
   ```bash
   npm install discord.js @discordjs/voice
   ```
3. `bot.js` ファイルにトークンを設定します。
4. Botを起動します:
   ```bash
   node bot.js
   ```

## 使用方法
1. DiscordサーバーにBotを招待します。
2. ボイスチャンネルに参加し、`!start` コマンドを送信してゲームを開始します。
3. `!stop` コマンドでゲームを終了します。
