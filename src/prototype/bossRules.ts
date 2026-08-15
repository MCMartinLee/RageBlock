export type BossRule = "pressure" | "charge" | "lane-lock";
export type BossRuleTuning = {
  speedMultiplier: number;
  damage: number;
  lane?: { top: number; bottom: number };
  color: number;
};

export type BossRulePhase = { rule: BossRule; telegraphing: boolean };

const BOSS_PHASE_MS = 2200;
const BOSS_TELEGRAPH_MS = 420;

export function getBossRule(elapsedMs: number): BossRule {
  return getBossRulePhase(elapsedMs).rule;
}

export function getBossRulePhase(elapsedMs: number): BossRulePhase {
  const safeElapsed = Math.max(0, elapsedMs);
  const phase = Math.floor(safeElapsed / BOSS_PHASE_MS) % 3;
  const telegraphing = safeElapsed % BOSS_PHASE_MS < BOSS_TELEGRAPH_MS;
  const rule = phase === 0 ? "pressure" : phase === 1 ? "charge" : "lane-lock";
  return { rule, telegraphing };
}

export function getBossRuleLabel(rule: BossRule): string {
  return rule === "pressure" ? "BOSS: PRESSURE" : rule === "charge" ? "BOSS: CHARGE" : "BOSS: LANE LOCK";
}

export function canBossCharge(rule: BossRule, telegraphing: boolean): boolean {
  return rule === "charge" && !telegraphing;
}

export function getBossRuleTuning(rule: BossRule, telegraphing = false): BossRuleTuning {
  const active = rule === "charge"
    ? { speedMultiplier: 1.9, damage: 8, color: 0xff5f4d }
    : rule === "lane-lock"
      ? { speedMultiplier: 0.82, damage: 3, lane: { top: 345, bottom: 425 }, color: 0xd83b87 }
      : { speedMultiplier: 1.2, damage: 5, color: 0xffd23f };
  return telegraphing ? { speedMultiplier: 0.2, damage: 0, color: active.color } : active;
}
