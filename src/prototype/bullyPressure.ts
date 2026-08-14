import type { Point } from "./arenaDefinition";

export type BullyMood = "taunting" | "approaching" | "shoving" | "backing-off" | "charging";

export type BullyPressureState = {
  mood: BullyMood;
  nextMoodAt: number;
  canCharge: boolean;
};

export type BullyPressureDecision = {
  mood: BullyMood;
  velocity: Point;
  damagesPlayer: boolean;
};

const APPROACH_RANGE = 96;
const SHOVE_RANGE = 56;
const WALK_SPEED = 92;
const BACK_OFF_SPEED = 115;
const CHARGE_SPEED = 210;

export function createBullyPressureState(
  now: number,
  canCharge = false
): BullyPressureState {
  return {
    mood: "taunting",
    nextMoodAt: now + 700,
    canCharge
  };
}

export function updateBullyPressure(
  state: BullyPressureState,
  bullyPosition: Point,
  playerPosition: Point,
  now: number
): { state: BullyPressureState; decision: BullyPressureDecision } {
  const delta = {
    x: playerPosition.x - bullyPosition.x,
    y: playerPosition.y - bullyPosition.y
  };
  const distance = Math.hypot(delta.x, delta.y);
  const direction = normalize(delta);

  if (state.mood === "taunting" && now < state.nextMoodAt) {
    return {
      state,
      decision: { mood: "taunting", velocity: { x: 0, y: 0 }, damagesPlayer: false }
    };
  }

  if (state.canCharge && state.mood === "taunting" && distance > APPROACH_RANGE) {
    return {
      state: { mood: "charging", nextMoodAt: now + 360, canCharge: false },
      decision: {
        mood: "charging",
        velocity: scale(direction, CHARGE_SPEED),
        damagesPlayer: distance <= SHOVE_RANGE,
      }
    };
  }

  if (state.mood === "backing-off" && now < state.nextMoodAt) {
    return {
      state,
      decision: {
        mood: "backing-off",
        velocity: scale(direction, -BACK_OFF_SPEED),
        damagesPlayer: false
      }
    };
  }

  if (state.mood === "shoving" && now < state.nextMoodAt) {
    return {
      state,
      decision: { mood: "shoving", velocity: { x: 0, y: 0 }, damagesPlayer: distance <= SHOVE_RANGE }
    };
  }

  if (state.mood === "shoving") {
    return {
      state: { ...state, mood: "backing-off", nextMoodAt: now + 420 },
      decision: {
        mood: "backing-off",
        velocity: scale(direction, -BACK_OFF_SPEED),
        damagesPlayer: false
      }
    };
  }

  if (state.mood === "charging" && now < state.nextMoodAt) {
    return {
      state,
      decision: {
        mood: "charging",
        velocity: scale(direction, CHARGE_SPEED),
        damagesPlayer: distance <= SHOVE_RANGE
      }
    };
  }

  if (distance <= SHOVE_RANGE) {
    return {
      state: { ...state, mood: "shoving", nextMoodAt: now + 260 },
      decision: { mood: "shoving", velocity: { x: 0, y: 0 }, damagesPlayer: true }
    };
  }

  return {
    state: { ...state, mood: "approaching", nextMoodAt: now + 120 },
    decision: {
      mood: "approaching",
      velocity: scale(direction, WALK_SPEED),
      damagesPlayer: false
    }
  };
}

function normalize(point: Point): Point {
  const length = Math.hypot(point.x, point.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: point.x / length,
    y: point.y / length
  };
}

function scale(point: Point, amount: number): Point {
  return {
    x: point.x * amount,
    y: point.y * amount
  };
}
