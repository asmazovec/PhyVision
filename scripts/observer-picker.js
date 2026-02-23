import { moduleName, socketId } from "./consts.js";
import { SocketAction } from "./socket-handler.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ObserverPickerApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "phyvision-observer-picker",
        classes: ["phyvision", "observer-picker"],
        window: {
            title: "PhyVision: Выбор наблюдателя",
            icon: "fas fa-tv",
            resizable: false,
        },
        position: {
            width: 340,
            height: "auto",
        },
        actions: {
            selectObserver: ObserverPickerApp.#onSelectObserver,
            clearObserver: ObserverPickerApp.#onClearObserver,
        },
    };

    static PARTS = {
        form: {
            template: `./modules/${moduleName}/templates/observer-picker.hbs`,
        },
    };

    async _prepareContext(options) {
        const currentObserverId = game.settings.get(moduleName, "selectedObserverId");

        const onlineUsers = game.users
            .filter(u => u.active && u.id !== game.user.id)
            .map(u => ({
                id: u.id,
                name: u.name,
                isSelected: u.id === currentObserverId,
                isGM: u.isGM,
            }));

        return {
            users: onlineUsers,
            hasObserver: !!currentObserverId,
            currentObserverName: currentObserverId
                ? (game.users.get(currentObserverId)?.name ?? "—")
                : null,
        };
    }

    static async #onSelectObserver(event, target) {
        const userId = target.dataset.userId;
        if (!userId) return;

        const previousId = game.settings.get(moduleName, "selectedObserverId");

        // Уведомляем предыдущего наблюдателя об отключении
        if (previousId) {
            game.socket.emit(socketId, {
                type: SocketAction.SET_OBSERVER,
                payload: { observerUserId: previousId, enabled: false },
            });
        }

        // Сохраняем нового
        await game.settings.set(moduleName, "selectedObserverId", userId);

        // Уведомляем нового наблюдателя
        game.socket.emit(socketId, {
            type: SocketAction.SET_OBSERVER,
            payload: { observerUserId: userId, enabled: true },
        });

        const user = game.users.get(userId);
        ui.notifications.info(`Наблюдатель: ${user?.name}`);

        this.render({ force: true });
    }

    static async #onClearObserver(event, target) {
        const previousId = game.settings.get(moduleName, "selectedObserverId");

        if (previousId) {
            game.socket.emit(socketId, {
                type: SocketAction.SET_OBSERVER,
                payload: { observerUserId: previousId, enabled: false },
            });
        }

        await game.settings.set(moduleName, "selectedObserverId", "");
        ui.notifications.info("Наблюдатель отключён");

        this.render({ force: true });
    }
}