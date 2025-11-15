import type { TouchEvent } from "react";
import { useJoystick } from "../../hooks/useJoystick";
import styles from "./styles/MobileJumpButton.module.css";

interface MobileJumpButtonProps {
  onJump: () => void;
}

const MobileJumpButton = ({ onJump }: MobileJumpButtonProps) => {
  const { showJoystick } = useJoystick();

  const handleTouchStart = (e: TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onJump();
  };

  if (!showJoystick) return null;

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        onTouchStart={handleTouchStart}
        type="button"
        aria-label="Jump"
      >
        X
      </button>
    </div>
  );
};

export default MobileJumpButton;
