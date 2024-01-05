// ExternalAccount.model.ts
import chalk from "chalk";
import Database from "../../lib/DatabaseManager";
import User from "./User.model";

// Twitch can't be an ExternalAccount because is the main account
export enum ExternalAccountProvider {
    SPOTIFY = 'spotify',
    DISCORD = 'discord',
}



class ExternalAccount {
    user: User;
    provider: ExternalAccountProvider;
    accountId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    metadata?: Object;

    constructor(user: User, provider: ExternalAccountProvider, accountId: string, accessToken?: string, refreshToken?: string, expiresAt?: Date, metadata?: Object) {
        this.user = user;
        this.provider = provider;
        this.accountId = accountId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = expiresAt;
        this.metadata = metadata;
    }

    public static async findByUser(user: User): Promise<ExternalAccount[]> {
        const query = 'SELECT * FROM external_accounts WHERE user_id = $1';
        const values = [user.twitchId];
        const result = await Database.query(query, values);

        const externalAccounts: ExternalAccount[] = [];
        for (const accountData of result.rows) {
            externalAccounts.push(new ExternalAccount(
                accountData.user_id,
                accountData.provider,
                accountData.account_id,
                accountData.access_token,
                accountData.refresh_token,
                accountData.expires_at,
                accountData.metadata
            ));
        }

        return externalAccounts;
    }

    public static async findByProviderAndUser(provider: ExternalAccountProvider, user: User): Promise<ExternalAccount | null> {
        const query = 'SELECT * FROM external_accounts WHERE provider = $1 AND user_id = $2';
        const values = [provider, user.twitchId];
        const result = await Database.query(query, values);

        if (result.rows.length > 0) {
            const accountData = result.rows[0];
            return new ExternalAccount(
                user,
                accountData.provider,
                accountData.account_id,
                accountData.access_token,
                accountData.refresh_token,
                accountData.expires_at,
                accountData.metadata
            );
        } else {
            return null;
        }
    }


    public static async create(user: User, provider: ExternalAccountProvider, accountId: string, accessToken?: string, refreshToken?: string, expiresAt?: Date, metadata?: Object): Promise<ExternalAccount> {
        try {
            const query = 'INSERT INTO external_accounts (user_id, provider, account_id, access_token, refresh_token, expires_at, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)';
            const values = [user.twitchId, provider, accountId, accessToken, refreshToken, expiresAt, metadata];
            await Database.query(query, values);

            return new ExternalAccount(user, provider, accountId, accessToken, refreshToken, expiresAt);
        } catch (error) {
            throw new Error(`Error creating external account: ${(error as Error).message}`);
        }
    }

    public async update(accessToken?: string, refreshToken?: string, expiresAt?: Date, metadata?: Object): Promise<void> {
        try {
            const query = 'UPDATE external_accounts SET access_token = $1, refresh_token = $2, expires_at = $3, metadata = $4 WHERE user_id = $5 AND provider = $6 AND account_id = $7';
            const values = [accessToken, refreshToken, expiresAt, metadata, this.user.twitchId, this.provider, this.accountId];
            await Database.query(query, values);

            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresAt = expiresAt;
            this.metadata = metadata;
            await this.save();
        } catch (error) {
            throw new Error(`Error updating external account: ${(error as Error).message}`);
        }
    }

    public async delete(): Promise<void> {
        try {
            const query = 'DELETE FROM external_accounts WHERE user_id = $1 AND provider = $2 AND account_id = $3';
            const values = [this.user.twitchId, this.provider, this.accountId];
            await Database.query(query, values);
        } catch (error) {
            throw new Error(`Error deleting external account: ${(error as Error).message}`);
        }
    }

    public async save(): Promise<void> {
        try {
            const query = 'INSERT INTO external_accounts (user_id, provider, account_id, access_token, refresh_token, expires_at, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id, provider, account_id) DO UPDATE SET access_token = $4, refresh_token = $5, expires_at = $6, metadata = $7';
            const values = [this.user.twitchId, this.provider, this.accountId, this.accessToken, this.refreshToken, this.expiresAt, this.metadata];
            await Database.query(query, values);
        } catch (error) {
            throw new Error(`Error saving external account: ${(error as Error).message}`);
        }
    }

    public async getToken(): Promise<string | null> {
        if (!this.accessToken) {
            console.error(chalk.red(`[ExternalAccount]`), `External account (${this.provider}) for account ${this.accountId} (User ${this.user.username}) doesn't have an access token`);
            return null;
        }
        return this.accessToken;
    }

    public async getRefreshToken(): Promise<string | null> {
        if (!this.refreshToken) {
            console.error(chalk.red(`[ExternalAccount]`), `External account (${this.provider}) for account ${this.accountId} (User ${this.user.username}) doesn't have a refresh token`);
            return null;
        }
        return this.refreshToken;
    }

    public async getExpiresAt(): Promise<Date | null> {
        if (!this.expiresAt) {
            console.error(chalk.red(`[ExternalAccount]`), `External account (${this.provider}) for account ${this.accountId} (User ${this.user.username}) doesn't have an expiration date`);
            return null;
        }
        return this.expiresAt;
    }

    public async getMetadata(): Promise<Object | null> {
        if (!this.metadata) {
            console.error(chalk.red(`[ExternalAccount]`), `External account (${this.provider}) for account ${this.accountId} (User ${this.user.username}) doesn't have metadata`);
            return null;
        }
        return this.metadata
    }

}

export default ExternalAccount;
