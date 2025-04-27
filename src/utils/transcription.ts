import { nodewhisper } from 'nodejs-whisper';
import * as fs from 'fs';
import * as path from 'path';

export async function transcribeAudio(
  filePath: string,
  outputInText: boolean = false,
  removeWavFileAfterTranscription: boolean = false
): Promise<string> {
  try {
    console.log('Starting transcription...');

    // Whisper用のrecordingsフォルダへファイルをコピー
    const whisperDir = path.join(
      path.dirname(require.resolve('nodejs-whisper')),
      'cpp',
      'whisper.cpp',
      'recordings'
    );
    if (!fs.existsSync(whisperDir)) {
      fs.mkdirSync(whisperDir, { recursive: true });
    }
    const targetFilePath = path.join(whisperDir, path.basename(filePath));
    fs.copyFileSync(filePath, targetFilePath);
    console.log(`Copied file to ${targetFilePath}`);

    // 音声ファイルをテキストに変換
    const transcription = await nodewhisper(targetFilePath, {
      modelName: 'base', // 使用するモデル
      autoDownloadModelName: 'base', // モデルが存在しない場合に自動ダウンロード
      removeWavFileAfterTranscription: removeWavFileAfterTranscription, // 変換後にwavファイルを削除しない
      withCuda: false, // CUDAを使用しない
      logger: console, // ログ出力
      whisperOptions: {
        language: 'ja', // 日本語を指定
        outputInText: outputInText, // テキスト出力
      },
    });

    console.log('Transcription result:', transcription);
    return transcription; // 結果を返す
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error; // エラーを呼び出し元に伝播
  }
}
