import path from 'path';
import assert from 'assert';
import { transcribeAudio } from '../src/utils/transcription';

// テスト用の音声ファイルパス
const testFilePath = path.resolve(__dirname, '../recordings/test_audio_16k.wav'); // 16kHzに変換したファイルを指定

// テスト実行
(async () => {
  try {
    console.log('Running transcription test...');
    const result = await transcribeAudio(testFilePath);

    // アサーション: 結果が空文字でないことを確認
    assert.ok(result.length > 0, 'Transcription result should not be empty');

    // アサーション: 結果に特定のキーワードが含まれることを確認
    assert.ok(result.includes('発言'), 'Transcription result should include "発言"');

    console.log('Transcription test passed!');
  } catch (error) {
    console.error('Transcription test failed:', error);
  }
})();