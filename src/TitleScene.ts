import Phaser from "phaser";
import { GAME_SCENE_KEY } from "./prototype/prototypeDefinition";
import { loadCampaign, loadSelectedMode, loadStartChapter, saveCampaign, saveSelectedMode, saveStartChapter } from "./campaignPersistence";
import { CAMPAIGN_CHAPTERS, CAMPAIGN_CHAPTER_IDS } from "./campaignDefinition";
import { prepareCampaignStart, resolveChapterStart, type CampaignState, type RageMode } from "./campaignRuntime";
import { getTitleGamepadNavigation } from "./prototype/inputActions";
import { hasReadableLayout } from "./prototype/layoutGeometry";
import { formatUnlockName } from "./displayText";

export const TITLE_SCENE_KEY = "rageblock-title";

export class TitleScene extends Phaser.Scene {
  private selectedMode: RageMode = "crash";
  private selectedChapter = 0;
  private campaignState?: CampaignState;
  private modeText?: Phaser.GameObjects.Text;
  private chapterText?: Phaser.GameObjects.Text;
  private unlockText?: Phaser.GameObjects.Text;
  private previousGamepadButtons: boolean[] = [];
  private layoutRows: Phaser.GameObjects.Text[][] = [];
  private starting = false;
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
    this.load.spritesheet("rageblock-boss", "assets/art/rageblock-boss-atlas.png", {
      frameWidth: 512,
      frameHeight: 512
    });
    this.load.spritesheet("rageblock-props", "assets/art/rageblock-prop-atlas.png", {
      frameWidth: 256,
      frameHeight: 256
    });
    this.load.spritesheet("rageblock-hazards", "assets/art/rageblock-hazard-atlas.png", {
      frameWidth: 256,
      frameHeight: 256
    });
    for (const chapter of CAMPAIGN_CHAPTER_IDS) {
      this.load.image(`rageblock-bg-${chapter}`, `assets/art/backgrounds/rageblock-${chapter}-background.png`);
    }
  }

  create(): void {
    const { width, height } = this.scale;
    window.__RAGEBLOCK__ = undefined;
    window.__RAGEBLOCK_TITLE_LAYOUT_OK__ = false;
    this.previousGamepadButtons = [];
    this.starting = false;
    this.campaignState = loadCampaign(window.localStorage);
    this.selectedMode = loadSelectedMode(window.localStorage);
    const requestedChapter = loadStartChapter(window.localStorage, CAMPAIGN_CHAPTERS.length - 1, this.campaignState.chapterIndex);
    this.selectedChapter = resolveChapterStart(this.campaignState, requestedChapter).chapterIndex;
    const keyArt = this.add.image(width / 2, height / 2, "rageblock-key-art").setDisplaySize(width, height).setAlpha(0.78);
    const keyArtScale = { x: keyArt.scaleX, y: keyArt.scaleY };
    this.tweens.add({
      targets: keyArt,
      x: width / 2 + 5,
      scaleX: keyArtScale.x * 1.018,
      scaleY: keyArtScale.y * 1.018,
      duration: 4200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.add.rectangle(width / 2, height / 2, width, height, 0x16171d, 0.52);
    this.add.rectangle(width / 2, height * 0.76, width, height * 0.34, 0x16171d, 0.84);
    this.add.rectangle(width / 2, height * 0.5, width * 0.72, 12, 0xf0c15c, 0.8);
    const title = this.add.text(width / 2, 92, "RAGEBLOCK", { fontFamily: "Arial Black, Arial", fontSize: "68px", color: "#f5f0e8", stroke: "#7a3bd1", strokeThickness: 10 }).setOrigin(0.5).setAlpha(0);
    const premise = this.add.text(width / 2, 190, "Recover the Rage Remote before sunset. Take back every block.", { fontFamily: "Arial", fontSize: "18px", color: "#f0c15c" }).setOrigin(0.5).setAlpha(0);
    const startButton = this.add.rectangle(width / 2, 372, 420, 62, 0x7a3bd1).setStrokeStyle(3, 0xf5f0e8).setInteractive({ useHandCursor: true });
    const startLabel = this.add.text(width / 2, 372, "START BLOCK", { fontFamily: "Arial Black, Arial", fontSize: "19px", color: "#f5f0e8" }).setOrigin(0.5);
    const controls = this.add.text(width / 2, 462, "WASD / LEFT STICK     J / A     K / B     SPACE / RT", { fontFamily: "Arial Black, Arial", fontSize: "14px", color: "#d8d5c9" }).setOrigin(0.5);
    const controlLabels = this.add.text(width / 2, 490, "MOVE                 COMBO     LAUNCH     RUN", { fontFamily: "Arial", fontSize: "11px", color: "#8de0ff" }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 112, alpha: 1, duration: 520, ease: "Back.easeOut" });
    this.tweens.add({ targets: premise, alpha: 1, duration: 420, delay: 180, ease: "Quad.easeOut" });
    this.tweens.add({ targets: startButton, alpha: 0.72, duration: 760, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.modeText = this.add.text(width / 2, 250, "", { fontFamily: "Arial Black, Arial", fontSize: "15px", color: "#bca7ff" }).setOrigin(0.5);
    this.chapterText = this.add.text(width / 2, 286, "", { fontFamily: "Arial Black, Arial", fontSize: "17px", color: "#f0c15c" }).setOrigin(0.5);
    this.unlockText = this.add.text(width / 2, 320, "", { fontFamily: "Arial", fontSize: "13px", color: "#d8d5c9" }).setOrigin(0.5);
    this.layoutRows = [[title], [premise], [this.modeText], [this.chapterText], [this.unlockText], [startLabel], [controls], [controlLabels]];
    this.selectMode(this.selectedMode);
    this.selectChapter(this.selectedChapter);
    this.input.keyboard?.on("keydown-ONE", () => this.selectMode("crash"));
    this.input.keyboard?.on("keydown-TWO", () => this.selectMode("zip"));
    this.input.keyboard?.on("keydown-THREE", () => this.selectMode("junkstorm"));
    this.input.keyboard?.on("keydown-Q", () => this.cycleChapter(-1));
    this.input.keyboard?.on("keydown-E", () => this.cycleChapter(1));
    this.input.keyboard?.once("keydown-ENTER", () => this.startGame());
    startButton.once("pointerdown", () => this.startGame());
    this.publishLayoutState();
    window.__RAGEBLOCK_TITLE_READY__ = true;
  }

  update(): void {
    const pad = this.input.gamepad?.getPad(0);
    const buttons = pad ? Array.from({ length: 16 }, (_, index) => Boolean(pad.buttons[index]?.pressed)) : [];
    const navigation = getTitleGamepadNavigation(buttons, this.previousGamepadButtons);
    if (navigation.modeDelta !== 0) this.cycleMode(navigation.modeDelta);
    if (navigation.chapterDelta !== 0) this.cycleChapter(navigation.chapterDelta);
    if (navigation.start) this.startGame();
    this.previousGamepadButtons = buttons;
  }

  private startGame(): void {
    if (this.starting) return;
    this.starting = true;
    window.__RAGEBLOCK_TITLE_READY__ = false;
    if (this.campaignState) {
      this.campaignState = prepareCampaignStart(this.campaignState, this.selectedChapter);
      saveCampaign(window.localStorage, this.campaignState);
    }
    saveSelectedMode(window.localStorage, this.selectedMode);
    saveStartChapter(window.localStorage, this.selectedChapter);
    this.cameras.main.fadeOut(200, 22, 23, 29);
    this.time.delayedCall(220, () => this.scene.start(GAME_SCENE_KEY));
  }

  private selectMode(mode: RageMode): void {
    this.selectedMode = mode;
    this.modeText?.setText(`1/2/3 OR LB/RB:  CRASH  |  ZIP  |  JUNKSTORM    ${mode.toUpperCase()} SELECTED`);
    this.publishLayoutState();
  }

  private cycleMode(delta: -1 | 1): void {
    const modes: RageMode[] = ["crash", "zip", "junkstorm"];
    const index = (modes.indexOf(this.selectedMode) + delta + modes.length) % modes.length;
    this.selectMode(modes[index]);
  }

  private cycleChapter(delta: -1 | 1): void {
    const unlocked = this.campaignState?.unlockedChapters ?? [0];
    const index = unlocked.indexOf(this.selectedChapter);
    this.selectChapter(unlocked[(Math.max(0, index) + delta + unlocked.length) % unlocked.length]);
  }

  private selectChapter(chapterIndex: number): void {
    this.selectedChapter = chapterIndex;
    const chapter = CAMPAIGN_CHAPTERS[chapterIndex];
    const replay = Boolean(this.campaignState && resolveChapterStart(this.campaignState, chapterIndex).replay);
    const freshCampaign = Boolean(this.campaignState?.completed && chapterIndex === 0);
    this.chapterText?.setText(`Q / DPAD  <  CHAPTER ${chapterIndex + 1}: ${chapter.title.toUpperCase()}  >  E / DPAD${freshCampaign ? "  |  FRESH CAMPAIGN" : replay ? "  |  REPLAY" : ""}`);
    const cosmetics = this.campaignState?.cosmetics ?? ["classic"];
    const equippedLook = formatUnlockName(cosmetics.at(-1) ?? "classic").toUpperCase();
    const masteryCount = this.campaignState?.modifiers.filter((modifier) => modifier.endsWith("-mastery")).length ?? 0;
    this.unlockText?.setText(`${this.campaignState?.unlockedChapters.length ?? 1}/6 blocks open   |   Mastery ${masteryCount}/6   |   Look: ${equippedLook}   |   Best ${this.campaignState?.bestScore ?? 0}`);
    this.publishLayoutState();
  }

  private publishLayoutState(): void {
    window.__RAGEBLOCK_TITLE_LAYOUT_OK__ = hasReadableLayout(
      { x: 0, y: 0, width: this.scale.width, height: this.scale.height },
      this.layoutRows.map((row) => row.map((label) => {
        const bounds = label.getBounds();
        return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
      }))
    );
  }
}
