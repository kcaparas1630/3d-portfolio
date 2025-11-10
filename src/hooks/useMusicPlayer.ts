import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "../utils/AudioPlay";

export const useMusicPlayer = (musicPath: string) => {
  const musicPlayerRef = useRef<AudioPlayer | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    // Create audio player
    musicPlayerRef.current = new AudioPlayer(musicPath);

    // Try autoplay and check if it succeeds
    const playPromise = musicPlayerRef.current.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Autoplay succeeded
          setIsMusicPlaying(true);
        })
        .catch(() => {
          // Autoplay blocked by browser
          setIsMusicPlaying(false);
        });
    }

    // Cleanup: stop music when component unmounts
    return () => {
      musicPlayerRef.current?.stop();
    };
  }, [musicPath]);

  const toggleMusic = () => {
    if (isMusicPlaying) {
      musicPlayerRef.current?.pause();
      setIsMusicPlaying(false);
    } else {
      musicPlayerRef.current?.play();
      setIsMusicPlaying(true);
    }
  };

  return {
    isMusicPlaying,
    toggleMusic,
    musicPlayerRef,
  };
};
