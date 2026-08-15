import type { Point } from "./arenaDefinition";
import type { EnemyArchetype } from "./enemyArchetypes";
import { getCampaignChapter, type CampaignChapterId } from "../campaignDefinition";
import type { PropKind } from "./propReaction";

export type ChapterWaveEntry = { position: Point; delayMs: number; canCharge: boolean; variant: EnemyArchetype };
export type RoutePhase = "main" | "side" | "climax";
export type ChapterPropEntry = { kind: PropKind; position: Point };

const POSITIONS: Point[] = [
  { x: 710, y: 375 }, { x: 620, y: 455 }, { x: 820, y: 430 }, { x: 760, y: 465 },
  { x: 675, y: 315 }, { x: 860, y: 360 }, { x: 585, y: 395 }, { x: 805, y: 485 }
];

const CHAPTER_PROP_LAYOUTS: Record<CampaignChapterId, Record<RoutePhase, ChapterPropEntry[]>> = {
  "back-lot": {
    main: [{ kind: "cone", position: { x: 430, y: 452 } }, { kind: "trash-can", position: { x: 535, y: 340 } }, { kind: "ball", position: { x: 350, y: 365 } }, { kind: "tire-stack", position: { x: 790, y: 455 } }],
    side: [{ kind: "trash-can", position: { x: 610, y: 420 } }, { kind: "ball", position: { x: 720, y: 330 } }, { kind: "tire-stack", position: { x: 430, y: 350 } }],
    climax: [{ kind: "cone", position: { x: 610, y: 452 } }, { kind: "ball", position: { x: 470, y: 330 } }, { kind: "tire-stack", position: { x: 760, y: 350 } }]
  },
  "arcade-strip": {
    main: [{ kind: "trash-can", position: { x: 370, y: 448 } }, { kind: "cone", position: { x: 610, y: 350 } }, { kind: "ball", position: { x: 520, y: 455 } }, { kind: "arcade-sign", position: { x: 790, y: 440 } }],
    side: [{ kind: "ball", position: { x: 650, y: 450 } }, { kind: "cone", position: { x: 750, y: 360 } }, { kind: "trash-can", position: { x: 540, y: 330 } }, { kind: "arcade-sign", position: { x: 400, y: 420 } }],
    climax: [{ kind: "trash-can", position: { x: 430, y: 355 } }, { kind: "cone", position: { x: 710, y: 455 } }, { kind: "arcade-sign", position: { x: 560, y: 445 } }]
  },
  "apartment-maze": {
    main: [{ kind: "ball", position: { x: 400, y: 438 } }, { kind: "trash-can", position: { x: 650, y: 445 } }, { kind: "cone", position: { x: 540, y: 330 } }, { kind: "ball", position: { x: 760, y: 350 } }, { kind: "laundry-cart", position: { x: 830, y: 450 } }],
    side: [{ kind: "trash-can", position: { x: 560, y: 450 } }, { kind: "trash-can", position: { x: 720, y: 450 } }, { kind: "laundry-cart", position: { x: 410, y: 380 } }],
    climax: [{ kind: "ball", position: { x: 360, y: 350 } }, { kind: "cone", position: { x: 590, y: 455 } }, { kind: "trash-can", position: { x: 750, y: 330 } }, { kind: "laundry-cart", position: { x: 820, y: 455 } }]
  },
  "canal-walk": {
    main: [{ kind: "cone", position: { x: 350, y: 350 } }, { kind: "ball", position: { x: 520, y: 455 } }, { kind: "trash-can", position: { x: 730, y: 420 } }, { kind: "scooter-rack", position: { x: 840, y: 450 } }],
    side: [{ kind: "ball", position: { x: 590, y: 340 } }, { kind: "cone", position: { x: 730, y: 450 } }, { kind: "scooter-rack", position: { x: 420, y: 430 } }],
    climax: [{ kind: "trash-can", position: { x: 420, y: 450 } }, { kind: "ball", position: { x: 680, y: 350 } }, { kind: "cone", position: { x: 790, y: 455 } }, { kind: "scooter-rack", position: { x: 570, y: 430 } }]
  },
  "community-fair": {
    main: [{ kind: "ball", position: { x: 340, y: 455 } }, { kind: "cone", position: { x: 470, y: 340 } }, { kind: "trash-can", position: { x: 620, y: 455 } }, { kind: "ball", position: { x: 780, y: 360 } }, { kind: "prize-crate", position: { x: 845, y: 455 } }],
    side: [{ kind: "cone", position: { x: 560, y: 450 } }, { kind: "ball", position: { x: 690, y: 450 } }, { kind: "trash-can", position: { x: 790, y: 340 } }, { kind: "prize-crate", position: { x: 390, y: 420 } }],
    climax: [{ kind: "trash-can", position: { x: 370, y: 360 } }, { kind: "cone", position: { x: 550, y: 455 } }, { kind: "ball", position: { x: 730, y: 430 } }, { kind: "prize-crate", position: { x: 820, y: 350 } }]
  },
  "rooftop-relay": {
    main: [{ kind: "cone", position: { x: 390, y: 450 } }, { kind: "trash-can", position: { x: 580, y: 430 } }, { kind: "ball", position: { x: 740, y: 350 } }, { kind: "relay-box", position: { x: 830, y: 445 } }],
    side: [{ kind: "trash-can", position: { x: 600, y: 450 } }, { kind: "ball", position: { x: 760, y: 420 } }, { kind: "relay-box", position: { x: 420, y: 400 } }],
    climax: [{ kind: "ball", position: { x: 410, y: 450 } }, { kind: "trash-can", position: { x: 650, y: 455 } }, { kind: "cone", position: { x: 780, y: 350 } }, { kind: "relay-box", position: { x: 550, y: 340 } }]
  }
};

const CHAPTER_POSITION_INDEXES: Record<CampaignChapterId, Record<RoutePhase, number[]>> = {
  "back-lot": { main: [0, 1, 2, 4], side: [1, 5], climax: [5, 6] },
  "arcade-strip": { main: [0, 1, 2, 3, 5], side: [1, 5, 7], climax: [4, 6, 7] },
  "apartment-maze": { main: [0, 1, 2, 3], side: [1, 5], climax: [4, 5, 6, 7] },
  "canal-walk": { main: [0, 1, 2, 3, 4, 5], side: [1, 7], climax: [5, 6, 7] },
  "community-fair": { main: [0, 1, 2, 4, 5, 7], side: [1, 5, 7], climax: [4, 5, 6, 7] },
  "rooftop-relay": { main: [0, 1, 2, 3, 4], side: [1, 5], climax: [5] }
};

export function getChapterWaveBlueprint(chapterIndex: number, phase: RoutePhase = "main"): ChapterWaveEntry[] {
  const chapter = getCampaignChapter(chapterIndex);
  const positionIndexes = CHAPTER_POSITION_INDEXES[chapter.id][phase];
  const variants: EnemyArchetype[] = chapterIndex === 5 && phase === "climax"
    ? ["boss"]
    : Array.from({ length: positionIndexes.length }, (_, index) => {
      const offset = phase === "main" ? chapterIndex : phase === "side" ? chapterIndex + 2 : chapterIndex + 1;
      return chapter.enemyRoster[(index + offset) % chapter.enemyRoster.length];
    });

  return variants.map((variant, index) => ({
    position: { ...POSITIONS[positionIndexes[index]] },
    delayMs: index * 620,
    canCharge: variant === "charger" || variant === "boss",
    variant
  }));
}

export function getChapterPropBlueprint(chapterIndex: number, phase: RoutePhase = "main"): ChapterPropEntry[] {
  const chapter = getCampaignChapter(chapterIndex);
  return CHAPTER_PROP_LAYOUTS[chapter.id][phase].map((entry) => ({ kind: entry.kind, position: { ...entry.position } }));
}
