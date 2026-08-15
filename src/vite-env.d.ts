/// <reference types="vite/client" />

declare global {
  interface Window {
    __RAGEBLOCK_TITLE_READY__?: boolean;
    __RAGEBLOCK_TITLE_LAYOUT_OK__?: boolean;
    __RAGEBLOCK__?: {
      getState: () => {
        player: {
          x: number;
          y: number;
        };
        running: boolean;
        runEnded: boolean;
        paused: boolean;
        chapter: number;
        phase: "main" | "side" | "climax";
        replay: boolean;
        exitOpen: boolean;
        mode: string;
        score: number;
        health: number;
        completed: boolean;
        defeated: number;
        routeNode: number;
        sideCacheHealth: number;
        sideRewarded: boolean;
        hazardX: number;
        hazardY: number;
        hazardKind?: string;
        gameplayTime: number;
        backdropWidth: number;
        hazardChainHits: number;
        bossRule?: string;
        bossTelegraphing: boolean;
        enemySpecialsFired: number;
        hitAudioEvents: number;
        resultRewardText: string;
        hudBoundsOk: boolean;
        hudScoreText: string;
        hudActionText: string;
        hudObjectiveText: string;
        enemies: Array<{ x: number; y: number; health: number; isBoss: boolean }>;
        props: Array<{ kind: string; frame: number; broken: boolean }>;
      };
      clearWave: () => void;
      defeatPlayer: () => void;
    };
  }
}

export {};
