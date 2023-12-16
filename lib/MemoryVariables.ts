import { HelixStream } from "@twurple/api";

interface BookInfo {
    id: string;
}


class MemoryVariables {
    private static latency: number = 0;
    private static liveChannels: HelixStream[] | null = [];
    private static logs: string[] = [];
    private static lastLiveStreamsCheck: Date = new Date();
    private static currentBooks: { [channelId: number]: BookInfo } = {};


    public static getLatency(): number {
        return this.latency;
    }

    public static setLatency(latency: number): void {
        this.latency = latency;
    }

    public static getLiveChannels(): HelixStream[] {
        return this.liveChannels || [];
    }

    public static setLiveChannels(channels: HelixStream[]): void {
        this.liveChannels = channels;
    }

    public static getLogs(): string[] {
        return this.logs;
    }

    public static setLogs(logs: string[]): void {
        this.logs = logs;
    }

    public static getLastLiveStreamsCheck(): Date {
        return this.lastLiveStreamsCheck;
    }

    public static setLastLiveStreamsCheck(date: Date): void {
        this.lastLiveStreamsCheck = date;
    }

    public static getCurrentBooks(): { [channelId: number]: BookInfo } {
        return this.currentBooks;
    }

    public static setCurrentBooks(books: { [channelId: number]: BookInfo }): void {
        this.currentBooks = books;
    }

    public static getCurrentBook(channelId: number): BookInfo | null {
        return this.currentBooks[channelId] || null;
    }

    public static setCurrentBook(channelId: number, book: BookInfo): void {
        this.currentBooks[channelId] = book;
    }
}

export default MemoryVariables;
