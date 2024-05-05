import { Howl, Howler } from 'howler';

export enum Sounds {
  BUTTON_CLICK = '/assets/sounds/button-clicked.mp3',
  PIN_CLICK = '/assets/sounds/pin-select.mp3',
  BACKGROUND_MUSIC = 'background_music.mp3',
  GOT_TALENT_RED_BUTTON = '/assets/sounds/got-talent-red-button.mp3',
  GOT_TALENT_RED_BUTTON_BACKDROP = '/assets/sounds/red-button-backdrop.mp3',
  GOLDEN_BUZZER = '/assets/sounds/celebration.mp3',
  GOLDEN_BUZZER_PRESSED = '/assets/sounds/pase-de-oro.mp3',
  GOLDEN_BUZZER_BACKDROP = '/assets/sounds/golden-backdrop.mp3',
  NEW_NOTIFICATION = '/assets/sounds/notification.mp3',
  CONFETTI = '/assets/sounds/confetti.mp3',
  SLACK_NOTIFICATION = '/assets/sounds/slack-notification.mp3',
}

class SoundManager {
  private static instance: SoundManager;
  private constructor() {
    // Load all sounds
    Howler.autoUnlock = true;
    Object.values(Sounds).forEach((sound) => {
      new Howl({
        src: [sound],
        html5: true,
        preload: true,
      });
    });

  }
  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private sounds: { [key: string]: Howl | null } = {};

  public playSound = (src: string, volume?: number) => {
    if (!this.sounds[src]) {
      this.sounds[src] = new Howl({
        src: [src],
        html5: true,
      });
    }
    this.sounds[src]?.volume(volume || 1);
    this.sounds[src]?.play();
    console.log('Playing sound', src);
  };

  public stopSound = (src: string) => {
    if (this.sounds[src]) {
      this.sounds[src]?.stop();
    }
  };

  public loopSound = (src: string) => {
    if (!this.sounds[src]) {
      this.sounds[src] = new Howl({
        src: [src],
        html5: true,
        loop: true,
      });
    }
    this.sounds[src]?.play();
    this.sounds[src]?.loop(true);
  };
}

export default SoundManager;
