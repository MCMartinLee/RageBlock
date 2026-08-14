export type BossRule = "pressure" | "charge" | "lane-lock";

export function getBossRule(elapsedMs: number): BossRule {
  const phase = Math.floor(elapsedMs / 1800) % 3;
  return phase === 0 ? "pressure" : phase === 1 ? "charge" : "lane-lock";
}

export function getBossRuleLabel(rule: BossRule): string {
  return rule === "pressure" ? "BOSS: PRESSURE" : rule === "charge" ? "BOSS: CHARGE" : "BOSS: LANE LOCK";
}
