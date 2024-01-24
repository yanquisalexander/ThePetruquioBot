import Database from "../../lib/DatabaseManager";
import DeckButton from "./DeckButton.model";

class DeckPage {
  deckPageId: number;
  deckId: number;
  buttons?: DeckButton[];

  constructor(deckPageId: number, deckId: number, buttons?: DeckButton[]) {
    this.deckPageId = deckPageId;
    this.deckId = deckId;
    this.buttons = buttons || [];
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

      if (!result.rowCount) {
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
        const deckPage = new DeckPage(result.rows[0].page_id, result.rows[0].deck_id);
        const deckButtons = await DeckButton.getDeckButtonsByPageId(deckPage.deckPageId);
        console.log(deckButtons);
        if (deckButtons) {
          deckPage.buttons = deckButtons;
        }

        return deckPage;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting deck page by id:", error);
      return null;
    }
  }

  static async getDeckPagesByDeckId(deckId: number): Promise<DeckPage[] | null> {
    try {
      const query = `
        SELECT * FROM deck_pages
        WHERE deck_id = $1`;

      const values = [deckId];
      const result = await Database.query(query, values);

      if (result.rows.length > 0) {
        const deckPages: DeckPage[] = await Promise.all(
          result.rows.map(async (deckPage) => {
            let newDeckPage = new DeckPage(deckPage.page_id, deckPage.deck_id);
            let deckButtons = await DeckButton.getDeckButtonsByPageId(newDeckPage.deckPageId);

            if (deckButtons) {
              newDeckPage.buttons = deckButtons;
            }

            return newDeckPage;
          })
        );

        return deckPages;

      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting deck pages by deck id:", error);
      return null;
    }
  }
}

export default DeckPage;
