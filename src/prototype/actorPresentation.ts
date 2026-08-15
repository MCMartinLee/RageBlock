import type { EnemyArchetype, PlayerAnimationState } from "./enemyArchetypes";
import type { CampaignChapterId } from "../campaignDefinition";

type EnemyPresentation = {
  frame: number;
  reactionFrame: number;
  width: number;
  height: number;
  spriteY: number;
  healthOffset: number;
};

export type PlayerAnimationPose = { frame: number; y: number; rotation: number; widthScale: number; heightScale: number };
export type EnemyAnimationState = "idle" | "approach" | "attack" | "hurt" | "launch" | "land" | "recovery" | "defeated";
export type EnemyAnimationPose = { reactionFrame: boolean; yOffset: number; rotation: number; widthScale: number; heightScale: number };
export type FactionAccessory = "headband" | "visor" | "cap" | "scarf" | "ears" | "sash";
export type FactionPresentation = { accessory: FactionAccessory; color: number; accent: number };

const ENEMY_PRESENTATION: Record<Exclude<EnemyArchetype, "boss">, EnemyPresentation> = {
  bully: { frame: 0, reactionFrame: 4, width: 116, height: 131, spriteY: -56, healthOffset: 105 },
  charger: { frame: 1, reactionFrame: 5, width: 116, height: 131, spriteY: -56, healthOffset: 105 },
  thrower: { frame: 2, reactionFrame: 6, width: 116, height: 131, spriteY: -56, healthOffset: 105 },
  heavy: { frame: 3, reactionFrame: 7, width: 138, height: 155, spriteY: -65, healthOffset: 124 }
};

const COSMETIC_TINTS: Record<string, number> = {
  classic: 0xffffff,
  "crash-jacket": 0xffead1,
  "zip-laces": 0xd5fbff,
  "maze-stickers": 0xfff0a8,
  "canal-scarf": 0xd4ffd0,
  "fair-rage-eyes": 0xffd6ed,
  "sunset-remote": 0xffcfad,
  "fence-crew-colors": 0xffe1c2,
  "token-crew-colors": 0xc8f8ff,
  "stairwell-squad-colors": 0xffefad,
  "canal-rider-colors": 0xc8ffe2,
  "prize-patrol-colors": 0xffc8e7,
  "relay-guard-colors": 0xffc5a8
};

const FACTION_PRESENTATIONS: Record<CampaignChapterId, FactionPresentation> = {
  "back-lot": { accessory: "headband", color: 0xff6b35, accent: 0xf0c15c },
  "arcade-strip": { accessory: "visor", color: 0x36d1dc, accent: 0xff4fa3 },
  "apartment-maze": { accessory: "cap", color: 0xffd166, accent: 0x4d7f73 },
  "canal-walk": { accessory: "scarf", color: 0x36c98f, accent: 0xff875e },
  "community-fair": { accessory: "ears", color: 0xff5fa2, accent: 0xffd23f },
  "rooftop-relay": { accessory: "sash", color: 0xff875e, accent: 0x8de0ff }
};

export function getPlayerAnimationPose(state: PlayerAnimationState, time: number): PlayerAnimationPose {
  if (state === "run" || state === "move") {
    return { frame: Math.floor(time / (state === "run" ? 90 : 140)) % 2 === 0 ? 1 : 2, y: state === "run" ? -58 : -55, rotation: state === "run" ? -0.035 : -0.015, widthScale: state === "run" ? 1.04 : 1, heightScale: state === "run" ? 0.96 : 1 };
  }
  if (state === "light") return time < 45
    ? { frame: 0, y: -53, rotation: 0.055, widthScale: 0.94, heightScale: 1.05 }
    : { frame: 3, y: -56, rotation: -0.07, widthScale: 1.06, heightScale: 0.94 };
  if (state === "heavy") return time < 120
    ? { frame: 4, y: -54, rotation: 0.09, widthScale: 0.93, heightScale: 1.08 }
    : { frame: 5, y: -60, rotation: -0.13, widthScale: 1.1, heightScale: 0.9 };
  if (state === "rage") return { frame: 5, y: -68, rotation: 0.02, widthScale: 1.14 + Math.sin(time * 0.03) * 0.03, heightScale: 1.06 };
  if (state === "hurt") return { frame: 6, y: -50, rotation: 0.12, widthScale: 0.9, heightScale: 1.08 };
  if (state === "launch") return { frame: 4, y: -82, rotation: -0.22, widthScale: 0.88, heightScale: 1.13 };
  if (state === "land") return { frame: 6, y: -43, rotation: 0.03, widthScale: 1.18, heightScale: 0.76 };
  if (state === "recovery") return { frame: 0, y: -52, rotation: 0.04, widthScale: 0.95, heightScale: 1.04 };
  if (state === "defeated") return { frame: 6, y: -29, rotation: -1.08, widthScale: 1.02, heightScale: 0.82 };
  if (state === "victory") return { frame: 7, y: -65, rotation: -0.03, widthScale: 1.1, heightScale: 1.08 };
  return { frame: 0, y: -54, rotation: 0, widthScale: 1, heightScale: 1 };
}

export function getPlayerSpriteFrame(state: PlayerAnimationState, time: number): number {
  return getPlayerAnimationPose(state, time).frame;
}

export function getEnemyAnimationPose(state: EnemyAnimationState, time: number): EnemyAnimationPose {
  if (state === "approach") return { reactionFrame: false, yOffset: Math.sin(time * 0.018) * 3, rotation: -0.025, widthScale: 1.02, heightScale: 0.98 };
  if (state === "attack") return { reactionFrame: true, yOffset: -4, rotation: 0.09, widthScale: 1.09, heightScale: 0.91 };
  if (state === "hurt") return { reactionFrame: true, yOffset: -2, rotation: -0.12, widthScale: 0.88, heightScale: 1.12 };
  if (state === "launch") return { reactionFrame: true, yOffset: -30, rotation: 0.2, widthScale: 0.9, heightScale: 1.08 };
  if (state === "land") return { reactionFrame: true, yOffset: 8, rotation: -0.05, widthScale: 1.2, heightScale: 0.74 };
  if (state === "recovery") return { reactionFrame: false, yOffset: 1, rotation: 0.045, widthScale: 0.96, heightScale: 1.04 };
  if (state === "defeated") return { reactionFrame: true, yOffset: 16, rotation: -0.9, widthScale: 1.05, heightScale: 0.72 };
  return { reactionFrame: false, yOffset: Math.sin(time * 0.006) * 1.5, rotation: 0, widthScale: 1, heightScale: 1 };
}

export function getEnemyPresentation(variant: Exclude<EnemyArchetype, "boss">, isBoss: boolean): EnemyPresentation {
  const base = ENEMY_PRESENTATION[variant];
  if (!isBoss) return { ...base };
  return { frame: 0, reactionFrame: 1, width: 220, height: 220, spriteY: -92, healthOffset: 245 };
}

export function getCosmeticTint(cosmetic: string): number {
  return COSMETIC_TINTS[cosmetic] ?? COSMETIC_TINTS.classic;
}

export function getFactionPresentation(chapterId: CampaignChapterId): FactionPresentation {
  return { ...FACTION_PRESENTATIONS[chapterId] };
}
