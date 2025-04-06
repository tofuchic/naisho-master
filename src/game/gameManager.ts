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

    receiver.speaking.on('start', (userId) => {
      console.log(`User ${userId} started speaking`);

      const audioStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 1000, // 1秒間の無音で終了
        },
      });

      const outputPath = `./recordings/${userId}-${Date.now()}.wav`;
      const output16kPath = `./recordings/${userId}-${Date.now()}-16k.wav`;

      // FFmpegプロセスを開始
      // prettier-ignore
      const ffmpeg = spawn('ffmpeg', [
        '-f', 's16le', // PCMフォーマット
        '-ar', '48000', // サンプリングレート
        '-ac', '2', // チャンネル数
        '-i', 'pipe:0', // 標準入力から読み取る
        '-y', // 上書き許可
        outputPath, // 出力ファイル
      ]);

      const pcmStream = new prism.opus.Decoder({
        rate: 48000,
        channels: 2,
        frameSize: 960,
      });

      // PCMデータをFFmpegにパイプ
      audioStream.pipe(pcmStream).pipe(ffmpeg.stdin);

      // FFmpegプロセスの終了時にstdinを閉じる
      ffmpeg.stdin.on('error', (err) => {
        if ((err as any).code !== 'EPIPE') {
          console.error('FFmpeg stdin error:', err);
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`Audio saved to ${outputPath}`);

          // 16kHzに変換するFFmpegプロセスを開始
          // prettier-ignore
          const ffmpeg16k = spawn('ffmpeg', [
            '-i', outputPath, // 入力ファイル
            '-ar', '16000', // サンプリングレートを16kHzに変更
            '-y', // 上書き許可
            output16kPath, // 出力ファイル
          ]);

          ffmpeg16k.on('close', (code16k) => {
            if (code16k === 0) {
              console.log(
                `Audio converted to 16kHz and saved to ${output16kPath}`
              );
              // 必要に応じて16kHzのファイルを処理
              (async () => {
                try {
                  const trascription = await transcribeAudio(
                    path.join(
                      __dirname, // Use __dirname to resolve the directory of the current file
                      '../..',
                      output16kPath
                    )
                  );
                } catch (transcriptionError) {
                  console.error(
                    'Error transcribing audio:',
                    transcriptionError
                  );
                }
              })();
            } else {
              console.error(
                `FFmpeg 16kHz conversion exited with code ${code16k}`
              );
            }

            // 元の48kHzファイルを削除（必要に応じて）
            fs.unlink(outputPath, (err) => {
              if (err) console.error(`Failed to delete ${outputPath}:`, err);
              else console.log(`Deleted original file: ${outputPath}`);
            });
          });

          ffmpeg16k.on('error', (error) => {
            console.error('FFmpeg 16kHz conversion error:', error);
          });
        } else {
          console.error(`FFmpeg process exited with code ${code}`);
        }
      });

      ffmpeg.on('error', (error) => {
        console.error('FFmpeg error:', error);
      });

      audioStream.on('close', () => {
        console.log(`Audio stream for user ${userId} has closed.`);
        // FFmpegプロセスが終了していない場合、stdinを閉じる
        if (!ffmpeg.killed) {
          ffmpeg.stdin.end();
        }
      });
    });
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
