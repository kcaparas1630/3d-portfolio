import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  AnimationMixer,
  AnimationAction,
  Group,
  Mesh,
  MeshStandardMaterial,
} from "three";
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
} from "@react-three/rapier";

interface ModelProps {
  joystickInput?: { x: number; y: number };
}

const Model = forwardRef<Group, ModelProps>(({ joystickInput }, ref) => {
  const walkingGltf = useGLTF(
    "/Character/Animations/Animation_Walking_withSkin_draco.glb"
  );
  const idleGltf = useGLTF(
    "/Character/Animations/Animation_Idle_02_withSkin_draco.glb"
  );
  const secondIdleGltf = useGLTF(
    "/Character/Animations/Animation_Idle_03_withSkin_draco.glb"
  );

  const mixersRef = useRef<{
    idle1: AnimationMixer | null;
    idle2: AnimationMixer | null;
    walking: AnimationMixer | null;
  }>({
    idle1: null,
    idle2: null,
    walking: null,
  });

  const groupRef = useRef<Group>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const idle1Ref = useRef<Group>(null);
  const idle2Ref = useRef<Group>(null);
  const walkingRef = useRef<Group>(null);

  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const actionsRef = useRef<{
    idle1: AnimationAction | null;
    idle2: AnimationAction | null;
    walking: AnimationAction | null;
  }>({
    idle1: null,
    idle2: null,
    walking: null,
  });
  const currentActionRef = useRef<"idle1" | "idle2" | "walking">("idle1");
  const idleTimerRef = useRef<number>(0);
  const currentIdleRef = useRef<"idle1" | "idle2">("idle1");

  useImperativeHandle(ref, () => groupRef.current as Group);

  useEffect(() => {
    // Setup mixers and actions for all animations
    mixersRef.current.idle1 = new AnimationMixer(idleGltf.scene);
    mixersRef.current.idle2 = new AnimationMixer(secondIdleGltf.scene);
    mixersRef.current.walking = new AnimationMixer(walkingGltf.scene);

    if (idleGltf.animations && idleGltf.animations.length > 0) {
      actionsRef.current.idle1 = mixersRef.current.idle1.clipAction(
        idleGltf.animations[0]
      );
      actionsRef.current.idle1.play();
    }

    if (secondIdleGltf.animations && secondIdleGltf.animations.length > 0) {
      actionsRef.current.idle2 = mixersRef.current.idle2.clipAction(
        secondIdleGltf.animations[0]
      );
    }

    if (walkingGltf.animations && walkingGltf.animations.length > 0) {
      actionsRef.current.walking = mixersRef.current.walking.clipAction(
        walkingGltf.animations[0]
      );
    }

    // Fix material properties for all models
    const fixMaterials = (model: Group) => {
      model.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh;
          if (mesh.material) {
            const material = mesh.material as MeshStandardMaterial;
            if (material.emissive) {
              material.emissive.setHex(0x000000);
            }
            material.emissiveIntensity = 0;
            material.metalness = 0;
            material.roughness = 1;
            material.needsUpdate = true;
          }
        }
      });
    };

    fixMaterials(idleGltf.scene);
    fixMaterials(secondIdleGltf.scene);
    fixMaterials(walkingGltf.scene);

    // Set initial visibility
    if (idle1Ref.current) idle1Ref.current.visible = true;
    if (idle2Ref.current) idle2Ref.current.visible = false;
    if (walkingRef.current) walkingRef.current.visible = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === "ArrowUp" || key === "w")
        setKeys((k) => ({ ...k, forward: true }));
      if (e.key === "ArrowDown" || key === "s")
        setKeys((k) => ({ ...k, backward: true }));
      if (e.key === "ArrowLeft" || key === "a")
        setKeys((k) => ({ ...k, left: true }));
      if (e.key === "ArrowRight" || key === "d")
        setKeys((k) => ({ ...k, right: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === "ArrowUp" || key === "w")
        setKeys((k) => ({ ...k, forward: false }));
      if (e.key === "ArrowDown" || key === "s")
        setKeys((k) => ({ ...k, backward: false }));
      if (e.key === "ArrowLeft" || key === "a")
        setKeys((k) => ({ ...k, left: false }));
      if (e.key === "ArrowRight" || key === "d")
        setKeys((k) => ({ ...k, right: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [walkingGltf, idleGltf, secondIdleGltf]);

  useFrame((_state, delta) => {
    // Update all mixers
    mixersRef.current.idle1?.update(delta);
    mixersRef.current.idle2?.update(delta);
    mixersRef.current.walking?.update(delta);

    if (rigidBodyRef.current && groupRef.current) {
      const moveSpeed = 2.5;
      const rotateSpeed = 3 * delta;

      // Check for movement from keyboard or joystick
      const hasJoystickInput =
        joystickInput &&
        (Math.abs(joystickInput.x) > 0.1 || Math.abs(joystickInput.y) > 0.1);
      const isMoving = keys.forward || keys.backward || hasJoystickInput;

      // Handle idle animation cycling every 5 seconds
      if (!isMoving) {
        idleTimerRef.current += delta;

        if (idleTimerRef.current >= 5) {
          idleTimerRef.current = 0;

          // Switch to the other idle animation
          if (currentIdleRef.current === "idle1") {
            // Switch to idle2
            if (idle1Ref.current) idle1Ref.current.visible = false;
            if (idle2Ref.current) idle2Ref.current.visible = true;
            actionsRef.current.idle2?.reset().play();
            currentIdleRef.current = "idle2";
            currentActionRef.current = "idle2";
          } else {
            // Switch back to idle1
            if (idle2Ref.current) idle2Ref.current.visible = false;
            if (idle1Ref.current) idle1Ref.current.visible = true;
            actionsRef.current.idle1?.reset().play();
            currentIdleRef.current = "idle1";
            currentActionRef.current = "idle1";
          }
        }
      }

      // Switch between idle and walking animations
      if (isMoving && currentActionRef.current !== "walking") {
        // Switch to walking
        if (idle1Ref.current) idle1Ref.current.visible = false;
        if (idle2Ref.current) idle2Ref.current.visible = false;
        if (walkingRef.current) walkingRef.current.visible = true;
        actionsRef.current.walking?.reset().play();
        currentActionRef.current = "walking";
        idleTimerRef.current = 0; // Reset timer
      } else if (!isMoving && currentActionRef.current === "walking") {
        // Always return to idle1 after walking
        if (walkingRef.current) walkingRef.current.visible = false;
        if (idle1Ref.current) idle1Ref.current.visible = true;
        actionsRef.current.idle1?.reset().play();
        currentActionRef.current = "idle1";
        currentIdleRef.current = "idle1";
        idleTimerRef.current = 0; // Reset timer to start fresh
      }
      // Calculate velocity
      const velocity = { x: 0, z: 0 };

      // Handle joystick input
      if (hasJoystickInput && joystickInput) {
        // Joystick controls: x for rotation, y for forward/backward
        // Apply rotation based on horizontal joystick input (positive x = right turn)
        groupRef.current.rotation.y -= joystickInput.x * rotateSpeed * 1.5;

        // Move forward/backward based on vertical joystick input
        if (Math.abs(joystickInput.y) > 0.1) {
          velocity.x +=
            Math.sin(groupRef.current.rotation.y) * moveSpeed * joystickInput.y;
          velocity.z +=
            Math.cos(groupRef.current.rotation.y) * moveSpeed * joystickInput.y;
        }
      } else {
        // Rotation (relative to camera/viewer perspective)
        if (keys.left) groupRef.current.rotation.y += rotateSpeed; // Positive rotation for left
        if (keys.right) groupRef.current.rotation.y -= rotateSpeed; // Negative rotation for right

        // Keyboard controls
        if (keys.forward) {
          velocity.x += Math.sin(groupRef.current.rotation.y) * moveSpeed;
          velocity.z += Math.cos(groupRef.current.rotation.y) * moveSpeed;
        }
        if (keys.backward) {
          velocity.x -= Math.sin(groupRef.current.rotation.y) * moveSpeed;
          velocity.z -= Math.cos(groupRef.current.rotation.y) * moveSpeed;
        }
      }

      // Apply velocity to the RigidBody with interpolation for smoother movement
      const currentVel = rigidBodyRef.current.linvel();
      const smoothingFactor = 0.15; // Lower value = smoother movement

      rigidBodyRef.current.setLinvel(
        {
          x:
            currentVel.x * (1 - smoothingFactor) + velocity.x * smoothingFactor,
          y: currentVel.y, // Preserve gravity
          z:
            currentVel.z * (1 - smoothingFactor) + velocity.z * smoothingFactor,
        },
        true
      );

      // Lock rotation to prevent tipping
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      position={[0, 0, 0]}
      enabledRotations={[false, false, false]} // Prevent physics rotation
    >
      <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.75, 0]} />
      <group ref={groupRef}>
        <group ref={idle1Ref}>
          <primitive object={idleGltf.scene} scale={0.8} />
        </group>
        <group ref={idle2Ref}>
          <primitive object={secondIdleGltf.scene} scale={0.8} />
        </group>
        <group ref={walkingRef}>
          <primitive object={walkingGltf.scene} scale={0.8} />
        </group>
      </group>
    </RigidBody>
  );
});

export default Model;
