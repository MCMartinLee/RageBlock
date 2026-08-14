import { describe, expect, it } from "vitest";
import { getLightComboAttack, spendRageOnHeavyAttack, createPlayerState } from "./combatRules";
import { applyAttackToProp, createPropState } from "./propReaction";

describe("toybox prop reactions", () => {
  it("knocks props in the player's facing direction", () => {
    const reaction = applyAttackToProp(createPropState("cone"), getLightComboAttack(0), "right");

    expect(reaction.velocity.x).toBeGreaterThan(0);
    expect(reaction.state.hitCount).toBe(1);
  });

  it("breaks non-ball props with heavy attacks", () => {
    const heavy = spendRageOnHeavyAttack(createPlayerState()).attack;
    const reaction = applyAttackToProp(createPropState("trash-can"), heavy, "left");

    expect(reaction.breaksNow).toBe(true);
    expect(reaction.state.broken).toBe(true);
    expect(reaction.velocity.x).toBeLessThan(0);
  });

  it("makes the ball bounce instead of breaking", () => {
    const heavy = spendRageOnHeavyAttack(createPlayerState({ rage: 100 })).attack;
    const reaction = applyAttackToProp(createPropState("ball"), heavy, "right");

    expect(reaction.state.broken).toBe(false);
    expect(reaction.velocity.y).toBeLessThan(0);
  });
});
