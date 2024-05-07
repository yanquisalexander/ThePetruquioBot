import { dbService } from "@/app/services/Database";
import { UploadsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { remoteStorageService } from "../services/RemoteStorage";
import User from "./User.model";

export interface UploadData {
    id: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    key?: string | null;
    uploaded_by: number | null;
    uploaded_at: Date | null;
}

export class Upload {
    data: UploadData

    constructor(data: UploadData) {
        this.data = data
    }

    static async getById(id: string): Promise<Upload | null> {
        const data = await dbService.query.UploadsTable
            .findFirst({
                where: eq(UploadsTable.id, id)
            })

        if (!data) {
            return null
        }

        return new Upload(data)
    }

    static async getByUserId(user: User): Promise<Upload[]> {
        const data = await dbService.query.UploadsTable
            .findMany({
                where: eq(UploadsTable.uploaded_by, user.twitchId)
            })

        return data.map(d => new Upload(d))
    }

    async save() {
        await dbService.insert(UploadsTable)
            .values(this.data)
            .onConflictDoUpdate({
                target: [UploadsTable.id],
                set: this.data
            })
    }

    async delete() {
        try {
            await remoteStorageService.deleteFile(this.data.key as string)
            await dbService.delete(UploadsTable)
                .where(eq(UploadsTable.id, this.data.id))
        } catch (error) {
            console.error(error)
            throw error
        }

    }

}