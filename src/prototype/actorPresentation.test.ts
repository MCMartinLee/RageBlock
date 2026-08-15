import { describe, expect, it } from "vitest";
import { getCosmeticTint, getEnemyAnimationPose, getEnemyPresentation, getFactionPresentation, getPlayerAnimationPose, getPlayerSpriteFrame } from "./actorPresentation";

describe("actor presentation", () => {
  it("assigns intentional frames to the complete player state contract", () => {
    expect(getPlayerSpriteFrame("idle", 0)).toBe(0);
    expect(getPlayerSpriteFrame("move", 0)).toBe(1);
    expect(getPlayerSpriteFrame("move", 200)).toBe(2);
    expect(getPlayerSpriteFrame("rage", 0)).toBe(5);
    expect(getPlayerSpriteFrame("launch", 0)).toBe(4);
    expect(getPlayerSpriteFrame("land", 0)).toBe(6);
    expect(getPlayerSpriteFrame("recovery", 0)).toBe(0);
    expect(getPlayerSpriteFrame("victory", 0)).toBe(7);
  });

  it("derives enemy scale, offsets, and reaction frames from one map", () => {
    expect(getEnemyPresentation("bully", false)).toMatchObject({ frame: 0, reactionFrame: 4 });
    expect(getEnemyPresentation("heavy", false).width).toBeGreaterThan(getEnemyPresentation("bully", false).width);
    expect(getEnemyPresentation("heavy", true).healthOffset).toBeGreaterThan(getEnemyPresentation("heavy", false).healthOffset);
    expect(getEnemyPresentation("heavy", true)).toMatchObject({ frame: 0, reactionFrame: 1, width: 220 });
  });

  it("turns recovered looks into visible hero palettes", () => {
    expect(getCosmeticTint("classic")).toBe(0xffffff);
    expect(getCosmeticTint("sunset-remote")).not.toBe(getCosmeticTint("classic"));
    expect(getCosmeticTint("unknown-look")).toBe(0xffffff);
  });

  it("gives every player reaction a distinct authored motion pose", () => {
    const states = ["hurt", "launch", "land", "recovery", "rage", "defeated", "victory"] as const;
    const signatures = states.map((state) => JSON.stringify(getPlayerAnimationPose(state, 120)));
    expect(new Set(signatures).size).toBe(states.length);
    expect(getPlayerAnimationPose("heavy", 0).frame).toBe(4);
    expect(getPlayerAnimationPose("heavy", 180).frame).toBe(5);
  });

  it("uses attack-relative anticipation and impact poses", () => {
    expect(getPlayerAnimationPose("light", 0).frame).not.toBe(getPlayerAnimationPose("light", 46).frame);
    expect(getPlayerAnimationPose("heavy", 0).frame).not.toBe(getPlayerAnimationPose("heavy", 121).frame);
  });

  it("gives every faction a keyed silhouette accessory", () => {
    const chapterIds = ["back-lot", "arcade-strip", "apartment-maze", "canal-walk", "community-fair", "rooftop-relay"] as const;
    const looks = chapterIds.map((chapterId) => getFactionPresentation(chapterId));
    expect(new Set(looks.map((look) => look.accessory)).size).toBe(chapterIds.length);
    expect(new Set(looks.map((look) => look.color)).size).toBe(chapterIds.length);
  });

  it("gives enemy attack, hurt, launch, land, and recovery distinct motion", () => {
    const states = ["attack", "hurt", "launch", "land", "recovery", "defeated"] as const;
    const signatures = states.map((state) => JSON.stringify(getEnemyAnimationPose(state, 120)));
    expect(new Set(signatures).size).toBe(states.length);
  });
});
