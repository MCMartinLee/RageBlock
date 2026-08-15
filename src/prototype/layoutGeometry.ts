export type LayoutBounds = { x: number; y: number; width: number; height: number };

function isInside(container: LayoutBounds, item: LayoutBounds): boolean {
  return item.x >= container.x
    && item.y >= container.y
    && item.x + item.width <= container.x + container.width
    && item.y + item.height <= container.y + container.height;
}

function overlaps(first: LayoutBounds, second: LayoutBounds): boolean {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

export function hasReadableLayout(container: LayoutBounds, rows: LayoutBounds[][]): boolean {
  const items = rows.flat();
  if (!items.every((item) => isInside(container, item))) return false;
  return rows.every((row) => row.every((item, index) => row.slice(index + 1).every((other) => !overlaps(item, other))));
}
