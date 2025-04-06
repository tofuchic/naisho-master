import path from 'path';
import { transcribeAudio } from '../src/utils/transcription';

describe('transcribe 16kHz WAV', () => {
  it.only('should return a non-empty transcription result', async () => {
    // テスト用の音声ファイルパス
    const testFilePath = path.resolve(
      __dirname,
      '../recordings/test_audio_16k.wav'
    ); // 16kHzに変換したファイルを指定

    const result = await transcribeAudio(testFilePath);

    // 結果が空文字でないことを確認
    expect(result.length).toBeGreaterThan(0);

    // 結果に特定のキーワードが含まれることを確認
    expect(result).toContain('発言');
  });
});

describe('transcribe 48kHz WAV', () => {
  it.only('should return an error', async () => {
    // テスト用の音声ファイルパス
    const testFilePath = path.resolve(
      __dirname,
      '../recordings/test_audio_48k.wav'
    );

    try {
      await transcribeAudio(testFilePath);
      // エラーが発生しなかった場合は失敗
      fail('Expected an error to be thrown, but none was thrown.');
    } catch (error) {
      // エラーが発生したことを確認
      expect(error).toBeDefined();
      console.error('Expected error:', error);
    }
  });
});

describe('transcribe 16kHz PCM', () => {
  it.only('should return an error', async () => {
    // テスト用の音声ファイルパス
    const testFilePath = path.resolve(
      __dirname,
      '../recordings/test_audio_16bit_16k.pcm'
    );

    try {
      await transcribeAudio(testFilePath);
      // エラーが発生しなかった場合は失敗
      fail('Expected an error to be thrown, but none was thrown.');
    } catch (error) {
      // エラーが発生したことを確認
      expect(error).toBeDefined();
      console.error('Expected error:', error);
    }
  });
});
