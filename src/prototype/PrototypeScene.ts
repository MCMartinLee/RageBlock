import Phaser from "phaser";
import {
  PROTOTYPE_SCENE_KEY,
  PROTOTYPE_SUBTITLE,
  PROTOTYPE_TITLE
} from "./prototypeDefinition";

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super(PROTOTYPE_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x202129)
      .setStrokeStyle(4, 0x353743);

    this.add
      .text(width / 2, height / 2 - 18, PROTOTYPE_TITLE, {
        fontFamily: "Arial, sans-serif",
        fontSize: "48px",
        color: "#f5f0e8"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 42, PROTOTYPE_SUBTITLE, {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        color: "#f0c15c"
      })
      .setOrigin(0.5);
  }
}
