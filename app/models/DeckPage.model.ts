import Database from "../../lib/DatabaseManager";

class DeckPage {
  deckPageId: number;
  deckId: number;

  constructor(deckPageId: number, deckId: number) {
    this.deckPageId = deckPageId;
    this.deckId = deckId;
  }

  static async createDeckPage(deckId: number): Promise<DeckPage | null> {
    try {
      const query = `
        INSERT INTO deck_pages (deck_id)
        VALUES ($1)
        RETURNING *`;

      const values = [deckId];
      const result = await Database.query(query, values);

      if (result.rows.length > 0) {
        const newDeckPage = result.rows[0];
        return new DeckPage(newDeckPage.page_id, newDeckPage.deck_id);
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error creating deck page:", error);
      return null;
    }
  }

  async deleteDeckPage(): Promise<boolean> {
    try {
      const query = `
        DELETE FROM deck_pages
        WHERE page_id = $1`;

      const values = [this.deckPageId];
      const result = await Database.query(query, values);

      if(!result.rowCount) {
        console.log("No se eliminó ninguna página de deck. Puede que la página no exista o haya ocurrido un error.");
        return false;
      }

      if (result?.rowCount > 0) {
        return true;
      } else {
        console.log("No se eliminó ninguna página de deck. Puede que la página no exista o haya ocurrido un error.");
        return false;
      }
    } catch (error) {
      console.error("Error deleting deck page:", error);
      return false;
    }
  }

  static async getDeckPageById(id: number): Promise<DeckPage | null> {
    try {
      const query = `
        SELECT * FROM deck_pages
        WHERE page_id = $1`;

      const values = [id];
      const result = await Database.query(query, values);

      if (result.rows.length > 0) {
        const deckPage = result.rows[0];
        return new DeckPage(deckPage.page_id, deckPage.deck_id);
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting deck page by id:", error);
      return null;
    }
  }
}

export default DeckPage;
