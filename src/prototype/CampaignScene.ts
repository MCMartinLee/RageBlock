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
  recoverPlayerHealth,
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
import { applyAttackToProp, createPropState, getPropFrame, getPropPresentation, type PropKind, type PropState } from "./propReaction";
import {
  createBullyPressureState,
  updateBullyPressure,
  type BullyPressureState
} from "./bullyPressure";
import { bufferAttack, consumeBufferedAttack, getPlayerMotionState, type PlayerAction } from "./playerController";
import { CAMPAIGN_CHAPTERS, getCampaignChapter } from "../campaignDefinition";
import { advanceRouteNode, completeChapter, completeSideRoom, createCampaignState, getCampaignRank, getRageModeTuning, recordDefeat, recordPlayerDefeat, resolveChapterStart, restartCampaign, type CampaignState } from "../campaignRuntime";
import { loadCampaign, loadStartChapter, saveCampaign, saveStartChapter } from "../campaignPersistence";
import { ENEMY_ARCHETYPES, type PlayerAnimationState } from "./enemyArchetypes";
import { canBossCharge, getBossRuleLabel, getBossRulePhase, getBossRuleTuning } from "./bossRules";
import { isNormalizedActionHeld, isNormalizedActionPressed, type NormalizedAction } from "./inputActions";
import { getChapterPropBlueprint, getChapterWaveBlueprint, type RoutePhase } from "./chapterWaves";
import { isChainReactionImpact } from "./chainReaction";
import { getCosmeticTint, getEnemyAnimationPose, getEnemyPresentation, getFactionPresentation, getPlayerAnimationPose, type EnemyAnimationState, type FactionAccessory } from "./actorPresentation";
import { applyHitToSideCache, createSideCacheState, type SideCacheState } from "./sideRoomChallenge";
import { getChapterHazardBlueprint, isPointInsideHazard, type ChapterHazardBlueprint } from "./chapterHazards";
import { getEnemySpecialPlan, type EnemySpecialPlan } from "./enemySpecials";
import { hasReadableLayout } from "./layoutGeometry";
import { formatUnlockName } from "../displayText";
import { advanceGameplayClock } from "./gameplayClock";
import { getCampaignObjective } from "./campaignObjective";

const PLAYER_SPEED = 245;
const PLAYER_RUN_MULTIPLIER = 1.55;
const PLAYER_DAMAGE_COOLDOWN_MS = 1050;

type BullyActor = {
  body: Phaser.GameObjects.Container;
  visual: Phaser.GameObjects.Container;
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
  reactionUntil: number;
  launchUntil: number;
  landUntil: number;
  recoveryUntil: number;
  defeatAnimated: boolean;
  nextSpecialAt: number;
  specialUntil: number;
  specialKind?: EnemySpecialPlan["kind"];
};

type ToyboxProp = {
  body: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  position: Point;
  velocity: Point;
  state: PropState;
  nextChainAt: number;
};

type SideRoomCacheActor = {
  body: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  state: SideCacheState;
};

type EnemyProjectile = {
  sprite: Phaser.GameObjects.Sprite;
  position: Point;
  velocity: Point;
  expiresAt: number;
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
  private attackStartedAt = 0;
  private attackFacing: FacingDirection = "right";
  private bufferedAttack?: PlayerAction;
  private activeAttack?: Phaser.GameObjects.Container;
  private attackLabel?: Phaser.GameObjects.Text;
  private healthLabel?: Phaser.GameObjects.Text;
  private rageLabel?: Phaser.GameObjects.Text;
  private defeatLabel?: Phaser.GameObjects.Text;
  private stateLabel?: Phaser.GameObjects.Text;
  private playerAnimationState: PlayerAnimationState = "idle";
  private forcedPlayerAnimation?: { state: PlayerAnimationState; until: number };
  private hurtUntil = 0;
  private damageTaken = 0;
  private hitsLanded = 0;
  private gameplayTime = 0;
  private runStartedAt = 0;
  private encounterStartedAt = 0;
  private runEnded = false;
  private resultOverlay?: Phaser.GameObjects.Container;
  private bullyWeirdos: BullyActor[] = [];
  private toyboxProps: ToyboxProp[] = [];
  private nextPlayerDamageAt = 0;
  private campaignChapter = 0;
  private campaignState: CampaignState = createCampaignState();
  private chapterLabel?: Phaser.GameObjects.Text;
  private objectiveLabel?: Phaser.GameObjects.Text;
  private scoreLabel?: Phaser.GameObjects.Text;
  private modeLabel?: Phaser.GameObjects.Text;
  private paused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private audioContext?: AudioContext;
  private ambientTimer?: Phaser.Time.TimerEvent;
  private previousGamepadButtons: boolean[] = [];
  private chapterWorldLayer?: Phaser.GameObjects.Container;
  private chapterBackdrop?: Phaser.GameObjects.Image;
  private bossLaneGuide?: Phaser.GameObjects.Rectangle;
  private hazardActor?: Phaser.GameObjects.Container;
  private hazardBlueprint?: ChapterHazardBlueprint;
  private nextHazardEnemyAt = 0;
  private nextHazardPropAt = 0;
  private hazardChainHits = 0;
  private exitOpen = false;
  private exitLabel?: Phaser.GameObjects.Text;
  private sideRoomMarker?: Phaser.GameObjects.Container;
  private sideRoomCache?: SideRoomCacheActor;
  private routePhase: RoutePhase = "main";
  private isChapterReplay = false;
  private lastBossPhaseKey?: string;
  private enemyProjectiles: EnemyProjectile[] = [];
  private enemySpecialsFired = 0;
  private hitAudioEvents = 0;
  private resultRewardText = "";
  private pendingHitPauses = 0;
  private hudRows: Phaser.GameObjects.Text[][] = [];

  constructor() {
    super(GAME_SCENE_KEY);
  }

  init(): void {
    this.resetRunState();
  }

  preload(): void {
    this.load.spritesheet("rageblock-signature-props", "assets/art/rageblock-signature-prop-atlas.png", {
      frameWidth: 256,
      frameHeight: 256
    });
  }

  create(): void {
    const { width, height } = this.scale;
    this.runStartedAt = this.gameplayTime;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.centerOn(width / 2, height / 2);

    this.createChapterWorld(width, height);
    this.createExitMarkers();
    this.createSideRoomCache();
    this.player = this.createPlayerCharacter(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
    this.spawnChapterWave();
    this.spawnChapterProps();

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
      if (this.paused || this.runEnded) return;
      if (pointer.rightButtonDown()) {
        this.requestAttack("heavy", this.gameplayTime);
        return;
      }

      this.requestAttack("light", this.gameplayTime);
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
    this.objectiveLabel = this.add.text(24, 99, "", { fontFamily: "Arial Black, Arial", fontSize: "11px", color: "#f0c15c" });
    this.scoreLabel = this.add.text(700, 12, "Score 0", { fontFamily: "Arial Black, Arial", fontSize: "15px", color: "#f5f0e8" }).setOrigin(1, 0);
    this.modeLabel = this.add.text(700, 42, "Remote CRASH", { fontFamily: "Arial Black, Arial", fontSize: "14px", color: "#bca7ff" }).setOrigin(1, 0);
    this.stateLabel = this.add.text(700, 72, "Combo ready", { fontFamily: "Arial Black, Arial", fontSize: "14px", color: "#bca7ff" }).setOrigin(1, 0);
    this.attackLabel = this.add.text(width - 24, 12, "Ready", { fontFamily: "Arial Black, Arial", fontSize: "15px", color: "#f5f0e8" }).setOrigin(1, 0);
    this.healthLabel = this.add.text(width - 24, 38, "", { fontFamily: "Arial", fontSize: "16px", color: "#8de0ff" }).setOrigin(1, 0);
    this.rageLabel = this.add.text(width - 24, 64, "", { fontFamily: "Arial", fontSize: "16px", color: "#f0c15c" }).setOrigin(1, 0);
    this.defeatLabel = this.add.text(width - 24, 90, "", { fontFamily: "Arial", fontSize: "16px", color: "#f5f0e8" }).setOrigin(1, 0);
    this.hudRows = [
      [gameTitle, this.scoreLabel, this.attackLabel],
      [subtitle, this.modeLabel, this.healthLabel],
      [this.chapterLabel, this.stateLabel, this.rageLabel],
      [this.objectiveLabel, this.defeatLabel]
    ];
    this.add.container(0, 0, [hudBand, gameTitle, subtitle, this.chapterLabel, this.objectiveLabel, this.scoreLabel, this.modeLabel, this.stateLabel, this.attackLabel, this.healthLabel, this.rageLabel, this.defeatLabel]).setDepth(4000);
    this.updateHealthLabel();
    this.updateRunLabels();
    this.updateChapterLabel();
    this.updateObjectiveLabel();
    this.updatePresentationLabels();
    this.showChapterStamp();
    this.ambientTimer = this.time.addEvent({ delay: 2600, loop: true, callback: () => this.playTone(72, 0.18) });
    this.publishDebugState();
  }

  update(_rawTime: number, frameDelta: number): void {
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
      if (this.campaignState.completed && !this.isChapterReplay) {
        this.campaignState = restartCampaign(this.campaignState);
        saveCampaign(window.localStorage, this.campaignState);
        saveStartChapter(window.localStorage, 0);
      }
      this.scene.restart();
      return;
    }

    if (actionPressed("pause")) {
      this.togglePause();
    }

    this.previousGamepadButtons = padButtons;
    const clock = advanceGameplayClock(this.gameplayTime, frameDelta, {
      paused: this.paused || this.runEnded,
      hitPaused: this.pendingHitPauses > 0
    });
    this.gameplayTime = clock.time;
    if (this.paused || this.runEnded) return;
    const time = this.gameplayTime;
    const delta = clock.delta;

    if (actionPressed("light")) {
      this.requestAttack("light", time);
    }

    if (actionPressed("heavy")) {
      this.requestAttack("heavy", time);
    }

    const movement = this.getMovementInput();
    const running = this.isRunning();
    if (!this.activeAttack) {
      if (movement.x < 0) {
        this.facing = "left";
      } else if (movement.x > 0) {
        this.facing = "right";
      }
    } else {
      this.facing = this.attackFacing;
    }

    const seconds = delta / 1000;
    const speed = PLAYER_SPEED * getRageModeTuning(this.campaignState.mode, this.campaignState.modifiers).speedMultiplier * (running ? PLAYER_RUN_MULTIPLIER : 1);
    let nextPosition = clampToArena({
      x: this.playerPosition.x + movement.x * speed * seconds,
      y: this.playerPosition.y + movement.y * speed * seconds
    });
    const bossAlive = this.bullyWeirdos.some((bully) => bully.isBoss && !bully.combat.defeated);
    const bossPhase = bossAlive ? getBossRulePhase(time - this.encounterStartedAt) : undefined;
    const bossRule = bossPhase?.rule;
    const bossTuning = bossPhase ? getBossRuleTuning(bossPhase.rule, bossPhase.telegraphing) : undefined;
    if (bossTuning?.lane) nextPosition = { ...nextPosition, y: Phaser.Math.Clamp(nextPosition.y, bossTuning.lane.top, bossTuning.lane.bottom) };
    this.bossLaneGuide?.setVisible(bossRule === "lane-lock" && !bossPhase?.telegraphing).setAlpha(0.22 + Math.sin(time * 0.012) * 0.08);

    this.playerPosition = nextPosition;
    if (this.forcedPlayerAnimation && time >= this.forcedPlayerAnimation.until) this.forcedPlayerAnimation = undefined;
    if (this.forcedPlayerAnimation) this.playerAnimationState = this.forcedPlayerAnimation.state;
    else if (!this.activeAttack && time >= this.hurtUntil) this.playerAnimationState = getPlayerMotionState(movement.x !== 0 || movement.y !== 0, running);
    const bob = this.playerAnimationState === "run" ? Math.sin(time * 0.025) * 5 : this.playerAnimationState === "move" ? Math.sin(time * 0.016) * 3 : Math.sin(time * 0.004) * 1.5;
    this.player.setPosition(nextPosition.x, nextPosition.y + bob);
    this.applyPlayerAnimationPose(time);
    this.player.setScale(this.facing === "right" ? 1 : -1, 1);
    this.player.setDepth(Math.round(nextPosition.y));
    this.updateHazardCollision(time);
    this.attackLabel?.setColor(running ? "#8de0ff" : "#f5f0e8");
    this.stateLabel?.setText(`Combo ${this.comboStep + 1}/3 | ${this.playerAnimationState}`);
    const chapter = getCampaignChapter(this.campaignChapter);
    const sideReward = `${chapter.id}-side-room`;
    if (this.routePhase === "main" && this.exitOpen && nextPosition.x <= ARENA_BOUNDS.left + 42 && !this.campaignState.recoveredRewards.includes(sideReward)) {
      this.exitOpen = false;
      this.playerPosition = { ...PLAYER_SPAWN };
      this.player.setPosition(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
      this.enterSideRoom();
    }
    if (this.exitOpen && nextPosition.x >= ARENA_BOUNDS.right - 42) {
      this.exitOpen = false;
      this.playerPosition = { ...PLAYER_SPAWN };
      this.player.setPosition(PLAYER_SPAWN.x, PLAYER_SPAWN.y);
      if (this.routePhase === "main" || this.routePhase === "side") this.enterClimax();
      else this.finishChapter();
    }

    if (this.activeAttack && time >= this.attackingUntil) {
      this.activeAttack.destroy();
      this.activeAttack = undefined;
      this.attackLabel?.setText("Ready");
      const queued = consumeBufferedAttack(this.bufferedAttack);
      this.bufferedAttack = undefined;
      if (queued === "light") this.performLightAttack(time);
      if (queued === "heavy") this.performHeavyAttack(time);
      if (!queued) this.forcePlayerAnimation("recovery", time + 130);
    }

    this.updateBullyWeirdos(time, delta);
    this.updateEnemyProjectiles(time, delta);
    this.updateToyboxProps(time, delta);
    this.publishDebugState();
  }

  private createChapterWorld(width: number, height: number): void {
    this.killContainerTweens(this.chapterWorldLayer);
    this.chapterWorldLayer?.destroy(true);
    const chapter = getCampaignChapter(this.campaignChapter);
    const palette = chapter.palette;
    const routeIndex = this.routePhase === "main" ? 0 : this.routePhase === "side" ? 1 : 2;
    const world = this.add.container(0, 0).setDepth(-1000);
    const backdrop = this.add.image(width / 2, height / 2, `rageblock-bg-${chapter.id}`).setDisplaySize(width * 1.04, height * 1.04);
    this.chapterBackdrop = backdrop;
    if (this.routePhase === "side") backdrop.setFlipX(true).setTint(0xd9efff);
    world.add([
      backdrop,
      this.add.rectangle(width / 2, height / 2, width, height, palette.sky, 0.08),
      this.add.rectangle(width / 2, 390, width, 300, palette.ground, 0.1),
      this.add.rectangle(width / 2, 122, width, 5, palette.accent, 0.9),
      this.add.text(24, 128, this.routePhase === "side" ? `${chapter.route[1].label.toUpperCase()} HIDEOUT` : chapter.setting.toUpperCase(), { fontFamily: "Arial Black, Arial", fontSize: "20px", color: "#f5f0e8", stroke: "#17242b", strokeThickness: 4 }),
      this.add.text(24, 153, `${chapter.faction}  |  ${chapter.route[routeIndex].label}  |  ${this.routePhase.toUpperCase()}`, { fontFamily: "Arial", fontSize: "14px", color: "#f5f0e8", stroke: "#17242b", strokeThickness: 3 })
    ]);
    const baseScaleX = backdrop.scaleX;
    const baseScaleY = backdrop.scaleY;
    this.tweens.add({ targets: backdrop, x: width / 2 + 12, scaleX: baseScaleX * 1.015, scaleY: baseScaleY * 1.015, duration: 5200 - this.campaignChapter * 180, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.createChapterHazard(world);
    this.chapterWorldLayer = world;
  }

  private createChapterHazard(world: Phaser.GameObjects.Container): void {
    this.hazardBlueprint = getChapterHazardBlueprint(this.campaignChapter, this.routePhase);
    this.hazardActor = undefined;
    const blueprint = this.hazardBlueprint;
    if (!blueprint) return;

    const frames: Record<ChapterHazardBlueprint["kind"], number> = {
      "rolling-tire": 0,
      "flicker-sign": 1,
      "laundry-cart": 2,
      "runaway-scooter": 3,
      "parade-float": 4,
      "sweeping-antenna": 5
    };
    const sizes: Record<ChapterHazardBlueprint["kind"], { width: number; height: number }> = {
      "rolling-tire": { width: 96, height: 96 },
      "flicker-sign": { width: 112, height: 112 },
      "laundry-cart": { width: 120, height: 120 },
      "runaway-scooter": { width: 136, height: 112 },
      "parade-float": { width: 164, height: 132 },
      "sweeping-antenna": { width: 310, height: 206 }
    };
    const size = sizes[blueprint.kind];
    const hazardSprite = this.add.sprite(0, 0, "rageblock-hazards", frames[blueprint.kind]).setDisplaySize(size.width, size.height);
    const parts: Phaser.GameObjects.GameObject[] = [hazardSprite];

    const actor = this.add.container(blueprint.start.x, blueprint.start.y, parts);
    const label = this.add.text(0, blueprint.motion === "sweep" ? -42 : -48, blueprint.kind.replaceAll("-", " ").toUpperCase(), { fontFamily: "Arial Black, Arial", fontSize: "10px", color: "#f5f0e8", stroke: "#17242b", strokeThickness: 3 }).setOrigin(0.5);
    if (blueprint.motion === "sweep") world.add(label.setPosition(blueprint.start.x, blueprint.start.y - 48));
    else actor.add(label);
    world.add(actor);
    this.hazardActor = actor;

    if (blueprint.motion === "sweep") {
      this.tweens.add({ targets: actor, angle: 360, duration: blueprint.durationMs, repeat: -1, ease: "Linear" });
    } else {
      this.tweens.add({ targets: actor, x: blueprint.end.x, y: blueprint.end.y, duration: blueprint.durationMs, yoyo: true, repeat: -1, ease: blueprint.motion === "parade" ? "Sine.easeInOut" : "Quad.easeInOut" });
      if (blueprint.motion === "vertical") this.tweens.add({ targets: parts, alpha: 0.45, duration: 110, yoyo: true, repeat: -1 });
      if (blueprint.motion === "parade") this.tweens.add({ targets: actor, scaleY: 1.12, duration: 260, yoyo: true, repeat: -1 });
      if (blueprint.kind === "rolling-tire") this.tweens.add({ targets: parts, angle: 360, duration: 650, repeat: -1, ease: "Linear" });
    }
  }

  private createExitMarkers(): void {
    const exit = this.add.container(ARENA_BOUNDS.right - 28, (ARENA_BOUNDS.top + ARENA_BOUNDS.bottom) / 2);
    this.exitLabel = this.add.text(-82, 72, "", { fontFamily: "Arial Black, Arial", fontSize: "12px", color: "#f0c15c" });
    exit.add([
      this.add.rectangle(0, 0, 8, 118, 0xf0c15c, 0.8),
      this.add.triangle(-12, -48, 0, 0, 24, 14, 24, -14, 0xf0c15c, 0.9),
      this.exitLabel
    ]);
    exit.setDepth(20);
    this.sideRoomMarker = this.add.container(ARENA_BOUNDS.left + 28, (ARENA_BOUNDS.top + ARENA_BOUNDS.bottom) / 2);
    this.sideRoomMarker.add([
      this.add.rectangle(0, 0, 8, 96, 0x36d1dc, 0.7),
      this.add.triangle(12, -36, 0, 0, -22, 14, -22, -14, 0x36d1dc, 0.9),
      this.add.text(-16, 58, "SIDE ROOM", { fontFamily: "Arial Black, Arial", fontSize: "11px", color: "#36d1dc" }).setOrigin(0, 0.5)
    ]);
    this.sideRoomMarker.setDepth(20);
    this.updateExitMarkers();
  }

  private createPlayerCharacter(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 8, 70, 18, 0x000000, 0.3);
    this.playerSprite = this.add.sprite(0, -54, "rageblock-hero", 0)
      .setDisplaySize(132, 132)
      .setTint(getCosmeticTint(this.campaignState.cosmetics.at(-1) ?? "classic"));
    return this.add.container(x, y, [shadow, this.playerSprite]);
  }

  private createBullyWeirdo(
    position: Point,
    delayMs: number,
    canCharge: boolean,
    variant: BullyActor["variant"] = canCharge ? "charger" : "bully",
    isBoss = false
  ): BullyActor {
    const presentation = getEnemyPresentation(variant, isBoss);
    const body = this.add.container(position.x, position.y);
    const shadow = this.add.ellipse(0, 8, isBoss ? 108 : 66, isBoss ? 24 : 16, 0x000000, 0.26);
    const sprite = this.add.sprite(0, presentation.spriteY, isBoss ? "rageblock-boss" : "rageblock-enemies", presentation.frame);
    sprite.setDisplaySize(presentation.width, presentation.height);
    if (!isBoss) sprite.setTint(getCampaignChapter(this.campaignChapter).enemyTint);
    const factionAccessories = isBoss ? [] : this.createFactionAccessories();
    const visual = this.add.container(0, 0, [sprite, ...factionAccessories]);
    const moodLabel = this.add
      .text(0, isBoss ? -220 : -108, isBoss ? "BLOCK CAPTAIN" : "", {
        fontFamily: "Arial Black, Arial",
        fontSize: isBoss ? "13px" : "11px",
        color: isBoss ? "#ffd23f" : "#f5f0e8",
        stroke: "#17242b",
        strokeThickness: 3
      })
      .setOrigin(0.5);

    body.add([shadow, visual, moodLabel]);
    body.setDepth(Math.round(position.y));
    body.setVisible(delayMs === 0);

    const healthBar = this.add.rectangle(position.x, position.y - presentation.healthOffset, isBoss ? 118 : 56, 7, isBoss ? 0xff5f4d : variant === "heavy" ? 0xff9d4d : 0x8de0ff);
    healthBar.setVisible(delayMs === 0);

    return {
      body,
      visual,
      sprite,
      spawnAt: this.gameplayTime + delayMs,
      active: delayMs === 0,
      position,
      knockbackVelocity: { x: 0, y: 0 },
      pressure: createBullyPressureState(this.gameplayTime + delayMs, canCharge),
      combat: createBullyWeirdoState({ health: isBoss ? ENEMY_ARCHETYPES.boss.health : ENEMY_ARCHETYPES[variant].health }),
      moodLabel,
      healthBar,
      variant,
      isBoss,
      reactionUntil: 0,
      launchUntil: 0,
      landUntil: 0,
      recoveryUntil: 0,
      defeatAnimated: false,
      nextSpecialAt: this.gameplayTime + delayMs + 900,
      specialUntil: 0
    };
  }

  private createFactionAccessories(): Phaser.GameObjects.GameObject[] {
    const look = getFactionPresentation(getCampaignChapter(this.campaignChapter).id);
    const rectangle = (x: number, y: number, width: number, height: number, color = look.color) =>
      this.add.rectangle(x, y, width, height, color, 0.96).setStrokeStyle(2, look.accent, 0.95);
    const circle = (x: number, y: number, radius: number) =>
      this.add.circle(x, y, radius, look.color, 0.96).setStrokeStyle(2, look.accent, 0.95);
    const accessories: Record<FactionAccessory, () => Phaser.GameObjects.GameObject[]> = {
      headband: () => [rectangle(0, -93, 50, 8), rectangle(26, -87, 15, 7).setRotation(0.38)],
      visor: () => [rectangle(1, -92, 48, 12), rectangle(0, -92, 34, 5, look.accent)],
      cap: () => [rectangle(-2, -101, 40, 16), rectangle(19, -96, 27, 7, look.accent)],
      scarf: () => [rectangle(0, -71, 50, 9), rectangle(24, -59, 11, 27, look.accent).setRotation(-0.22)],
      ears: () => [circle(-20, -104, 11), circle(20, -104, 11), rectangle(0, -98, 38, 8, look.accent)],
      sash: () => [rectangle(0, -57, 13, 92).setRotation(-0.37), circle(17, -31, 7)]
    };
    return accessories[look.accessory]();
  }

  private createToyboxProp(kind: PropKind, position: Point): ToyboxProp {
    const presentation = getPropPresentation(kind);
    const body = this.add.container(position.x, position.y);
    const shadow = this.add.ellipse(0, 6, presentation.shadowWidth, 13, 0x000000, 0.25);
    const sprite = this.add.sprite(0, presentation.spriteY, presentation.texture, presentation.frame);
    sprite.setDisplaySize(presentation.size, presentation.size);
    body.add([shadow, sprite]);

    body.setDepth(Math.round(position.y));

    return {
      body,
      sprite,
      position,
      velocity: { x: 0, y: 0 },
      state: createPropState(kind),
      nextChainAt: 0
    };
  }

  private createSideRoomCache(): void {
    this.killContainerTweens(this.sideRoomCache?.body);
    this.sideRoomCache?.body.destroy();
    this.sideRoomCache = undefined;
    const chapter = getCampaignChapter(this.campaignChapter);
    if (this.routePhase !== "side" || this.campaignState.recoveredRewards.includes(`${chapter.id}-side-room`)) {
      this.updateExitMarkers();
      return;
    }
    const body = this.add.container(360 + this.campaignChapter * 18, 394 - (this.campaignChapter % 2) * 34).setDepth(396);
    const pad = this.add.ellipse(0, 2, 110, 34, chapter.palette.accent, 0.24).setStrokeStyle(3, 0x36d1dc, 0.85);
    const sprite = this.add.sprite(0, -39, "rageblock-props", 1).setDisplaySize(88, 88);
    const label = this.add.text(0, -98, `${chapter.route[1].label.toUpperCase()}\nCACHE 12`, {
      fontFamily: "Arial Black, Arial",
      fontSize: "11px",
      color: "#8de0ff",
      align: "center",
      stroke: "#17242b",
      strokeThickness: 3
    }).setOrigin(0.5);
    body.add([pad, sprite, label]);
    this.sideRoomCache = { body, sprite, label, state: createSideCacheState() };
    this.tweens.add({ targets: pad, alpha: 0.48, scaleX: 1.08, duration: 720, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.updateExitMarkers();
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
        phase: this.routePhase,
        replay: this.isChapterReplay,
        exitOpen: this.exitOpen,
        mode: this.campaignState.mode,
        score: this.campaignState.score,
        health: this.playerState.health,
        completed: this.campaignState.completed,
        defeated: this.combatRun.defeatedBullyWeirdos,
        routeNode: this.campaignState.routeNode,
        sideCacheHealth: this.sideRoomCache?.state.health ?? 0,
        sideRewarded: this.campaignState.recoveredRewards.includes(`${getCampaignChapter(this.campaignChapter).id}-side-room`),
        hazardX: this.hazardActor?.x ?? 0,
        hazardY: this.hazardActor?.y ?? 0,
        hazardKind: this.hazardBlueprint?.kind,
        gameplayTime: this.gameplayTime,
        backdropWidth: this.chapterBackdrop?.displayWidth ?? 0,
        hazardChainHits: this.hazardChainHits,
        bossRule: this.bullyWeirdos.some((bully) => bully.isBoss && !bully.combat.defeated) ? getBossRulePhase(this.gameplayTime - this.encounterStartedAt).rule : undefined,
        bossTelegraphing: this.bullyWeirdos.some((bully) => bully.isBoss && !bully.combat.defeated) && getBossRulePhase(this.gameplayTime - this.encounterStartedAt).telegraphing,
        enemySpecialsFired: this.enemySpecialsFired,
        hitAudioEvents: this.hitAudioEvents,
        resultRewardText: this.resultRewardText,
        hudBoundsOk: this.hasReadableHudLayout(),
        hudScoreText: this.scoreLabel?.text ?? "",
        hudActionText: this.attackLabel?.text ?? "",
        hudObjectiveText: this.objectiveLabel?.text ?? "",
        enemies: this.bullyWeirdos
          .filter((bully) => bully.active && !bully.combat.defeated)
          .map((bully) => ({ ...bully.position, health: bully.combat.health, isBoss: bully.isBoss })),
        props: this.toyboxProps.map((prop) => ({ kind: prop.state.kind, frame: Number(prop.sprite.frame.name), broken: prop.state.broken }))
      }),
      clearWave: () => {
        const alive = this.bullyWeirdos.filter((bully) => !bully.combat.defeated).length;
        for (const bully of this.bullyWeirdos) {
          bully.active = true;
          bully.body.setVisible(true);
          bully.combat = { ...bully.combat, health: 0, defeated: true };
        }
        this.combatRun = { ...this.combatRun, defeatedBullyWeirdos: this.combatRun.defeatedBullyWeirdos + alive };
        this.openExitIfCleared();
      },
      defeatPlayer: () => {
        this.damagePlayer(this.playerState.health, this.gameplayTime, "DEFEATED");
      }
    };
  }

  private resetRunState(): void {
    this.playerPosition = { ...PLAYER_SPAWN };
    this.facing = "right";
    this.comboStep = 0;
    this.playerState = createPlayerState();
    this.playerAnimationState = "idle";
    this.forcedPlayerAnimation = undefined;
    this.hurtUntil = 0;
    this.playerSprite = undefined;
    this.combatRun = createCombatRunState();
    this.attackingUntil = 0;
    this.attackStartedAt = 0;
    this.attackFacing = "right";
    this.bufferedAttack = undefined;
    this.activeAttack = undefined;
    this.damageTaken = 0;
    this.hitsLanded = 0;
    this.gameplayTime = 0;
    this.runStartedAt = 0;
    this.encounterStartedAt = 0;
    this.runEnded = false;
    this.resultOverlay = undefined;
    this.bullyWeirdos = [];
    this.toyboxProps = [];
    this.enemyProjectiles = [];
    this.enemySpecialsFired = 0;
    this.hitAudioEvents = 0;
    this.resultRewardText = "";
    this.pendingHitPauses = 0;
    this.nextPlayerDamageAt = 0;
    this.campaignState = loadCampaign(window.localStorage);
    const requestedChapter = loadStartChapter(window.localStorage, CAMPAIGN_CHAPTERS.length - 1, this.campaignState.chapterIndex);
    const start = resolveChapterStart(this.campaignState, requestedChapter);
    this.campaignChapter = start.chapterIndex;
    this.isChapterReplay = start.replay;
    this.routePhase = !this.isChapterReplay && this.campaignState.routeNode > 0 ? "climax" : "main";
    this.exitOpen = false;
    this.paused = false;
    this.pauseOverlay = undefined;
    this.chapterBackdrop = undefined;
    this.hazardActor = undefined;
    this.hazardBlueprint = undefined;
    this.nextHazardEnemyAt = 0;
    this.nextHazardPropAt = 0;
    this.hazardChainHits = 0;
    this.lastBossPhaseKey = undefined;
    this.exitLabel = undefined;
    this.sideRoomMarker = undefined;
    this.sideRoomCache = undefined;
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.playTone(this.paused ? 180 : 280, 0.07);
    this.syncSimulationTimeScale();
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

  private syncSimulationTimeScale(): void {
    const scale = this.paused ? 0 : this.pendingHitPauses > 0 ? 0.05 : 1;
    this.time.timeScale = scale;
    this.tweens.timeScale = scale;
  }

  private updateChapterLabel(): void {
    const chapter = getCampaignChapter(this.campaignChapter);
    const route = chapter.route[this.routePhase === "main" ? 0 : this.routePhase === "side" ? 1 : 2];
    this.chapterLabel?.setText(`CH ${this.campaignChapter + 1}/6 | ${chapter.title} | ${route.label}${this.isChapterReplay ? " | Replay" : ""}`);
  }

  private updateObjectiveLabel(): void {
    const chapter = getCampaignChapter(this.campaignChapter);
    const sideAvailable = !this.campaignState.recoveredRewards.includes(`${chapter.id}-side-room`);
    this.objectiveLabel?.setText(`OBJECTIVE | ${getCampaignObjective(chapter, this.routePhase, this.exitOpen, sideAvailable)}`);
  }

  private hasReadableHudLayout(): boolean {
    return hasReadableLayout(
      { x: 0, y: 0, width: this.scale.width, height: this.scale.height },
      this.hudRows.map((row) => row.map((label) => {
        const bounds = label.getBounds();
        return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
      }))
    );
  }

  private showChapterStamp(): void {
    const { width, height } = this.scale;
    const chapter = getCampaignChapter(this.campaignChapter);
    const band = this.add.rectangle(0, 0, width, 126, 0x16171d, 0.94).setStrokeStyle(3, chapter.palette.accent);
    const number = this.add.text(0, -29, `CHAPTER ${this.campaignChapter + 1} / 6  |  ${this.routePhase.toUpperCase()}`, {
      fontFamily: "Arial Black, Arial",
      fontSize: "17px",
      color: "#f0c15c"
    }).setOrigin(0.5);
    const title = this.add.text(0, 4, chapter.title.toUpperCase(), {
      fontFamily: "Arial Black, Arial",
      fontSize: "30px",
      color: "#f5f0e8"
    }).setOrigin(0.5);
    const objectiveText = this.routePhase === "main" ? chapter.objective : this.routePhase === "side" ? `Optional: open the cache and clear the hideout` : `Climax: ${chapter.route[2].label}`;
    const objective = this.add.text(0, 38, objectiveText, {
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
    const tuning = getRageModeTuning(this.campaignState.mode, this.campaignState.modifiers);
    const effectiveAttack = { ...attack, knockback: Math.round(attack.knockback * tuning.knockbackMultiplier) };
    const attackFacing = this.facing;
    const presentation = getAttackPresentation(effectiveAttack, attackFacing);
    const hitboxShape = createAttackHitbox(this.playerPosition, presentation);
    const x = hitboxShape.center.x;
    const y = hitboxShape.center.y;
    const attackDuration = Math.round(presentation.durationMs * tuning.recoveryMultiplier);

    this.activeAttack?.destroy();
    this.activeAttack = this.add.container(x, y);
    const attackFx = this.activeAttack;

    const trail = this.add
      .ellipse(0, 0, presentation.hitboxWidth, effectiveAttack.kind === "heavy" ? 30 : 16, presentation.color, 0.72)
      .setRotation(attackFacing === "right" ? -0.18 : 0.18);
    const core = this.add
      .ellipse(attackFacing === "right" ? presentation.hitboxWidth * 0.3 : -presentation.hitboxWidth * 0.3, 0, effectiveAttack.kind === "heavy" ? 28 : 18, effectiveAttack.kind === "heavy" ? 28 : 18, 0xf5f0e8, 0.9)
      .setStrokeStyle(4, presentation.color, 0.95);
    attackFx.add([trail, core]).setAlpha(0.18).setScale(0.58, 1.12);
    this.tweens.add({
      targets: attackFx,
      alpha: 0.92,
      scaleX: 1,
      scaleY: 1,
      duration: presentation.impactDelayMs,
      ease: "Cubic.easeIn"
    });
    attackFx.setDepth(Math.round(this.playerPosition.y) + 10);
    this.attackStartedAt = time;
    this.attackFacing = attackFacing;
    this.attackingUntil = time + attackDuration;
    this.attackLabel?.setText(`${presentation.label}!`);
    this.stateLabel?.setText(effectiveAttack.kind === "heavy" ? "RAGE LAUNCH" : `COMBO ${effectiveAttack.comboStep ?? 1}`);
    this.forcedPlayerAnimation = undefined;
    this.playerAnimationState = effectiveAttack.kind;
    this.time.delayedCall(presentation.impactDelayMs, () => {
      if (this.runEnded || !attackFx.active) return;
      const impactPresentation = getAttackPresentation(effectiveAttack, attackFacing);
      const impactHitbox = createAttackHitbox(this.playerPosition, impactPresentation);
      attackFx.setPosition(impactHitbox.center.x, impactHitbox.center.y).setDepth(Math.round(this.playerPosition.y) + 10);
      this.tweens.add({
        targets: attackFx,
        alpha: 0,
        scaleX: 1.3,
        scaleY: 0.65,
        duration: Math.max(60, attackDuration - presentation.impactDelayMs),
        ease: "Quad.easeOut"
      });
      this.applyAttackToBullyWeirdos(effectiveAttack, impactHitbox);
      this.applyAttackToToyboxProps({ ...effectiveAttack, knockback: Math.round(effectiveAttack.knockback * tuning.propMultiplier) }, impactHitbox);
      this.applyAttackToSideRoomCache(effectiveAttack, impactHitbox);
    });
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
        if (!bully.defeatAnimated) {
          bully.defeatAnimated = true;
          const presentation = getEnemyPresentation(bully.variant, bully.isBoss);
          bully.sprite.setFrame(presentation.reactionFrame);
          this.tweens.add({ targets: bully.body, angle: bully.isBoss ? -8 : -18, scaleY: 0.78, alpha: 0.34, duration: 260, ease: "Back.easeOut" });
          this.tweens.add({ targets: bully.visual, y: 16, duration: 220, ease: "Bounce.easeOut" });
        }
        bully.moodLabel.setVisible(false);
        bully.healthBar.setVisible(false);
        continue;
      }

      const distanceToPlayer = Phaser.Math.Distance.Between(bully.position.x, bully.position.y, this.playerPosition.x, this.playerPosition.y);
      const special = bully.isBoss ? undefined : getEnemySpecialPlan(bully.variant, distanceToPlayer, time, bully.nextSpecialAt);
      if (special) {
        bully.nextSpecialAt = time + special.cooldownMs;
        bully.specialUntil = time + special.telegraphMs;
        bully.specialKind = special.kind;
        this.showEnemyCallout(bully, ENEMY_ARCHETYPES[bully.variant].telegraph.toUpperCase(), special.kind === "throw" ? "#8de0ff" : "#ff9d4d");
        this.time.delayedCall(special.telegraphMs, () => this.executeEnemySpecial(bully, special.kind));
      }

      const archetype = bully.isBoss ? ENEMY_ARCHETYPES.boss : ENEMY_ARCHETYPES[bully.variant];
      const bossPhase = bully.isBoss ? getBossRulePhase(time - this.encounterStartedAt) : undefined;
      const bossRule = bossPhase?.rule;
      const bossTuning = bossPhase ? getBossRuleTuning(bossPhase.rule, bossPhase.telegraphing) : undefined;
      const bossPhaseKey = bossPhase ? `${bossPhase.rule}:${bossPhase.telegraphing ? "warning" : "active"}` : undefined;
      if (bully.isBoss && bossRule && bossPhaseKey !== this.lastBossPhaseKey) {
        this.lastBossPhaseKey = bossPhaseKey;
        bully.pressure = {
          ...bully.pressure,
          mood: "taunting",
          nextMoodAt: time + (bossPhase.telegraphing ? 420 : 0),
          canCharge: canBossCharge(bossRule, bossPhase.telegraphing)
        };
        const phaseCallout = `${bossPhase?.telegraphing ? "WATCH: " : ""}${getBossRuleLabel(bossRule).replace("BOSS: ", "")}`;
        this.showEnemyCallout(bully, phaseCallout, `#${bossTuning!.color.toString(16).padStart(6, "0")}`);
        this.cameras.main.shake(100, 0.003);
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
      const speedScale = archetype.approachScale * (bossTuning?.speedMultiplier ?? 1);
      const decisionVelocity = { ...decision.velocity };
      if (!bully.isBoss && bully.variant === "thrower") {
        if (distanceToPlayer < 140) {
          decisionVelocity.x *= -1;
          decisionVelocity.y *= -1;
        } else if (distanceToPlayer < 300) {
          decisionVelocity.x = 0;
          decisionVelocity.y = 0;
        }
      }
      bully.position = clampToArena({
        x: bully.position.x + (decisionVelocity.x * speedScale + bully.knockbackVelocity.x) * seconds,
        y: bully.position.y + (decisionVelocity.y * speedScale + bully.knockbackVelocity.y) * seconds
      });

      bully.body.setPosition(bully.position.x, bully.position.y);
      bully.body.setDepth(Math.round(bully.position.y));
      const presentation = getEnemyPresentation(bully.variant, bully.isBoss);
      const specialActive = time < bully.specialUntil;
      const enemyAnimationState: EnemyAnimationState = time < bully.launchUntil ? "launch"
        : time < bully.landUntil ? "land"
          : time < bully.reactionUntil ? "hurt"
            : time < bully.recoveryUntil ? "recovery"
              : specialActive || decision.mood === "charging" || decision.mood === "shoving" ? "attack"
                : Math.hypot(decisionVelocity.x, decisionVelocity.y) > 1 ? "approach" : "idle";
      const enemyPose = getEnemyAnimationPose(enemyAnimationState, time + bully.position.x);
      bully.sprite
        .setFrame(enemyPose.reactionFrame ? presentation.reactionFrame : presentation.frame)
        .setY(presentation.spriteY)
        .setRotation(0)
        .setDisplaySize(presentation.width, presentation.height);
      bully.visual
        .setY(enemyPose.yOffset)
        .setRotation(enemyPose.rotation * (decisionVelocity.x > 0 ? -1 : 1))
        .setScale((decisionVelocity.x > 0 ? -1 : 1) * enemyPose.widthScale, enemyPose.heightScale);
      const showTelegraph = specialActive || decision.mood === "charging" || decision.mood === "shoving";
      bully.moodLabel.setVisible(bully.isBoss || showTelegraph);
      bully.moodLabel.setText(bully.isBoss ? `${bossPhase?.telegraphing ? "WARNING: " : ""}${getBossRuleLabel(bossRule!)}` : specialActive ? bully.specialKind === "throw" ? "WIND-UP!" : "BRACE!" : decision.mood === "charging" ? "CHARGE!" : "SHOVE!");
      const maxHealth = archetype.health;
      bully.healthBar.setVisible(true).setPosition(bully.position.x, bully.position.y - presentation.healthOffset);
      bully.healthBar.setDisplaySize((bully.isBoss ? 118 : 56) * (bully.combat.health / maxHealth), bully.isBoss ? 7 : 5);
      bully.healthBar.setDepth(Math.round(bully.position.y) + 2);

      const contactDamage = bossTuning?.damage ?? archetype.damage;
      if (decision.damagesPlayer && contactDamage > 0 && bully.variant !== "thrower" && time >= this.nextPlayerDamageAt) {
        this.damagePlayer(contactDamage, time, bully.isBoss ? getBossRuleLabel(bossRule!).replace("BOSS: ", "") : "SHOVED!");
      }
    }
  }

  private executeEnemySpecial(bully: BullyActor, kind: EnemySpecialPlan["kind"]): void {
    if (this.runEnded || bully.combat.defeated || !this.bullyWeirdos.includes(bully)) return;
    this.enemySpecialsFired += 1;
    if (kind === "throw") {
      const start = { x: bully.position.x, y: bully.position.y - 56 };
      const dx = this.playerPosition.x - start.x;
      const dy = this.playerPosition.y - 26 - start.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const sprite = this.add.sprite(start.x, start.y, "rageblock-props", 2).setDisplaySize(38, 38).setTint(0x8de0ff).setDepth(Math.round(bully.position.y) + 4);
      this.enemyProjectiles.push({ sprite, position: start, velocity: { x: dx / length * 285, y: dy / length * 285 }, expiresAt: this.gameplayTime + 2200 });
      this.showEnemyCallout(bully, "THROW!", "#8de0ff");
      this.playTone(260, 0.08);
      return;
    }

    const ring = this.add.circle(bully.position.x, bully.position.y - 4, 36, 0xff9d4d, 0.18).setStrokeStyle(6, 0xffd23f, 0.9).setDepth(Math.round(bully.position.y) - 1);
    this.tweens.add({ targets: ring, scale: 3.2, alpha: 0, duration: 300, ease: "Quad.easeOut", onComplete: () => ring.destroy() });
    this.showEnemyCallout(bully, "SLAM!", "#ff9d4d");
    this.cameras.main.shake(110, 0.0035);
    this.playTone(74, 0.16);
    if (Phaser.Math.Distance.Between(bully.position.x, bully.position.y, this.playerPosition.x, this.playerPosition.y) <= 125 && this.gameplayTime >= this.nextPlayerDamageAt) {
      this.damagePlayer(ENEMY_ARCHETYPES.heavy.damage, this.gameplayTime, "GROUND SLAM!");
    }
  }

  private updateEnemyProjectiles(time: number, delta: number): void {
    const seconds = delta / 1000;
    const remaining: EnemyProjectile[] = [];
    for (const projectile of this.enemyProjectiles) {
      projectile.position = {
        x: projectile.position.x + projectile.velocity.x * seconds,
        y: projectile.position.y + projectile.velocity.y * seconds
      };
      projectile.sprite.setPosition(projectile.position.x, projectile.position.y).setRotation(projectile.sprite.rotation + seconds * 8);
      const hitPlayer = Phaser.Math.Distance.Between(projectile.position.x, projectile.position.y, this.playerPosition.x, this.playerPosition.y - 26) <= 30;
      const expired = time >= projectile.expiresAt || projectile.position.x < 40 || projectile.position.x > 920 || projectile.position.y < 120 || projectile.position.y > 520;
      if (hitPlayer) {
        if (time >= this.nextPlayerDamageAt) this.damagePlayer(ENEMY_ARCHETYPES.thrower.damage + 2, time, "THROWN TOY!");
        projectile.sprite.destroy();
      } else if (expired) {
        projectile.sprite.destroy();
      } else {
        remaining.push(projectile);
      }
    }
    this.enemyProjectiles = remaining;
  }

  private updateHazardCollision(time: number): void {
    if (!this.hazardActor || !this.hazardBlueprint) return;
    const actorPosition = { x: this.hazardActor.x, y: this.hazardActor.y };
    const hazardAttack: AttackOutcome = {
      kind: "heavy",
      comboStep: null,
      damage: Math.max(4, this.hazardBlueprint.damage - 2),
      knockback: 220,
      launch: true,
      empowered: false,
      rageGain: 0,
      nextComboStep: 0
    };

    if (time >= this.nextHazardPropAt) {
      const prop = this.toyboxProps.find((candidate) => !candidate.state.broken && isPointInsideHazard(this.hazardBlueprint!, actorPosition, this.hazardActor!.rotation, candidate.position, 20));
      if (prop) {
        const facing: FacingDirection = prop.position.x >= actorPosition.x ? "right" : "left";
        const reaction = applyAttackToProp(prop.state, hazardAttack, facing);
        prop.state = reaction.state;
        prop.velocity = { ...reaction.velocity, y: Math.min(-140, reaction.velocity.y) };
        this.nextHazardPropAt = time + 600;
        this.hazardChainHits += 1;
        this.spawnHitSparks(prop.position, 6, 0xffd23f);
      }
    }

    if (time >= this.nextHazardEnemyAt) {
      const target = this.bullyWeirdos.find((bully) => bully.active && !bully.combat.defeated && isPointInsideHazard(this.hazardBlueprint!, actorPosition, this.hazardActor!.rotation, bully.position, bully.isBoss ? 28 : 18));
      if (target) {
        const result = applyAttackToBullyWeirdo(this.combatRun, target.combat, hazardAttack);
        this.combatRun = result.run;
        target.combat = result.bully;
        target.knockbackVelocity = getKnockbackVelocity(hazardAttack.knockback, target.position.x >= actorPosition.x ? "right" : "left", true);
        target.launchUntil = time + 210;
        target.landUntil = time + 360;
        target.recoveryUntil = time + 510;
        const maxHealth = target.isBoss ? ENEMY_ARCHETYPES.boss.health : ENEMY_ARCHETYPES[target.variant].health;
        target.healthBar.setDisplaySize((target.isBoss ? 96 : 48) * (target.combat.health / maxHealth), target.isBoss ? 7 : 5);
        this.showEnemyCallout(target, "HAZARD!", "#ffd23f");
        this.nextHazardEnemyAt = time + 700;
        this.hazardChainHits += 1;
        if (target.combat.defeated) this.recordEnemyDefeat(target, 200);
        this.updateRunLabels();
        this.openExitIfCleared();
      }
    }

    if (time < this.nextPlayerDamageAt || !isPointInsideHazard(this.hazardBlueprint, actorPosition, this.hazardActor.rotation, this.playerPosition, 18)) return;
    this.damagePlayer(this.hazardBlueprint.damage, time, this.hazardBlueprint.kind.replaceAll("-", " ").toUpperCase());
    this.playerPosition = clampToArena({ x: this.playerPosition.x - (this.hazardActor.x < this.playerPosition.x ? -48 : 48), y: this.playerPosition.y + 18 });
  }

  private damagePlayer(amount: number, time: number, callout: string): void {
    if (this.runEnded) return;
    this.playerState = { ...this.playerState, health: Math.max(0, this.playerState.health - amount) };
    this.damageTaken += amount;
    this.nextPlayerDamageAt = time + PLAYER_DAMAGE_COOLDOWN_MS;
    this.hurtUntil = time + 540;
    this.forcePlayerAnimation("hurt", time + 90);
    this.time.delayedCall(90, () => {
      if (!this.runEnded) this.forcePlayerAnimation("launch", this.gameplayTime + 160);
    });
    this.time.delayedCall(250, () => {
      if (!this.runEnded) this.forcePlayerAnimation("land", this.gameplayTime + 120);
    });
    this.time.delayedCall(370, () => {
      if (!this.runEnded) this.forcePlayerAnimation("recovery", this.gameplayTime + 170);
    });
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
    const defeated = this.bullyWeirdos.filter((bully) => bully.combat.defeated).length;
    this.defeatLabel?.setText(boss ? `BLOCK CAPTAIN ${boss.combat.health}/${ENEMY_ARCHETYPES.boss.health}` : `Wave ${defeated}/${this.bullyWeirdos.length}`);
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
      prop.sprite.setFrame(getPropFrame(prop.state.kind, actionFrame));

      if (time >= prop.nextChainAt) {
        const target = this.bullyWeirdos.find((bully) => bully.active && !bully.combat.defeated && isChainReactionImpact(prop.position, prop.velocity, bully.position));
        if (target) {
          const rageBefore = this.combatRun.rage;
          const chainAttack: AttackOutcome = { kind: "light", comboStep: null, damage: 4, knockback: 180, launch: false, empowered: false, rageGain: 12, nextComboStep: 0 };
          const result = applyAttackToBullyWeirdo(this.combatRun, target.combat, chainAttack);
          this.combatRun = result.run;
          target.combat = result.bully;
          target.knockbackVelocity = getKnockbackVelocity(chainAttack.knockback, prop.velocity.x < 0 ? "left" : "right", false);
          target.reactionUntil = time + 190;
          target.recoveryUntil = time + 310;
          const maxHealth = target.isBoss ? ENEMY_ARCHETYPES.boss.health : ENEMY_ARCHETYPES[target.variant].health;
          target.healthBar.setDisplaySize((target.isBoss ? 96 : 48) * (target.combat.health / maxHealth), target.isBoss ? 7 : 5);
          this.showEnemyCallout(target, "CHAIN!", "#ffd23f");
          prop.nextChainAt = time + 500;
          prop.velocity = { x: -prop.velocity.x * 0.35, y: -120 };
          this.spawnHitSparks(target.position, 5, 0xffd23f);
          if (target.combat.defeated) this.recordEnemyDefeat(target, 250);
          this.syncPlayerRage(rageBefore);
          this.updateRunLabels();
          this.openExitIfCleared();
        }
      }
    }
  }

  private showEnemyCallout(bully: BullyActor, label: string, color: string): void {
    const callout = this.add.text(bully.position.x, bully.position.y - getEnemyPresentation(bully.variant, bully.isBoss).healthOffset - 12, label, {
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
    const rageBefore = this.combatRun.rage;
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
      bully.reactionUntil = this.gameplayTime + 190;
      if (attack.launch) {
        bully.launchUntil = this.gameplayTime + 210;
        bully.landUntil = this.gameplayTime + 360;
        bully.recoveryUntil = this.gameplayTime + 510;
      } else {
        bully.recoveryUntil = this.gameplayTime + 310;
      }
      this.showEnemyCallout(bully, attack.launch ? "LAUNCHED!" : "POW!", attack.kind === "heavy" ? "#ff6b35" : "#f5f0e8");
      const maxHealth = bully.isBoss ? ENEMY_ARCHETYPES.boss.health : ENEMY_ARCHETYPES[bully.variant].health;
      bully.healthBar.setDisplaySize((bully.isBoss ? 96 : 48) * (bully.combat.health / maxHealth), bully.isBoss ? 7 : 5);
      this.playHitFeedback(attack, bully);

      if (bully.combat.defeated) {
        this.recordEnemyDefeat(bully);
      }
    }

    this.syncPlayerRage(rageBefore);
    this.updateRunLabels();
    this.openExitIfCleared();
  }

  private syncPlayerRage(rageBefore: number): void {
    this.playerState = { ...this.playerState, rage: this.combatRun.rage };
    if (rageBefore < 100 && this.combatRun.rage >= 100) this.activateRage(this.gameplayTime);
  }

  private recordEnemyDefeat(bully: BullyActor, points = 100): void {
    this.campaignState = recordDefeat(this.campaignState, points);
    this.restoreFightHealth(bully.isBoss ? 20 : 6);
    saveCampaign(window.localStorage, this.campaignState);
    this.updatePresentationLabels();
    bully.body.setAlpha(0.35);
    bully.healthBar.setAlpha(0.25);
  }

  private openExitIfCleared(): void {
    if (this.bullyWeirdos.length === 0 || this.bullyWeirdos.some((bully) => !bully.combat.defeated) || (this.routePhase === "side" && !this.sideRoomCache?.state.opened) || this.exitOpen) return;
    this.exitOpen = true;
    this.attackLabel?.setText(this.routePhase === "main" ? "ROUTE OPEN" : this.routePhase === "side" ? "SIDE CLEAR" : this.campaignChapter === 5 ? "CAPTAIN DOWN" : "BLOCK CLEAR");
    this.updateObjectiveLabel();
    this.updateExitMarkers();
    this.playTone(this.campaignChapter === 5 && this.routePhase === "climax" ? 72 : 520, this.campaignChapter === 5 && this.routePhase === "climax" ? 0.45 : 0.2);
  }

  private enterSideRoom(): void {
    this.restoreFightHealth(24);
    this.routePhase = "side";
    this.rebuildEncounter("OPTIONAL SIDE ROOM");
  }

  private enterClimax(): void {
    if (!this.isChapterReplay) this.campaignState = advanceRouteNode(this.campaignState);
    saveCampaign(window.localStorage, this.campaignState);
    this.restoreFightHealth(100);
    this.routePhase = "climax";
    this.rebuildEncounter("CLIMAX OPEN");
  }

  private finishChapter(): void {
    this.restoreFightHealth(100);
    this.campaignState = completeChapter(this.campaignState, this.campaignChapter);
    saveCampaign(window.localStorage, this.campaignState);
    this.updatePresentationLabels();
    this.playerSprite?.setTint(getCosmeticTint(this.campaignState.cosmetics.at(-1) ?? "classic"));
    if (this.isChapterReplay) {
      this.endRun("Block Replayed");
      return;
    }
    if (this.campaignChapter >= CAMPAIGN_CHAPTERS.length - 1) {
      this.endRun("Remote Recovered");
      return;
    }
    this.campaignChapter = this.campaignState.chapterIndex;
    saveStartChapter(window.localStorage, this.campaignChapter);
    this.routePhase = "main";
    this.rebuildEncounter("NEW BLOCK");
  }

  private rebuildEncounter(label: string): void {
    this.destroyEncounterActors();
    this.createChapterWorld(this.scale.width, this.scale.height);
    this.exitOpen = false;
    this.createSideRoomCache();
    this.combatRun = { ...this.combatRun, defeatedBullyWeirdos: 0 };
    this.lastBossPhaseKey = undefined;
    this.spawnChapterWave();
    this.spawnChapterProps();
    this.updateExitMarkers();
    this.updateChapterLabel();
    this.updateObjectiveLabel();
    this.updatePresentationLabels();
    this.updateRunLabels();
    this.attackLabel?.setText(label);
    this.showChapterStamp();
    this.playTone(440, 0.16);
    this.flashTarget(this.player, 0xf0c15c, 220);
    this.time.delayedCall(1100, () => {
      if (!this.exitOpen && !this.runEnded) this.attackLabel?.setText("Ready");
    });
  }

  private spawnChapterWave(): void {
    this.encounterStartedAt = this.gameplayTime;
    this.bullyWeirdos = getChapterWaveBlueprint(this.campaignChapter, this.routePhase)
      .map((entry) => this.createBullyWeirdo(entry.position, entry.delayMs, entry.canCharge, entry.variant === "boss" ? "heavy" : entry.variant, entry.variant === "boss"));
    this.bossLaneGuide?.destroy();
    this.bossLaneGuide = this.campaignChapter === 5 && this.routePhase === "climax"
      ? this.add.rectangle((ARENA_BOUNDS.left + ARENA_BOUNDS.right) / 2, 385, ARENA_BOUNDS.right - ARENA_BOUNDS.left, 80, 0xd83b87, 0.18).setStrokeStyle(4, 0xffd23f, 0.85).setDepth(10).setVisible(false)
      : undefined;
  }

  private spawnChapterProps(): void {
    this.toyboxProps = getChapterPropBlueprint(this.campaignChapter, this.routePhase)
      .map((entry) => this.createToyboxProp(entry.kind, entry.position));
  }

  private destroyEncounterActors(): void {
    for (const bully of this.bullyWeirdos) {
      bully.body.destroy();
      bully.healthBar.destroy();
    }
    for (const prop of this.toyboxProps) prop.body.destroy();
    for (const projectile of this.enemyProjectiles) projectile.sprite.destroy();
    this.killContainerTweens(this.sideRoomCache?.body);
    this.sideRoomCache?.body.destroy();
    this.sideRoomCache = undefined;
    this.bullyWeirdos = [];
    this.toyboxProps = [];
    this.enemyProjectiles = [];
    this.bossLaneGuide?.destroy();
    this.bossLaneGuide = undefined;
  }

  private updateExitMarkers(): void {
    const chapter = getCampaignChapter(this.campaignChapter);
    const sideReward = `${chapter.id}-side-room`;
    this.exitLabel?.setText(this.routePhase === "main" ? "CLIMAX" : this.routePhase === "side" ? "RETURN" : this.campaignChapter === 5 ? "REMOTE" : "NEXT BLOCK");
    this.sideRoomMarker?.setVisible(this.routePhase === "main" && this.exitOpen && !this.campaignState.recoveredRewards.includes(sideReward));
  }

  private forcePlayerAnimation(state: PlayerAnimationState, until: number): void {
    this.forcedPlayerAnimation = { state, until };
    this.playerAnimationState = state;
  }

  private restoreFightHealth(amount: number): void {
    const previousHealth = this.playerState.health;
    this.playerState = recoverPlayerHealth(this.playerState, amount);
    if (this.playerState.health === previousHealth) return;
    this.updateHealthLabel();
    this.spawnHitSparks({ x: this.playerPosition.x, y: this.playerPosition.y - 48 }, 4, 0x79e08f);
  }

  private applyPlayerAnimationPose(time: number): void {
    if (!this.playerSprite || !this.player) return;
    const animationTime = this.playerAnimationState === "light" || this.playerAnimationState === "heavy"
      ? Math.max(0, time - this.attackStartedAt)
      : time;
    const pose = getPlayerAnimationPose(this.playerAnimationState, animationTime);
    this.playerSprite.setFrame(pose.frame).setY(pose.y).setDisplaySize(132 * pose.widthScale, 132 * pose.heightScale);
    this.player.setRotation(pose.rotation * (this.facing === "right" ? 1 : -1));
  }

  private killContainerTweens(container: Phaser.GameObjects.Container | undefined): void {
    if (!container) return;
    const targets: Phaser.GameObjects.GameObject[] = [container];
    const collect = (current: Phaser.GameObjects.Container) => {
      for (const child of current.list) {
        targets.push(child);
        if (child instanceof Phaser.GameObjects.Container) collect(child);
      }
    };
    collect(container);
    this.tweens.killTweensOf(targets);
  }

  private activateRage(time: number): void {
    this.forcePlayerAnimation("rage", time + 420);
    this.stateLabel?.setText("RAGE READY!");
    this.playTone(340, 0.2);
    if (!this.player) return;
    const aura = this.add.circle(this.playerPosition.x, this.playerPosition.y - 48, 26, 0xffd23f, 0.35).setStrokeStyle(5, 0xff5f4d, 0.9).setDepth(this.player.depth - 1);
    this.tweens.add({ targets: aura, scale: 3.4, alpha: 0, duration: 420, ease: "Quad.easeOut", onComplete: () => aura.destroy() });
    this.flashTarget(this.player, 0xffd23f, 300);
  }

  private endRun(title: "Remote Recovered" | "Block Replayed" | "Knocked Out"): void {
    if (this.runEnded) {
      return;
    }

    this.runEnded = true;
    const success = title !== "Knocked Out";
    this.playTone(success ? 660 : 58, success ? 0.34 : 0.42);
    this.forcedPlayerAnimation = undefined;
    this.playerAnimationState = success ? "victory" : "defeated";
    this.applyPlayerAnimationPose(this.gameplayTime);
    this.animateRunEnd(success);
    this.stateLabel?.setText(success ? "VICTORY" : "DEFEATED");
    this.attackLabel?.setText(title === "Remote Recovered" ? "CAMPAIGN CLEAR" : title === "Block Replayed" ? "REPLAY CLEAR" : "RETRY READY");
    const elapsedSeconds = Math.max(0, Math.round((this.gameplayTime - this.runStartedAt) / 1000));
    this.resultRewardText = success ? formatUnlockName(getCampaignChapter(this.campaignChapter).reward) : "";
    const { width, height } = this.scale;
    const panel = this.add.rectangle(0, 0, 500, 350, 0x16171d, 0.95).setStrokeStyle(4, 0xf0c15c);
    const heading = this.add.text(0, -132, title, {
      fontFamily: "Arial, sans-serif",
      fontSize: "34px",
      color: success ? "#f0c15c" : "#ff5f4d"
    }).setOrigin(0.5);
    const stats = this.add.text(0, 18, [
      `Time ${elapsedSeconds}s`,
      `Hits Landed ${this.hitsLanded}`,
      `Damage Taken ${this.damageTaken}`,
      `Score ${this.campaignState.score}`,
      `Rank ${getCampaignRank(this.campaignState.score)}`,
      `Remote ${this.campaignState.mode.toUpperCase()}`,
      success ? `Recovered ${this.resultRewardText}` : `Checkpoint Chapter ${this.campaignChapter + 1}`,
      success ? `Look ${formatUnlockName(this.campaignState.cosmetics.at(-1) ?? "classic")}` : "Keep your rewards",
      success ? `Modifier ${formatUnlockName(this.campaignState.modifiers.at(-1) ?? "rage-ready")}` : "",
      "",
      title === "Remote Recovered" ? "R Replay Campaign   T Title" : title === "Block Replayed" ? "R Replay Block   T Title" : "R Retry Checkpoint   T Title"
    ], {
      fontFamily: "Arial, sans-serif",
      fontSize: "19px",
      color: "#f5f0e8",
      align: "center"
    }).setOrigin(0.5);

    this.resultOverlay = this.add.container(width / 2, height / 2, [panel, heading, stats]);
    this.resultOverlay.setDepth(5000).setAlpha(0).setScale(0.84);
    this.tweens.add({ targets: this.resultOverlay, alpha: 1, scale: 1, duration: 320, ease: "Back.easeOut" });
  }

  private animateRunEnd(success: boolean): void {
    if (!this.player) return;
    if (success) {
      this.tweens.add({
        targets: this.player,
        y: this.player.y - 12,
        rotation: (this.facing === "right" ? -1 : 1) * 0.08,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      return;
    }
    this.tweens.add({
      targets: this.player,
      y: this.player.y + 18,
      rotation: (this.facing === "right" ? -1 : 1) * 1.32,
      scaleY: 0.84,
      duration: 340,
      ease: "Bounce.easeOut"
    });
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
        prop.sprite.setFrame(getPropFrame(prop.state.kind, true));
        this.squashTarget(prop.body, 1.35, 0.6, 120);
      } else {
        this.squashTarget(prop.body, 1.16, 0.82, 90);
      }
    }
  }

  private applyAttackToSideRoomCache(attack: AttackOutcome, hitboxShape: ReturnType<typeof createAttackHitbox>): void {
    const cache = this.sideRoomCache;
    if (!cache || cache.state.opened || !isPointInsideHitbox({ x: cache.body.x, y: cache.body.y - 36 }, hitboxShape)) return;
    const result = applyHitToSideCache(cache.state, attack.damage);
    cache.state = result.state;
    cache.label.setText(result.openedNow ? "CACHE OPEN!\n+250" : `KEEP HITTING\nCACHE ${cache.state.health}`);
    this.squashTarget(cache.body, 1.18, 0.78, 120);
    this.spawnHitSparks({ x: cache.body.x, y: cache.body.y - 42 }, result.openedNow ? 8 : 4, 0x36d1dc);
    if (!result.openedNow) return;
    const chapter = getCampaignChapter(this.campaignChapter);
    this.campaignState = completeSideRoom(this.campaignState, `${chapter.id}-side-room`);
    saveCampaign(window.localStorage, this.campaignState);
    cache.sprite.setFrame(4);
    this.sideRoomMarker?.setVisible(false);
    this.attackLabel?.setText("SIDE CACHE +250");
    this.updatePresentationLabels();
    this.playTone(560, 0.2);
    this.tweens.add({ targets: cache.body, alpha: 0.42, duration: 500, delay: 350 });
    this.openExitIfCleared();
  }

  private playHitFeedback(attack: AttackOutcome, bully: BullyActor): void {
    const feedback = getHitFeedback(attack);
    const impact = {
      x: (this.playerPosition.x + bully.position.x) / 2,
      y: bully.position.y - 42
    };

    this.pendingHitPauses += 1;
    this.hitAudioEvents += 1;
    this.playTone(attack.kind === "heavy" ? 72 : 178, attack.kind === "heavy" ? 0.12 : 0.07);
    this.syncSimulationTimeScale();
    this.time.delayedCall(feedback.hitPauseMs * 0.05, () => {
      this.pendingHitPauses = Math.max(0, this.pendingHitPauses - 1);
      this.syncSimulationTimeScale();
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
