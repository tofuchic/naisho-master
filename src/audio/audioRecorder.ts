import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import prism from 'prism-media';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import PQueue from 'p-queue';
import { processTranscription } from '../utils/fileUtils';

const ffmpegQueue = new PQueue({ concurrency: 1 });

export class AudioRecorder {
  private recordingsDir: string;
  private ensureRecordingsDir: () => Promise<void>;

  constructor(recordingsDir: string, ensureRecordingsDir: () => Promise<void>) {
    this.recordingsDir = recordingsDir;
    this.ensureRecordingsDir = ensureRecordingsDir;
  }

  listen(receiver: VoiceReceiver) {
    receiver.speaking.on('start', async (userId) => {
      console.log(`User ${userId} started speaking`);
      try {
        await this.ensureRecordingsDir();
      } catch (err) {
        console.error('Error ensuring recordings directory:', err);
        return;
      }
      await ffmpegQueue.add(async () => {
        const uniqueFileName = `${userId}-${Date.now()}-${uuidv4()}-16k.wav`;
        const outputPath = path.join(this.recordingsDir, uniqueFileName);
        const audioStream = receiver.subscribe(userId, {
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 1000,
          },
        });
        const ffmpeg = spawn('ffmpeg', [
          '-f',
          's16le',
          '-ar',
          '48000',
          '-ac',
          '2',
          '-i',
          'pipe:0',
          '-ar',
          '16000',
          '-acodec',
          'pcm_s16le',
          '-f',
          'wav',
          '-y',
          path.resolve(outputPath),
        ]);
        const pcmStream = new prism.opus.Decoder({
          rate: 48000,
          channels: 2,
          frameSize: 960,
        });
        audioStream.pipe(pcmStream).pipe(ffmpeg.stdin);
        ffmpeg.stderr.on('data', (data) => {
          console.error(`FFmpeg stderr: ${data.toString()}`);
        });
        ffmpeg.on('close', async (code) => {
          if (code === 0) {
            console.log(`Audio converted to 16kHz and saved to ${outputPath}`);
            if (!fs.existsSync(outputPath)) {
              console.error(
                `File not found after FFmpeg process: ${outputPath}`
              );
              return;
            }
            try {
              await processTranscription(outputPath);
            } catch (transcriptionError) {
              console.error('Error transcribing audio:', transcriptionError);
            }
          } else {
            console.error(`FFmpeg process exited with code ${code}`);
          }
        });
        ffmpeg.on('error', (error) => {
          console.error('FFmpeg error:', error);
          console.error('FFmpeg command:', ffmpeg.spawnargs.join(' '));
          if (!ffmpeg.killed) {
            ffmpeg.kill('SIGKILL');
          }
        });
        audioStream.on('close', async () => {
          console.log(`Audio stream for user ${userId} has closed.`);
          if (!ffmpeg.killed) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            ffmpeg.stdin.end();
          }
        });
        audioStream.on('error', (error) => {
          console.error(`Audio stream error for user ${userId}:`, error);
        });
      });
    });
    receiver.speaking.on('end', (userId) => {
      console.log(`User ${userId} finished speaking.`);
    });
  }
}
