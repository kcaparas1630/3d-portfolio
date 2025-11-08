export class AudioPlayer {
  private audio: HTMLAudioElement;
  private isPlaying: boolean = false;

  constructor(audioUrl: string, loop: boolean = true) {
    this.audio = new Audio(audioUrl);
    this.audio.loop = loop;
  }

  play(): Promise<void> | undefined {
    const playPromise = this.audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          this.isPlaying = false;
        });
    }

    return playPromise;
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
  }

  setVolume(volume: number) {
    // Volume range: 0.0 to 1.0
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  fadeOut(duration: number = 1000) {
    const startVolume = this.audio.volume;
    const fadeStep = startVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      if (this.audio.volume > fadeStep) {
        this.audio.volume -= fadeStep;
      } else {
        this.audio.volume = 0;
        this.pause();
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  fadeIn(duration: number = 1000, targetVolume: number = 1.0) {
    this.audio.volume = 0;
    this.play();

    const fadeStep = targetVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      if (this.audio.volume < targetVolume - fadeStep) {
        this.audio.volume += fadeStep;
      } else {
        this.audio.volume = targetVolume;
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}
