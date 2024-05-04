import axios from "axios"

import { API_ENDPOINT } from "./constants"
export const PetruquioSDK = {
  searchUsers: async (query: string) => {
    const response = await axios.get(`${API_ENDPOINT}/twitch-tools/users/search`, {
      params: {
        query
      }
    })
    return response
  }
}