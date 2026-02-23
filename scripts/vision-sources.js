const MODULE_ID = "phyvision";

export class VisionSourceManager {
  constructor() {
    this.sources = new Map();
  }

  updateSources(centroids, radius) {
    if (!canvas?.sight) return;

    // Удаляем старые
    for (const [id, source] of this.sources) {
      if (!centroids.find(c => c._id === id)) {
        canvas.sight.removeSource?.(source);
        this.sources.delete(id);
      }
    }

    // Создаём новые
    const newMap = new Map();

    centroids.forEach((c, i) => {
      const id = `mv-${i}`;
      const source = new foundry.canvas.sources.VisionSource({
        object: null,
        x: c.x,
        y: c.y,
        radius,
        visionMode: "basic",
        angle: 360,
        rotation: 0,
        externalSource: true
      });

      source.initialize();
      canvas.sight.addSource(source);

      newMap.set(id, source);
    });

    // Полностью заменить на новые
    for (const [id, source] of this.sources) {
      canvas.sight.removeSource?.(source);
    }
    this.sources = newMap;

    canvas.perception.update({ refreshVision: true });
  }

  clear() {
    for (const source of this.sources.values()) {
      canvas.sight.removeSource?.(source);
    }
    this.sources.clear();
  }
}