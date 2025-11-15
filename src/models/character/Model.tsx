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
  LoopOnce,
} from "three";
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import { ANIMATION_MAP } from "../../constants/animations";

type AnimationType =
  | "idle1"
  | "idle2"
  | "walkingForward"
  | "walkingBackward"
  | "jump";

interface ModelProps {
  joystickInput?: { x: number; y: number };
}

const Model = forwardRef<Group, ModelProps>(({ joystickInput }, ref) => {
  // Load animations using the animation map
  const walkingForwardGltf = useGLTF(ANIMATION_MAP.walkingForward);
  const walkingBackwardGltf = useGLTF(ANIMATION_MAP.walkingBackward);
  const idleGltf = useGLTF(ANIMATION_MAP.idle1);
  const secondIdleGltf = useGLTF(ANIMATION_MAP.idle2);
  const jumpGltf = useGLTF(ANIMATION_MAP.jump);

  const mixersRef = useRef<{
    idle1: AnimationMixer | null;
    idle2: AnimationMixer | null;
    walkingForward: AnimationMixer | null;
    walkingBackward: AnimationMixer | null;
    jump: AnimationMixer | null;
  }>({
    idle1: null,
    idle2: null,
    walkingForward: null,
    walkingBackward: null,
    jump: null,
  });

  const groupRef = useRef<Group>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const idle1Ref = useRef<Group>(null);
  const idle2Ref = useRef<Group>(null);
  const walkingForwardRef = useRef<Group>(null);
  const walkingBackwardRef = useRef<Group>(null);
  const jumpRef = useRef<Group>(null);

  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  
  const actionsRef = useRef<{
    idle1: AnimationAction | null;
    idle2: AnimationAction | null;
    walkingForward: AnimationAction | null;
    walkingBackward: AnimationAction | null;
    jump: AnimationAction | null;
  }>({
    idle1: null,
    idle2: null,
    walkingForward: null,
    walkingBackward: null,
    jump: null,
  });
  
  const currentActionRef = useRef<AnimationType>("idle1");
  const idleTimerRef = useRef<number>(0);
  const currentIdleRef = useRef<"idle1" | "idle2">("idle1");
  const isGroundedRef = useRef<boolean>(true);
  const isJumpingRef = useRef<boolean>(false);
  const hasJumpedRef = useRef<boolean>(false);

  useImperativeHandle(ref, () => groupRef.current as Group);

  useEffect(() => {
    // Setup mixers and actions for all animations
    mixersRef.current.idle1 = new AnimationMixer(idleGltf.scene);
    mixersRef.current.idle2 = new AnimationMixer(secondIdleGltf.scene);
    mixersRef.current.walkingForward = new AnimationMixer(walkingForwardGltf.scene);
    mixersRef.current.walkingBackward = new AnimationMixer(walkingBackwardGltf.scene);
    mixersRef.current.jump = new AnimationMixer(jumpGltf.scene);

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

    if (walkingForwardGltf.animations && walkingForwardGltf.animations.length > 0) {
      actionsRef.current.walkingForward = mixersRef.current.walkingForward.clipAction(
        walkingForwardGltf.animations[0]
      );
    }
    
    if (walkingBackwardGltf.animations && walkingBackwardGltf.animations.length > 0) {
      actionsRef.current.walkingBackward = mixersRef.current.walkingBackward.clipAction(
        walkingBackwardGltf.animations[0]
      );
    }

    // Create finished handler function outside the conditional
    const finishedHandler = () => {
      isJumpingRef.current = false;
    };

    if (jumpGltf.animations && jumpGltf.animations.length > 0) {
      actionsRef.current.jump = mixersRef.current.jump.clipAction(
        jumpGltf.animations[0]
      );
      // Configure jump animation to play once and not loop
      actionsRef.current.jump.setLoop(LoopOnce, 1);
      actionsRef.current.jump.clampWhenFinished = true;
      
      // Add event listener for when jump animation finishes
      mixersRef.current.jump.addEventListener('finished', finishedHandler);
    }

    // Fix material properties for all models
    const fixMaterials = (model: Group) => {
      model.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
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
    fixMaterials(walkingForwardGltf.scene);
    fixMaterials(walkingBackwardGltf.scene);
    fixMaterials(jumpGltf.scene);

    // Set initial visibility
    if (idle1Ref.current) idle1Ref.current.visible = true;
    if (idle2Ref.current) idle2Ref.current.visible = false;
    if (walkingForwardRef.current) walkingForwardRef.current.visible = false;
    if (walkingBackwardRef.current) walkingBackwardRef.current.visible = false;
    if (jumpRef.current) jumpRef.current.visible = false;

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
      // Only set jump to true if not already jumping and grounded
      if (key === " " && !e.repeat && isGroundedRef.current && !isJumpingRef.current && !hasJumpedRef.current) {
        setKeys((k) => ({ ...k, jump: true }));
        hasJumpedRef.current = true;
      }
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
      if (key === " ") {
        setKeys((k) => ({ ...k, jump: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Capture the jump mixer for cleanup
    const jumpMixer = mixersRef.current.jump;

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      
      // Clean up event listener with captured reference and same handler
      if (jumpMixer) {
        jumpMixer.removeEventListener('finished', finishedHandler);
      }
    };
  }, [walkingForwardGltf, walkingBackwardGltf, idleGltf, secondIdleGltf, jumpGltf]);

  useFrame((_state, delta) => {
    // Update all mixers
    mixersRef.current.idle1?.update(delta);
    mixersRef.current.idle2?.update(delta);
    mixersRef.current.walkingForward?.update(delta);
    mixersRef.current.walkingBackward?.update(delta);
    mixersRef.current.jump?.update(delta);

    if (rigidBodyRef.current && groupRef.current) {
      const moveSpeed = 2.5;
      const rotateSpeed = 2 * delta;

      // Check for movement from keyboard or joystick
      const hasJoystickInput =
        joystickInput &&
        (Math.abs(joystickInput.x) > 0.1 || Math.abs(joystickInput.y) > 0.1);

      // Movement state detection for keyboard
      const isMovingForward = keys.forward;
      const isMovingBackward = keys.backward;

      // Movement state detection for joystick
      const isMoving = keys.forward || keys.backward || hasJoystickInput;
      
      // Check if grounded
      const currentVel = rigidBodyRef.current.linvel();
      isGroundedRef.current = Math.abs(currentVel.y) < 0.1;
      
      // Reset hasJumpedRef when grounded
      if (isGroundedRef.current && !isJumpingRef.current) {
        hasJumpedRef.current = false;
      }

      // Determine current animation state
      let targetAction: AnimationType = "idle1";

      // Jump takes priority over other animations
      if (isJumpingRef.current) {
        targetAction = "jump";
        idleTimerRef.current = 0; // Reset idle timer during jump
      } else if (!isMoving) {
        // Handle idle animation cycling every 5 seconds
        idleTimerRef.current += delta;

        if (idleTimerRef.current >= 5) {
          idleTimerRef.current = 0;
          currentIdleRef.current =
            currentIdleRef.current === "idle1" ? "idle2" : "idle1";
        }
        targetAction = currentIdleRef.current;
      } else {
        idleTimerRef.current = 0; // Reset idle timer when moving
        if (isMovingForward || (hasJoystickInput && joystickInput!.y > 0.1)) {
          targetAction = "walkingForward";
        } else if (isMovingBackward || (hasJoystickInput && joystickInput!.y < -0.1)) {
          targetAction = "walkingBackward";
        }
      }

      // Switch animations if needed
      if (currentActionRef.current !== targetAction) {
        // Stop current action
        const currentAction = actionsRef.current[currentActionRef.current];
        if (currentAction && currentActionRef.current !== "jump") {
          currentAction.stop();
        }

        // Hide all animation models
        if (idle1Ref.current) idle1Ref.current.visible = false;
        if (idle2Ref.current) idle2Ref.current.visible = false;
        if (walkingForwardRef.current) walkingForwardRef.current.visible = false;
        if (walkingBackwardRef.current) walkingBackwardRef.current.visible = false;
        if (jumpRef.current) jumpRef.current.visible = false;

        // Show and play the target animation
        switch (targetAction) {
          case "idle1":
            if (idle1Ref.current) idle1Ref.current.visible = true;
            actionsRef.current.idle1?.reset().play();
            currentIdleRef.current = "idle1";
            break;
          case "idle2":
            if (idle2Ref.current) idle2Ref.current.visible = true;
            actionsRef.current.idle2?.reset().play();
            currentIdleRef.current = "idle2";
            break;
          case "walkingForward":
            if (walkingForwardRef.current) walkingForwardRef.current.visible = true;
            actionsRef.current.walkingForward?.reset().play();
            break;
          case "walkingBackward":
            if (walkingBackwardRef.current) walkingBackwardRef.current.visible = true;
            actionsRef.current.walkingBackward?.reset().play();
            break;
          case "jump":
            if (jumpRef.current) jumpRef.current.visible = true;
            actionsRef.current.jump?.reset().play();
            break;
        }

        currentActionRef.current = targetAction;
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
      const smoothingFactor = 0.15; // Lower value = smoother movement
      let newYVel = currentVel.y; // Preserve gravity by default

      // Handle jumping - trigger once per press when grounded
      if (keys.jump && isGroundedRef.current && !isJumpingRef.current) {
        newYVel = 4; // Jump force
        isJumpingRef.current = true;
        // Immediately reset jump flag
        setKeys((k) => ({ ...k, jump: false }));
      }

      rigidBodyRef.current.setLinvel(
        {
          x:
            currentVel.x * (1 - smoothingFactor) + velocity.x * smoothingFactor,
          y: newYVel, // Use jump velocity or preserve gravity
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
        <group ref={walkingForwardRef}>
          <primitive object={walkingForwardGltf.scene} scale={0.8} />
        </group>
        <group ref={walkingBackwardRef}>
          <primitive object={walkingBackwardGltf.scene} scale={0.8} />
        </group>
        <group ref={jumpRef}>
          <primitive object={jumpGltf.scene} scale={0.8} />
        </group>
      </group>
    </RigidBody>
  );
});

export default Model;
