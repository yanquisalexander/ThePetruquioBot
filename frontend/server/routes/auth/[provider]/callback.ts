import { getServerSession } from '#auth'
import axios from 'axios'
import { API_ENDPOINT, FRONTEND_URL } from "~/utils/constants"

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const code = query.code
    const provider = event.context.params?.provider
    const config = useRuntimeConfig()
    let session = await getServerSession(event)

    if (!provider) {
        return {
            status: 400,
            body: 'No provider specified',
        }
    }

    if (!session) {
        return {
            errors: [
                `To link your ${provider?.charAt(0).toUpperCase() + provider?.slice(1)} account, you must be logged in.`
            ],
            error_type: 'UNAUTHORIZED'
        }

    }

    if (!code) {
        return {
            status: 400,
            body: 'No code provided',
        }
    }

    let url = `${API_ENDPOINT}/external-accounts/${provider}/callback?code=${code}`
    console.log(url)

    try {
        const response = await axios.get(url, {
            headers: {
                // @ts-ignore
                Authorization: `Bearer ${session.user.token}`
            }
        })
        console.log(response)
        let protocol = FRONTEND_URL.includes('localhost') ? 'http' : 'https'
        return sendRedirect(event, `/account?provider=${provider}&success=true`)
    } catch (error) {
        console.log(error)
        return {
            errors: [
                `There was an error linking your ${provider?.charAt(0).toUpperCase() + provider?.slice(1)} account.`
            ],
            error_type: 'INTERNAL_SERVER_ERROR'
        }
    }
})