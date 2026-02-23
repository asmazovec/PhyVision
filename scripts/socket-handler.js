import { moduleName, socketId } from "./consts.js";

/**
 * Типы сокет-событий
 */
export const SocketAction = {
    PAN: "PAN",                     // Синхронизация позиции рамки
    SET_OBSERVER: "SET_OBSERVER",   // GM назначает наблюдателя
    FULL_SYNC: "FULL_SYNC",         // Полная синхронизация (при первом подключении)
    SCREEN_INFO: "SCREEN_INFO",     // Размеры экрана наблюдателя
};

export class TVFrameSocketHandler {
    constructor() {
        this._registered = false;
    }

    /**
     * Регистрация слушателей — вызывать в Hooks.once("ready")
     */
    register() {
        if (this._registered) return;
        this._registered = true;

        game.socket.on(socketId, (data) => {
            const { type, payload, targetUserId } = data;

            // Если указан конкретный получатель — игнорируем если это не мы
            if (targetUserId && targetUserId !== game.user.id) return;

            switch (type) {
                case SocketAction.PAN:
                    this.#handlePan(payload);
                    break;
                case SocketAction.FULL_SYNC:
                    this.#handleFullSync(payload);
                    break;
                case SocketAction.SET_OBSERVER:
                    this.#handleSetObserver(payload);
                    break;
                case SocketAction.SCREEN_INFO:
                    this.#handleScreenInfo(payload);
                    break;
                default:
                    console.warn(`${moduleName} | Unknown socket action: ${type}`);
            }
        });

        console.log(`${moduleName} | Socket listeners registered`);
    }

    /**
     * Отправка события через сокет
     * @param {string} type - тип действия
     * @param {object} payload - данные
     * @param {string|null} targetUserId - ID конкретного получателя (null = всем)
     */
    emit(type, payload, targetUserId = null) {
        const data = { type, payload, targetUserId };
        game.socket.emit(socketId, data);
    }

    // ─── Обработчики на стороне НАБЛЮДАТЕЛЯ ───

    #handlePan({ x, y, scale }) {
        if (!this.isObserver) return;

        canvas.animatePan({
            x,
            y,
            scale,
            duration: 250, // плавная анимация 250мс
        });

        this.emit(SocketAction.SCREEN_INFO, {
            userId: game.user.id,
            width: window.innerWidth,
            height: window.innerHeight,
        })
    }

    #handleFullSync({ x, y, scale, sceneId }) {
        if (!this.isObserver) return;

        // Блокируем ручное управление камерой у наблюдателя
        game.settings.set(moduleName, "viewLocked", locked);

        // Если наблюдатель на другой сцене — переключаем
        if (canvas.scene?.id !== sceneId) {
            const scene = game.scenes.get(sceneId);
            if (scene) {
                scene.view().then(() => {
                    canvas.pan({ x, y, scale });
                });
            }
            return;
        }

        canvas.pan({ x, y, scale });

        this.emit(SocketAction.SCREEN_INFO, {
            userId: game.user.id,
            width: window.innerWidth,
            height: window.innerHeight,
        })
    }

    #handleSetObserver({ observerUserId, enabled }) {
        if (game.user.id !== observerUserId) return;

        game.settings.set(moduleName, "isObserver", enabled);
        ui.notifications.info(
            enabled
                ? "Вы назначены наблюдателем TV-рамки"
                : "Режим наблюдателя TV-рамки отключён"
        );

        if (!enabled) return;
    }

    #handleScreenInfo({ userId, width, height }) {
        if (!game.user.isGM) return;

        phyvision.observerScreen = { userId, width, height };
    }

    /**
     * Является ли текущий пользователь наблюдателем
     */
    get isObserver() {
        return game.settings.get(moduleName, "isObserver") ?? false;
    }
}

/**
 * Вычисляет параметры pan/zoom для наблюдателя
 * чтобы его viewport точно совпал с рамкой GM
 */
export function computeObserverPan(frameData) {
    // Центр рамки — куда навести камеру наблюдателя
    const centerX = frameData.x + frameData.width / 2;
    const centerY = frameData.y + frameData.height / 2;

    const screenInfo = phyvision.observerScreen;
    const screenW = screenInfo?.width ?? 1920;
    const screenH = screenInfo?.height ?? 1080;

    const scaleX = screenW / frameData.width;
    const scaleY = screenH / frameData.height;
    const scale = Math.min(scaleX, scaleY);

    return { x: centerX, y: centerY, scale: scale };
}


/**
 * Вызывается из вашего CanvasLayer при каждом изменении рамки.
 * frameData = { x, y, width, height, scale }
 * где x, y — центр рамки в координатах canvas
 */
export function broadcastFrameToObserver(frameData) {
    if (!game.user.isGM) return;

    const handler = phyvision.socketHandler;
    const observerId = game.settings.get(moduleName, "selectedObserverId");
    if (!observerId) return;

    // Вычисляем параметры pan для наблюдателя
    // Нужно чтобы наблюдатель видел ровно то, что внутри рамки
    const panData = computeObserverPan(frameData);

    handler.emit(
        SocketAction.PAN,
        {
            x: panData.x,
            y: panData.y,
            scale: panData.scale,
        },
        observerId // отправляем только наблюдателю
    );
}

/**
 * Полная синхронизация — вызывается при назначении наблюдателя
 * или при смене сцены
 */
export function fullSyncToObserver(frameData) {
    if (!game.user.isGM) return;

    const handler = phyvision.socketHandler;
    const observerId = game.settings.get(moduleName, "selectedObserverId");
    if (!observerId) return;

    const panData = computeObserverPan(frameData);

    canvas.pan({ x: panData.x, y: panData.y });

    handler.emit(
        SocketAction.FULL_SYNC,
        {
            x: panData.x,
            y: panData.y,
            scale: panData.scale,
            sceneId: canvas.scene.id,
        },
        observerId
    );
}