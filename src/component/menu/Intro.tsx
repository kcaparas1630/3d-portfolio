import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "../../utils/AudioPlay";
import { Volume2, VolumeX } from "lucide-react";
import styles from "./styles/Intro.module.css";
const Introduction = () => {
  const navigate = useNavigate();
  const musicPlayerRef = useRef<AudioPlayer | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    // Create audio player
    musicPlayerRef.current = new AudioPlayer(
      "/music/our-greatest-adventure-427782.mp3"
    );

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
  }, []);

  const toggleMusic = () => {
    if (isMusicPlaying) {
      musicPlayerRef.current?.pause();
      setIsMusicPlaying(false);
    } else {
      musicPlayerRef.current?.play();
      setIsMusicPlaying(true);
    }
  };

  const handlePortfolioClick = () => {
    // Fade out music before navigating
    musicPlayerRef.current?.fadeOut(1000);
    setTimeout(() => {
      navigate({ to: "/app" });
    }, 1000);
  };

  return (
    <>
      {/* Orientation warning for mobile portrait mode */}
      <div className={styles["orientation-warning"]}>
        <h2>Please Rotate Your Device</h2>
        <p>This website is best viewed in landscape orientation.</p>
      </div>

      {/* Sound toggle button - fixed in top right */}
      <button
        onClick={toggleMusic}
        className={styles["sound-toggle"]}
        title={isMusicPlaying ? "Pause music" : "Play music"}
      >
        {isMusicPlaying ? (
          <Volume2 size={28} color="white" strokeWidth={2.5} />
        ) : (
          <VolumeX size={28} color="white" strokeWidth={2.5} />
        )}
      </button>

      <section className={styles["intro-banner"]}>
        <div className={styles["intro-content"]}>
          <h1>Kent Hudson Caparas</h1>
          <h2>Full-Stack Engineer | AI Enthusiast | Tech Junkie </h2>
          <div className={styles["button-group"]}>
            <button onClick={handlePortfolioClick}>
              <div className={styles["button-inner-shadow"]}></div>
              <div className={styles["button-white-base"]}></div>
              <div className={styles["button-top-container"]}>
                <div className={styles["button-main"]}>
                  <div className={styles["button-yellow-top"]}></div>
                  <span className={styles["button-text"]} data-text="Portfolio">
                    Portfolio
                  </span>
                </div>
              </div>
            </button>
            <button onClick={() => (window.location.href = "#contact")}>
              <div className={styles["button-inner-shadow"]}></div>
              <div className={styles["button-white-base"]}></div>
              <div className={styles["button-top-container"]}>
                <div className={styles["button-main"]}>
                  <div className={styles["button-yellow-top"]}></div>
                  <span className={styles["button-text"]} data-text="Contact">
                    Contact
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Introduction;
