import { moduleName } from "./consts.js";

export function initializeSettings() {
    // Скрытая настройка: является ли этот клиент наблюдателем
    game.settings.register(moduleName, "isObserver", {
        name: "Is Observer",
        scope: "client",
        config: false,
        type: Boolean,
        default: false,
    });

    // Скрытая настройка: заблокирован ли вид
    game.settings.register(moduleName, "viewLocked", {
        name: "View Locked",
        scope: "client",
        config: false,
        type: Boolean,
        default: false,
    });

    // Настройка: ID выбранного наблюдателя (хранится у GM)
    game.settings.register(moduleName, "selectedObserverId", {
        name: "Selected Observer User ID",
        scope: "world",
        config: false,
        type: String,
        default: "",
    });

    game.settings.register(moduleName, "scalingSide", {
        name: "Frame broad side",
        scope: "world",
        config: false,
        type: Number,
        default: 1920,
    });

    game.settings.register(moduleName, "scalingSideMin", {
        name: "Minimum for the frame broad side",
        scope: "world",
        config: true,
        type: Number,
        default: 200,
    });
}
