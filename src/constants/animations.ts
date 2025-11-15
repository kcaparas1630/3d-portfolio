// Animation Map Configuration
export const ANIMATION_MAP = {
  idle1: "/Character/Animations/Animation_Idle_02_withSkin_draco.glb",
  idle2: "/Character/Animations/Animation_Idle_03_withSkin_draco.glb",
  walkingForward: "/Character/Animations/Animation_Walking_withSkin_draco.glb",
  walkingBackward: "/Character/Animations/Animation_Walk_Backward_inplace_withSkin_draco.glb",
  jump: "/Character/Animations/Animation_Regular_Jump_withSkin_draco.glb",

} as const;

export type AnimationKey = keyof typeof ANIMATION_MAP;
