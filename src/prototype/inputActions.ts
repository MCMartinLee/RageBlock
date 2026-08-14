export type NormalizedAction = "light" | "heavy" | "pause";

export function isGamepadActionPressed(buttons: readonly boolean[], action: NormalizedAction): boolean {
  const buttonIndex = action === "light" ? 0 : action === "heavy" ? 1 : 9;
  return Boolean(buttons[buttonIndex]);
}
