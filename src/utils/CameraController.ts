import { useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { useMemo } from "react";

const CameraController = ({ targetRef }: { targetRef: React.RefObject<Group | null> }) => {
  const { camera } = useThree();
  const worldPosition = useMemo(() => new Vector3(), []);

  useFrame(() => {
    if (targetRef.current) {
      // Get world position of the group (which includes RigidBody's position)
      targetRef.current.getWorldPosition(worldPosition);

      // Camera follows character horizontally at waist height
      camera.position.x = worldPosition.x;
      camera.position.y = -1; // Fixed at waist height (character base is at -2, waist at ~0)
      camera.position.z = worldPosition.z + 5;

      // Look at the waist position
      camera.lookAt(worldPosition.x, 0, worldPosition.z);
    }
  });

  return null;
};

export default CameraController;
