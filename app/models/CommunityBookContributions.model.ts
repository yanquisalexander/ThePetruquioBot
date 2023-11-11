import Database from "../../lib/DatabaseManager";
import CommunityBook from "./CommunityBook.model";
import User from "./User.model";

class CommunityBookContribution {
    id: string;
    userId: string;
    content: string;
    createdAt: Date;
    user: User;
    communityBook: CommunityBook;

    constructor(id: string, userId: string, content: string, createdAt: Date, user: User, communityBook: CommunityBook) {
        this.id = id;
        this.userId = userId;
        this.content = content;
        this.createdAt = createdAt;
        this.user = user;
        this.communityBook = communityBook;
    }

    public static async create(communityBook: CommunityBook, userId: string, content: string): Promise<CommunityBookContribution> {
        const { rows } = await Database.query(`
            INSERT INTO community_book_contributions (community_book_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [communityBook.id, userId, content]);
        return new CommunityBookContribution(
            rows[0].id,
            rows[0].user_id,
            rows[0].content,
            rows[0].created_at,
            await User.findByTwitchId(rows[0].user_id) as User,
            communityBook
        );
    }

    public static async getByCommunityBookId(communityBookId: string): Promise<CommunityBookContribution[]> {
        const { rows } = await Database.query(`
            SELECT * FROM community_book_contributions
            WHERE community_book_id = $1
            ORDER BY created_at ASC;
        `, [communityBookId]);
        const contributions = await Promise.all(rows.map(async row => new CommunityBookContribution(
            row.id,
            row.user_id,
            row.content,
            row.created_at,
            await User.findByTwitchId(row.user_id) as User,
            await CommunityBook.findById(row.community_book_id) as CommunityBook
        )));
        return contributions;
    }

    public static async delete(id: string): Promise<void> {
        await Database.query(`
            DELETE FROM community_book_contributions
            WHERE id = $1;
        `, [id]);
    }
}

export default CommunityBookContribution;