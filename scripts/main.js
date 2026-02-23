/**
 * Physical Vision Sync (PhyVision) - i18n & Optional WS
 * Модуль для Foundry VTT v13
 */

const MODULE_ID = "phyvision";

class PhyVisionSource extends VisionSource {
    get isActive() { return true; }
}

class PhyVisionLayer extends InteractionLayer {
    constructor() {
        super();
        this.frame = { x: 0, y: 0, w: 1920, h: 1080 };
        this.isDragging = false;
        this.dragData = null;
    }

    async _draw() {
        await super._draw();
        const savedFrame = canvas.scene?.getFlag(MODULE_ID, "frame");
        if (savedFrame) this.frame = savedFrame;

        this.overlay = this.addChild(new PIXI.Graphics());
        this.frameGraphic = this.addChild(new PIXI.Graphics());
        this.markerContainer = this.addChild(new PIXI.Container());

        this.frameGraphic.eventMode = 'static';
        this.frameGraphic.cursor = 'pointer';
        this.frameGraphic.on('pointerdown', this._onDragStart, this);
        this.frameGraphic.on('pointerup', this._onDragEnd, this);
        this.frameGraphic.on('pointerupoutside', this._onDragEnd, this);
        this.frameGraphic.on('pointermove', this._onDragMove, this);

        this.refreshVisuals();
    }

    refreshVisuals() {
        if (!this.active) {
            this.overlay.clear();
            this.frameGraphic.clear();
            this.markerContainer.visible = false;
            return;
        }

        this.markerContainer.visible = true;
        this.overlay.clear();
        this.overlay.beginFill(0x000000, 0.7);
        const d = canvas.dimensions.rect;
        const f = this.frame;
        this.overlay.drawRect(d.x, d.y, d.width, f.y - d.y);
        this.overlay.drawRect(d.x, f.y + f.h, d.width, (d.y + d.height) - (f.y + f.h));
        this.overlay.drawRect(d.x, f.y, f.x - d.x, f.h);
        this.overlay.drawRect(f.x + f.w, f.y, (d.x + d.width) - (f.x + f.w), f.h);
        this.overlay.endFill();

        this.frameGraphic.clear();
        this.frameGraphic.lineStyle(4, 0x00ff00, 1);
        this.frameGraphic.beginFill(0x00ff00, 0.05);
        this.frameGraphic.drawRect(f.x, f.y, f.w, f.h);
        this.frameGraphic.endFill();
        this.frameGraphic.hitArea = new PIXI.Rectangle(f.x, f.y, f.w, f.h);
    }

    updateMarkers() {
        this.markerContainer.removeChildren();
        if (!this.active || !PhyVisionSync.centroids) return;

        const colorHex = game.settings.get(MODULE_ID, "markerColor").replace('#', '0x');
        const color = parseInt(colorHex, 16);

        PhyVisionSync.centroids.forEach(c => {
            const marker = new PIXI.Graphics();
            marker.beginFill(color, 0.8);
            marker.lineStyle(2, 0xffffff, 1);
            marker.drawCircle(c.x, c.y, 20);
            marker.endFill();
            this.markerContainer.addChild(marker);
        });
    }

    _onDragStart(event) {
        this.isDragging = true;
        this.dragData = event.data.getLocalPosition(this.parent);
        this.dragOffset = { x: this.frame.x - this.dragData.x, y: this.frame.y - this.dragData.y };
    }

    _onDragEnd() {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragData = null;
            canvas.scene.setFlag(MODULE_ID, "frame", this.frame);
        }
    }

    _onDragMove(event) {
        if (this.isDragging) {
            const newPosition = event.data.getLocalPosition(this.parent);
            this.frame.x = newPosition.x + this.dragOffset.x;
            this.frame.y = newPosition.y + this.dragOffset.y;
            this.refreshVisuals();
        }
    }

    _activate() { super._activate(); this.refreshVisuals(); this.updateMarkers(); }
    _deactivate() { super._deactivate(); this.refreshVisuals(); }
}

class PhyVisionSync {
    static ws = null;
    static centroids = [];

    static initWebSocket() {
        if (!game.user.isGM) return; 

        // Если сокет уже был открыт - закрываем его (чтобы не плодить соединения при смене настроек)
        if (this.ws) {
            this.ws.onclose = null; // Отключаем авто-реконнект
            this.ws.close();
            this.ws = null;
        }

        const isEnabled = game.settings.get(MODULE_ID, "enableWS");
        const url = game.settings.get(MODULE_ID, "wsUrl");

        if (!isEnabled || !url) {
            console.log("PhyVision | WebSocket отключен или URL не указан.");
            return;
        }

        try {
            this.ws = new WebSocket(url);
            this.ws.onopen = () => console.log("PhyVision | WebSocket подключен");
            this.ws.onmessage = (event) => this.handleData(JSON.parse(event.data));
            this.ws.onerror = (e) => console.error("PhyVision | Ошибка WS:", e);
            this.ws.onclose = () => {
                // Пытаемся переподключиться только если настройка всё еще включена
                if (game.settings.get(MODULE_ID, "enableWS")) {
                    setTimeout(() => this.initWebSocket(), 5000);
                }
            };
        } catch (e) {
            console.error("PhyVision | Неверный URL WebSocket");
        }
    }

    static handleData(normalizedPoints) {
        if (!canvas.ready || !canvas.scene) return;

        const layer = canvas.layers.phyvision;
        const frame = layer.frame;

        const canvasPoints = normalizedPoints.map(p => ({
            x: frame.x + (p.x * frame.w),
            y: frame.y + (p.y * frame.h)
        }));

        const radius = game.settings.get(MODULE_ID, "clusterRadius") * canvas.dimensions.distancePixels;
        this.centroids = this.clusterPoints(canvasPoints, radius);

        layer.updateMarkers();
        canvas.perception.update({ initializeVision: true, refreshVision: true });

        game.socket.emit(`module.${MODULE_ID}`, {
            action: "updateCentroids",
            centroids: this.centroids
        });
    }

    static clusterPoints(points, radius) {
        let clusters = [];
        for (let p of points) {
            let found = false;
            for (let c of clusters) {
                const dx = p.x - c.x;
                const dy = p.y - c.y;
                if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                    c.points.push(p);
                    c.x = c.points.reduce((sum, pt) => sum + pt.x, 0) / c.points.length;
                    c.y = c.points.reduce((sum, pt) => sum + pt.y, 0) / c.points.length;
                    found = true;
                    break;
                }
            }
            if (!found) clusters.push({ x: p.x, y: p.y, points: [p] });
        }
        return clusters;
    }
}

Hooks.once("init", () => {
    CONFIG.Canvas.layers.phyvision = { group: "interface", layerClass: PhyVisionLayer };

    // Новая настройка: Включить/Выключить WebSocket
    game.settings.register(MODULE_ID, "enableWS", {
        name: "PHYVISION.Settings.EnableWS.Name",
        hint: "PHYVISION.Settings.EnableWS.Hint",
        scope: "world", config: true, type: Boolean, default: false,
        onChange: () => PhyVisionSync.initWebSocket()
    });

    game.settings.register(MODULE_ID, "wsUrl", {
        name: "PHYVISION.Settings.WSUrl.Name",
        hint: "PHYVISION.Settings.WSUrl.Hint",
        scope: "world", config: true, type: String, default: "ws://localhost:8080",
        onChange: () => PhyVisionSync.initWebSocket()
    });

    game.settings.register(MODULE_ID, "clusterRadius", {
        name: "PHYVISION.Settings.ClusterRadius.Name",
        hint: "PHYVISION.Settings.ClusterRadius.Hint",
        scope: "world", config: true, type: Number, default: 2.0
    });

    game.settings.register(MODULE_ID, "visionRange", {
        name: "PHYVISION.Settings.VisionRange.Name",
        hint: "PHYVISION.Settings.VisionRange.Hint",
        scope: "world", config: true, type: Number, default: 60
    });

    game.settings.register(MODULE_ID, "markerColor", {
        name: "PHYVISION.Settings.MarkerColor.Name",
        hint: "PHYVISION.Settings.MarkerColor.Hint",
        scope: "world", config: true, type: String, default: "#ff0000"
    });
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user.isGM) return;
    controls.push({
        name: MODULE_ID,
        title: game.i18n.localize("PHYVISION.Controls.GroupTitle"),
        icon: "fas fa-tv",
        layer: "phyvision",
        tools: [
            {
                name: "toggle", 
                title: game.i18n.localize("PHYVISION.Controls.ToggleFrame"), 
                icon: "fas fa-crop-alt",
                toggle: true, 
                active: false,
                onClick: (toggled) => toggled ? canvas.layers.phyvision.activate() : canvas.layers.phyvision.deactivate()
            },
            {
                name: "resetSize",
                title: game.i18n.localize("PHYVISION.Controls.ResetFrame"),
                icon: "fas fa-compress",
                button: true,
                onClick: () => {
                    if (canvas.layers.phyvision) {
                        canvas.layers.phyvision.frame.w = 1920;
                        canvas.layers.phyvision.frame.h = 1080;
                        canvas.layers.phyvision.refreshVisuals();
                        canvas.scene.setFlag(MODULE_ID, "frame", canvas.layers.phyvision.frame);
                    }
                }
            }
        ]
    });
});

Hooks.once("ready", () => {
    if (game.user.isGM) {
        PhyVisionSync.initWebSocket();
    }

    game.socket.on(`module.${MODULE_ID}`, (data) => {
        if (data.action === "updateCentroids") {
            PhyVisionSync.centroids = data.centroids;
            if (canvas.ready) {
                canvas.perception.update({ initializeVision: true, refreshVision: true });
            }
        }
    });
});

Hooks.on("initializeVisionSources", (sources) => {
    if (!canvas.scene || !PhyVisionSync.centroids || PhyVisionSync.centroids.length === 0) return;

    const rangeUnits = game.settings.get(MODULE_ID, "visionRange");
    const radiusPixels = rangeUnits * (canvas.dimensions.size / canvas.dimensions.distance);

    PhyVisionSync.centroids.forEach((c, index) => {
        const sourceId = `phyvision_source_${index}`;
        const mockObject = { document: { documentName: "PhyVision" }, sourceId: sourceId };
        const source = new PhyVisionSource({ object: mockObject });
        
        source.initialize({
            x: c.x, y: c.y,
            radius: radiusPixels,
            angle: 360,
            visionMode: "basic",
            blinded: false
        });

        sources.set(sourceId, source);
    });
});