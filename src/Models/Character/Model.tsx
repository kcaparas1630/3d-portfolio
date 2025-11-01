import { useFrame } from "@react-three/fiber";
import { useFBX } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { AnimationMixer, AnimationAction, Group, Mesh, MeshStandardMaterial } from "three";

const Model = () => {
  const walkingFbx = useFBX("/Character/Animations/Animation_Walking_withSkin.fbx");
  const idleFbx = useFBX("/Character/Animations/Animation_Idle_02_withSkin.fbx");
  const secondIdleFbx = useFBX("/Character/Animations/Animation_Idle_03_withSkin.fbx");
  const mixer = useRef<AnimationMixer | null>(null);
  const groupRef = useRef<Group>(null);
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

  useEffect(() => {
    if (walkingFbx.animations.length > 0) {
      mixer.current = new AnimationMixer(walkingFbx);
      actionsRef.current.walking = mixer.current.clipAction(
        walkingFbx.animations[0]
      );

      if (idleFbx.animations.length > 0) {
        actionsRef.current.idle1 = mixer.current.clipAction(
          idleFbx.animations[0]
        );
      }

      if (secondIdleFbx.animations.length > 0) {
        actionsRef.current.idle2 = mixer.current.clipAction(
          secondIdleFbx.animations[0]
        );
      }

      // Start with first idle animation
      actionsRef.current.idle1?.play();
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

    fixMaterials(walkingFbx);
    fixMaterials(idleFbx);
    fixMaterials(secondIdleFbx);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setKeys((k) => ({ ...k, forward: true }));
      if (e.key === "ArrowDown") setKeys((k) => ({ ...k, backward: true }));
      if (e.key === "ArrowLeft") setKeys((k) => ({ ...k, left: true }));
      if (e.key === "ArrowRight") setKeys((k) => ({ ...k, right: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setKeys((k) => ({ ...k, forward: false }));
      if (e.key === "ArrowDown") setKeys((k) => ({ ...k, backward: false }));
      if (e.key === "ArrowLeft") setKeys((k) => ({ ...k, left: false }));
      if (e.key === "ArrowRight") setKeys((k) => ({ ...k, right: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [walkingFbx, idleFbx, secondIdleFbx]);

  useFrame((_state, delta) => {
    mixer.current?.update(delta);

    if (groupRef.current) {
      const moveSpeed = 2 * delta;
      const rotateSpeed = 3 * delta;
      const isMoving = keys.forward || keys.backward;

      // Handle idle animation cycling every 5 seconds
      if (!isMoving) {
        idleTimerRef.current += delta;

        if (idleTimerRef.current >= 5) {
          idleTimerRef.current = 0;

          // Switch to the other idle animation
          if (currentIdleRef.current === "idle1") {
            actionsRef.current.idle1?.fadeOut(0.3);
            actionsRef.current.idle2?.reset().fadeIn(0.3).play();
            currentIdleRef.current = "idle2";
            currentActionRef.current = "idle2";
          } else {
            actionsRef.current.idle2?.fadeOut(0.3);
            actionsRef.current.idle1?.reset().fadeIn(0.3).play();
            currentIdleRef.current = "idle1";
            currentActionRef.current = "idle1";
          }
        }
      }

      // Switch between idle and walking animations
      if (
        isMoving &&
        currentActionRef.current !== "walking" &&
        actionsRef.current.walking
      ) {
        // Fade out current idle animation
        if (currentIdleRef.current === "idle1") {
          actionsRef.current.idle1?.fadeOut(0.3);
        } else {
          actionsRef.current.idle2?.fadeOut(0.3);
        }
        actionsRef.current.walking.reset().fadeIn(0.3).play();
        currentActionRef.current = "walking";
        idleTimerRef.current = 0; // Reset timer
        currentIdleRef.current = "idle1"; // Reset to idle1 when moving
      } else if (
        !isMoving &&
        currentActionRef.current === "walking" &&
        actionsRef.current.walking
      ) {
        actionsRef.current.walking.fadeOut(0.3);
        // Always return to idle1 after walking
        actionsRef.current.idle1?.reset().fadeIn(0.3).play();
        currentActionRef.current = "idle1";
        currentIdleRef.current = "idle1";
        idleTimerRef.current = 0; // Reset timer to start fresh
      }

      // Rotation
      if (keys.left) groupRef.current.rotation.y -= rotateSpeed;
      if (keys.right) groupRef.current.rotation.y += rotateSpeed;

      // Movement in the direction the character is facing
      if (keys.forward) {
        groupRef.current.position.x +=
          Math.sin(groupRef.current.rotation.y) * moveSpeed;
        groupRef.current.position.z +=
          Math.cos(groupRef.current.rotation.y) * moveSpeed;
      }
      if (keys.backward) {
        groupRef.current.position.x -=
          Math.sin(groupRef.current.rotation.y) * moveSpeed;
        groupRef.current.position.z -=
          Math.cos(groupRef.current.rotation.y) * moveSpeed;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={walkingFbx} scale={0.01} />
    </group>
  );
};

export default Model;
