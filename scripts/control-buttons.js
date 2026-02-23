import { moduleName } from "./consts.js";
import { fullSyncToObserver } from "./socket-handler.js";

export function initializeControlButtons() {
    Hooks.on('getSceneControlButtons', controls => {
        controls.phyvision = {
            activeTool: "visionControl",
            name: "phyvision",
            title: "phyvision",
            icon: "fas fa-eye",
            visible: game.user.isGM,
            onChange: () => canvas[moduleName].activate(),
            tools: {
                visionControl: {
                    name: "visionControl",
                    title: "Manual vision control",
                    icon: "fas fa-eye",
                    order: 0,
                },
                observerPicker: {
                    name: "observerPicker",
                    title: "Выбрать наблюдателя (TV)",
                    icon: "fas fa-tv",
                    order: 1,
                    button: true,
                    onChange: () => {
                        const appId = "phyvision-observer-picker";
                        const existing = foundry.applications.instances.get(appId);
                        if (existing) {
                            existing.close();
                        } else {
                            new ObserverPickerApp().render({ force: true });
                        }
                    },
                },
            },
        }
    });
}