class Cache {
    private data: { [key: string]: { value: any; expires: number } };
    private defaultTTL: number;

    constructor() {
        this.data = {};
        this.defaultTTL = 3600; // Default time-to-live for data in seconds
    }

    get(key: string): any | null {
        const item = this.data[key];
        if (item && item.expires > Date.now()) {
            return item.value;
        }
        return null;
    }

    set(key: string, value: any, ttl: number = this.defaultTTL): void {
        const expires = Date.now() + ttl * 1000;
        this.data[key] = { value, expires };
    }

    remove(key: string): void {
        delete this.data[key];
    }

    clear(): void {
        this.data = {};
    }
}

export default Cache;
