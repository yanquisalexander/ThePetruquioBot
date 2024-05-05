export default defineNuxtPlugin(() => {
    // Preload SoundManager and Howler's audio files
    SoundManager.getInstance();
});