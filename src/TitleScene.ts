import Phaser from "phaser";
import { GAME_SCENE_KEY } from "./prototype/prototypeDefinition";
import { loadSelectedMode, saveSelectedMode } from "./campaignPersistence";
import type { RageMode } from "./campaignRuntime";
import { isGamepadActionPressed } from "./prototype/inputActions";

export const TITLE_SCENE_KEY = "rageblock-title";

export class TitleScene extends Phaser.Scene {
  private selectedMode: RageMode = "crash";
  private modeText?: Phaser.GameObjects.Text;
  private previousGamepadButtons: boolean[] = [];
  constructor() {
    super(TITLE_SCENE_KEY);
  }

  preload(): void {
    this.load.image("rageblock-key-art", "assets/art/rageblock-protagonist-key-art.png");
    this.load.spritesheet("rageblock-hero", "assets/art/rageblock-hero-atlas.png", {
      frameWidth: 221,
      frameHeight: 221
    });
    this.load.spritesheet("rageblock-enemies", "assets/art/rageblock-enemy-atlas.png", {
      frameWidth: 209,
      frameHeight: 235
    });
    this.load.spritesheet("rageblock-props", "assets/art/rageblock-prop-atlas.png", {
      frameWidth: 256,
      frameHeight: 256
    });
    for (const chapter of ["back-lot", "arcade-strip", "apartment-maze", "canal-walk", "community-fair", "rooftop-relay"]) {
      this.load.image(`rageblock-bg-${chapter}`, `assets/art/backgrounds/rageblock-${chapter}-background.png`);
    }
  }

  create(): void {
    const { width, height } = this.scale;
    window.__RAGEBLOCK__ = undefined;
    this.selectedMode = loadSelectedMode(window.localStorage);
    this.add.image(width / 2, height / 2, "rageblock-key-art").setDisplaySize(width, height).setAlpha(0.78);
    this.add.rectangle(width / 2, height / 2, width, height, 0x16171d, 0.52);
    this.add.rectangle(width / 2, height * 0.76, width, height * 0.34, 0x16171d, 0.84);
    this.add.rectangle(width / 2, height * 0.5, width * 0.72, 12, 0xf0c15c, 0.8);
    this.add.text(width / 2, 112, "RAGEBLOCK", { fontFamily: "Arial Black, Arial", fontSize: "68px", color: "#f5f0e8", stroke: "#7a3bd1", strokeThickness: 10 }).setOrigin(0.5);
    this.add.text(width / 2, 190, "Recover the Rage Remote before sunset. Take back every block.", { fontFamily: "Arial", fontSize: "18px", color: "#f0c15c" }).setOrigin(0.5);
    this.add.rectangle(width / 2, 350, 420, 68, 0x7a3bd1).setStrokeStyle(3, 0xf5f0e8);
    this.add.text(width / 2, 350, "PRESS ENTER / CLICK TO PLAY", { fontFamily: "Arial Black, Arial", fontSize: "18px", color: "#f5f0e8" }).setOrigin(0.5);
    this.add.text(width / 2, 465, "WASD move   J light   K heavy   Space run   P pause   R restart   T title", { fontFamily: "Arial", fontSize: "15px", color: "#d8d5c9" }).setOrigin(0.5);
    this.add.text(width / 2, 493, "Gamepad: A light/start   B heavy   RT run   Menu pause   Y restart", { fontFamily: "Arial", fontSize: "14px", color: "#8de0ff" }).setOrigin(0.5);
    this.modeText = this.add.text(width / 2, 250, "", { fontFamily: "Arial Black, Arial", fontSize: "17px", color: "#bca7ff" }).setOrigin(0.5);
    this.selectMode(this.selectedMode);
    this.input.keyboard?.on("keydown-ONE", () => this.selectMode("crash"));
    this.input.keyboard?.on("keydown-TWO", () => this.selectMode("zip"));
    this.input.keyboard?.on("keydown-THREE", () => this.selectMode("junkstorm"));
    this.input.keyboard?.once("keydown-ENTER", () => this.startGame());
    this.input.once("pointerdown", () => this.startGame());
    window.__RAGEBLOCK_TITLE_READY__ = true;
  }

  update(): void {
    const pad = this.input.gamepad?.getPad(0);
    const buttons = pad ? Array.from({ length: 10 }, (_, index) => Boolean(pad.buttons[index]?.pressed)) : [];
    if (isGamepadActionPressed(buttons, "light") && !isGamepadActionPressed(this.previousGamepadButtons, "light")) {
      this.startGame();
    }
    this.previousGamepadButtons = buttons;
  }

  private startGame(): void {
    window.__RAGEBLOCK_TITLE_READY__ = false;
    saveSelectedMode(window.localStorage, this.selectedMode);
    this.scene.start(GAME_SCENE_KEY);
  }

  private selectMode(mode: RageMode): void {
    this.selectedMode = mode;
    this.modeText?.setText(`RAGE MODE: ${mode.toUpperCase()}   [1 Crash / 2 Zip / 3 Junkstorm]`);
  }
}
