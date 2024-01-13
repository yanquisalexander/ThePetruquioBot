import Database from "../../lib/DatabaseManager";

class DeckButton {
  deckButtonId: number;
  pageId: number;
  deckId: number;
  actions: any; // Puedes ajustar el tipo según tus necesidades
  icon: string;
  text: string;

  constructor(deckButtonId: number, pageId: number, deckId: number, actions: any, icon: string, text: string) {
    this.deckButtonId = deckButtonId;
    this.pageId = pageId;
    this.deckId = deckId;
    this.actions = actions;
    this.icon = icon;
    this.text = text;
  }

  static async createDeckButton(pageId: number, deckId: number, actions: any, icon: string, text: string): Promise<DeckButton | null> {
    try {
      const query = `
        INSERT INTO deck_buttons (page_id, deck_id, actions, icon, text)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`;

      const values = [pageId, deckId, actions, icon, text];
      const result = await Database.query(query, values);

      if (result.rows.length > 0) {
        const newDeckButton = result.rows[0];
        return new DeckButton(newDeckButton.button_id, newDeckButton.page_id, newDeckButton.deck_id, newDeckButton.actions, newDeckButton.icon, newDeckButton.text);
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error creating deck button:", error);
      return null;
    }
  }

  async deleteDeckButton(): Promise<boolean> {
    try {
      const query = `
        DELETE FROM deck_buttons
        WHERE button_id = $1`;

      const values = [this.deckButtonId];
      const result = await Database.query(query, values);

        if (!result.rowCount) {
            console.log("No se eliminó ningún botón de deck. Puede que el botón no exista o haya ocurrido un error.");
            return false;
        }

      if (result?.rowCount > 0) {
        return true;
      } else {
        console.log("No se eliminó ningún botón de deck. Puede que el botón no exista o haya ocurrido un error.");
        return false;
      }
    } catch (error) {
      console.error("Error deleting deck button:", error);
      return false;
    }
  }

    static async getDeckButtonById(id: number): Promise<DeckButton | null> {
        try {
        const query = `
            SELECT * FROM deck_buttons
            WHERE button_id = $1`;
    
        const values = [id];
        const result = await Database.query(query, values);
    
        if (result.rows.length > 0) {
            const deckButton = result.rows[0];
            return new DeckButton(deckButton.button_id, deckButton.page_id, deckButton.deck_id, deckButton.actions, deckButton.icon, deckButton.text);
        } else {
            return null;
        }
        } catch (error) {
        console.error("Error getting deck button by id:", error);
        return null;
        }
    }

    static async getDeckButtonsByPageId(id: number): Promise<DeckButton[] | null> {
        try {
        const query = `
            SELECT * FROM deck_buttons
            WHERE page_id = $1`;
    
        const values = [id];
        const result = await Database.query(query, values);
    
        if (result.rows.length > 0) {
            const deckButtons = result.rows;
            return deckButtons.map((deckButton) => new DeckButton(deckButton.button_id, deckButton.page_id, deckButton.deck_id, deckButton.actions, deckButton.icon, deckButton.text));
        } else {
            return null;
        }
        } catch (error) {
        console.error("Error getting deck buttons by page id:", error);
        return null;
        }
    }

    async updateDeckButton(actions: any, icon: string, text: string): Promise<boolean> {
        try {
        const query = `
            UPDATE deck_buttons
            SET actions = $1, icon = $2, text = $3
            WHERE button_id = $4`;
    
        const values = [actions, icon, text, this.deckButtonId];
        const result = await Database.query(query, values);
    
        if (!result.rowCount) {
            console.log("No se actualizó ningún botón de deck. Puede que el botón no exista o haya ocurrido un error.");
            return false;
        }
    
        if (result?.rowCount > 0) {
            return true;
        } else {
            console.log("No se actualizó ningún botón de deck. Puede que el botón no exista o haya ocurrido un error.");
            return false;
        }
        } catch (error) {
        console.error("Error updating deck button:", error);
        return false;
        }
    }
}

export default DeckButton;
