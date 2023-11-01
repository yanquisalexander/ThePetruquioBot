import { HelixStream } from "@twurple/api";

class MemoryVariables {
    private static latency: number = 0;
    private static liveChannels: HelixStream[] | null = [];
    private static logs: string[] = [];

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
}

export default MemoryVariables;
