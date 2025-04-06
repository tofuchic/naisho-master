import path from 'path';
import { transcribeAudio } from '../src/utils/transcription';

// テスト用の音声ファイルパス
const testFilePath = path.resolve(__dirname, '../recordings/test_audio_16k.wav'); // 16kHzに変換したファイルを指定

describe('transcribeAudio', () => {
  it('should return a non-empty transcription result', async () => {
    const result = await transcribeAudio(testFilePath);

    // 結果が空文字でないことを確認
    expect(result.length).toBeGreaterThan(0);

    // 結果に特定のキーワードが含まれることを確認
    expect(result).toContain('発言');
  });
});