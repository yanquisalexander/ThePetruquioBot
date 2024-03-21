import axios, { type AxiosError, type AxiosInstance } from 'axios'
import { Configuration } from '../config'
import paypalSDK from 'paypal-rest-sdk'
import type User from '@/app/models/User.model'
import Environment from '@/utils/environment'

class PayPal {
  private readonly authToken: string
  private readonly subscriptionPlanId: string
  private readonly endpoint: string
  private readonly axiosInstance: AxiosInstance

  private accessToken: string = ''

  constructor () {
    this.authToken = this.buildGrantToken()
    this.subscriptionPlanId = Configuration.PAYPAL_SUBSCRIPTION_PLAN_ID
    this.endpoint = Configuration.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
    this.axiosInstance = axios.create({
      baseURL: this.endpoint,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.authToken}`
      }
    })

    this.initialize()
  }

  private initialize (): void {
    paypalSDK.configure({
      mode: Configuration.PAYPAL_MODE,
      client_id: Configuration.PAYPAL_CLIENT_ID,
      client_secret: Configuration.PAYPAL_CLIENT_SECRET
    })

    this.getAccessToken().then(token => {
      this.accessToken = token
    }).catch(error => {
      console.error(error)
    })
  }

  private buildGrantToken (): string {
    return Buffer.from(`${Configuration.PAYPAL_CLIENT_ID}:${Configuration.PAYPAL_CLIENT_SECRET}`).toString('base64')
  }

  private async getAccessToken (): Promise<string> {
    const response = await axios.post(`${this.endpoint}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${this.authToken}`
      }
    })

    return response.data.access_token
  }

  private async refreshToken (): Promise<string> {
    this.accessToken = await this.getAccessToken()
    return this.accessToken
  }

  public async createSubscription (user: User): Promise<any> {
    try {
      const subscriptionPayload = {
        plan_id: this.subscriptionPlanId,
        custom_id: `P-${user.twitchId}`,
        suscriber: {
          name: {
            given_name: user.displayName
          },
          email_address: user.email
        },
        application_context: {
          brand_name: 'PetruquioLIVE',
          user_action: 'SUBSCRIBE_NOW',
          shipping_preference: 'NO_SHIPPING',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: Environment.isDevelopment ? 'http://localhost:8888/dashboard/plus/success' : 'https://petruquio.live/dashboard/plus/success',
          cancel_url: Environment.isDevelopment ? 'http://localhost:8888/dashboard/plus/cancel' : 'https://petruquio.live/dashboard/plus/cancel'
        }
      }

      const response = await this.axiosInstance.post('/v1/billing/subscriptions', subscriptionPayload)
      return response.data
    } catch (error) {
      if ((error as AxiosError).response && (error as AxiosError).status === 401) {
        // Si hay un problema de autenticación, refresca el token y reintentar la solicitud
        await this.refreshToken()
        return await this.createSubscription(user)
      }
      throw error
    }
  }

  public async getSubscription (subscriptionId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/v1/billing/subscriptions/${subscriptionId}`)
      return response.data
    } catch (error) {
      if ((error as AxiosError).response && (error as AxiosError).status === 401) {
        // Si hay un problema de autenticación, refresca el token y reintentar la solicitud
        await this.refreshToken()
        return await this.getSubscription(subscriptionId)
      }
      throw error
    }
  }

  public async isSubscriptionActive (subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscription(subscriptionId)
      return subscription.status === 'ACTIVE'
    } catch (error) {
      console.error(error)
      return false
    }
  }

  public async cancelSubscription (subscriptionId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/v1/billing/subscriptions/${subscriptionId}/cancel`)
      return response.data
    } catch (error) {
      if ((error as AxiosError).response && (error as AxiosError).status === 401) {
        // Si hay un problema de autenticación, refresca el token y reintentar la solicitud
        await this.refreshToken()
        return await this.cancelSubscription(subscriptionId)
      }
      throw error
    }
  }

  public async activateSubscription (subscriptionId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/v1/billing/subscriptions/${subscriptionId}/activate`)
      return response.data
    } catch (error) {
      if ((error as AxiosError).response && (error as AxiosError).status === 401) {
        // Si hay un problema de autenticación, refresca el token y reintentar la solicitud
        await this.refreshToken()
        return await this.activateSubscription(subscriptionId)
      }
      throw error
    }
  }

  public async getSubscriptionTransactions (subscriptionId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/v1/billing/subscriptions/${subscriptionId}/transactions`)
      return response.data
    } catch (error) {
      if ((error as AxiosError).response && (error as AxiosError).status === 401) {
        // Si hay un problema de autenticación, refresca el token y reintentar la solicitud
        await this.refreshToken()
        return await this.getSubscriptionTransactions(subscriptionId)
      }
      throw error
    }
  }
}

export const paypalService = new PayPal()
