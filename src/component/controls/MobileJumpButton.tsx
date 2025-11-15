import { useJoystick } from "../../hooks/useJoystick";
import styles from "./styles/MobileJumpButton.module.css";

interface MobileJumpButtonProps {
  onJump: () => void;
}

const MobileJumpButton = ({ onJump }: MobileJumpButtonProps) => {
  const { showJoystick } = useJoystick();

  const handleTouchStart = (e: React.TouchEvent) => {
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
      >
        X
      </button>
    </div>
  );
};

export default MobileJumpButton;
