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

export type TitleGamepadNavigation = { start: boolean; modeDelta: -1 | 0 | 1; chapterDelta: -1 | 0 | 1 };

export function getTitleGamepadNavigation(buttons: readonly boolean[], previousButtons: readonly boolean[]): TitleGamepadNavigation {
  const pressed = (index: number) => Boolean(buttons[index]) && !previousButtons[index];
  return {
    start: pressed(0),
    modeDelta: pressed(5) ? 1 : pressed(4) ? -1 : 0,
    chapterDelta: pressed(15) ? 1 : pressed(14) ? -1 : 0
  };
}
