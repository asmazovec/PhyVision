let frameOverlay = null; // PIXI.Container с рамкой

Hooks.on("canvasReady", () => {
  if (frameOverlay) {
    frameOverlay.destroy({ children: true });
  }

  frameOverlay = new PIXI.Container();
  frameOverlay.name = "phyvision-frame-overlay";
  frameOverlay.eventMode = "none";           // ← контейнер не перехватывает события
  frameOverlay.interactiveChildren = false;   // ← дети тоже не перехватывают
  canvas.controls.addChild(frameOverlay);

  drawFrameOverlay();
});

Hooks.on("canvasTearDown", () => {
  frameOverlay = null;
});

/**
 * Перерисовать рамку — вызывается при любом изменении
 */
export function drawFrameOverlay(bounds = null) {
  if (!frameOverlay) return;

  frameOverlay.removeChildren();

  if (!bounds) return;

  const { x, y, w, h } = bounds;
  const s = canvas.dimensions.sceneRect;

  // ─── Затенение: 4 прямоугольника вокруг рамки ───
  //
  //  ┌──────────────────────────┐
  //  │          TOP             │
  //  ├─────┬──────────┬─────────┤
  //  │ LEFT│  (окно)  │  RIGHT  │
  //  ├─────┴──────────┴─────────┤
  //  │         BOTTOM           │
  //  └──────────────────────────┘

  const dimColor = 0x000000;
  const dimAlpha = 0.5;

  // TOP — от верха сцены до верха рамки, на всю ширину
  const top = new PIXI.Graphics();
  top.beginFill(dimColor, dimAlpha);
  top.drawRect(s.x, s.y, s.width, y - s.y);
  top.endFill();
  top.eventMode = "none";
  frameOverlay.addChild(top);

  // BOTTOM — от низа рамки до низа сцены, на всю ширину
  const bottom = new PIXI.Graphics();
  bottom.beginFill(dimColor, dimAlpha);
  bottom.drawRect(s.x, y + h, s.width, (s.y + s.height) - (y + h));
  bottom.endFill();
  bottom.eventMode = "none";
  frameOverlay.addChild(bottom);

  // LEFT — от верха рамки до низа рамки, слева
  const left = new PIXI.Graphics();
  left.beginFill(dimColor, dimAlpha);
  left.drawRect(s.x, y, x - s.x, h);
  left.endFill();
  left.eventMode = "none";
  frameOverlay.addChild(left);

  // RIGHT — от верха рамки до низа рамки, справа
  const right = new PIXI.Graphics();
  right.beginFill(dimColor, dimAlpha);
  right.drawRect(x + w, y, (s.x + s.width) - (x + w), h);
  right.endFill();
  right.eventMode = "none";
  frameOverlay.addChild(right);

  // ─── Рамка (обводка) ───
  const border = new PIXI.Graphics();
  border.lineStyle(3, 0x00aaff, 1);
  border.drawRect(x, y, w, h);
  border.eventMode = "none";
  frameOverlay.addChild(border);
}

/**
 * Показать/скрыть оверлей
 */
export function setFrameOverlayVisible(visible) {
  if (frameOverlay) {
    frameOverlay.visible = visible;
  }
}