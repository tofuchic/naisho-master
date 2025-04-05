import { CommandInteraction } from 'discord.js';

export class GameManager {
  private isGameActive: boolean = false;

  async startGame(interaction: CommandInteraction) {
    if (this.isGameActive) {
      await interaction.reply('A game is already in progress!');
      return;
    }

    this.isGameActive = true;
    await interaction.reply('The game has started! NG words have been set.');
    // ...initialize NG words and other game logic...
  }

  async endGame(interaction: CommandInteraction) {
    if (!this.isGameActive) {
      await interaction.reply('No game is currently active.');
      return;
    }

    this.isGameActive = false;
    await interaction.reply('The game has ended!');
    // ...clean up game state...
  }
}
