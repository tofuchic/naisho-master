import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { transcribeAudio } from './transcription';

export async function processTranscription(filePath: string): Promise<void> {
  // 録音ファイルは必ずrecordingsディレクトリ基準で絶対パス化
  // プロジェクトルートからrecordingsディレクトリを参照
  const recordingsDir = path.resolve(__dirname, '../../recordings');
  let absolutePath: string;
  if (path.isAbsolute(filePath)) {
    absolutePath = filePath;
  } else if (filePath.startsWith('recordings/')) {
    absolutePath = path.resolve(process.cwd(), filePath);
  } else {
    absolutePath = path.join(recordingsDir, filePath);
  }
  console.log(`Processing transcription for file: ${absolutePath}`);
  await sleep(100);
  const fileReady = await waitForFile(absolutePath, 3, 200);
  if (!fileReady) {
    console.warn(
      `File not available after waiting: ${absolutePath}. Skipping transcription.`
    );
    return;
  }
  let finalPath = absolutePath;
  const stats = fs.statSync(finalPath);
  if (stats.size < 16000) {
    console.log('Audio file is too short, padding with silence...');
    const paddedFilePath = finalPath.replace('.wav', '-padded.wav');
    try {
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-i',
          finalPath,
          '-af',
          'apad=pad_dur=1',
          '-y',
          paddedFilePath,
        ]);
        ffmpeg.on('close', (code) => {
          if (code === 0) {
            console.log(`Padded file created: ${paddedFilePath}`);
            resolve();
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });
      });
      finalPath = paddedFilePath;
    } catch (error) {
      console.error('Error padding audio file:', error);
      return;
    }
  }
  console.log(`Starting transcription on file: ${finalPath}`);
  try {
    const transcription = await transcribeAudio(finalPath, false);
    console.log('Transcription result:', transcription);
    console.log(
      'Transcription process completed. Cleaning up the recorded file: ',
      finalPath
    );
    fs.unlinkSync(finalPath);
    console.log(`Cleaning file ${finalPath} completed.`);
  } catch (error) {
    console.error('Error during transcription:', error);
  }
}

export async function waitForFile(
  filePath: string,
  retries: number,
  delay: number
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 0) {
        return true;
      }
    }
    console.log(
      `Waiting for file availability: ${filePath} (${i + 1}/${retries})`
    );
    await sleep(delay);
  }
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
