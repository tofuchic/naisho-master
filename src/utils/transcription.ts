import * as path from 'path';
// Set environment variables so that nodewhisper uses the project's recordings directory.
const recordingsDir = path.resolve(__dirname, '../../recordings');
process.env.WHISPER_RECORDINGS_DIR = recordingsDir;
process.env.WHISPER_CPP_RECORDINGS_DIR = recordingsDir;
process.env.WHISPER_WORKING_DIR = recordingsDir;

import { nodewhisper } from 'nodejs-whisper';
import * as fs from 'fs';
import * as pathModule from 'path';
import fetch from 'node-fetch'; // npm install node-fetch

/**
 * ローカルLLM API（llama.cpp等）に文字起こし結果を送信し、文脈を考慮した修正済みテキストを取得
 */
async function refineTranscriptionWithLLM(
  transcription: string
): Promise<string> {
  const endpoint = 'http://localhost:8080/completion'; // llama.cppのAPIエンドポイント
  const prompt = `以下は音声認識による日本語の文字起こし結果です。誤認識や文脈の不自然な箇所を前後の文脈を考慮して自然な日本語に修正してください。\n\n${transcription}\n\n修正後の文章のみ出力してください。`;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: 512,
        temperature: 0.7,
        stop: ['</s>'],
      }),
    });
    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }
    const data = await response.json();
    // llama.cppのAPIレスポンス仕様に応じて修正
    return data.content || data.text || '';
  } catch (err) {
    console.error('LLMによる修正失敗:', err);
    // 修正できない場合は元の文字起こし結果を返す
    return transcription;
  }
}

export async function transcribeAudio(
  filePath: string,
  outputInText: boolean = false
): Promise<string> {
  try {
    console.log('Starting transcription...');
    const transcription = await nodewhisper(filePath, {
      modelName: 'base',
      autoDownloadModelName: 'base',
      withCuda: false,
      logger: console,
      whisperOptions: {
        language: 'ja',
        outputInText: outputInText,
      },
    });
    console.log('Transcription result:', transcription);
    // LLMで文脈修正
    const refined = await refineTranscriptionWithLLM(transcription);
    console.log('Refined transcription:', refined);
    return refined;
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
}
