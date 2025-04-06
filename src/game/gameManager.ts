import { CommandInteraction, GuildMember, VoiceChannel } from 'discord.js';
import {
  joinVoiceChannel,
  VoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayer,
  entersState,
  VoiceConnectionStatus,
  EndBehaviorType,
} from '@discordjs/voice';
import prism from 'prism-media';
import OpenAI from 'openai';
import { transcribeAudio } from '../utils/transcription';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);

export class GameManager {
  private isGameActive: boolean = false;
  private voiceConnection: VoiceConnection | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // OpenAIのAPIキーを.envに設定
    });
  }

  async startGame(interaction: CommandInteraction) {
    if (this.isGameActive) {
      await interaction.reply('A game is already in progress!');
      return;
    }

    // Check if the user is in a voice channel
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel as VoiceChannel;

    if (!voiceChannel) {
      await interaction.reply(
        'You need to be in a voice channel to start the game!'
      );
      return;
    }

    // Join the voice channel
    this.voiceConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    // Wait for the connection to be ready
    try {
      await entersState(
        this.voiceConnection,
        VoiceConnectionStatus.Ready,
        10_000
      );
      await interaction.reply('The game has started! NG words have been set.');
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      await interaction.reply('Failed to join the voice channel.');
      return;
    }

    // Initialize the audio player
    this.audioPlayer = createAudioPlayer();
    this.voiceConnection.subscribe(this.audioPlayer);

    this.isGameActive = true;

    // Example: Announce the start of the game
    const resource = createAudioResource('./audio/game_start.wav'); // Replace with your audio file
    this.audioPlayer.play(resource);

    // Start listening to audio
    this.listenToAudio();
  }

  private listenToAudio(): void {
    if (!this.voiceConnection) return;

    const receiver = this.voiceConnection.receiver;

    receiver.speaking.on('start', async (userId) => {
      console.log(`User ${userId} started speaking`);

      const recordingsDir = './recordings';
      const outputPath = `${recordingsDir}/${userId}-${Date.now()}-16k.wav`;

      // Ensure the recordings directory exists
      try {
        await mkdir(recordingsDir, { recursive: true });
      } catch (err) {
        console.error(`Failed to create recordings directory: ${err}`);
        return;
      }

      const audioStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 1000, // 1秒間の無音で終了
        },
      });

      // FFmpegプロセスを開始（直接16kHzに変換）
      // prettier-ignore
      const ffmpeg = spawn('ffmpeg', [
        '-f', 's16le', // PCMフォーマット
        '-ar', '48000', // 入力サンプリングレート
        '-ac', '2', // チャンネル数
        '-i', 'pipe:0', // 標準入力から読み取る
        '-ar', '16000', // 出力サンプリングレートを16kHzに変更
        '-y', // 上書き許可
        outputPath, // 出力ファイル
      ]);

      const pcmStream = new prism.opus.Decoder({
        rate: 48000,
        channels: 2,
        frameSize: 960,
      });

      // Pipe PCM data to FFmpeg
      audioStream.pipe(pcmStream).pipe(ffmpeg.stdin);

      // Log FFmpeg stderr
      ffmpeg.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data.toString()}`);
      });

      // Handle FFmpeg process close
      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          console.log(`Audio converted to 16kHz and saved to ${outputPath}`);
          try {
            await this.processTranscription(outputPath);
          } catch (transcriptionError) {
            console.error('Error transcribing audio:', transcriptionError);
          } finally {
            // Clean up the file
            fs.unlink(outputPath, (err) => {
              if (err) console.error(`Failed to delete ${outputPath}:`, err);
              else console.log(`Deleted file: ${outputPath}`);
            });
          }
        } else {
          console.error(`FFmpeg process exited with code ${code}`);
        }
      });

      // Handle FFmpeg errors
      ffmpeg.on('error', (error) => {
        console.error('FFmpeg error:', error);
      });

      // Handle audio stream close
      audioStream.on('close', () => {
        console.log(`Audio stream for user ${userId} has closed.`);
        if (!ffmpeg.killed) {
          ffmpeg.stdin.end();
        }
      });

      // Handle audio stream errors
      audioStream.on('error', (error) => {
        console.error(`Audio stream error for user ${userId}:`, error);
      });
    });
  }

  private async processTranscription(filePath: string): Promise<void> {
    try {
      const transcription = await transcribeAudio(
        path.join(__dirname, '../..', filePath)
      );
      console.log('Transcription result:', transcription);
      // 必要に応じて追加処理を実装
    } catch (error) {
      throw error;
    }
  }

  async endGame(interaction: CommandInteraction) {
    if (!this.isGameActive) {
      await interaction.reply('No game is currently active.');
      return;
    }

    // Disconnect from the voice channel
    if (this.voiceConnection) {
      this.voiceConnection.destroy();
      this.voiceConnection = null;
    }

    if (this.audioPlayer) {
      this.audioPlayer.stop();
      this.audioPlayer = null;
    }

    this.isGameActive = false;
    await interaction.reply('The game has ended!');
  }
}
