import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
config();

const commands = [
  {
    name: 'start',
    description: 'Start the Secret NG game',
  },
  {
    name: 'end',
    description: 'End the Secret NG game',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.APPLICATION_ID!,
        process.env.SERVER_ID!
      ),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
