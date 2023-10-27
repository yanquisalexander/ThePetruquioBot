import NodeGeocoder from 'node-geocoder';

class Geolocation {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    private static geocoder = NodeGeocoder({
        provider: 'openstreetmap'
    });

    public static async getLocalization(address: string): Promise<NodeGeocoder.Entry | null> {
        const result = await this.geocoder.geocode(address);
        if (result.length === 0) {
            return null;
        }
        return result[0];
    }
}

export default Geolocation;