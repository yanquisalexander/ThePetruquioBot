import OBSWebSocket from 'obs-websocket-js';
const { rawUser } = useCurrentUser();
interface Scene {
    sceneIndex: number;
    sceneName: string;
    sceneUuid: string;
}

interface SpecialInputs {
    desktop1: string;
    desktop2: string;
    mic1: string;
    mic2: string;
    mic3: string;
    mic4: string;
}

export default class OBSManager {
    private obs: OBSWebSocket | null = null;

    async connect(): Promise<void> {
        if (!this.obs) {
            const address = rawUser().channel.preferences.obsWebsocketUrl.value
            const password = rawUser().channel.preferences.obsWebsocketPassword.value
            this.obs = new OBSWebSocket();
            try {
                await this.obs.connect(`ws://${address}`, password);
                console.log(`Connected to OBS Studio at ${address}`);
            } catch (error) {
                console.error('Error connecting to OBS Studio', error);
                throw error;
            }
        }
    }

    async disconnect(): Promise<void> {
        if (this.obs) {
            try {
                await this.obs.disconnect();
                console.log('Disconnected from OBS Studio');
            } catch (error) {
                console.error('Error disconnecting from OBS Studio', error);
                throw error;
            } finally {
                this.obs = null;
            }
        }
    }

    async fetchScenes(): Promise<{ scenes: Scene[], currentPreviewSceneName: string, currentProgramSceneName: string, currentPreviewSceneUuid: string, currentProgramSceneUuid: string }> {
        if (this.obs) {
            try {
                const response = await this.obs.call('GetSceneList');
                const scenes: Scene[] = response.scenes.map((scene: any) => ({
                    sceneIndex: scene.sceneIndex,
                    sceneName: scene.sceneName,
                    sceneUuid: scene.sceneUuid,
                }));
                return {
                    scenes,
                    currentPreviewSceneName: response.currentPreviewSceneName,
                    currentProgramSceneName: response.currentProgramSceneName,
                    currentPreviewSceneUuid: response.currentPreviewSceneUuid,
                    currentProgramSceneUuid: response.currentProgramSceneUuid,
                };
            } catch (error) {
                console.error('Error fetching scenes from OBS Studio', error);
                throw error;
            }
        } else {
            throw new Error('Not connected to OBS Studio');
        }
    }

    async getInputList(): Promise<any[]> {
        if (this.obs) {
            try {
                const response = await this.obs.call('GetInputList');
                return response.inputs
            } catch (error) {
                console.error('Error fetching input list from OBS Studio', error);
                throw error;
            }
        } else {
            throw new Error('Not connected to OBS Studio');
        }
    }

    async getSpecialInputList(): Promise<SpecialInputs> {
        if (this.obs) {
            try {
                const response = await this.obs.call('GetSpecialInputs');
                return response
            } catch (error) {
                console.error('Error fetching special input list from OBS Studio', error);
                throw error;
            }
        } else {
            throw new Error('Not connected to OBS Studio');
        }
    }


    async changeScene(sceneUuid: string): Promise<void> {
        if (this.obs) {
            try {
                await this.obs.call('SetCurrentProgramScene', {
                    sceneUuid
                });
            } catch (error) {
                console.error('Error changing scene in OBS Studio', error);
                throw error;
            }
        } else {
            throw new Error('Not connected to OBS Studio');
        }
    }

    async getStats(): Promise<any> {
        if (this.obs) {
            try {
                const response = await this.obs.call('GetStats');
                return response;
            } catch (error) {
                console.error('Error fetching stats from OBS Studio', error);
                throw error;
            }
        } else {
            throw new Error('Not connected to OBS Studio');
        }
    }

    getObsInstance(): OBSWebSocket | null {
        return this.obs;
    }
}
