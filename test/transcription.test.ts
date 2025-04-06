import path from 'path';
import { transcribeAudio } from '../src/utils/transcription';

describe('transcribeAudio Tests', () => {
  // タイムアウトを延長 (デフォルトは5000ms)
  jest.setTimeout(30000);

  it.only('should return a non-empty transcription result for 16kHz WAV', async () => {
    const testFilePath = path.resolve(
      __dirname,
      '../recordings/test_audio_16k.wav'
    );

    const result = await transcribeAudio(testFilePath);

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('発言');
  });

  it.only('should return an error when transcribe 48kHz WAV', async () => {
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

  it.only('should return a non-empty transcription result for 16kHz PCM', async () => {
    // テスト用の音声ファイルパス
    const testFilePath = path.resolve(
      __dirname,
      '../recordings/test_audio_16bit_16k.pcm'
    );

    const result = await transcribeAudio(testFilePath, true);

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('発言');
  });
});
