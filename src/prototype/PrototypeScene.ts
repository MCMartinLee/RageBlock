import Phaser from "phaser";
import {
  GAME_SCENE_KEY,
  GAME_SUBTITLE,
  GAME_TITLE
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
  type Point
} from "./arenaDefinition";
import { getAttackPresentation, type FacingDirection } from "./attackPresentation";
import { createAttackHitbox, getKnockbackVelocity, isPointInsideHitbox } from "./hitDetection";
import { getHitFeedback } from "./hitFeedback";
import { applyAttackToProp, createPropState, type PropKind, type PropState } from "./propReaction";
import {
  createBullyPressureState,
  updateBullyPressure,
  type BullyPressureState
} from "./bullyPressure";
import { bufferAttack, consumeBufferedAttack, getPlayerMotionState, type PlayerAction } from "./playerController";
import { getCampaignChapter } from "../campaignDefinition";
import { completeChapter, completeSideRoom, createCampaignState, getCampaignRank, getRageModeTuning, recordDefeat, recordPlayerDefeat, restartCampaign, type CampaignState } from "../campaignRuntime";
import { loadCampaign, saveCampaign } from "../campaignPersistence";
import { ENEMY_ARCHETYPES, type PlayerAnimationState } from "./enemyArchetypes";
import { getBossRule, getBossRuleLabel } from "./bossRules";
import { isNormalizedActionHeld, isNormalizedActionPressed, type NormalizedAction } from "./inputActions";
import { getChapterWaveBlueprint } from "./chapterWaves";
import { isChainReactionImpact } from "./chainReaction";

const PLAYER_SPEED = 245;
const PLAYER_RUN_MULTIPLIER = 1.55;
const BULLY_DAMAGE = 4;
const PLAYER_DAMAGE_COOLDOWN_MS = 1050;

type BullyActor = {
  body: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  spawnAt: number;
  active: boolean;
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
  sprite: Phaser.GameObjects.Sprite;
  position: Point;
  velocity: Point;
  state: PropState;
  nextChainAt: number;
};

export class CampaignScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private actionKeys?: Record<"light" | "heavy" | "run" | "runAlt" | "runAlt2" | "restart" | "pause" | "title", Phaser.Input.Keyboard.Key>;
  private player?: Phaser.GameObjects.Container;
  private playerSprite?: Phaser.GameObjects.Sprite;
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
  private playerAnimationState: PlayerAnimationState = "idle";
  private hurtUntil = 0;
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
  private scoreLabel?: Phaser.GameObjects.Text;
  private modeLabel?: Phaser.GameObjects.Text;
  private paused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private audioContext?: AudioContext;
  private ambientTimer?: Phaser.Time.TimerEvent;
  private previousGamepadButtons: boolean[] = [];
  private chapterWorldLayer?: Phaser.GameObjects.Container;
  private bossLaneGuide?: Phaser.GameObjects.Rectangle;
  private hazardActor?: Phaser.GameObjects.Container;
  private exitOpen = false;

  constructor() {
    super(GAME_SCENE_KEY);
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
    this.player = this.createPlayerCharacter(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
    this.spawnChapterWave();
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
      Phaser.Input.Keyboard.KeyCodes.R,
      Phaser.Input.Keyboard.KeyCodes.P,
      Phaser.Input.Keyboard.KeyCodes.T
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
      restart: Phaser.Input.Keyboard.KeyCodes.R,
      pause: Phaser.Input.Keyboard.KeyCodes.P,
      title: Phaser.Input.Keyboard.KeyCodes.T
    }) as Record<"light" | "heavy" | "run" | "runAlt" | "runAlt2" | "restart" | "pause" | "title", Phaser.Input.Keyboard.Key>;

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.requestAttack("heavy", this.time.now);
        return;
      }

      this.requestAttack("light", this.time.now);
    });

    const hudBand = this.add.rectangle(width / 2, 60, width, 120, 0x16171d, 0.86).setStrokeStyle(0).setOrigin(0.5);
    const gameTitle = this.add.text(24, 12, GAME_TITLE, {
      fontFamily: "Arial Black, Arial",
      fontSize: "25px",
      color: "#f5f0e8"
    });
    const subtitle = this.add.text(24, 44, GAME_SUBTITLE, {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#f0c15c"
    });

    this.chapterLabel = this.add.text(24, 76, "", { fontFamily: "Arial", fontSize: "14px", color: "#d8d5c9" });
    this.scoreLabel = this.add.text(700, 12, "Score 0", { fontFamily: "Arial Black, Arial", fontSize: "15px", color: "#f5f0e8" }).setOrigin(1, 0);
    this.modeLabel = this.add.text(700, 42, "Remote CRASH", { fontFamily: "Arial Black, Arial", fontSize: "14px", color: "#bca7ff" }).setOrigin(1, 0);
    this.stateLabel = this.add.text(700, 72, "Combo ready", { fontFamily: "Arial Black, Arial", fontSize: "14px", color: "#bca7ff" }).setOrigin(1, 0);
    this.attackLabel = this.add.text(width - 24, 12, "Ready", { fontFamily: "Arial Black, Arial", fontSize: "15px", color: "#f5f0e8" }).setOrigin(1, 0);
    this.healthLabel = this.add.text(width - 24, 38, "", { fontFamily: "Arial", fontSize: "16px", color: "#8de0ff" }).setOrigin(1, 0);
    this.rageLabel = this.add.text(width - 24, 64, "", { fontFamily: "Arial", fontSize: "16px", color: "#f0c15c" }).setOrigin(1, 0);
    this.defeatLabel = this.add.text(width - 24, 90, "", { fontFamily: "Arial", fontSize: "16px", color: "#f5f0e8" }).setOrigin(1, 0);
    this.add.container(0, 0, [hudBand, gameTitle, subtitle, this.chapterLabel, this.scoreLabel, this.modeLabel, this.stateLabel, this.attackLabel, this.healthLabel, this.rageLabel, this.defeatLabel]).setDepth(4000);
    this.updateHealthLabel();
    this.updateRunLabels();
    this.updateChapterLabel();
    this.updatePresentationLabels();
    this.showChapterStamp();
    this.ambientTimer = this.time.addEvent({ delay: 2600, loop: true, callback: () => this.playTone(72, 0.18) });
    this.publishDebugState();
  }

  update(time: number, delta: number): void {
    if (!this.player) {
      return;
    }

    const pad = this.input.gamepad?.getPad(0);
    const padButtons = pad ? Array.from({ length: 10 }, (_, index) => Boolean(pad.buttons[index]?.pressed)) : [];
    const keyboardPressed: Partial<Record<NormalizedAction, boolean>> = this.actionKeys ? {
      light: Phaser.Input.Keyboard.JustDown(this.actionKeys.light),
      heavy: Phaser.Input.Keyboard.JustDown(this.actionKeys.heavy),
      restart: Phaser.Input.Keyboard.JustDown(this.actionKeys.restart),
      pause: Phaser.Input.Keyboard.JustDown(this.actionKeys.pause),
      title: Phaser.Input.Keyboard.JustDown(this.actionKeys.title)
    } : {};
    const actionPressed = (action: NormalizedAction) => isNormalizedActionPressed(
      keyboardPressed,
      padButtons,
      this.previousGamepadButtons,
      action
    );

    if (actionPressed("title")) {
      saveCampaign(window.localStorage, this.campaignState);
      this.scene.start("rageblock-title");
      return;
    }

    if (actionPressed("restart")) {
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
      this.input.keyboard?.resetKeys();
      if (this.campaignState.completed) {
        this.campaignState = restartCampaign(this.campaignState);
        saveCampaign(window.localStorage, this.campaignState);
      }
      this.scene.restart();
      return;
    }

    if (actionPressed("pause")) {
      this.togglePause();
    }

    this.previousGamepadButtons = padButtons;
    if (this.paused) return;

    if (this.runEnded) {
      return;
    }

    if (actionPressed("light")) {
      this.requestAttack("light", time);
    }

    if (actionPressed("heavy")) {
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
    const speed = PLAYER_SPEED * getRageModeTuning(this.campaignState.mode).speedMultiplier * (running ? PLAYER_RUN_MULTIPLIER : 1);
    let nextPosition = clampToArena({
      x: this.playerPosition.x + movement.x * speed * seconds,
      y: this.playerPosition.y + movement.y * speed * seconds
    });
    const bossAlive = this.bullyWeirdos.some((bully) => bully.isBoss && !bully.combat.defeated);
    const bossRule = bossAlive ? getBossRule(time - this.runStartedAt) : undefined;
    if (bossRule === "lane-lock") nextPosition = { ...nextPosition, y: Phaser.Math.Clamp(nextPosition.y, 345, 425) };
    this.bossLaneGuide?.setVisible(bossRule === "lane-lock").setAlpha(0.22 + Math.sin(time * 0.012) * 0.08);

    this.playerPosition = nextPosition;
    if (!this.activeAttack && time >= this.hurtUntil) this.playerAnimationState = getPlayerMotionState(movement.x !== 0 || movement.y !== 0, running);
    const bob = this.playerAnimationState === "run" ? Math.sin(time * 0.025) * 5 : this.playerAnimationState === "move" ? Math.sin(time * 0.016) * 3 : Math.sin(time * 0.004) * 1.5;
    this.player.setPosition(nextPosition.x, nextPosition.y + bob);
    this.playerSprite?.setFrame(this.getPlayerSpriteFrame(time));
    this.player.setScale(this.facing === "right" ? 1 : -1, 1);
    this.player.setRotation(this.activeAttack ? (this.facing === "right" ? -0.09 : 0.09) : Math.sin(time * 0.006) * 0.012);
    this.player.setDepth(Math.round(nextPosition.y));
    this.updateHazardCollision(time);
    this.attackLabel?.setColor(running ? "#8de0ff" : "#f5f0e8");
    this.stateLabel?.setText(`Combo ${this.comboStep + 1}/3 | ${this.playerAnimationState}`);
    if (nextPosition.x <= ARENA_BOUNDS.left + 36 && this.campaignState.routeNode === 0) {
      const chapter = getCampaignChapter(this.campaignChapter);
      this.campaignState = completeSideRoom(this.campaignState, `${chapter.id}-side-room`);
      saveCampaign(window.localStorage, this.campaignState);
      this.attackLabel?.setText(`SIDE ROOM CLEAR | +250 | ${chapter.route[1].label}`);
      this.updatePresentationLabels();
      this.flashTarget(this.player, chapter.palette.accent, 220);
    }
    if (this.exitOpen && nextPosition.x >= ARENA_BOUNDS.right - 42) {
      this.exitOpen = false;
      this.playerPosition = { ...PLAYER_SPAWN };
      this.player.setPosition(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
      if (this.campaignChapter < 5) this.advanceChapter();
      else {
        this.campaignState = completeChapter(this.campaignState);
        saveCampaign(window.localStorage, this.campaignState);
        this.endRun("Remote Recovered");
      }
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
    this.updateToyboxProps(time, delta);
    this.publishDebugState();
  }

  private createSchoolyardCorner(width: number, height: number): void {
    this.chapterWorldLayer?.destroy(true);
    const chapter = getCampaignChapter(this.campaignChapter);
    const palette = chapter.palette;
    const world = this.add.container(0, 0).setDepth(-1000);
    const backdrop = this.add.image(width / 2, height / 2, `rageblock-bg-${chapter.id}`).setDisplaySize(width, height);
    world.add([
      backdrop,
      this.add.rectangle(width / 2, height / 2, width, height, palette.sky, 0.08),
      this.add.rectangle(width / 2, 390, width, 300, palette.ground, 0.1),
      this.add.rectangle(width / 2, 122, width, 5, palette.accent, 0.9),
      this.add.text(24, 128, chapter.setting.toUpperCase(), { fontFamily: "Arial Black, Arial", fontSize: "20px", color: "#f5f0e8", stroke: "#17242b", strokeThickness: 4 }),
      this.add.text(24, 153, `${chapter.route[0].label}  >  ${chapter.route[2].label}`, { fontFamily: "Arial", fontSize: "14px", color: "#f5f0e8", stroke: "#17242b", strokeThickness: 3 })
    ]);
    const hazard = this.add.rectangle(0, 0, 30, 30, palette.accent, 0.86).setRotation(Math.PI / 4).setStrokeStyle(3, 0xf5f0e8, 0.8);
    const hazardCore = this.add.circle(0, 0, 7, 0x16171d, 0.9);
    const hazardLabel = this.add.text(0, -30, chapter.hazards[0].replaceAll("-", " ").toUpperCase(), { fontFamily: "Arial Black, Arial", fontSize: "10px", color: "#f5f0e8", stroke: "#17242b", strokeThickness: 3 }).setOrigin(0.5);
    const hazardGroup = this.add.container(180, 260, [hazard, hazardCore, hazardLabel]);
    world.add(hazardGroup);
    this.hazardActor = hazardGroup;
    this.tweens.add({ targets: hazardGroup, x: 780, duration: 3200 - this.campaignChapter * 180, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: hazard, angle: 360, duration: 900, repeat: -1, ease: "Linear" });
    this.chapterWorldLayer = world;
  }

  private createExitMarkers(): void {
    const exit = this.add.container(ARENA_BOUNDS.right - 28, (ARENA_BOUNDS.top + ARENA_BOUNDS.bottom) / 2);
    exit.add([
      this.add.rectangle(0, 0, 8, 118, 0xf0c15c, 0.8),
      this.add.triangle(-12, -48, 0, 0, 24, 14, 24, -14, 0xf0c15c, 0.9),
      this.add.text(-82, 72, "NEXT BLOCK", { fontFamily: "Arial Black, Arial", fontSize: "12px", color: "#f0c15c" })
    ]);
    exit.setDepth(20);
    const side = this.add.container(ARENA_BOUNDS.left + 28, (ARENA_BOUNDS.top + ARENA_BOUNDS.bottom) / 2);
    side.add([
      this.add.rectangle(0, 0, 8, 96, 0x36d1dc, 0.7),
      this.add.triangle(12, -36, 0, 0, -22, 14, -22, -14, 0x36d1dc, 0.9),
      this.add.text(-16, 58, "SIDE ROOM", { fontFamily: "Arial Black, Arial", fontSize: "11px", color: "#36d1dc" }).setOrigin(0, 0.5)
    ]);
    side.setDepth(20);
  }

  private createPlayerCharacter(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 8, 70, 18, 0x000000, 0.3);
    this.playerSprite = this.add.sprite(0, -54, "rageblock-hero", 0).setDisplaySize(132, 132);
    return this.add.container(x, y, [shadow, this.playerSprite]);
  }

  private getPlayerSpriteFrame(time: number): number {
    if (this.playerAnimationState === "run" || this.playerAnimationState === "move") {
      return Math.floor(time / (this.playerAnimationState === "run" ? 90 : 140)) % 2 === 0 ? 1 : 2;
    }
    if (this.playerAnimationState === "light") return 3;
    if (this.playerAnimationState === "heavy") return Math.floor(time / 110) % 2 === 0 ? 4 : 5;
    if (this.playerAnimationState === "hurt" || this.playerAnimationState === "defeated") return 6;
    if (this.playerAnimationState === "victory") return 7;
    return 0;
  }

  private getEnemySpriteFrame(variant: BullyActor["variant"]): number {
    return { bully: 0, charger: 1, thrower: 2, heavy: 3 }[variant];
  }

  private getEnemyHealthOffset(variant: BullyActor["variant"], isBoss: boolean): number {
    return isBoss ? 154 : variant === "heavy" ? 124 : 105;
  }

  private createBullyWeirdo(
    position: Point,
    delayMs: number,
    canCharge: boolean,
    variant: BullyActor["variant"] = canCharge ? "charger" : "bully",
    isBoss = false
  ): BullyActor {
    const body = this.add.container(position.x, position.y);
    const shadow = this.add.ellipse(0, 8, isBoss ? 108 : 66, isBoss ? 24 : 16, 0x000000, 0.26);
    const frame = this.getEnemySpriteFrame(variant);
    const sprite = this.add.sprite(0, isBoss ? -76 : variant === "heavy" ? -65 : -56, "rageblock-enemies", frame);
    sprite.setDisplaySize(isBoss ? 172 : variant === "heavy" ? 138 : 116, isBoss ? 194 : variant === "heavy" ? 155 : 131);
    const moodLabel = this.add
      .text(0, isBoss ? -162 : -108, isBoss ? "BLOCK CAPTAIN" : "", {
        fontFamily: "Arial Black, Arial",
        fontSize: isBoss ? "13px" : "11px",
        color: isBoss ? "#ffd23f" : "#f5f0e8",
        stroke: "#17242b",
        strokeThickness: 3
      })
      .setOrigin(0.5);

    body.add([shadow, sprite, moodLabel]);
    body.setDepth(Math.round(position.y));
    body.setVisible(delayMs === 0);

    const healthBar = this.add.rectangle(position.x, position.y - this.getEnemyHealthOffset(variant, isBoss), isBoss ? 118 : 56, 7, isBoss ? 0xff5f4d : variant === "heavy" ? 0xff9d4d : 0x8de0ff);
    healthBar.setVisible(delayMs === 0);

    return {
      body,
      sprite,
      spawnAt: this.time.now + delayMs,
      active: delayMs === 0,
      position,
      knockbackVelocity: { x: 0, y: 0 },
      pressure: createBullyPressureState(this.time.now + delayMs, canCharge),
      combat: createBullyWeirdoState({ health: isBoss ? ENEMY_ARCHETYPES.boss.health : ENEMY_ARCHETYPES[variant].health }),
      moodLabel,
      healthBar,
      variant,
      isBoss
    };
  }

  private createToyboxProp(kind: PropKind, position: Point): ToyboxProp {
    const body = this.add.container(position.x, position.y);
    const shadow = this.add.ellipse(0, 6, kind === "ball" ? 44 : 58, 13, 0x000000, 0.25);
    const sprite = this.add.sprite(0, kind === "ball" ? -22 : -32, "rageblock-props", this.getPropSpriteFrame(kind));
    const size = kind === "ball" ? 64 : kind === "cone" ? 76 : 82;
    sprite.setDisplaySize(size, size);
    body.add([shadow, sprite]);

    body.setDepth(Math.round(position.y));

    return {
      body,
      sprite,
      position,
      velocity: { x: 0, y: 0 },
      state: createPropState(kind)
      , nextChainAt: 0
    };
  }

  private getPropSpriteFrame(kind: PropKind): number {
    return { cone: 0, "trash-can": 1, ball: 2 }[kind];
  }

  private getMovementInput(): Point {
    const left = this.cursors?.left.isDown || this.wasd?.left.isDown;
    const right = this.cursors?.right.isDown || this.wasd?.right.isDown;
    const up = this.cursors?.up.isDown || this.wasd?.up.isDown;
    const down = this.cursors?.down.isDown || this.wasd?.down.isDown;

    const pad = this.input.gamepad?.getPad(0);
    const padX = pad ? (Math.abs(pad.axes[0]?.getValue() ?? 0) > 0.2 ? pad.axes[0].getValue() : 0) : 0;
    const padY = pad ? (Math.abs(pad.axes[1]?.getValue() ?? 0) > 0.2 ? pad.axes[1].getValue() : 0) : 0;
    const movement = {
      x: padX || Number(Boolean(right)) - Number(Boolean(left)),
      y: padY || Number(Boolean(down)) - Number(Boolean(up))
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
    const pad = this.input.gamepad?.getPad(0);
    const buttons = pad ? Array.from({ length: 10 }, (_, index) => Boolean(pad.buttons[index]?.pressed)) : [];
    return isNormalizedActionHeld(
      { run: Boolean(this.actionKeys?.run.isDown || this.actionKeys?.runAlt.isDown || this.actionKeys?.runAlt2.isDown) },
      buttons,
      "run"
    );
  }

  private updatePresentationLabels(): void {
    this.scoreLabel?.setText(`Score ${this.campaignState.score}`);
    this.modeLabel?.setText(`Remote ${this.campaignState.mode.toUpperCase()}`);
  }

  private publishDebugState(): void {
    window.__RAGEBLOCK__ = {
      getState: () => ({
        player: { ...this.playerPosition },
        running: this.isRunning(),
        runEnded: this.runEnded,
        paused: this.paused,
        chapter: this.campaignChapter,
        exitOpen: this.exitOpen,
        mode: this.campaignState.mode,
        score: this.campaignState.score,
        completed: this.campaignState.completed,
        defeated: this.combatRun.defeatedBullyWeirdos,
        enemies: this.bullyWeirdos
          .filter((bully) => bully.active && !bully.combat.defeated)
          .map((bully) => ({ ...bully.position, health: bully.combat.health }))
      }),
      clearWave: () => {
        for (const bully of this.bullyWeirdos) {
          bully.active = true;
          bully.body.setVisible(true);
          bully.combat = { ...bully.combat, health: 0, defeated: true };
        }
        this.combatRun = { ...this.combatRun, defeatedBullyWeirdos: 8 };
        this.openExitIfCleared();
      },
      defeatPlayer: () => {
        this.damagePlayer(this.playerState.health, this.time.now, "DEFEATED");
      }
    };
  }

  private resetRunState(): void {
    this.playerPosition = { ...PLAYER_SPAWN };
    this.facing = "right";
    this.comboStep = 0;
    this.playerState = createPlayerState();
    this.playerAnimationState = "idle";
    this.hurtUntil = 0;
    this.playerSprite = undefined;
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
    this.campaignState = loadCampaign(window.localStorage);
    this.campaignChapter = this.campaignState.completed ? 0 : this.campaignState.chapterIndex;
    if (this.campaignState.completed) this.campaignState = restartCampaign(this.campaignState);
    this.exitOpen = false;
    this.paused = false;
    this.pauseOverlay = undefined;
    this.hazardActor = undefined;
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.playTone(this.paused ? 180 : 280, 0.07);
    if (this.paused) {
      const { width, height } = this.scale;
      const panel = this.add.rectangle(0, 0, 360, 150, 0x16171d, 0.96).setStrokeStyle(3, 0xf0c15c);
      const title = this.add.text(0, -28, "PAUSED", { fontFamily: "Arial Black, Arial", fontSize: "32px", color: "#f5f0e8" }).setOrigin(0.5);
      const hint = this.add.text(0, 28, "P / Menu resume   T / View title", { fontFamily: "Arial", fontSize: "18px", color: "#d8d5c9" }).setOrigin(0.5);
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

  private showChapterStamp(): void {
    const { width, height } = this.scale;
    const chapter = getCampaignChapter(this.campaignChapter);
    const band = this.add.rectangle(0, 0, width, 126, 0x16171d, 0.94).setStrokeStyle(3, chapter.palette.accent);
    const number = this.add.text(0, -29, `CHAPTER ${this.campaignChapter + 1} / 6`, {
      fontFamily: "Arial Black, Arial",
      fontSize: "17px",
      color: "#f0c15c"
    }).setOrigin(0.5);
    const title = this.add.text(0, 4, chapter.title.toUpperCase(), {
      fontFamily: "Arial Black, Arial",
      fontSize: "30px",
      color: "#f5f0e8"
    }).setOrigin(0.5);
    const objective = this.add.text(0, 38, chapter.objective, {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#d8d5c9"
    }).setOrigin(0.5);
    const stamp = this.add.container(width / 2, height / 2, [band, number, title, objective]).setDepth(4500);
    this.tweens.add({
      targets: stamp,
      alpha: 0,
      y: height / 2 - 18,
      delay: 900,
      duration: 320,
      ease: "Quad.easeIn",
      onComplete: () => stamp.destroy()
    });
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
    const tuning = getRageModeTuning(this.campaignState.mode);
    const effectiveAttack = { ...attack, knockback: Math.round(attack.knockback * tuning.knockbackMultiplier) };
    const presentation = getAttackPresentation(effectiveAttack, this.facing);
    const hitboxShape = createAttackHitbox(this.playerPosition, presentation);
    const x = hitboxShape.center.x;
    const y = hitboxShape.center.y;

    this.activeAttack?.destroy();
    this.activeAttack = this.add.container(x, y);

    const trail = this.add
      .ellipse(0, 0, presentation.hitboxWidth, effectiveAttack.kind === "heavy" ? 30 : 16, presentation.color, 0.72)
      .setRotation(this.facing === "right" ? -0.18 : 0.18);
    const core = this.add
      .ellipse(this.facing === "right" ? presentation.hitboxWidth * 0.3 : -presentation.hitboxWidth * 0.3, 0, effectiveAttack.kind === "heavy" ? 28 : 18, effectiveAttack.kind === "heavy" ? 28 : 18, 0xf5f0e8, 0.9)
      .setStrokeStyle(4, presentation.color, 0.95);
    this.activeAttack.add([trail, core]);
    this.tweens.add({
      targets: this.activeAttack,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 0.65,
      duration: presentation.durationMs,
      ease: "Quad.easeOut"
    });
    this.activeAttack.setDepth(Math.round(this.playerPosition.y) + 10);
    this.attackingUntil = time + presentation.durationMs;
    this.attackLabel?.setText(`${presentation.label}!`);
    this.stateLabel?.setText(effectiveAttack.kind === "heavy" ? "RAGE LAUNCH" : `COMBO ${effectiveAttack.comboStep ?? 1}`);
    this.playerAnimationState = effectiveAttack.kind;
    this.applyAttackToBullyWeirdos(effectiveAttack, hitboxShape);
    this.applyAttackToToyboxProps({ ...effectiveAttack, knockback: Math.round(effectiveAttack.knockback * tuning.propMultiplier) }, hitboxShape);
    this.playTone(effectiveAttack.kind === "heavy" ? 120 : 220, effectiveAttack.kind === "heavy" ? 0.12 : 0.06);
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
      if (!bully.active) {
        if (time < bully.spawnAt) continue;
        bully.active = true;
        bully.body.setVisible(true).setAlpha(0).setScale(0.65);
        bully.healthBar.setVisible(true);
        this.tweens.add({ targets: bully.body, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });
        this.playTone(bully.isBoss ? 65 : 105, bully.isBoss ? 0.32 : 0.08);
      }
      if (bully.combat.defeated) {
        bully.body.setAlpha(0.35);
        bully.sprite.setFrame(this.getEnemySpriteFrame(bully.variant) + 4).setRotation(-0.9);
        bully.moodLabel.setVisible(false);
        bully.healthBar.setVisible(false);
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
          x: bully.position.x - decision.velocity.x * seconds * (1 - ENEMY_ARCHETYPES.thrower.approachScale),
          y: bully.position.y - decision.velocity.y * seconds * (1 - ENEMY_ARCHETYPES.thrower.approachScale)
        });
      }

      bully.body.setPosition(bully.position.x, bully.position.y);
      bully.body.setDepth(Math.round(bully.position.y));
      bully.sprite.setFlipX(decision.velocity.x > 0);
      bully.sprite.setFrame(this.getEnemySpriteFrame(bully.variant) + (decision.mood === "charging" || decision.mood === "shoving" ? 4 : 0));
      bully.sprite.setRotation(Math.sin((time + bully.position.x * 3) * (bully.variant === "heavy" ? 0.003 : 0.006)) * (bully.variant === "charger" ? 0.055 : 0.025));
      const showTelegraph = decision.mood === "charging" || decision.mood === "shoving";
      bully.moodLabel.setVisible(bully.isBoss || showTelegraph);
      bully.moodLabel.setText(bully.isBoss ? getBossRuleLabel(getBossRule(time - this.runStartedAt)) : decision.mood === "charging" ? "CHARGE!" : "SHOVE!");
      const healthOffset = this.getEnemyHealthOffset(bully.variant, bully.isBoss);
      const maxHealth = bully.isBoss ? ENEMY_ARCHETYPES.boss.health : ENEMY_ARCHETYPES[bully.variant].health;
      bully.healthBar.setVisible(true).setPosition(bully.position.x, bully.position.y - healthOffset);
      bully.healthBar.setDisplaySize((bully.isBoss ? 118 : 56) * (bully.combat.health / maxHealth), bully.isBoss ? 7 : 5);
      bully.healthBar.setDepth(Math.round(bully.position.y) + 2);

      if (decision.damagesPlayer && time >= this.nextPlayerDamageAt) {
        this.damagePlayer(BULLY_DAMAGE, time, "SHOVED!");
      }
    }
  }

  private updateHazardCollision(time: number): void {
    if (!this.hazardActor || time < this.nextPlayerDamageAt) return;
    if (Phaser.Math.Distance.Between(this.playerPosition.x, this.playerPosition.y, this.hazardActor.x, this.hazardActor.y) > 44) return;
    this.damagePlayer(8, time, "HAZARD!");
    this.playerPosition = clampToArena({ x: this.playerPosition.x - (this.hazardActor.x < this.playerPosition.x ? -48 : 48), y: this.playerPosition.y + 18 });
  }

  private damagePlayer(amount: number, time: number, callout: string): void {
    if (this.runEnded) return;
    this.playerState = { ...this.playerState, health: Math.max(0, this.playerState.health - amount) };
    this.damageTaken += amount;
    this.nextPlayerDamageAt = time + PLAYER_DAMAGE_COOLDOWN_MS;
    this.playerAnimationState = "hurt";
    this.hurtUntil = time + 260;
    this.stateLabel?.setText(callout);
    this.playTone(86, 0.11);
    this.updateHealthLabel();
    this.flashTarget(this.player, 0x8de0ff, 120);
    if (this.playerState.health <= 0) this.knockOutPlayer();
  }

  private knockOutPlayer(): void {
    if (this.runEnded) return;
    this.playerState = { ...this.playerState, health: 0 };
    this.campaignState = recordPlayerDefeat(this.campaignState);
    saveCampaign(window.localStorage, this.campaignState);
    this.updateHealthLabel();
    this.endRun("Knocked Out");
  }

  private updateHealthLabel(): void {
    this.healthLabel?.setText(`Health ${this.playerState.health} | Taken ${this.damageTaken}`);
  }

  private updateRunLabels(): void {
    this.rageLabel?.setText(`Rage ${this.combatRun.rage}/100`);
    const boss = this.bullyWeirdos.find((bully) => bully.isBoss && !bully.combat.defeated);
    this.defeatLabel?.setText(boss ? `BLOCK CAPTAIN ${boss.combat.health}/60` : `Defeated ${this.combatRun.defeatedBullyWeirdos}/8`);
  }

  private updateToyboxProps(time: number, delta: number): void {
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
      const actionFrame = prop.state.broken || (prop.state.kind === "ball" && Math.hypot(prop.velocity.x, prop.velocity.y) > 120);
      prop.sprite.setFrame(this.getPropSpriteFrame(prop.state.kind) + (actionFrame ? 3 : 0));

      if (time >= prop.nextChainAt) {
        const target = this.bullyWeirdos.find((bully) => bully.active && !bully.combat.defeated && isChainReactionImpact(prop.position, prop.velocity, bully.position));
        if (target) {
          const chainAttack: AttackOutcome = { kind: "light", comboStep: null, damage: 4, knockback: 180, launch: false, empowered: false, rageGain: 12, nextComboStep: 0 };
          const result = applyAttackToBullyWeirdo(this.combatRun, target.combat, chainAttack);
          this.combatRun = result.run;
          target.combat = result.bully;
          target.knockbackVelocity = getKnockbackVelocity(chainAttack.knockback, prop.velocity.x < 0 ? "left" : "right", false);
          this.showEnemyCallout(target, "CHAIN!", "#ffd23f");
          prop.nextChainAt = time + 500;
          prop.velocity = { x: -prop.velocity.x * 0.35, y: -120 };
          this.spawnHitSparks(target.position, 5, 0xffd23f);
          if (target.combat.defeated) this.campaignState = recordDefeat(this.campaignState, 250);
          this.updateRunLabels();
          this.openExitIfCleared();
        }
      }
    }
  }

  private showEnemyCallout(bully: BullyActor, label: string, color: string): void {
    const callout = this.add.text(bully.position.x, bully.position.y - this.getEnemyHealthOffset(bully.variant, bully.isBoss) - 12, label, {
      fontFamily: "Arial Black, Arial",
      fontSize: bully.isBoss ? "18px" : "14px",
      color,
      stroke: "#17242b",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(3200);
    this.tweens.add({
      targets: callout,
      y: callout.y - 28,
      alpha: 0,
      scale: 1.2,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => callout.destroy()
    });
  }

  private applyAttackToBullyWeirdos(attack: AttackOutcome, hitboxShape: ReturnType<typeof createAttackHitbox>): void {
    for (const bully of this.bullyWeirdos) {
      const targetCenter = { x: bully.position.x, y: bully.position.y - (bully.isBoss ? 62 : 42) };
      if (!bully.active || bully.combat.defeated || !isPointInsideHitbox(targetCenter, hitboxShape)) {
        continue;
      }

      const result = applyAttackToBullyWeirdo(this.combatRun, bully.combat, attack);
      this.hitsLanded += 1;
      this.combatRun = result.run;
      bully.combat = result.bully;
      bully.knockbackVelocity = getKnockbackVelocity(attack.knockback, this.facing, attack.launch);
      this.showEnemyCallout(bully, attack.launch ? "LAUNCHED!" : "POW!", attack.kind === "heavy" ? "#ff6b35" : "#f5f0e8");
      bully.healthBar.setDisplaySize((bully.isBoss ? 96 : 48) * (bully.combat.health / (bully.isBoss ? 60 : bully.variant === "heavy" ? 30 : 18)), bully.isBoss ? 7 : 5);
      this.playHitFeedback(attack, bully);

      if (bully.combat.defeated) {
        this.campaignState = recordDefeat(this.campaignState);
        saveCampaign(window.localStorage, this.campaignState);
        this.updatePresentationLabels();
        bully.body.setAlpha(0.35);
        bully.healthBar.setAlpha(0.25);
      }
    }

    this.playerState = {
      ...this.playerState,
      rage: this.combatRun.rage
    };
    this.updateRunLabels();
    this.openExitIfCleared();
  }

  private openExitIfCleared(): void {
    if (!isBlockCleared(this.combatRun) || this.exitOpen) return;
    this.exitOpen = true;
    this.attackLabel?.setText(this.campaignChapter < 5 ? "EXIT OPEN | Reach NEXT BLOCK" : "BOSS DOWN | Reach NEXT BLOCK");
    this.playTone(this.campaignChapter < 5 ? 520 : 72, this.campaignChapter < 5 ? 0.2 : 0.45);
  }

  private advanceChapter(): void {
    this.campaignState = completeChapter(this.campaignState);
    saveCampaign(window.localStorage, this.campaignState);
    this.campaignChapter = this.campaignState.chapterIndex;
    for (const bully of this.bullyWeirdos) {
      bully.body.destroy();
      bully.healthBar.destroy();
    }
    this.spawnChapterWave();
    this.createSchoolyardCorner(this.scale.width, this.scale.height);
    this.combatRun = { ...this.combatRun, defeatedBullyWeirdos: 0 };
    this.updateChapterLabel();
    this.updatePresentationLabels();
    this.attackLabel?.setText("NEW BLOCK");
    this.showChapterStamp();
    this.playTone(440, 0.16);
    this.flashTarget(this.player, 0xf0c15c, 220);
    this.time.delayedCall(1100, () => {
      if (!this.exitOpen && !this.runEnded) this.attackLabel?.setText("Ready");
    });
  }

  private spawnChapterWave(): void {
    this.bullyWeirdos = getChapterWaveBlueprint(this.campaignChapter)
      .map((entry) => this.createBullyWeirdo(entry.position, entry.delayMs, entry.canCharge, entry.variant === "boss" ? "heavy" : entry.variant, entry.variant === "boss"));
    this.bossLaneGuide?.destroy();
    this.bossLaneGuide = this.campaignChapter === 5
      ? this.add.rectangle((ARENA_BOUNDS.left + ARENA_BOUNDS.right) / 2, 385, ARENA_BOUNDS.right - ARENA_BOUNDS.left, 80, 0xd83b87, 0.18).setStrokeStyle(4, 0xffd23f, 0.85).setDepth(10).setVisible(false)
      : undefined;
  }

  private endRun(title: "Remote Recovered" | "Knocked Out"): void {
    if (this.runEnded) {
      return;
    }

    this.runEnded = true;
    this.playTone(title === "Remote Recovered" ? 660 : 58, title === "Remote Recovered" ? 0.34 : 0.42);
    this.playerAnimationState = title === "Remote Recovered" ? "victory" : "defeated";
    this.playerSprite?.setFrame(title === "Remote Recovered" ? 7 : 6);
    this.stateLabel?.setText(title === "Remote Recovered" ? "VICTORY" : "DEFEATED");
    const elapsedSeconds = Math.max(0, Math.round((this.time.now - this.runStartedAt) / 1000));
    const { width, height } = this.scale;
    const panel = this.add.rectangle(0, 0, 500, 350, 0x16171d, 0.95).setStrokeStyle(4, 0xf0c15c);
    const heading = this.add.text(0, -132, title, {
      fontFamily: "Arial, sans-serif",
      fontSize: "34px",
      color: title === "Remote Recovered" ? "#f0c15c" : "#ff5f4d"
    }).setOrigin(0.5);
    const stats = this.add.text(0, -24, [
      `Time ${elapsedSeconds}s`,
      `Hits Landed ${this.hitsLanded}`,
      `Damage Taken ${this.damageTaken}`,
      `Score ${this.campaignState.score}`,
      `Rank ${getCampaignRank(this.campaignState.score)}`,
      `Remote ${this.campaignState.mode.toUpperCase()}`,
      title === "Remote Recovered" ? `Recovered ${this.campaignState.recoveredRewards.at(-1) ?? "Rage Remote"}` : `Checkpoint Chapter ${this.campaignChapter + 1}`,
      "",
      title === "Remote Recovered" ? "R Replay Campaign   T Title" : "R Retry Checkpoint   T Title"
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
      if (!isPointInsideHitbox({ x: prop.position.x, y: prop.position.y - 20 }, hitboxShape)) {
        continue;
      }

      const reaction = applyAttackToProp(prop.state, attack, this.facing);
      prop.state = reaction.state;
      prop.velocity = reaction.velocity;
      this.spawnHitSparks(prop.position, prop.state.kind === "ball" ? 4 : 3, 0xf0c15c);

      if (reaction.breaksNow) {
        this.playTone(150, 0.18);
        prop.sprite.setFrame(this.getPropSpriteFrame(prop.state.kind) + 3);
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
