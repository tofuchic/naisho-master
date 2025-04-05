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
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream';
import prism from 'prism-media';
import OpenAI from 'openai';

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
      await interaction.reply('You need to be in a voice channel to start the game!');
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
      await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 10_000);
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

    // Start listening to audio
    this.listenToAudio();
  }

  private listenToAudio() {
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

      const outputPath = `./recordings/${userId}-${Date.now()}.pcm`;
      const pcmStream = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
      const writeStream = createWriteStream(outputPath);

      pipeline(audioStream, pcmStream, writeStream, (err) => {
        if (err) {
          console.error('Error processing audio stream:', err);
        } else {
          console.log(`Audio saved to ${outputPath}`);
          this.transcribeAudio(outputPath);
        }
      });
    });
  }

  private async transcribeAudio(filePath: string) {
    try {
      const response = await this.openai.audio.transcriptions.create(
        { file: createReadStream(filePath), model: 'whisper-1' },
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('Transcription result:', response.text);
      // TODO: Handle NG word detection logic here
    } catch (error) {
      console.error('Error during transcription:', error);
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
