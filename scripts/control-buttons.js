import { moduleName } from "./consts.js";
import { observerPickerApp } from "../apps/observer-picker-app.js";
import { scalingControlApp } from "../apps/scaling-control-app.js";

export function initializeControlButtons() {
    Hooks.on('getSceneControlButtons', controls => {
        controls.phyvision = {
            activeTool: "visionControl",
            name: "phyvision",
            title: "phyvision",
            icon: "fas fa-eye",
            visible: game.user.isGM,
            onChange: () => phyvision.layer.activate(),
            tools: {
                visionControl: {
                    name: "visionControl",
                    title: "Vision control",
                    icon: "fas fa-eye",
                    order: 0,
                },
                observerPicker: {
                    name: "observerPicker",
                    title: "Pick TV observer",
                    icon: "fas fa-user",
                    order: 1,
                    button: true,
                    onChange: () => phyvision.toggleApp(observerPickerApp),
                },
                scalingControl: {
                    name: "scalingControl",
                    title: "Scaling Control",
                    icon: "fas fa-crop",
                    order: 2,
                    button: true,
                    onChange: () => phyvision.toggleApp(scalingControlApp),
                }
            },
        }
    });
}