import axios from "axios";

export const useAuthenticatedRequest = () => {
    const { getToken } = useCurrentUser();
    const axiosInstance = axios.create({
        baseURL: API_ENDPOINT,
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return axiosInstance;
}