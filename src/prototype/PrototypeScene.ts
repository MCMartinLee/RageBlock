import Phaser from "phaser";
import {
  PROTOTYPE_SCENE_KEY,
  PROTOTYPE_SUBTITLE,
  PROTOTYPE_TITLE
} from "./prototypeDefinition";
import {
  ARENA_BOUNDS,
  clampToArena,
  PLAYER_SPAWN,
  RESERVED_CONTROLS,
  type Point
} from "./arenaDefinition";

const PLAYER_SPEED = 245;

export class PrototypeScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private player?: Phaser.GameObjects.Container;
  private playerPosition: Point = { ...PLAYER_SPAWN };

  constructor() {
    super(PROTOTYPE_SCENE_KEY);
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.centerOn(width / 2, height / 2);

    this.createSchoolyardCorner(width, height);
    this.player = this.createPlayerSilhouette(PLAYER_SPAWN.x, PLAYER_SPAWN.y);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;

    this.add
      .text(24, 18, PROTOTYPE_TITLE, {
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        color: "#f5f0e8"
      });

    this.add
      .text(24, 54, PROTOTYPE_SUBTITLE, {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#f0c15c"
      });

    this.add
      .text(
        24,
        height - 70,
        [
          "Move: WASD / Arrow Keys",
          `Reserved: ${RESERVED_CONTROLS.lightAttack.join(" / ")} light, ${RESERVED_CONTROLS.heavyAttack.join(" / ")} heavy, ${RESERVED_CONTROLS.dash.join(" / ")} dash, ${RESERVED_CONTROLS.jump.join(" / ")} jump`
        ],
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "15px",
          color: "#d8d5c9"
        }
      );
  }

  update(_time: number, delta: number): void {
    if (!this.player) {
      return;
    }

    const movement = this.getMovementInput();
    const seconds = delta / 1000;
    const nextPosition = clampToArena({
      x: this.playerPosition.x + movement.x * PLAYER_SPEED * seconds,
      y: this.playerPosition.y + movement.y * PLAYER_SPEED * seconds
    });

    this.playerPosition = nextPosition;
    this.player.setPosition(nextPosition.x, nextPosition.y);
    this.player.setDepth(Math.round(nextPosition.y));
  }

  private createSchoolyardCorner(width: number, height: number): void {
    this.add.rectangle(width / 2, height / 2, width, height, 0x202129);
    this.add.rectangle(width / 2, 152, width, 190, 0x2b3140);
    this.add.rectangle(width / 2, 398, width, 284, 0x5f6367);
    this.add.rectangle(width / 2, ARENA_BOUNDS.top - 18, width, 28, 0x3d4d48);

    for (let x = 52; x < width; x += 64) {
      this.add.rectangle(x, 214, 8, 72, 0x88907f);
      this.add.rectangle(x + 30, 205, 60, 6, 0x88907f);
      this.add.rectangle(x + 30, 230, 60, 6, 0x88907f);
    }

    this.add.rectangle(775, 328, 190, 38, 0x8f3f3f).setRotation(-0.02);
    this.add.rectangle(720, 302, 52, 34, 0xb7d3db);
    this.add.rectangle(836, 302, 52, 34, 0xb7d3db);
    this.add.rectangle(775, 350, 206, 10, 0x2d2d31);

    this.add
      .rectangle(
        (ARENA_BOUNDS.left + ARENA_BOUNDS.right) / 2,
        (ARENA_BOUNDS.top + ARENA_BOUNDS.bottom) / 2,
        ARENA_BOUNDS.right - ARENA_BOUNDS.left,
        ARENA_BOUNDS.bottom - ARENA_BOUNDS.top,
        0x000000,
        0
      )
      .setStrokeStyle(2, 0xf0c15c, 0.8);
  }

  private createPlayerSilhouette(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 28, 58, 16, 0x000000, 0.28);
    const legs = this.add.rectangle(0, 16, 32, 42, 0x232026);
    const hoodie = this.add.rectangle(0, -18, 54, 62, 0x7a3bd1);
    const head = this.add.circle(0, -62, 24, 0xf0b36f);
    const hair = this.add.triangle(0, -88, -26, 10, 0, -18, 28, 10, 0x17151b);
    const leftEye = this.add.rectangle(-8, -64, 10, 4, 0xf7f0a1).setRotation(-0.25);
    const rightEye = this.add.rectangle(9, -64, 10, 4, 0xf7f0a1).setRotation(0.25);

    return this.add.container(x, y, [
      shadow,
      legs,
      hoodie,
      head,
      hair,
      leftEye,
      rightEye
    ]);
  }

  private getMovementInput(): Point {
    const left = this.cursors?.left.isDown || this.wasd?.left.isDown;
    const right = this.cursors?.right.isDown || this.wasd?.right.isDown;
    const up = this.cursors?.up.isDown || this.wasd?.up.isDown;
    const down = this.cursors?.down.isDown || this.wasd?.down.isDown;

    const movement = {
      x: Number(Boolean(right)) - Number(Boolean(left)),
      y: Number(Boolean(down)) - Number(Boolean(up))
    };

    if (movement.x !== 0 && movement.y !== 0) {
      const diagonal = Math.SQRT1_2;
      return {
        x: movement.x * diagonal,
        y: movement.y * diagonal
      };
    }

    return movement;
  }
}
