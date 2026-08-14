import Phaser from "phaser";
import {
  PROTOTYPE_SCENE_KEY,
  PROTOTYPE_SUBTITLE,
  PROTOTYPE_TITLE
} from "./prototypeDefinition";
import {
  applyAttackToBullyWeirdo,
  createBullyWeirdoState,
  createCombatRunState,
  createPlayerState,
  getLightComboAttack,
  isBlockCleared,
  spendRageOnHeavyAttack,
  type AttackOutcome,
  type BullyWeirdoState,
  type CombatRunState,
  type PlayerState
} from "./combatRules";
import {
  ARENA_BOUNDS,
  clampToArena,
  PLAYER_SPAWN,
  RESERVED_CONTROLS,
  type Point
} from "./arenaDefinition";
import { getAttackPresentation, type FacingDirection } from "./attackPresentation";
import { createAttackHitbox, getKnockbackVelocity, isPointInsideHitbox } from "./hitDetection";
import { getHitFeedback } from "./hitFeedback";
import { applyAttackToProp, createPropState, type PropKind, type PropState } from "./propReaction";
import {
  createBullyPressureState,
  updateBullyPressure,
  type BullyPressureState,
  type BullyMood
} from "./bullyPressure";
import { bufferAttack, consumeBufferedAttack, getPlayerMotionState, type PlayerAction } from "./playerController";
import { getCampaignChapter } from "../campaignDefinition";
import { completeChapter, createCampaignState, type CampaignState } from "../campaignRuntime";

const PLAYER_SPEED = 245;
const PLAYER_RUN_MULTIPLIER = 1.55;
const BULLY_DAMAGE = 4;
const PLAYER_DAMAGE_COOLDOWN_MS = 1050;

type BullyActor = {
  body: Phaser.GameObjects.Container;
  position: Point;
  knockbackVelocity: Point;
  pressure: BullyPressureState;
  combat: BullyWeirdoState;
  moodLabel: Phaser.GameObjects.Text;
  healthBar: Phaser.GameObjects.Rectangle;
  variant: "bully" | "charger" | "thrower" | "heavy";
  isBoss: boolean;
};

type ToyboxProp = {
  body: Phaser.GameObjects.Container;
  position: Point;
  velocity: Point;
  state: PropState;
};

export class PrototypeScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private actionKeys?: Record<"light" | "heavy" | "run" | "runAlt" | "runAlt2" | "restart" | "pause", Phaser.Input.Keyboard.Key>;
  private player?: Phaser.GameObjects.Container;
  private playerPosition: Point = { ...PLAYER_SPAWN };
  private facing: FacingDirection = "right";
  private comboStep = 0;
  private playerState: PlayerState = createPlayerState();
  private combatRun: CombatRunState = createCombatRunState();
  private attackingUntil = 0;
  private bufferedAttack?: PlayerAction;
  private activeAttack?: Phaser.GameObjects.Container;
  private attackLabel?: Phaser.GameObjects.Text;
  private healthLabel?: Phaser.GameObjects.Text;
  private rageLabel?: Phaser.GameObjects.Text;
  private defeatLabel?: Phaser.GameObjects.Text;
  private stateLabel?: Phaser.GameObjects.Text;
  private damageTaken = 0;
  private hitsLanded = 0;
  private runStartedAt = 0;
  private runEnded = false;
  private resultOverlay?: Phaser.GameObjects.Container;
  private bullyWeirdos: BullyActor[] = [];
  private toyboxProps: ToyboxProp[] = [];
  private nextPlayerDamageAt = 0;
  private campaignChapter = 0;
  private campaignState: CampaignState = createCampaignState();
  private chapterLabel?: Phaser.GameObjects.Text;
  private paused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private audioContext?: AudioContext;
  private exitOpen = false;

  constructor() {
    super(PROTOTYPE_SCENE_KEY);
  }

  init(): void {
    this.resetRunState();
  }

  create(): void {
    const { width, height } = this.scale;
    this.runStartedAt = this.time.now;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.centerOn(width / 2, height / 2);

    this.createSchoolyardCorner(width, height);
    this.createExitMarkers();
    this.player = this.createPlayerSilhouette(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
    this.bullyWeirdos = [
      this.createBullyWeirdo({ x: 710, y: 375 }, 0, true, "charger"),
      this.createBullyWeirdo({ x: 620, y: 455 }, 160, false, "bully"),
      this.createBullyWeirdo({ x: 820, y: 430 }, 320, true, "charger"),
      this.createBullyWeirdo({ x: 760, y: 465 }, 480, false, "thrower"),
      this.createBullyWeirdo({ x: 675, y: 315 }, 640, true, "charger"),
      this.createBullyWeirdo({ x: 860, y: 360 }, 800, false, "heavy"),
      this.createBullyWeirdo({ x: 585, y: 395 }, 960, true, "charger"),
      this.createBullyWeirdo({ x: 805, y: 485 }, 1120, false, "bully")
    ];
    this.toyboxProps = [
      this.createToyboxProp("cone", { x: 430, y: 452 }),
      this.createToyboxProp("trash-can", { x: 535, y: 340 }),
      this.createToyboxProp("ball", { x: 350, y: 365 })
    ];

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
      Phaser.Input.Keyboard.KeyCodes.L,
      Phaser.Input.Keyboard.KeyCodes.J,
      Phaser.Input.Keyboard.KeyCodes.K,
      Phaser.Input.Keyboard.KeyCodes.R
      , Phaser.Input.Keyboard.KeyCodes.P
    ]);
    this.wasd = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
    this.actionKeys = this.input.keyboard?.addKeys({
      light: Phaser.Input.Keyboard.KeyCodes.J,
      heavy: Phaser.Input.Keyboard.KeyCodes.K,
      run: Phaser.Input.Keyboard.KeyCodes.SPACE,
      runAlt: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      runAlt2: Phaser.Input.Keyboard.KeyCodes.L,
      restart: Phaser.Input.Keyboard.KeyCodes.R
      , pause: Phaser.Input.Keyboard.KeyCodes.P
    }) as Record<"light" | "heavy" | "run" | "runAlt" | "runAlt2" | "restart" | "pause", Phaser.Input.Keyboard.Key>;

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.requestAttack("heavy", this.time.now);
        return;
      }

      this.requestAttack("light", this.time.now);
    });

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
          `${RESERVED_CONTROLS.lightAttack.join(" / ")} light, ${RESERVED_CONTROLS.heavyAttack.join(" / ")} heavy, Space / ${RESERVED_CONTROLS.dash.join(" / ")} run, P pause, R restart`
        ],
        {
          fontFamily: "Arial, sans-serif",
          fontSize: "15px",
          color: "#d8d5c9"
        }
      );

    this.attackLabel = this.add
      .text(width - 24, 24, "Ready", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#f5f0e8"
      })
      .setOrigin(1, 0);
    this.healthLabel = this.add
      .text(width - 24, 54, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#8de0ff"
      })
      .setOrigin(1, 0);
    this.rageLabel = this.add
      .text(width - 24, 84, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#f0c15c"
      })
      .setOrigin(1, 0);
    this.defeatLabel = this.add
      .text(width - 24, 114, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#f5f0e8"
      })
      .setOrigin(1, 0);
    this.chapterLabel = this.add.text(width - 24, 174, "", { fontFamily: "Arial, sans-serif", fontSize: "18px", color: "#f0c15c" }).setOrigin(1, 0);
    this.stateLabel = this.add
      .text(width - 24, 144, "State idle", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#bca7ff"
      })
      .setOrigin(1, 0);
    this.updateHealthLabel();
    this.updateRunLabels();
    this.updateChapterLabel();
    this.publishDebugState();
  }

  update(time: number, delta: number): void {
    if (!this.player) {
      return;
    }

    if (this.actionKeys && Phaser.Input.Keyboard.JustDown(this.actionKeys.restart)) {
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
      this.input.keyboard?.resetKeys();
      this.scene.restart();
      return;
    }

    if (this.actionKeys && Phaser.Input.Keyboard.JustDown(this.actionKeys.pause)) {
      this.togglePause();
    }

    if (this.paused) return;

    if (this.runEnded) {
      return;
    }

    if (this.actionKeys && Phaser.Input.Keyboard.JustDown(this.actionKeys.light)) {
      this.requestAttack("light", time);
    }

    if (this.actionKeys && Phaser.Input.Keyboard.JustDown(this.actionKeys.heavy)) {
      this.requestAttack("heavy", time);
    }

    const movement = this.getMovementInput();
    const running = this.isRunning();
    if (movement.x < 0) {
      this.facing = "left";
    } else if (movement.x > 0) {
      this.facing = "right";
    }

    const seconds = delta / 1000;
    const speed = PLAYER_SPEED * (running ? PLAYER_RUN_MULTIPLIER : 1);
    const nextPosition = clampToArena({
      x: this.playerPosition.x + movement.x * speed * seconds,
      y: this.playerPosition.y + movement.y * speed * seconds
    });

    this.playerPosition = nextPosition;
    this.player.setPosition(nextPosition.x, nextPosition.y);
    this.player.setScale(this.facing === "right" ? 1 : -1, 1);
    this.player.setDepth(Math.round(nextPosition.y));
    this.attackLabel?.setColor(running ? "#8de0ff" : "#f5f0e8");
    this.stateLabel?.setText(`State ${getPlayerMotionState(movement.x !== 0 || movement.y !== 0, running)}`);
    if (this.exitOpen && nextPosition.x >= ARENA_BOUNDS.right - 42) {
      this.exitOpen = false;
      this.playerPosition = { ...PLAYER_SPAWN };
      this.player.setPosition(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
      if (this.campaignChapter < 2) this.advanceChapter();
      else this.endRun("Block Cleared");
    }

    if (this.activeAttack && time >= this.attackingUntil) {
      this.activeAttack.destroy();
      this.activeAttack = undefined;
      this.attackLabel?.setText("Ready");
      const queued = consumeBufferedAttack(this.bufferedAttack);
      this.bufferedAttack = undefined;
      if (queued === "light") this.performLightAttack(time);
      if (queued === "heavy") this.performHeavyAttack(time);
    }

    this.updateBullyWeirdos(time, delta);
    this.updateToyboxProps(delta);
    this.publishDebugState();
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

  private createExitMarkers(): void {
    const exit = this.add.container(ARENA_BOUNDS.right - 28, (ARENA_BOUNDS.top + ARENA_BOUNDS.bottom) / 2);
    exit.add([
      this.add.rectangle(0, 0, 8, 118, 0xf0c15c, 0.8),
      this.add.triangle(-12, -48, 0, 0, 24, 14, 24, -14, 0xf0c15c, 0.9),
      this.add.text(-82, 72, "NEXT BLOCK", { fontFamily: "Arial Black, Arial", fontSize: "12px", color: "#f0c15c" })
    ]);
    exit.setDepth(20);
  }

  private createPlayerSilhouette(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 28, 58, 16, 0x000000, 0.28);
    const legs = this.add.rectangle(0, 16, 32, 42, 0x232026);
    const hoodie = this.add.rectangle(0, -18, 54, 62, 0x7a3bd1);
    const head = this.add.circle(0, -62, 24, 0xf0b36f);
    const hair = this.add.rectangle(0, -78, 36, 12, 0x5a3022).setRotation(-0.1);
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

  private createBullyWeirdo(
    position: Point,
    delayMs: number,
    canCharge: boolean,
    variant: BullyActor["variant"] = canCharge ? "charger" : "bully",
    isBoss = false
  ): BullyActor {
    const body = this.add.container(position.x, position.y);
    const shadow = this.add.ellipse(0, 24, 54, 14, 0x000000, 0.26);
    const legs = this.add.rectangle(0, 15, 28, 36, 0x243039);
    const shirtColors = { bully: 0x2aa876, charger: 0xd1495b, thrower: 0x2f80c0, heavy: 0x7b4f2a };
    const shirt = this.add.rectangle(0, -17, isBoss ? 78 : variant === "heavy" ? 60 : 50, isBoss ? 78 : variant === "heavy" ? 64 : 54, isBoss ? 0x9b2c70 : shirtColors[variant]);
    const head = this.add.circle(0, -54, 22, 0xd99a67);
    const brow = this.add.rectangle(0, -62, 32, 6, 0x22181c).setRotation(canCharge ? 0.16 : -0.16);
    const grin = this.add.rectangle(0, -45, 22, 4, 0x22181c);
    const moodLabel = this.add
      .text(0, isBoss ? -122 : -94, isBoss ? "BOSS: HALL MONITOR" : variant, {
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        color: "#f5f0e8"
      })
      .setOrigin(0.5);

    body.add([shadow, legs, shirt, head, brow, grin, moodLabel]);
    body.setDepth(Math.round(position.y));

    return {
      body,
      position,
      knockbackVelocity: { x: 0, y: 0 },
      pressure: createBullyPressureState(this.time.now + delayMs, canCharge),
      combat: createBullyWeirdoState({ health: isBoss ? 60 : variant === "heavy" ? 30 : 18 }),
      moodLabel,
      healthBar: this.add.rectangle(position.x, position.y - (isBoss ? 112 : 86), isBoss ? 96 : 48, 7, isBoss ? 0xff5f4d : variant === "heavy" ? 0xff9d4d : 0x8de0ff),
      variant,
      isBoss
    };
  }

  private createToyboxProp(kind: PropKind, position: Point): ToyboxProp {
    const body = this.add.container(position.x, position.y);

    if (kind === "cone") {
      body.add([
        this.add.triangle(0, -18, -18, 22, 0, -24, 18, 22, 0xf07d32),
        this.add.rectangle(0, 20, 42, 8, 0xf5f0e8)
      ]);
    } else if (kind === "trash-can") {
      body.add([
        this.add.rectangle(0, -8, 34, 48, 0x6f7d84),
        this.add.rectangle(0, -35, 44, 10, 0x9aa7ad),
        this.add.rectangle(-10, -8, 4, 36, 0x465156),
        this.add.rectangle(10, -8, 4, 36, 0x465156)
      ]);
    } else {
      body.add([
        this.add.circle(0, -12, 18, 0xf0c15c),
        this.add.circle(-7, -18, 4, 0x202129),
        this.add.circle(7, -6, 4, 0x202129)
      ]);
    }

    body.setDepth(Math.round(position.y));

    return {
      body,
      position,
      velocity: { x: 0, y: 0 },
      state: createPropState(kind)
    };
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

  private isRunning(): boolean {
    return Boolean(
      this.actionKeys?.run.isDown ||
        this.actionKeys?.runAlt.isDown ||
        this.actionKeys?.runAlt2.isDown
    );
  }

  private publishDebugState(): void {
    window.__RAGEBLOCK__ = {
      getState: () => ({
        player: { ...this.playerPosition },
        running: this.isRunning(),
        runEnded: this.runEnded
      })
    };
  }

  private resetRunState(): void {
    this.playerPosition = { ...PLAYER_SPAWN };
    this.facing = "right";
    this.comboStep = 0;
    this.playerState = createPlayerState();
    this.combatRun = createCombatRunState();
    this.attackingUntil = 0;
    this.bufferedAttack = undefined;
    this.activeAttack = undefined;
    this.damageTaken = 0;
    this.hitsLanded = 0;
    this.runEnded = false;
    this.resultOverlay = undefined;
    this.bullyWeirdos = [];
    this.toyboxProps = [];
    this.nextPlayerDamageAt = 0;
    this.campaignChapter = 0;
    this.campaignState = createCampaignState();
    this.exitOpen = false;
    this.paused = false;
    this.pauseOverlay = undefined;
  }

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      const { width, height } = this.scale;
      const panel = this.add.rectangle(0, 0, 360, 150, 0x16171d, 0.96).setStrokeStyle(3, 0xf0c15c);
      const title = this.add.text(0, -28, "PAUSED", { fontFamily: "Arial Black, Arial", fontSize: "32px", color: "#f5f0e8" }).setOrigin(0.5);
      const hint = this.add.text(0, 28, "Press P to resume", { fontFamily: "Arial", fontSize: "18px", color: "#d8d5c9" }).setOrigin(0.5);
      this.pauseOverlay = this.add.container(width / 2, height / 2, [panel, title, hint]).setDepth(6000);
    } else {
      this.pauseOverlay?.destroy();
      this.pauseOverlay = undefined;
    }
  }

  private updateChapterLabel(): void {
    const chapter = getCampaignChapter(this.campaignChapter);
    this.chapterLabel?.setText(`Chapter ${this.campaignChapter + 1}/6: ${chapter.title} | ${chapter.objective}`);
  }

  private performLightAttack(time: number): void {
    const attack = getLightComboAttack(this.comboStep);
    this.comboStep = attack.nextComboStep;
    this.showAttack(attack, time);
  }

  private requestAttack(action: PlayerAction, time: number): void {
    if (this.activeAttack && time < this.attackingUntil) {
      this.bufferedAttack = bufferAttack(this.bufferedAttack, action);
      this.attackLabel?.setText(`${action} queued`);
      return;
    }
    if (action === "light") this.performLightAttack(time);
    else this.performHeavyAttack(time);
  }

  private performHeavyAttack(time: number): void {
    const result = spendRageOnHeavyAttack(this.playerState);
    this.playerState = result.player;
    this.combatRun = {
      ...this.combatRun,
      rage: result.player.rage
    };
    this.comboStep = 0;
    this.updateRunLabels();
    this.showAttack(result.attack, time);
  }

  private showAttack(attack: AttackOutcome, time: number): void {
    const presentation = getAttackPresentation(attack, this.facing);
    const hitboxShape = createAttackHitbox(this.playerPosition, presentation);
    const x = hitboxShape.center.x;
    const y = hitboxShape.center.y;

    this.activeAttack?.destroy();
    this.activeAttack = this.add.container(x, y);

    const hitbox = this.add
      .rectangle(0, 0, presentation.hitboxWidth, presentation.hitboxHeight, presentation.color, 0.28)
      .setStrokeStyle(3, presentation.color, 0.95);
    const arrow = this.add.triangle(
      presentation.hitboxOffsetX > 0 ? presentation.hitboxWidth / 2 + 18 : -presentation.hitboxWidth / 2 - 18,
      0,
      presentation.hitboxOffsetX > 0 ? -12 : 12,
      -16,
      presentation.hitboxOffsetX > 0 ? -12 : 12,
      16,
      presentation.hitboxOffsetX > 0 ? 14 : -14,
      0,
      presentation.color,
      0.8
    );

    this.activeAttack.add([hitbox, arrow]);
    this.activeAttack.setDepth(Math.round(this.playerPosition.y) + 10);
    this.attackingUntil = time + presentation.durationMs;
    this.attackLabel?.setText(`${presentation.label} | knockback ${attack.knockback}`);
    this.stateLabel?.setText(`State ${attack.kind}`);
    this.applyAttackToBullyWeirdos(attack, hitboxShape);
    this.applyAttackToToyboxProps(attack, hitboxShape);
    this.playTone(attack.kind === "heavy" ? 120 : 220, attack.kind === "heavy" ? 0.12 : 0.06);
  }

  private playTone(frequency: number, duration: number): void {
    const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.audioContext ??= new AudioContextClass();
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "square";
    gain.gain.setValueAtTime(0.035, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    oscillator.connect(gain).connect(this.audioContext.destination);
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private updateBullyWeirdos(time: number, delta: number): void {
    const seconds = delta / 1000;

    for (const bully of this.bullyWeirdos) {
      if (bully.combat.defeated) {
        bully.body.setAlpha(0.35);
        bully.moodLabel.setText("defeated");
        continue;
      }

      const { state, decision } = updateBullyPressure(
        bully.pressure,
        bully.position,
        this.playerPosition,
        time
      );
      bully.pressure = state;
      bully.knockbackVelocity = {
        x: bully.knockbackVelocity.x * 0.88,
        y: bully.knockbackVelocity.y * 0.78
      };
      bully.position = clampToArena({
        x: bully.position.x + (decision.velocity.x + bully.knockbackVelocity.x) * seconds,
        y: bully.position.y + (decision.velocity.y + bully.knockbackVelocity.y) * seconds
      });
      if (bully.variant === "thrower") {
        bully.position = clampToArena({
          x: bully.position.x - decision.velocity.x * seconds * 0.45,
          y: bully.position.y - decision.velocity.y * seconds * 0.45
        });
      }

      bully.body.setPosition(bully.position.x, bully.position.y);
      bully.body.setDepth(Math.round(bully.position.y));
      bully.body.setScale(decision.velocity.x < 0 ? -1 : 1, 1);
      bully.moodLabel.setText(this.getMoodLabel(decision.mood));
      bully.healthBar.setPosition(bully.position.x, bully.position.y - (bully.isBoss ? 112 : 86));
      bully.healthBar.setDisplaySize((bully.isBoss ? 96 : 48) * (bully.combat.health / (bully.isBoss ? 60 : bully.variant === "heavy" ? 30 : 18)), bully.isBoss ? 7 : 5);
      if (bully.isBoss) bully.moodLabel.setText(decision.damagesPlayer ? "BOSS: CHARGE" : "BOSS: PRESSURE");

      if (decision.damagesPlayer && time >= this.nextPlayerDamageAt) {
        this.playerState = {
          ...this.playerState,
          health: Math.max(0, this.playerState.health - BULLY_DAMAGE)
        };
        this.damageTaken += BULLY_DAMAGE;
        this.nextPlayerDamageAt = time + PLAYER_DAMAGE_COOLDOWN_MS;
        this.stateLabel?.setText("State hurt");
        this.updateHealthLabel();
        this.flashTarget(this.player, 0x8de0ff, 120);
        if (this.playerState.health <= 0) {
          this.endRun("Knocked Out");
        }
      }
    }
  }

  private updateHealthLabel(): void {
    this.healthLabel?.setText(`Health ${this.playerState.health} | Taken ${this.damageTaken}`);
  }

  private updateRunLabels(): void {
    this.rageLabel?.setText(`Rage ${this.combatRun.rage}/100`);
    this.defeatLabel?.setText(`Defeated ${this.combatRun.defeatedBullyWeirdos}/8`);
  }

  private updateToyboxProps(delta: number): void {
    const seconds = delta / 1000;

    for (const prop of this.toyboxProps) {
      if (prop.state.broken) {
        prop.velocity = {
          x: prop.velocity.x * 0.8,
          y: prop.velocity.y * 0.8
        };
      } else {
        prop.velocity = {
          x: prop.velocity.x * 0.91,
          y: (prop.velocity.y + 520 * seconds) * 0.91
        };
      }

      prop.position = clampToArena({
        x: prop.position.x + prop.velocity.x * seconds,
        y: prop.position.y + prop.velocity.y * seconds
      });

      if (prop.position.y >= ARENA_BOUNDS.bottom - 1 && prop.velocity.y > 0) {
        prop.velocity.y = prop.state.kind === "ball" ? -Math.abs(prop.velocity.y) * 0.62 : 0;
      }

      prop.body.setPosition(prop.position.x, prop.position.y);
      prop.body.setRotation(prop.body.rotation + prop.velocity.x * seconds * 0.01);
      prop.body.setDepth(Math.round(prop.position.y));
    }
  }

  private getMoodLabel(mood: BullyMood): string {
    if (mood === "backing-off") {
      return "back off";
    }

    return mood;
  }

  private applyAttackToBullyWeirdos(attack: AttackOutcome, hitboxShape: ReturnType<typeof createAttackHitbox>): void {
    for (const bully of this.bullyWeirdos) {
      if (bully.combat.defeated || !isPointInsideHitbox(bully.position, hitboxShape)) {
        continue;
      }

      const result = applyAttackToBullyWeirdo(this.combatRun, bully.combat, attack);
      this.hitsLanded += 1;
      this.combatRun = result.run;
      bully.combat = result.bully;
      bully.knockbackVelocity = getKnockbackVelocity(attack.knockback, this.facing, attack.launch);
      bully.moodLabel.setText(attack.launch ? "launched" : "hit");
      bully.healthBar.setDisplaySize((bully.isBoss ? 96 : 48) * (bully.combat.health / (bully.isBoss ? 60 : bully.variant === "heavy" ? 30 : 18)), bully.isBoss ? 7 : 5);
      this.playHitFeedback(attack, bully);

      if (bully.combat.defeated) {
        bully.body.setAlpha(0.35);
        bully.healthBar.setAlpha(0.25);
      }
    }

    this.playerState = {
      ...this.playerState,
      rage: this.combatRun.rage
    };
    this.updateRunLabels();
    if (isBlockCleared(this.combatRun)) {
      this.exitOpen = true;
      this.attackLabel?.setText(this.campaignChapter < 2 ? "EXIT OPEN | Reach NEXT BLOCK" : "BOSS DOWN | Reach NEXT BLOCK");
    }
  }

  private advanceChapter(): void {
    this.campaignChapter += 1;
    this.campaignState = completeChapter(this.campaignState);
    for (const bully of this.bullyWeirdos) {
      bully.body.destroy();
      bully.healthBar.destroy();
    }
    this.bullyWeirdos = [
      this.createBullyWeirdo({ x: 710, y: 375 }, 0, true, this.campaignChapter === 1 ? "thrower" : "heavy", this.campaignChapter === 2),
      this.createBullyWeirdo({ x: 620, y: 455 }, 160, false, "bully"),
      this.createBullyWeirdo({ x: 820, y: 430 }, 320, true, "charger"),
      this.createBullyWeirdo({ x: 760, y: 465 }, 480, false, this.campaignChapter === 1 ? "thrower" : "heavy"),
      this.createBullyWeirdo({ x: 675, y: 315 }, 640, true, "charger"),
      this.createBullyWeirdo({ x: 860, y: 360 }, 800, false, "heavy"),
      this.createBullyWeirdo({ x: 585, y: 395 }, 960, true, "charger"),
      this.createBullyWeirdo({ x: 805, y: 485 }, 1120, false, "bully")
    ];
    this.combatRun = { ...this.combatRun, defeatedBullyWeirdos: 0 };
    this.updateChapterLabel();
    this.flashTarget(this.player, 0xf0c15c, 220);
  }

  private endRun(title: "Block Cleared" | "Knocked Out"): void {
    if (this.runEnded) {
      return;
    }

    this.runEnded = true;
    this.stateLabel?.setText(title === "Block Cleared" ? "State win" : "State defeated");
    const elapsedSeconds = Math.max(0, Math.round((this.time.now - this.runStartedAt) / 1000));
    const { width, height } = this.scale;
    const panel = this.add.rectangle(0, 0, 420, 250, 0x16171d, 0.92).setStrokeStyle(3, 0xf0c15c);
    const heading = this.add.text(0, -88, title, {
      fontFamily: "Arial, sans-serif",
      fontSize: "34px",
      color: title === "Block Cleared" ? "#f0c15c" : "#ff5f4d"
    }).setOrigin(0.5);
    const stats = this.add.text(0, -24, [
      `Time ${elapsedSeconds}s`,
      `Hits Landed ${this.hitsLanded}`,
      `Damage Taken ${this.damageTaken}`,
      "",
      "Press R to restart"
    ], {
      fontFamily: "Arial, sans-serif",
      fontSize: "19px",
      color: "#f5f0e8",
      align: "center"
    }).setOrigin(0.5);

    this.resultOverlay = this.add.container(width / 2, height / 2, [panel, heading, stats]);
    this.resultOverlay.setDepth(5000);
  }

  private applyAttackToToyboxProps(attack: AttackOutcome, hitboxShape: ReturnType<typeof createAttackHitbox>): void {
    for (const prop of this.toyboxProps) {
      if (!isPointInsideHitbox(prop.position, hitboxShape)) {
        continue;
      }

      const reaction = applyAttackToProp(prop.state, attack, this.facing);
      prop.state = reaction.state;
      prop.velocity = reaction.velocity;
      this.spawnHitSparks(prop.position, prop.state.kind === "ball" ? 4 : 3, 0xf0c15c);

      if (reaction.breaksNow) {
        prop.body.setAlpha(0.45);
        this.squashTarget(prop.body, 1.35, 0.6, 120);
      } else {
        this.squashTarget(prop.body, 1.16, 0.82, 90);
      }
    }
  }

  private playHitFeedback(attack: AttackOutcome, bully: BullyActor): void {
    const feedback = getHitFeedback(attack);
    const impact = {
      x: (this.playerPosition.x + bully.position.x) / 2,
      y: bully.position.y - 42
    };

    this.time.timeScale = 0.05;
    this.time.delayedCall(feedback.hitPauseMs, () => {
      this.time.timeScale = 1;
    });

    if (feedback.shakeDurationMs > 0) {
      this.cameras.main.shake(feedback.shakeDurationMs, feedback.shakeIntensity);
    }

    this.spawnHitSparks(impact, feedback.sparkCount, attack.kind === "heavy" ? 0xff5f4d : 0xf0c15c);
    this.squashTarget(bully.body, feedback.squashScale.x, feedback.squashScale.y, feedback.hitPauseMs + 85);
    this.flashTarget(bully.body, 0xf5f0e8, feedback.flashMs);
  }

  private spawnHitSparks(position: Point, count: number, color: number): void {
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const spark = this.add.circle(position.x, position.y, 4, color, 0.95);
      spark.setDepth(1000);

      this.tweens.add({
        targets: spark,
        x: position.x + Math.cos(angle) * Phaser.Math.Between(24, 58),
        y: position.y + Math.sin(angle) * Phaser.Math.Between(14, 36),
        alpha: 0,
        scale: 0.2,
        duration: 180,
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy()
      });
    }
  }

  private squashTarget(
    target: Phaser.GameObjects.Container,
    scaleX: number,
    scaleY: number,
    duration: number
  ): void {
    this.tweens.killTweensOf(target);
    this.tweens.add({
      targets: target,
      scaleX,
      scaleY,
      duration: 45,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        target.setScale(target.scaleX < 0 ? -1 : 1, 1);
      }
    });

    this.time.delayedCall(duration, () => {
      target.setScale(target.scaleX < 0 ? -1 : 1, 1);
    });
  }

  private flashTarget(
    target: Phaser.GameObjects.Container | undefined,
    color: number,
    duration: number
  ): void {
    if (!target) {
      return;
    }

    const flash = this.add.rectangle(target.x, target.y - 32, 64, 86, color, 0.28);
    flash.setDepth(target.depth + 20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration,
      ease: "Quad.easeOut",
      onComplete: () => flash.destroy()
    });
  }
}
