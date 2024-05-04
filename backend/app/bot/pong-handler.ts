import MemoryVariables from "../../lib/MemoryVariables";


export const pongHandler = (latency: number) => {
    MemoryVariables.setLatency(latency);
}