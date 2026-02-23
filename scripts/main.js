const MODULE_ID = "phyvision";

// ==========================================
// СЛОЙ ХОЛСТА (CANVAS LAYER) ДЛЯ GM
// ==========================================
class PhyVisionLayer extends InteractionLayer {
    constructor() {
        super();
        this.frame = { x: 0, y: 0, w: 1920, h: 1080 };
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    async _draw() {
        await super._draw();
        
        const savedFrame = canvas.scene?.getFlag(MODULE_ID, "frame");
        if (savedFrame) this.frame = savedFrame;

        this.overlay = this.addChild(new PIXI.Graphics());
        this.frameGraphic = this.addChild(new PIXI.Graphics());

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
            return;
        }

        const d = canvas.dimensions.rect;
        const f = this.frame;

        // 1. Рисуем затемнение
        this.overlay.clear();
        this.overlay.beginFill(0x000000, 0.7);
        this.overlay.drawRect(d.x, d.y, d.width, f.y - d.y);
        this.overlay.drawRect(d.x, f.y + f.h, d.width, (d.y + d.height) - (f.y + f.h));
        this.overlay.drawRect(d.x, f.y, f.x - d.x, f.h);
        this.overlay.drawRect(f.x + f.w, f.y, (d.x + d.width) - (f.x + f.w), f.h);
        this.overlay.endFill();

        // 2. Рисуем рамку
        this.frameGraphic.clear();
        this.frameGraphic.lineStyle(4, 0x00ff00, 1);
        this.frameGraphic.beginFill(0x00ff00, 0.05);
        this.frameGraphic.drawRect(f.x, f.y, f.w, f.h);
        this.frameGraphic.endFill();
        
        this.frameGraphic.hitArea = new PIXI.Rectangle(f.x, f.y, f.w, f.h);
    }

    _onDragStart(event) {
        this.isDragging = true;
        const position = event.data.getLocalPosition(this.parent);
        this.dragOffset = { 
            x: this.frame.x - position.x, 
            y: this.frame.y - position.y 
        };
    }

    _onDragEnd() {
        if (this.isDragging) {
            this.isDragging = false;
            canvas.scene?.setFlag(MODULE_ID, "frame", this.frame);
        }
    }

    _onDragMove(event) {
        if (this.isDragging) {
            const position = event.data.getLocalPosition(this.parent);
            this.frame.x = position.x + this.dragOffset.x;
            this.frame.y = position.y + this.dragOffset.y;
            this.refreshVisuals();
        }
    }

    _activate() { 
        super._activate(); 
        this.refreshVisuals(); 
    }
    
    _deactivate() { 
        super._deactivate(); 
        this.refreshVisuals(); 
    }
}

// ==========================================
// РЕГИСТРАЦИЯ В FOUNDRY v13
// ==========================================

Hooks.once("init", () => {
    CONFIG.Canvas.layers.phyvision = { 
        group: "interface", 
        layerClass: PhyVisionLayer 
    };
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user.isGM) return;
    
    controls[MODULE_ID] = {
        name: MODULE_ID,
        title: "PhyVision",
        icon: "fas fa-tv",
        layer: "phyvision",
        tools: {
            toggle: {
                name: "toggle", 
                title: "Настройка экрана", 
                icon: "fas fa-crop-alt",
                toggle: true, 
                active: false,
                onClick: (toggled) => {
                    if (canvas.layers.phyvision) {
                        toggled ? canvas.layers.phyvision.activate() : canvas.layers.phyvision.deactivate();
                    }
                }
            }
        }
    };
});