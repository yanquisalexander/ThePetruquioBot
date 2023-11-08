import dotenv from 'dotenv';

dotenv.config()

class Environment {
    private static isHttps: boolean = false;
    static get isDevelopment(): boolean {
        return process.env.NODE_ENV === 'development'
    }

    static get websiteUrl(): string {
        if(process.env.WEBSITE_URL && !process.env.WEBSITE_URL.startsWith('http')) throw new Error('WEBSITE_URL must start with http or https');
        return process.env.WEBSITE_URL || process.env.NODE_ENV === 'development' ? 'http://localhost:8888' : 'https://petruquio.live';
    }

    static get rootDir(): string {
        return __dirname + '/..';
    }

    static get hostname(): string {
        if (process.env.HOSTNAME) {
            return process.env.HOSTNAME;
        }

        if (process.env.NODE_ENV === 'development') {
            return 'api-local.petruquio.live';
        }

        return 'api.petruquio.live';
    }

    static get https(): boolean {
        return this.isHttps;
    }

    static set https(value: boolean) {
        this.isHttps = value;
    }


}

export default Environment;


