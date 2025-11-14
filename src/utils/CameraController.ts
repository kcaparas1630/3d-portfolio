import { useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3, PerspectiveCamera } from "three";
import { useMemo, useRef } from "react";

const CameraController = ({ targetRef }: { targetRef: React.RefObject<Group | null> }) => {
  const { camera } = useThree();
  const worldPosition = useMemo(() => new Vector3(), []);
  const cameraOffset = useMemo(() => new Vector3(0, 1, 5), []); // Behind and above the character
  const lookAtOffset = useMemo(() => new Vector3(0, 1, 0), []); // Look at character's upper body

  // Smoothed target positions
  const smoothedPosition = useRef(new Vector3(0, 1, 5));
  const smoothedLookAt = useRef(new Vector3(0, 1, 0));

  useFrame((_, delta) => {
    if (targetRef.current && camera instanceof PerspectiveCamera) {
      // Get world position of the character
      targetRef.current.getWorldPosition(worldPosition);

      // Calculate desired camera position (behind and above the character)
      const desiredPosition = new Vector3(
        worldPosition.x + cameraOffset.x,
        worldPosition.y + cameraOffset.y,
        worldPosition.z + cameraOffset.z
      );

      // Calculate look-at target (character's upper body)
      const lookAtTarget = new Vector3(
        worldPosition.x + lookAtOffset.x,
        worldPosition.y + lookAtOffset.y,
        worldPosition.z + lookAtOffset.z
      );

      // Smoothly interpolate both position and lookAt using delta time for frame-rate independence
      const lerpFactor = Math.min(delta * 5, 1); // Smooth damping
      smoothedPosition.current.lerp(desiredPosition, lerpFactor);
      smoothedLookAt.current.lerp(lookAtTarget, lerpFactor);

      // Apply smoothed values to camera
      camera.position.copy(smoothedPosition.current);
      camera.lookAt(smoothedLookAt.current);
    }
  });

  return null;
};

export default CameraController;
