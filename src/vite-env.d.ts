/// <reference types="vite/client" />

declare global {
  interface Window {
    __RAGEBLOCK_TITLE_READY__?: boolean;
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
        exitOpen: boolean;
        mode: string;
        score: number;
        completed: boolean;
        defeated: number;
        enemies: Array<{ x: number; y: number; health: number }>;
      };
      clearWave: () => void;
      defeatPlayer: () => void;
    };
  }
}

export {};
