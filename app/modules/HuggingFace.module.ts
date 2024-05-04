import { HfInference } from '@huggingface/inference';
import { Configuration } from "@/app/config";

class HuggingFace {
    private static instance: HuggingFace | null = null;
    private hfInference: HfInference;

    private constructor() {
        const { HUGGING_FACE_API_KEY } = Configuration;
        this.hfInference = new HfInference(HUGGING_FACE_API_KEY);
    }

    public static getInstance(): HuggingFace {
        if (!HuggingFace.instance) {
            HuggingFace.instance = new HuggingFace();
        }
        return HuggingFace.instance;
    }

    public getInference(): HfInference {
        return this.hfInference;
    }
}

export const getHuggingFace = () => HuggingFace.getInstance();
