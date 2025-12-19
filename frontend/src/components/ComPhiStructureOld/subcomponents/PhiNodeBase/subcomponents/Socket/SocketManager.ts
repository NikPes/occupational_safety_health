// subcomponents/Socket/SocketManager.ts
import { SocketFactory } from './SocketFactory';
import { NumberSocket } from './implementations/NumberSocket';
import { StringSocket } from './implementations/StringSocket';
import { SocketConstructor } from './SocketFactory';

export class SocketManager {
    private static isInitialized = false;

    // Инициализация менеджера
    public static async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Загружаем определения из БД
            await SocketFactory.loadSocketDefinitions();

            // Регистрируем фабрики для всех типов сокетов
            this.registerSocketTypes();

            this.isInitialized = true;
            console.log('SocketManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize SocketManager:', error);
        }
    }

    // Регистрация всех типов сокетов
    private static registerSocketTypes(): void {
        // Используем правильный тип конструктора
        SocketFactory.registerSocketType('integer', NumberSocket as SocketConstructor);
        SocketFactory.registerSocketType('string', StringSocket as SocketConstructor);
        SocketFactory.registerSocketType('text', StringSocket as SocketConstructor);

        console.log('Socket types registered:', {
            integer: SocketFactory.hasClass('integer'),
            string: SocketFactory.hasClass('string'),
            text: SocketFactory.hasClass('text')
        });
    }

    // Создание сокета
    public static createSocket(typeKey: string, name: string) {
        if (!this.isInitialized) {
            throw new Error('SocketManager not initialized. Call initialize() first.');
        }

        if (!SocketFactory.hasDefinition(typeKey)) {
            throw new Error(`Socket type "${typeKey}" not found in definitions`);
        }

        if (!SocketFactory.hasClass(typeKey)) {
            throw new Error(`Socket class for type "${typeKey}" not registered`);
        }

        return SocketFactory.createSocket(typeKey, name);
    }

    // Получение всех определений
    public static getSocketDefinitions() {
        return SocketFactory.getDefinitions();
    }

    // Проверка инициализации
    public static getIsInitialized(): boolean {
        return this.isInitialized;
    }

    // Получение информации о доступных типах
    public static getAvailableTypes(): string[] {
        return Array.from(SocketFactory.getDefinitions()).map(def => def.typeKey);
    }
}