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
// ...existing code...
import OpenAI from 'openai';
import { transcribeAudio } from '../utils/transcription';
import path from 'path';
import { promisify } from 'util';
import { AudioRecorder } from '../audio/audioRecorder';
import { sleep, waitForFile } from '../utils/fileUtils';

const mkdir = promisify(require('fs').mkdir);

export class GameManager {
  private isGameActive: boolean = false;
  private voiceConnection: VoiceConnection | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private openai: OpenAI;
  private recordingsDir: string = path.resolve(__dirname, '../../recordings');
  private isRecordingsDirInitialized: boolean = false;
  private audioRecorder: AudioRecorder | null = null;

  constructor() {
    // Set environment variables so that nodewhisper uses the project's recordings directory.
    process.env.WHISPER_RECORDINGS_DIR = this.recordingsDir;
    process.env.WHISPER_CPP_RECORDINGS_DIR = this.recordingsDir;

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
        10000
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
    this.audioRecorder = new AudioRecorder(
      this.recordingsDir,
      this.ensureRecordingsDir.bind(this)
    );
    if (this.voiceConnection) {
      this.audioRecorder.listen(this.voiceConnection.receiver);
    }
  }

  private async ensureRecordingsDir(): Promise<void> {
    if (!this.isRecordingsDirInitialized) {
      try {
        await mkdir(this.recordingsDir, { recursive: true });
        this.isRecordingsDirInitialized = true;
      } catch (err) {
        console.error(`Failed to create recordings directory: ${err}`);
        throw err;
      }
    }
  }

  // ...existing code...

  // ...existing code...

  // ...existing code...

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
