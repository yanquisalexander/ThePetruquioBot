import type { RouteLocationNormalized } from "vue-router"


const defineNuxtRouteMiddleware = async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    try {
        const makePing = await fetch(`${API_ENDPOINT}/ping`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            })

        if (makePing.status !== 200) {
            throw createError({ 
                statusCode: 503, 
                statusMessage: 'Service Unavailable' 
            })
  
        }
    } catch (error) {
        throw createError({ 
            statusCode: 521, 
            message: "Looks like our server is down.\nPlease try again later."
        })
    }
}

export default defineNuxtRouteMiddleware
