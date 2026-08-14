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
        chapter: number;
        exitOpen: boolean;
        mode: string;
        score: number;
        completed: boolean;
      };
      clearWave: () => void;
    };
  }
}

export {};
