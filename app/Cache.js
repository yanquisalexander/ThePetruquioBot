class Cache {
    constructor() {
        this.data = {};
        this.defaultTTL = 3600; // Tiempo de vida predeterminado para los datos en segundos
    }

    get(key) {
        const item = this.data[key];
        if (item && item.expires > Date.now()) {
            return item.value;
        }
        return null;
    }

    set(key, value, ttl = this.defaultTTL) {
        const expires = Date.now() + ttl * 1000;
        this.data[key] = { value, expires };
    }

    remove(key) {
        delete this.data[key];
    }

    clear() {
        this.data = {};
    }
}

export default Cache;