import { ApiClient } from "./api-client.js";
import { clusterPoints } from "./clustering.js";
import { VisionSourceManager } from "./vision-sources.js";
import { VisionTool } from "./ui-tool.js";

const MODULE_ID = "phyvision";

class PhyVision {
  constructor() {
    this.api = null;
    this.vision = null;
    this.tool = null;
    this.latestCentroids = [];
  }

  initSettings() {
    game.settings.register(MODULE_ID, "mode", {
      name: "Mode",
      scope: "world",
      config: true,
      type: String,
      choices: {
        ws: "WebSocket",
        manual: "Manual"
      },
      default: "ws"
    });

    game.settings.register(MODULE_ID, "apiUrl", {
      name: "API URL (WS)",
      scope: "world",
      config: true,
      type: String,
      default: ""
    });

    game.settings.register(MODULE_ID, "clusterThreshold", {
      name: "Cluster Distance (px)",
      scope: "world",
      config: true,
      type: Number,
      default: 120
    });

    game.settings.register(MODULE_ID, "visionRadius", {
      name: "Vision Radius (px)",
      scope: "world",
      config: true,
      type: Number,
      default: 400
    });

    game.settings.register(MODULE_ID, "viewAspect", {
      name: "Viewport Aspect (e.g. 16:9)",
      scope: "world",
      config: true,
      type: String,
      default: "16:9"
    });

    game.settings.register(MODULE_ID, "viewWidth", {
      name: "Viewport Width (px)",
      scope: "world",
      config: true,
      type: Number,
      default: 2000
    });

    game.settings.register(MODULE_ID, "pointColor", {
      name: "Point Color",
      scope: "world",
      config: true,
      type: String,
      default: "#00FFAA"
    });
  }

  getViewport(scene) {
    const flags = scene.getFlag(MODULE_ID, "viewport");
    if (flags) return flags;

    const width = game.settings.get(MODULE_ID, "viewWidth");
    const aspect = game.settings.get(MODULE_ID, "viewAspect");
    const [w, h] = aspect.split(":").map(n => Number(n));
    const height = width * (h / w);

    const rect = { x: 0, y: 0, w: width, h: height };
    scene.setFlag(MODULE_ID, "viewport", rect);
    return rect;
  }

  async setup() {
    this.vision = new VisionSourceManager();
    this.tool = new VisionTool(this);

    const mode = game.settings.get(MODULE_ID, "mode");

    if (mode === "ws") {
      this.api = new ApiClient({
        url: game.settings.get(MODULE_ID, "apiUrl")
      });

      this.api.onData(points => this.handlePoints(points));
      if (game.settings.get(MODULE_ID, "apiUrl")) {
        this.api.connect();
      }
    }

    if (mode === "manual") {
      const manual = canvas.scene?.getFlag(MODULE_ID, "manualPoints") || [];
      this.updateFromManual(manual);
    }
  }

  async handlePoints(pointsNorm) {
    const scene = canvas.scene;
    if (!scene) return;

    const viewport = this.getViewport(scene);

    const points = pointsNorm.map(p => ({
      x: viewport.x + p.x * viewport.w,
      y: viewport.y + p.y * viewport.h
    }));

    const threshold = game.settings.get(MODULE_ID, "clusterThreshold");
    const centroids = clusterPoints(points, threshold);

    this.latestCentroids = centroids;

    const radius = game.settings.get(MODULE_ID, "visionRadius");
    this.vision.updateSources(centroids, radius);

    if (this.tool?.active) {
      this.tool.updatePoints(centroids);
    }
  }

  updateFromManual(points) {
    this.latestCentroids = points;
    const radius = game.settings.get(MODULE_ID, "visionRadius");
    this.vision.updateSources(points, radius);
    if (this.tool?.active) {
      this.tool.updatePoints(points);
    }
  }
}

const phyVision = new PhyVision();

Hooks.once("init", () => {
  phyVision.initSettings();
});

Hooks.once("ready", async () => {
  await phyVision.setup();
  game.modules.get(MODULE_ID).api = phyVision;
});

Hooks.on("canvasReady", () => {
  if (phyVision.latestCentroids?.length) {
    const radius = game.settings.get(MODULE_ID, "visionRadius");
    phyVision.vision.updateSources(phyVision.latestCentroids, radius);
  }
});

Hooks.on("getSceneControlButtons", controls => {
  controls.phyvision = {
    name: "phyvision",
    title: game.i18n.localize("PHYVISION.Settings.Controls.GroupTitle"),
    icon: "fas fa-eye",
    layer: "controls",
    tools: [
      {
        name: "vision-viewport",
        title: game.i18n.localize("PHYVISION.Settings.Controls.GroupTitle"),
        icon: "fas fa-vector-square",
        onClick: () => phyVision.tool.toggle(),
        button: true
      }
    ]
  };
});