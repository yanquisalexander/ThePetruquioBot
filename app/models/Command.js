import { db } from "../../lib/database.js";

const DEFAULT_COMMAND_OPTIONS = {
    enabled: true,
    cooldown: {
        user_cooldown: 5,
        global_cooldown: 0,
    },
}

export const SYSTEM_COMMANDS = {
    map: {
        responseCanBeEdited: true,
    },
    random: {
        responseCanBeEdited: false,
        canBeDisabled: 'settings',
    },
    set: {
        responseCanBeEdited: false,
        canBeDisabled: false,
    },
    from: {
        responseCanBeEdited: false,
        canBeDisabled: 'settings',
    },
    emote: {
        responseCanBeEdited: false,
        canBeDisabled: 'settings',
    },
    show: {
        responseCanBeEdited: false,
        canBeDisabled: 'settings',
    },
}


class Command {
  constructor(command_id, channel_id, name, response, command_options) {
    this.command_id = command_id;
    this.channel_id = channel_id;
    this.name = name;
    this.response = response;
    this.command_options = command_options;
  }

  static async create(channel_id, name, response, command_options) {
    try {
      const query = `
        INSERT INTO commands (channel_id, name, response, command_options)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [channel_id, name, response, command_options];
      const result = await db.query(query, values);
      const newCommand = result.rows[0];
      return new Command(newCommand.command_id, newCommand.channel_id, newCommand.name, newCommand.response, newCommand.command_options);
    } catch (error) {
      throw new Error('Error creating command: ' + error.message);
    }
  }

  static async findById(command_id) {
    try {
      const query = 'SELECT * FROM commands WHERE command_id = $1';
      const values = [command_id];
      const result = await db.query(query, values);
      const command = result.rows[0];
      if (!command) {
        throw new Error('Command not found');
      }
      return new Command(command.command_id, command.channel_id, command.name, command.response, command.command_options);
    } catch (error) {
      throw new Error('Error finding command: ' + error.message);
    }
  }

  static async findByChannelAndName(channel_id, name) {
    try {
      const query = 'SELECT * FROM commands WHERE channel_id = $1 AND (name = $2 OR command_options->>\'aliasOf\' = $2)';
      const values = [channel_id, name];
      const result = await db.query(query, values);
      const command = result.rows[0];
      if (!command) {
        throw new Error('Command not found');
      }
      return new Command(command.command_id, command.channel_id, command.name, command.response, command.command_options);
    } catch (error) {
      throw new Error('Error finding command: ' + error.message);
    }
  }

  static async findAllByChannel(channel_id) {
    try {
      const query = 'SELECT * FROM commands WHERE channel_id = $1';
      const values = [channel_id];
      const result = await db.query(query, values);
      const commands = result.rows.map((command) => new Command(command.command_id, command.channel_id, command.name, command.response, command.command_options));
      return commands;
    } catch (error) {
      throw new Error('Error finding commands: ' + error.message);
    }
  }

  async update(response, command_options) {
    try {
        if (!this.command_id) {
            throw new Error('Command ID is missing. Make sure the command exists in the database before updating.');
        }

        // Check if the command is a system command
        if (SYSTEM_COMMANDS.hasOwnProperty(this.name)) {
            throw new Error('System commands cannot be updated.');
        }

        // Check if the response can be edited
        if (!SYSTEM_COMMANDS[this.name].responseCanBeEdited) {
            throw new Error('Response of this command cannot be updated.');
        }

        const query = 'UPDATE commands SET response = $1, command_options = $2 WHERE command_id = $3 RETURNING *';
        const values = [response, command_options, this.command_id];
        const result = await db.query(query, values);
        const updatedCommand = result.rows[0];
        this.response = updatedCommand.response;
        this.command_options = updatedCommand.command_options;
        return this;
    } catch (error) {
        throw new Error('Error updating command: ' + error.message);
    }
}

  async delete() {
    try {
      const query = 'DELETE FROM commands WHERE command_id = $1';
      const values = [this.command_id];
      await db.query(query, values);
      return true;
    } catch (error) {
      throw new Error('Error deleting command: ' + error.message);
    }
  }
}

export default Command;
