import Database from "../../lib/DatabaseManager";
import Channel from "./Channel.model";
import DeckPage from "./DeckPage.model";

class Deck {
    deck_id: number;
    name: string;
    channel_id: number;
    rows: number;
    cols: number;

    constructor(deck_id: number, name: string, channel_id: number, rows: number, cols: number) {
        this.deck_id = deck_id;
        this.name = name;
        this.channel_id = channel_id;
        this.rows = rows;
        this.cols = cols;
    }
    static async createDeck(name: string, channel: Channel, rows: number, cols: number): Promise<Deck | null> {
        try {
            const query = `
        INSERT INTO decks (name, channel_id, rows, cols)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;

            const values = [name, channel.twitchId, rows, cols];
            const result = await Database.query(query, values);

            if (result.rows.length > 0) {
                const newDeck = result.rows[0];
                return newDeck;
            } else {
                // La inserción no tuvo éxito, puedes manejarlo según tus necesidades
                return null;
            }
        } catch (error) {
            console.error("Error creating deck:", error);
            return null;
        }
    }

    static async getDeckById(id: number): Promise<Deck | null> {
        try {
            const query = `
            SELECT * FROM decks
            WHERE deck_id = $1`;

            const values = [id];
            const result = await Database.query(query, values);

            if (result.rows.length > 0) {
                const deck = new Deck(result.rows[0].deck_id, result.rows[0].name, result.rows[0].channel_id, result.rows[0].rows, result.rows[0].cols);
                return deck;
            } else {
                // No se encontró el deck, puedes manejarlo según tus necesidades
                return null;
            }
        } catch (error) {
            console.error("Error getting deck by id:", error);
            return null;
        }
    }


    static async deleteDeckById(id: number): Promise<boolean> {
        try {
            const query = `
            DELETE FROM decks
            WHERE deck_id = $1`;

            const values = [id];
            const result = await Database.query(query, values);

            if (!result.rowCount) {
                return false;
            }

            // Verifica si la consulta fue exitosa
            if (result?.rowCount > 0) {
                return true;
            } else {
                console.log("No se eliminó ningún deck. Puede que el deck no exista o haya ocurrido un error.");
                return false;
            }
        } catch (error) {
            console.error("Error deleting deck by id:", error);
            return false;
        }
    }

    static async getDecksByChannel(channel: Channel): Promise<Deck[] | null> {
        try {
            const query = `
            SELECT * FROM decks
            WHERE channel_id = $1`;

            const values = [channel.twitchId];
            const result = await Database.query(query, values);


            const decks = result.rows;
            return decks;


        } catch (error) {
            console.error("Error getting decks by channel:", error);
            return null;
        }
    }

    static async updateDeckById(id: number, name: string, rows: number, cols: number): Promise<Deck | null> {
        try {
            const query = `
            UPDATE decks
            SET name = $1, rows = $2, cols = $3
            WHERE deck_id = $4
            RETURNING *`;

            const values = [name, rows, cols, id];
            const result = await Database.query(query, values);

            if (result.rows.length > 0) {
                const deck = result.rows[0];
                return deck;
            } else {
                // No se encontró el deck, puedes manejarlo según tus necesidades
                return null;
            }
        } catch (error) {
            console.error("Error updating deck by id:", error);
            return null;
        }
    }

    async getPages(): Promise<DeckPage[]> {
        const deckPages = await DeckPage.getDeckPagesByDeckId(this.deck_id);
        return deckPages || [];
    }

}



export default Deck;
