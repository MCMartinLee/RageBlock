export type NormalizedAction = "light" | "heavy" | "run" | "pause" | "restart" | "title";

const GAMEPAD_BUTTONS: Record<NormalizedAction, number> = {
  light: 0,
  heavy: 1,
  run: 7,
  restart: 3,
  title: 8,
  pause: 9
};

export function isGamepadActionPressed(buttons: readonly boolean[], action: NormalizedAction): boolean {
  return Boolean(buttons[GAMEPAD_BUTTONS[action]]);
}

export function isNormalizedActionPressed(
  keyboardPressed: Partial<Record<NormalizedAction, boolean>>,
  gamepadButtons: readonly boolean[],
  previousGamepadButtons: readonly boolean[],
  action: NormalizedAction
): boolean {
  return Boolean(keyboardPressed[action]) || (
    isGamepadActionPressed(gamepadButtons, action) &&
    !isGamepadActionPressed(previousGamepadButtons, action)
  );
}

export function isNormalizedActionHeld(
  keyboardHeld: Partial<Record<NormalizedAction, boolean>>,
  gamepadButtons: readonly boolean[],
  action: NormalizedAction
): boolean {
  return Boolean(keyboardHeld[action]) || isGamepadActionPressed(gamepadButtons, action);
}
