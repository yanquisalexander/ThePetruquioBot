import axios from "axios";

class StreamerSonglist {
    id: number;
    requestsActive: boolean;
    constructor(id: number, requestsActive: boolean) {
        this.id = id;
        this.requestsActive = requestsActive;
    }

    static async getChannel(channelName: string): Promise<StreamerSonglist | null> {
        try {
            const response = await axios.get(`https://api.streamersonglist.com/v1/streamers/${channelName}`)
            return new StreamerSonglist(response.data.id, response.data.requests_active);
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getQueue(): Promise<any> {
        try {
            const response = await axios.get(`https://api.streamersonglist.com/v1/streamers/${this.id}/queue`)

            return response.data.list
        } catch (error) {
            console.error(error);
            return null;
        }
    }

}

export default StreamerSonglist;