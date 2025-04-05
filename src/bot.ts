import { Client, GatewayIntentBits } from 'discord.js';
import { GameManager } from './game/gameManager';

export class Bot {
  private client: Client;
  private gameManager: GameManager;

  constructor() {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
    this.gameManager = new GameManager();

    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user?.tag}!`);
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return;

      if (interaction.commandName === 'start') {
        await this.gameManager.startGame(interaction);
      } else if (interaction.commandName === 'end') {
        await this.gameManager.endGame(interaction);
      }
    });
  }

  start() {
    this.client.login(process.env.BOT_TOKEN);
  }
}
