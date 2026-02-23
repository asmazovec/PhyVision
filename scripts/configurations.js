import { moduleName } from "./consts.js";

export function initializeConfigurations() {
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
}
