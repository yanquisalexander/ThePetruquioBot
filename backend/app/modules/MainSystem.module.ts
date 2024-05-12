import Database from "@/lib/DatabaseManager";


export class MainSystem {

    static async createBackup() {
        await Database.createBackup();
    }
}