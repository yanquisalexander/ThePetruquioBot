import 'dotenv/config'
import path from 'path'
import os from 'os'
class Environment {
  private static isHttps: boolean = false
  static get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  static get websiteUrl(): string {
    if (process.env.WEBSITE_URL && !process.env.WEBSITE_URL.startsWith('http')) throw new Error('WEBSITE_URL must start with http or https')
    return process.env.WEBSITE_URL ?? process.env.NODE_ENV === 'development' ? 'http://localhost:8888' : 'https://petruquiolive.vercel.app'
  }

  static get rootDir(): string {
    return path.resolve(__dirname, '..')
  }

  static get hostname(): string {
    if (process.env.HOSTNAME) {
      return process.env.HOSTNAME
    }

    if (process.env.NODE_ENV === 'development') {
      return 'api-local.petruquio.live'
    }

    return 'api-petruquio.abstudios.tech'
  }

  static get https(): boolean {
    return this.isHttps
  }

  static set https(value: boolean) {
    this.isHttps = value
  }

  static get osHostname(): string {
    return os.hostname()
  }
}

export default Environment
