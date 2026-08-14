import Phaser from "phaser";
import { PROTOTYPE_SCENE_KEY } from "./prototype/prototypeDefinition";
import { saveSelectedMode } from "./campaignPersistence";
import type { RageMode } from "./campaignRuntime";

export const TITLE_SCENE_KEY = "rageblock-title";

export class TitleScene extends Phaser.Scene {
  private selectedMode: RageMode = "crash";
  private modeText?: Phaser.GameObjects.Text;
  constructor() {
    super(TITLE_SCENE_KEY);
  }

  preload(): void {
    this.load.image("rageblock-key-art", "assets/art/rageblock-protagonist-key-art.png");
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, "rageblock-key-art").setDisplaySize(width, height).setAlpha(0.78);
    this.add.rectangle(width / 2, height / 2, width, height, 0x16171d, 0.52);
    this.add.rectangle(width / 2, height * 0.76, width, height * 0.34, 0x16171d, 0.84);
    this.add.rectangle(width / 2, height * 0.5, width * 0.72, 12, 0xf0c15c, 0.8);
    this.add.text(width / 2, 112, "RAGEBLOCK", { fontFamily: "Arial Black, Arial", fontSize: "68px", color: "#f5f0e8", stroke: "#7a3bd1", strokeThickness: 10 }).setOrigin(0.5);
    this.add.text(width / 2, 190, "A cartoon street brawler about bad moods and worse manners", { fontFamily: "Arial", fontSize: "18px", color: "#f0c15c" }).setOrigin(0.5);
    this.add.rectangle(width / 2, 350, 420, 68, 0x7a3bd1).setStrokeStyle(3, 0xf5f0e8);
    this.add.text(width / 2, 350, "PRESS ENTER / CLICK TO PLAY", { fontFamily: "Arial Black, Arial", fontSize: "18px", color: "#f5f0e8" }).setOrigin(0.5);
    this.add.text(width / 2, 475, "WASD move   J light   K heavy   Space run   P pause   R restart", { fontFamily: "Arial", fontSize: "15px", color: "#d8d5c9" }).setOrigin(0.5);
    this.modeText = this.add.text(width / 2, 250, "RAGE MODE: CRASH   [1 Crash / 2 Zip / 3 Junkstorm]", { fontFamily: "Arial Black, Arial", fontSize: "17px", color: "#bca7ff" }).setOrigin(0.5);
    this.input.keyboard?.on("keydown-ONE", () => this.selectMode("crash"));
    this.input.keyboard?.on("keydown-TWO", () => this.selectMode("zip"));
    this.input.keyboard?.on("keydown-THREE", () => this.selectMode("junkstorm"));
    this.input.keyboard?.once("keydown-ENTER", () => this.startGame());
    this.input.once("pointerdown", () => this.startGame());
    window.__RAGEBLOCK_TITLE_READY__ = true;
  }

  private startGame(): void {
    window.__RAGEBLOCK_TITLE_READY__ = false;
    saveSelectedMode(window.localStorage, this.selectedMode);
    this.scene.start(PROTOTYPE_SCENE_KEY);
  }

  private selectMode(mode: RageMode): void {
    this.selectedMode = mode;
    this.modeText?.setText(`RAGE MODE: ${mode.toUpperCase()}   [1 Crash / 2 Zip / 3 Junkstorm]`);
  }
}
