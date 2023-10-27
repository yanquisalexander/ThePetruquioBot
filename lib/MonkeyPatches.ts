import MemoryVariables from "./MemoryVariables";

class MonkeyPatches {
    constructor() {
        throw new Error('This class cannot be instantiated');
    }

    public static apply(): void {
        this.patchConsole();
        console.log(`[MONKEY PATCHES] Monkey patches applied.`);
    }

    private static patchConsole(): void {
        /* Monkey patching console.log to add timestamps */

        const originalConsoleLog = console.log;
        console.log = (...args: any[]) => {
            const date = new Date();
            const timestamp = `[${date.toLocaleString()}]`;
            originalConsoleLog(timestamp, ...args);
            const log = args.join(' ');
            MemoryVariables.getLogs().push(`${timestamp} ${log}`);
        };
    }
}

export default MonkeyPatches;