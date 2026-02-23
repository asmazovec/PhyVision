import { moduleName } from "./consts.js";

import { TVFrameSocketHandler } from "./socket-handler.js";

import { initializeControlButtons } from "./control-buttons.js";
import { initializePhyVisionLayer } from "./phyvision-layer.js";
import { initializeSettings } from "./settings.js";

import { ObserverPickerApp, observerPickerApp } from "../apps/observer-picker-app.js";
import { ScalingControlApp, scalingControlApp } from "../apps/scaling-control-app.js";

class PhyVision {
    constructor() {
        this.overlay = null;

        this.socketHandler = new TVFrameSocketHandler();
        this.socketHandler.register();

        this.apps = {
            [observerPickerApp]: new ObserverPickerApp(),
            [scalingControlApp]: new ScalingControlApp(),
        }

        this.observerScreen = { userId: null, width: 1920, height: 1080 };
    }

    get layer() {
        return canvas[moduleName];
    }

    toggleApp(appId) {
        const existing = foundry.applications.instances.get(appId);
        const app = this.apps[appId];

        if (!!!app) return;

        if (existing) {
            app.close();
        } else {
            app.render({ force: true });
        }
    }
}

Hooks.once("init", () => {
    initializeSettings();
    initializePhyVisionLayer();
    initializeControlButtons();
});

Hooks.once("ready", () => {
    globalThis.phyvision = new PhyVision();
});