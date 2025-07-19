import * as path from 'path';
// Set environment variables so that nodewhisper uses the project's recordings directory.
const recordingsDir = path.resolve(process.cwd(), 'recordings');
process.env.WHISPER_RECORDINGS_DIR = recordingsDir;
process.env.WHISPER_CPP_RECORDINGS_DIR = recordingsDir;
process.env.WHISPER_WORKING_DIR = recordingsDir;

import { nodewhisper } from 'nodejs-whisper';
import * as fs from 'fs';
import * as pathModule from 'path';

export async function transcribeAudio(
  filePath: string,
  outputInText: boolean = false
): Promise<string> {
  try {
    console.log('Starting transcription...');

    // Directly use the provided filePath (which should be in ./recordings relative to cwd)
    const transcription = await nodewhisper(filePath, {
      modelName: 'base', // Model to use
      autoDownloadModelName: 'base', // Automatically download model if missing
      withCuda: false, // Do not use CUDA
      logger: console, // Logger output
      whisperOptions: {
        language: 'ja', // Specify Japanese
        outputInText: outputInText, // Text output flag
      },
    });

    console.log('Transcription result:', transcription);
    return transcription;
  } catch (error) {
    console.error('Error during transcription:', error);
    throw error;
  }
}
