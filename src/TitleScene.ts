import Phaser from "phaser";
import { PROTOTYPE_SCENE_KEY } from "./prototype/prototypeDefinition";

export const TITLE_SCENE_KEY = "rageblock-title";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(TITLE_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x16171d);
    this.add.rectangle(width / 2, height * 0.72, width, height * 0.32, 0x5f6367);
    this.add.rectangle(width / 2, height * 0.5, width * 0.72, 12, 0xf0c15c, 0.8);
    this.add.text(width / 2, 112, "RAGEBLOCK", { fontFamily: "Arial Black, Arial", fontSize: "68px", color: "#f5f0e8", stroke: "#7a3bd1", strokeThickness: 10 }).setOrigin(0.5);
    this.add.text(width / 2, 190, "A cartoon street brawler about bad moods and worse manners", { fontFamily: "Arial", fontSize: "18px", color: "#f0c15c" }).setOrigin(0.5);
    this.add.rectangle(width / 2, 330, 280, 70, 0x7a3bd1).setStrokeStyle(3, 0xf5f0e8);
    this.add.text(width / 2, 330, "PRESS ENTER / CLICK TO PLAY", { fontFamily: "Arial Black, Arial", fontSize: "19px", color: "#f5f0e8" }).setOrigin(0.5);
    this.add.text(width / 2, 450, "WASD move   J light   K heavy   Space run   R restart", { fontFamily: "Arial", fontSize: "16px", color: "#d8d5c9" }).setOrigin(0.5);
    this.input.keyboard?.once("keydown-ENTER", () => this.startGame());
    this.input.once("pointerdown", () => this.startGame());
  }

  private startGame(): void {
    this.scene.start(PROTOTYPE_SCENE_KEY);
  }
}
