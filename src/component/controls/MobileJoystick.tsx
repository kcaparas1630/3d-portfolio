import { useRef } from "react";
import { useJoystick } from "../../hooks/useJoystick";
import styles from "./styles/MobileJoystick.module.css";

interface MobileJoystickProps {
  onJoystickMove: (x: number, y: number) => void;
}

const MobileJoystick = ({ onJoystickMove }: MobileJoystickProps) => {
  const {
    joystickState,
    isActive,
    setIsActive,
    setJoystickState,
    calculateJoystickState,
    resetJoystick,
    showJoystick,
  } = useJoystick();

  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;

    const touch = e.touches[0];
    touchIdRef.current = touch.identifier;
    setIsActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null || !joystickBaseRef.current) return;

    const touch = Array.from(e.touches).find(
      (t) => t.identifier === touchIdRef.current
    );
    if (!touch) return;

    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDistance = rect.width / 2;

    const newState = calculateJoystickState(
      centerX,
      centerY,
      touch.clientX,
      touch.clientY,
      maxDistance
    );

    setJoystickState(newState); // Update the visual state
    onJoystickMove(newState.x, -newState.y); // Invert y for game controls
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    const touchEnded = Array.from(e.changedTouches).some(
      (t) => t.identifier === touchIdRef.current
    );

    if (touchEnded) {
      touchIdRef.current = null;
      resetJoystick();
      onJoystickMove(0, 0);
    }
  };

  if (!showJoystick) return null;

  const knobX = joystickState.x * 40; // 40px max movement
  const knobY = joystickState.y * 40;

  return (
    <div className={styles.container}>
      <div
        ref={joystickBaseRef}
        className={`${styles.base} ${isActive ? styles.active : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className={styles.knob}
          style={{
            transform: `translate(${knobX}px, ${knobY}px)`,
          }}
        />
      </div>
    </div>
  );
};

export default MobileJoystick;
