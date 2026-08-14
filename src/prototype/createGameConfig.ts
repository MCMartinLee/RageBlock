import Phaser from "phaser";
import { PrototypeScene } from "./PrototypeScene";
import { TitleScene } from "../TitleScene";

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: "#16171d",
    scene: [TitleScene, PrototypeScene],
    physics: {
      default: "arcade",
      arcade: {
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };
}
