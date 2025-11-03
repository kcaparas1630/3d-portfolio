import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "../utils/AudioPlay";

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
    musicPlayerRef.current.play();

    // play() returns undefined, but the AudioPlayer's play() catches errors internally
    // We'll assume autoplay is blocked and let user click to enable
    setIsMusicPlaying(false);

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
      {/* Sound toggle button - fixed in top right */}
      <button
        onClick={toggleMusic}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '2px solid #353839',
          backgroundColor: isMusicPlaying ? '#ADD1F5' : '#ffffff',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
        title={isMusicPlaying ? 'Pause music' : 'Play music'}
      >
        {isMusicPlaying ? '🔊' : '🔇'}
      </button>

      <section
        className="intro-banner"
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ADD1F5",
        }}
      >
        <h1>Kent Hudson Caparas</h1>
        <p>Full-Stack Engineer | AI Enthusiast | Tech Junkie </p>
        <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
          <button onClick={handlePortfolioClick}>Portfolio</button>
          <button onClick={() => (window.location.href = "#contact")}>
            Contact Me
          </button>
        </div>
      </section>
    </>
  );
};

export default Introduction;
