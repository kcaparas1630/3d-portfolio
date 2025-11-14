import { useEffect, useState } from "react";

export interface JoystickState {
  x: number; // -1 to 1 (left to right)
  y: number; // -1 to 1 (up to down)
  angle: number; // angle in radians
  distance: number; // 0 to 1
}

export const useJoystick = () => {
  const [joystickState, setJoystickState] = useState<JoystickState>({
    x: 0,
    y: 0,
    angle: 0,
    distance: 0,
  });

  const [isActive, setIsActive] = useState(false);
  const [showJoystick, setShowJoystick] = useState(false);

  // Check if device should show joystick (mobile landscape, width <= 1366px)
  useEffect(() => {
    const checkDevice = () => {
      const isMobileSize = window.innerWidth <= 1366;
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      setShowJoystick(isMobileSize && isLandscape);
    };

    checkDevice();

    // Listen for orientation and resize changes
    window.addEventListener("resize", checkDevice);
    const mediaQueryList = window.matchMedia("(orientation: landscape)");
    mediaQueryList.addEventListener("change", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      mediaQueryList.removeEventListener("change", checkDevice);
    };
  }, []);

  const calculateJoystickState = (
    centerX: number,
    centerY: number,
    touchX: number,
    touchY: number,
    maxDistance: number
  ): JoystickState => {
    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const clampedDistance = Math.min(distance, maxDistance);
    const normalizedDistance = clampedDistance / maxDistance;

    const angle = Math.atan2(deltaY, deltaX);

    // Calculate normalized x and y (-1 to 1)
    const x = (deltaX / maxDistance) * (clampedDistance / distance || 0);
    const y = (deltaY / maxDistance) * (clampedDistance / distance || 0);

    return {
      x: isNaN(x) ? 0 : x,
      y: isNaN(y) ? 0 : y,
      angle,
      distance: normalizedDistance,
    };
  };

  const resetJoystick = () => {
    setJoystickState({
      x: 0,
      y: 0,
      angle: 0,
      distance: 0,
    });
    setIsActive(false);
  };

  return {
    joystickState,
    isActive,
    setIsActive,
    setJoystickState,
    calculateJoystickState,
    resetJoystick,
    showJoystick,
  };
};
