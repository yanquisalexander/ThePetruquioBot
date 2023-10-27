import chalk from "chalk";
import Database from "../../lib/DatabaseManager";
import Environment from "../../utils/environment";
import Channel from "./Channel.model";
import User from "./User.model";

interface MessageData {
    sender: User;
    channel: Channel;
    content: string;
    timestamp: Date;
}

class MessageLogger {
    static async getByUser(user: User): Promise<any[]> {
        try {
            const query = 'SELECT * FROM messages WHERE sender_id = $1';
            const values = [user.twitchId];
            
            const result = await Database.query(query, values);
            return result.rows;

        } catch (error) {
            return [];
        }
    }
    public static async logMessage(messageData: MessageData): Promise<void> {
        const { sender, channel, content, timestamp } = messageData;

        if(Environment.isDevelopment) {
            console.log(chalk.green('[MESSAGE LOGGER]'), chalk.white(`Registrando mensaje de ${sender.username} en ${channel.user.username}: ${content}`));
        }

        try {
            const query = 'INSERT INTO messages (sender_id, channel_id, content, timestamp) VALUES ($1, $2, $3, $4)';
            const values = [sender.twitchId, channel.twitchId, content, timestamp];
            await Database.query(query, values);
        } catch (error) {
            console.error('Error al registrar mensaje:', error);
        }
    }


}

export default MessageLogger;
