// subcomponents/Socket/SocketFactory.ts
import { BaseSocket } from './BaseSocket';
import { SocketDefinition } from './types/socketTypes';

// Тип для конструктора сокета
export type SocketConstructor = {
    new (definition: SocketDefinition): BaseSocket;
};

export class SocketFactory {
    private static socketRegistry: Map<string, SocketConstructor> = new Map();
    private static socketDefinitions: Map<string, SocketDefinition> = new Map();

    // Регистрация типа сокета
    public static registerSocketType(typeKey: string, socketClass: SocketConstructor): void {
        this.socketRegistry.set(typeKey, socketClass);
    }

    // Загрузка определений из API
    public static async loadSocketDefinitions(): Promise<void> {
        try {
            const response = await fetch('/WorkOST/phi_socket/definitions');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const definitions: SocketDefinition[] = await response.json();

            definitions.forEach(def => {
                this.socketDefinitions.set(def.typeKey, def);
            });

            console.log('Socket definitions loaded successfully');
        } catch (error) {
            console.error('Failed to load socket definitions:', error);
            // Fallback определения
            this.loadFallbackDefinitions();
        }
    }

    // Fallback определения на случай если API недоступно
    private static loadFallbackDefinitions(): void {
        const fallbackDefinitions: SocketDefinition[] = [
            {
                id: '1',
                name: 'integer',
                typeKey: 'integer',
                compatibleWith: ['integer', 'number'],
                visualProps: {
                    color: '#3B82F6',
                    icon: '🔢',
                    typeName: 'Целое число'
                },
                description: 'Числовые значения: целые'
            },
            {
                id: '2',
                name: 'string',
                typeKey: 'string',
                compatibleWith: ['string', 'text'],
                visualProps: {
                    color: '#10B981',
                    icon: '📝',
                    typeName: 'Строка'
                },
                description: 'Текстовые данные: строки, символы, текст'
            },
            {
                id: '3',
                name: 'text',
                typeKey: 'text',
                compatibleWith: ['string', 'text'],
                visualProps: {
                    color: '#30B981',
                    icon: '📝',
                    typeName: 'Текст'
                },
                description: 'Текстовое поле'
            }
        ];

        fallbackDefinitions.forEach(def => {
            this.socketDefinitions.set(def.typeKey, def);
        });
    }

    // Создание сокета по typeKey
    public static createSocket(typeKey: string, name: string): BaseSocket {
        const definition = this.socketDefinitions.get(typeKey);
        if (!definition) {
            throw new Error(`Socket definition for type ${typeKey} not found`);
        }

        const SocketClass = this.socketRegistry.get(typeKey);
        if (!SocketClass) {
            throw new Error(`Socket class for type ${typeKey} not registered`);
        }

        // Создаем экземпляр с обновленным именем
        return new SocketClass({
            ...definition,
            name,
            id: `socket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
    }

    // Получение всех определений
    public static getDefinitions(): SocketDefinition[] {
        return Array.from(this.socketDefinitions.values());
    }

    // Получение определения по typeKey
    public static getDefinition(typeKey: string): SocketDefinition | undefined {
        return this.socketDefinitions.get(typeKey);
    }

    // Проверка наличия определения
    public static hasDefinition(typeKey: string): boolean {
        return this.socketDefinitions.has(typeKey);
    }

    // Проверка наличия класса
    public static hasClass(typeKey: string): boolean {
        return this.socketRegistry.has(typeKey);
    }
}