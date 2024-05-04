import Database from "../../lib/DatabaseManager";
import Channel from "./Channel.model";
import CommunityBookContribution from "./CommunityBookContributions.model";

`

-- community_book.sql
CREATE TABLE IF NOT EXISTS community_book (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES users(twitch_id) NOT NULL,
    title VARCHAR(255) NOT NULL,
	description TEXT,
    cover TEXT, -- Nuevo campo para la portada
    created_at TIMESTAMPTZ DEFAULT NOW(),
	updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- community_book.sql
CREATE TABLE IF NOT EXISTS community_book_contributions (
    id SERIAL PRIMARY KEY,
    community_book_id INT REFERENCES community_book(id),
    user_id INTEGER REFERENCES users(twitch_id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


`


class CommunityBook {
    id: string;
    title: string;
    description: string | null;
    cover: string | null;
    createdAt: Date;
    updatedAt: Date;
    body: string;
    contributions: CommunityBookContribution[] | null;
    channel: Channel;

    constructor(id: string, title: string, description: string | null, cover: string | null, createdAt: Date, updatedAt: Date, body: string, contributions: CommunityBookContribution[] | null, channel: Channel) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.cover = cover;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.body = body;
        this.contributions = contributions;
        this.channel = channel;
    }

    public static async create(channel: Channel, title: string, description: string | null, cover: string | null, body: string): Promise<CommunityBook> {
        const { rows } = await Database.query(`
            INSERT INTO community_book (channel_id, title, description, cover, body)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [channel.twitchId, title, description, cover, body]);
        return new CommunityBook(
            rows[0].id,
            rows[0].title,
            rows[0].description,
            rows[0].cover,
            rows[0].created_at,
            rows[0].updated_at,
            rows[0].body,
            null,
            channel
        );
        
    }

    public static async findById(id: string): Promise<CommunityBook | null> {
        const { rows } = await Database.query(`
            SELECT * FROM community_book
            WHERE id = $1;
        `, [id]);
        if (rows.length === 0) return null;
        return new CommunityBook(
            rows[0].id,
            rows[0].title,
            rows[0].description,
            rows[0].cover,
            rows[0].created_at,
            rows[0].updated_at,
            rows[0].body,
            await CommunityBookContribution.getByCommunityBookId(rows[0].id) as CommunityBookContribution[],
            await Channel.findByTwitchId(rows[0].channel_id) as Channel
        );
    }

    public static async getByChannel(channel: Channel): Promise<CommunityBook[]> {
        const { rows } = await Database.query(`
            SELECT * FROM community_book
            WHERE channel_id = $1;
        `, [channel.twitchId]);

        const communityBooks = await Promise.all(rows.map(async row => new CommunityBook(
            row.id,
            row.title,
            row.description,
            row.cover,
            row.created_at,
            row.updated_at,
            row.body,
            await CommunityBookContribution.getByCommunityBookId(row.id) as CommunityBookContribution[],
            channel
        )));

        return communityBooks;
    }

    async save(): Promise<void> {
        await Database.query(`
            UPDATE community_book
            SET title = $1, description = $2, cover = $3, updated_at = NOW()
            WHERE id = $4;
        `, [this.title, this.description, this.cover, this.id]);
    }

    async saveBody(): Promise<void> {
        await Database.query(`
            UPDATE community_book
            SET body = $1, updated_at = NOW()
            WHERE id = $2;
        `, [this.body, this.id]);
    }

    async delete(): Promise<void> {
        await Database.query(`
            DELETE FROM community_book
            WHERE id = $1;
        `, [this.id]);
    }

    async addContribution(userId: string, content: string): Promise<CommunityBookContribution> {
        return CommunityBookContribution.create(this, userId, content);
    }

    async deleteContribution(id: string): Promise<void> {
        await CommunityBookContribution.delete(id);
    }

    async getContribution(id: string): Promise<CommunityBookContribution | null> {
        const contributions = await CommunityBookContribution.getByCommunityBookId(this.id);
        return contributions.find(contribution => contribution.id === id) || null;
    }

    async getContributions(): Promise<CommunityBookContribution[]> {
        return CommunityBookContribution.getByCommunityBookId(this.id);
    }

    async getContributionsCount(): Promise<number> {
        const { rows } = await Database.query(`
            SELECT COUNT(*) FROM community_book_contributions
            WHERE community_book_id = $1;
        `, [this.id]);
        return parseInt(rows[0].count);
    }

    async getContributionsByUser(userId: string): Promise<CommunityBookContribution[]> {
        const contributions = await CommunityBookContribution.getByCommunityBookId(this.id);
        return contributions.filter(contribution => contribution.userId === userId);
    }
}

export default CommunityBook;