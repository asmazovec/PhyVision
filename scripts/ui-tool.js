const MODULE_ID = "phyvision";

export class VisionTool {
  constructor(module) {
    this.module = module;
    this.active = false;
    this.overlay = null;
    this.pointsLayer = null;
    this.dragging = false;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onRightClick = this.onRightClick.bind(this);
  }

  toggle() {
    if (this.active) this.deactivate();
    else this.activate();
  }

  activate() {
    this.active = true;
    this.drawOverlay();
    canvas.stage.on("pointerdown", this.onPointerDown);
    canvas.stage.on("pointermove", this.onPointerMove);
    canvas.stage.on("pointerup", this.onPointerUp);
    canvas.stage.on("rightdown", this.onRightClick);
  }

  deactivate() {
    this.active = false;
    canvas.stage.off("pointerdown", this.onPointerDown);
    canvas.stage.off("pointermove", this.onPointerMove);
    canvas.stage.off("pointerup", this.onPointerUp);
    canvas.stage.off("rightdown", this.onRightClick);
    if (this.overlay) this.overlay.destroy(true);
    if (this.pointsLayer) this.pointsLayer.destroy(true);
    this.overlay = null;
    this.pointsLayer = null;
  }

  getViewport() {
    return this.module.getViewport(canvas.scene);
  }

  saveViewport(rect) {
    canvas.scene.setFlag(MODULE_ID, "viewport", rect);
  }

  drawOverlay() {
    if (this.overlay) this.overlay.destroy(true);
    if (this.pointsLayer) this.pointsLayer.destroy(true);

    const rect = this.getViewport();

    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0x000000, 0.6);
    this.overlay.drawRect(0, 0, canvas.scene.width, canvas.scene.height);
    this.overlay.beginHole();
    this.overlay.drawRect(rect.x, rect.y, rect.w, rect.h);
    this.overlay.endHole();
    this.overlay.endFill();

    canvas.stage.addChild(this.overlay);

    this.pointsLayer = new PIXI.Graphics();
    canvas.stage.addChild(this.pointsLayer);

    this.updatePoints(this.module.latestCentroids || []);
  }

  updatePoints(centroids) {
    if (!this.pointsLayer) return;

    const color = game.settings.get(MODULE_ID, "pointColor");
    const rgb = parseInt(color.replace("#", ""), 16);

    this.pointsLayer.clear();
    for (const c of centroids) {
      this.pointsLayer.beginFill(rgb, 1.0);
      this.pointsLayer.drawCircle(c.x, c.y, 8);
      this.pointsLayer.endFill();
    }
  }

  onPointerDown(event) {
    const rect = this.getViewport();
    const pos = event.data.getLocalPosition(canvas.stage);

    if (pos.x >= rect.x && pos.x <= rect.x + rect.w &&
        pos.y >= rect.y && pos.y <= rect.y + rect.h) {
      this.dragging = true;
      this.dragOffset = { x: pos.x - rect.x, y: pos.y - rect.y };
    }

    const mode = game.settings.get(MODULE_ID, "mode");
    if (mode === "manual") {
      this.addPoint(pos);
    }
  }

  onPointerMove(event) {
    if (!this.dragging) return;
    const rect = this.getViewport();
    const pos = event.data.getLocalPosition(canvas.stage);

    rect.x = pos.x - this.dragOffset.x;
    rect.y = pos.y - this.dragOffset.y;

    this.saveViewport(rect);
    this.drawOverlay();
  }

  onPointerUp() {
    this.dragging = false;
  }

  onRightClick(event) {
    const mode = game.settings.get(MODULE_ID, "mode");
    if (mode !== "manual") return;
    const pos = event.data.getLocalPosition(canvas.stage);
    this.removeNearestPoint(pos);
  }

  addPoint(pos) {
    const points = canvas.scene.getFlag(MODULE_ID, "manualPoints") || [];
    points.push({ x: pos.x, y: pos.y });
    canvas.scene.setFlag(MODULE_ID, "manualPoints", points);
    this.module.updateFromManual(points);
  }

  removeNearestPoint(pos) {
    const points = canvas.scene.getFlag(MODULE_ID, "manualPoints") || [];
    if (!points.length) return;

    let idx = -1;
    let minDist = Infinity;

    points.forEach((p, i) => {
      const dx = p.x - pos.x;
      const dy = p.y - pos.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < minDist) {
        minDist = d;
        idx = i;
      }
    });

    if (idx >= 0) points.splice(idx, 1);

    canvas.scene.setFlag(MODULE_ID, "manualPoints", points);
    this.module.updateFromManual(points);
  }
}