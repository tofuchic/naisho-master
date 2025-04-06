import { nodewhisper } from 'nodejs-whisper';

export async function transcribeAudio(
  filePath: string,
  removeWavFileAfterTranscription: boolean = false
): Promise<string> {
  try {
    console.log('Starting transcription...');

    // 音声ファイルをテキストに変換
    const transcription = await nodewhisper(filePath, {
      modelName: 'base', // 使用するモデル
      autoDownloadModelName: 'base', // モデルが存在しない場合に自動ダウンロード
      removeWavFileAfterTranscription: removeWavFileAfterTranscription, // 変換後にwavファイルを削除しない
      withCuda: false, // CUDAを使用しない
      logger: console, // ログ出力
      whisperOptions: {
        language: 'ja', // 日本語を指定
        // outputInText: true, // テキスト出力
      },
    });

    console.log('Transcription result:', transcription);
    return transcription; // 結果を返す
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error; // エラーを呼び出し元に伝播
  }
}
