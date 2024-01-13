import { Request, Response } from 'express';
import { ExpressUser } from '../interfaces/ExpressUser.interface';
import CurrentUser from "../../lib/CurrentUser";
import Deck from "../models/Deck.model";
import DeckButton from "../models/DeckButton.model";
import DeckPage from "../models/DeckPage.model";


class DecksController {
    static async getDecks(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        const user = await currentUser.getCurrentUser()

        if (!user) {
            return res.status(400).json({
                errors: [
                    "User not found."
                ],
                error_type: "user_not_found"
            });
        }

        const channel = await user.getChannel()

        if (!channel) {
            return res.status(400).json({
                errors: [
                    "Channel not found."
                ],
                error_type: "channel_not_found"
            });
        }

        const decks = await Deck.getDecksByChannel(channel)

        if (!decks) {
            return res.status(500).json({
                errors: [
                    "Error getting decks."
                ],
                error_type: "internal_server_error"
            });
        }

        return res.status(200).json({
            data: {
                decks
            }
        });
    }

    static async createDeck(req: Request, res: Response): Promise<Response> {
        const currentUser = new CurrentUser(req.user as ExpressUser);

        const user = await currentUser.getCurrentUser()

        if (!user) {
            return res.status(400).json({
                errors: [
                    "User not found."
                ],
                error_type: "user_not_found"
            });
        }

        const channel = await user.getChannel()

        if (!channel) {
            return res.status(400).json({
                errors: [
                    "Channel not found."
                ],
                error_type: "channel_not_found"
            });
        }

        const deckName = req.body.name;
        const rows = req.body.rows;
        const cols = req.body.cols;

        if (!deckName || !rows || !cols) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            });
        }

        if (rows < 1 || rows > 10) {
            return res.status(400).json({
                errors: [
                    "Rows must be between 1 and 10."
                ],
                error_type: "invalid_rows"
            });
        }

        if (cols < 1 || cols > 10) {
            return res.status(400).json({
                errors: [
                    "Columns must be between 1 and 10."
                ],
                error_type: "invalid_cols"
            });
        }

        const deck = await Deck.createDeck(deckName, channel, rows, cols);

        if (!deck) {
            return res.status(500).json({
                errors: [
                    "Error creating deck."
                ],
                error_type: "internal_server_error"
            });
        }

        return res.status(200).json({
            data: {
                deck
            }
        });

    }

    static async getDeckById(req: Request, res: Response): Promise<Response> {
        const deckId = req.params.deckId as unknown as number;

        if (!deckId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            });
        }

        const deck = await Deck.getDeckById(deckId);

        if (!deck) {
            return res.status(404).json({
                errors: [
                    "Deck not found."
                ],
                error_type: "deck_not_found"
            });
        }

        return res.status(200).json({
            data: {
                deck
            }
        });
    }

    static async deleteDeckById(req: Request, res: Response): Promise<Response> {
        const deckId = req.params.deckId as unknown as number;

        if (!deckId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            });
        }

        const deck = await Deck.getDeckById(deckId);

        if (!deck) {
            return res.status(404).json({
                errors: [
                    "Deck not found."
                ],
                error_type: "deck_not_found"
            });
        }

        const deleted = await Deck.deleteDeckById(deckId);

        if (!deleted) {
            return res.status(500).json({
                errors: [
                    "Error deleting deck."
                ],
                error_type: "internal_server_error"
            });
        }

        return res.status(200).json({
            data: {
                deck
            }
        });
    }

    static async createDeckPage(req: Request, res: Response): Promise<Response> {
        const deckId = req.params.deckId as unknown as number;

        if (!deckId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            });
        }

        const deck = await Deck.getDeckById(deckId);

        if (!deck) {
            return res.status(404).json({
                errors: [
                    "Deck not found."
                ],
                error_type: "deck_not_found"
            });
        }

        const deckPage = await DeckPage.createDeckPage(deckId);

        if (!deckPage) {
            return res.status(500).json({
                errors: [
                    "Error creating deck page."
                ],
                error_type: "internal_server_error"
            });
        }

        return res.status(200).json({
            data: {
                deckPage
            }
        });
    }

    static async deleteDeckPageById(req: Request, res: Response): Promise<Response> {
        const deckPageId = req.params.deckPageId as unknown as number;

        if (!deckPageId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            });
        }

        const deckPage = await DeckPage.getDeckPageById(deckPageId);

        if (!deckPage) {
            return res.status(404).json({
                errors: [
                    "Deck page not found."
                ],
                error_type: "deck_page_not_found"
            });
        }

        const deleted = deckPage.deleteDeckPage();

        if (!deleted) {
            return res.status(500).json({
                errors: [
                    "Error deleting deck page."
                ],
                error_type: "internal_server_error"
            });
        }

        return res.status(200).json({
            data: {
                deckPage
            }
        });
    }

    static async createDeckButton(req: Request, res: Response): Promise<Response> {
        const deckPageId = req.params.deckPageId as unknown as number;

        if (!deckPageId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            });
        }

        const deckPage = await DeckPage.getDeckPageById(deckPageId);

        if (!deckPage) {
            return res.status(404).json({
                errors: [
                    "Deck page not found."
                ],
                error_type: "deck_page_not_found"
            });
        }

        const actions = req.body.actions;
        const icon = req.body.icon;
        const text = req.body.text;

        if (!actions || !icon || !text) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            });
        }

        const deckButton = await DeckButton.createDeckButton(deckPageId, deckPage.deckId, actions, icon, text);

        if (!deckButton) {
            return res.status(500).json({
                errors: [
                    "Error creating deck button."
                ],
                error_type: "internal_server_error"
            });
        }

        return res.status(200).json({
            data: {
                deckButton
            }
        });
    }

    static async deleteDeckButtonById(req: Request, res: Response): Promise<Response> {
        const deckButtonId = req.params.deckButtonId as unknown as number;

        if (!deckButtonId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            });
        }

        const deckButton = await DeckButton.getDeckButtonById(deckButtonId);

        if (!deckButton) {
            return res.status(404).json({
                errors: [
                    "Deck button not found."
                ],
                error_type: "deck_button_not_found"
            });
        }

        const deleted = deckButton.deleteDeckButton();

        if (!deleted) {
            return res.status(500).json({
                errors: [
                    "Error deleting deck button."
                ],
                error_type: "internal_server_error"
            });
        }

        return res.status(200).json({
            data: {
                deckButton
            }
        });
    }

    static async getDeckButtonById(req: Request, res: Response): Promise<Response> {
        const deckButtonId = req.params.deckButtonId as unknown as number;

        if (!deckButtonId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            });
        }

        const deckButton = await DeckButton.getDeckButtonById(deckButtonId);

        if (!deckButton) {
            return res.status(404).json({
                errors: [
                    "Deck button not found."
                ],
                error_type: "deck_button_not_found"
            });
        }

        return res.status(200).json({
            data: {
                deckButton
            }
        });
    }

    static async updateDeckButtonById(req: Request, res: Response): Promise<Response> {
        const deckButtonId = req.params.deckButtonId as unknown as number;

        if (!deckButtonId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            })
        }

        const deckButton = await DeckButton.getDeckButtonById(deckButtonId);

        if (!deckButton) {
            return res.status(404).json({
                errors: [
                    "Deck button not found."
                ],
                error_type: "deck_button_not_found"
            });
        }

        const actions = req.body.actions;
        const icon = req.body.icon;
        const text = req.body.text;

        if (!actions || !icon || !text) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            })
        }

        const updated = await deckButton.updateDeckButton(actions, icon, text);

        if (!updated) {
            return res.status(500).json({
                errors: [
                    "Error updating deck button."
                ],
                error_type: "internal_server_error"
            });
        }

        return res.status(200).json({
            data: {
                deckButton
            }
        });
    }

    static async getDeckPageById(req: Request, res: Response): Promise<Response> {
        const deckPageId = req.params.deckPageId as unknown as number;

        if (!deckPageId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            })
        }

        const deckPage = await DeckPage.getDeckPageById(deckPageId);

        if (!deckPage) {
            return res.status(404).json({
                errors: [
                    "Deck page not found."
                ],
                error_type: "deck_page_not_found"
            });
        }

        return res.status(200).json({
            data: {
                deckPage
            }
        });
    }

    static async updateDeck(req: Request, res: Response): Promise<Response> {
        const deckId = req.params.deckId as unknown as number;

        if (!deckId) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            })
        }

        const deck = await Deck.getDeckById(deckId);

        if (!deck) {
            return res.status(404).json({
                errors: [
                    "Deck not found."
                ],
                error_type: "deck_not_found"
            });
        }

        const deckName = req.body.name;
        const rows = req.body.rows;
        const cols = req.body.cols;

        if (!deckName || !rows || !cols) {
            return res.status(400).json({
                errors: [
                    "Missing required parameters."
                ],
                error_type: "missing_parameters"
            })
        }

        if (rows < 1 || rows > 10) {
            return res.status(400).json({
                errors: [
                    "Rows must be between 1 and 10."
                ],
                error_type: "invalid_rows"
            });
        }

        if (cols < 1 || cols > 10) {
            return res.status(400).json({
                errors: [
                    "Columns must be between 1 and 10."
                ],
                error_type: "invalid_cols"
            });
        }

        const updated = await Deck.updateDeckById(deckId, deckName, rows, cols);

        if (!updated) {
            return res.status(500).json({
                errors: [
                    "Error updating deck."
                ],
                error_type: "internal_server_error"
            });
        }

        return res.status(200).json({
            data: {
                deck
            }
        });
    }
}

export default DecksController;