import { HelixStream } from "@twurple/api";

interface BookInfo {
    id: string;
}

namespace MemoryVariables {
    let latency: number = 0;
    let liveChannels: HelixStream[] | null = [];
    let logs: string[] = [];
    let lastLiveStreamsCheck: Date = new Date();
    let currentBooks: { [channelId: number]: BookInfo } = {};

    export const getLatency = (): number => latency;

    export const setLatency = (newLatency: number): void => {
        latency = newLatency;
    };

    export const getLiveChannels = (): HelixStream[] => liveChannels || [];

    export const setLiveChannels = (channels: HelixStream[]): void => {
        liveChannels = channels;
    };

    export const getLogs = (): string[] => logs;

    export const setLogs = (newLogs: string[]): void => {
        logs = newLogs;
    };

    export const getLastLiveStreamsCheck = (): Date => lastLiveStreamsCheck;

    export const setLastLiveStreamsCheck = (date: Date): void => {
        lastLiveStreamsCheck = date;
    };

    export const getCurrentBooks = (): { [channelId: number]: BookInfo } => currentBooks;

    export const setCurrentBooks = (books: { [channelId: number]: BookInfo }): void => {
        currentBooks = books;
    };

    export const getCurrentBook = (channelId: number): BookInfo | null => {
        return currentBooks[channelId] || null;
    };

    export const setCurrentBook = (channelId: number, book: BookInfo): void => {
        currentBooks[channelId] = book;
    };
}

export default MemoryVariables;
