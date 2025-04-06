import path from 'path';
import { nodewhisper } from 'nodejs-whisper';

// テスト用の音声ファイルパス
const testFilePath = path.resolve(__dirname, './recordings/long_16k.wav'); // 16kHzに変換したファイルを指定

async function transcribeAudio(filePath: string) {
  try {
    console.log('Starting transcription...');

    // 音声ファイルをテキストに変換
    const transcription = await nodewhisper(filePath, {
      modelName: 'base', // 使用するモデル
      autoDownloadModelName: 'base', // モデルが存在しない場合に自動ダウンロード
      removeWavFileAfterTranscription: true, // 変換後にwavファイルを削除
      withCuda: false, // CUDAを使用しない
      logger: console, // ログ出力
      whisperOptions: {
        language: 'ja', // 日本語を指定
        outputInText: true, // テキスト出力
      },
    });

    console.log('Transcription result:', transcription);
  } catch (error) {
    console.error('Error during transcription:', error);
  }
}

// 実行
transcribeAudio(testFilePath).catch((error) => {
  console.error('Unexpected error during transcription:', error);
});