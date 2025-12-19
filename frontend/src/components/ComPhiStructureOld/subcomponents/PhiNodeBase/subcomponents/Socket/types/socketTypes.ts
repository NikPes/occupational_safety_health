// subcomponents/Socket/types/socketTypes.ts

export interface SocketVisualProps {
    color: string;
    icon: string;
    typeName: string;
    description?: string;
}

export interface SocketDefinition {
    id: string;
    name: string;
    typeKey: string;
    compatibleWith: string[];
    visualProps: SocketVisualProps;
    description?: string;
    isDeprecated?: boolean;
}

export type SocketType = 'input' | 'output' | 'parameter';
export type DataFlowDirection = 'in' | 'out';

// Типы данных из БД
export type PrimitiveType =
    | 'integer'
    | 'string'
    | 'text'
    | 'boolean'
    | 'number'
    | 'date'
    | 'datetime';

export type ComplexType =
    | 'array'
    | 'object'
    | 'query'
    | 'connection'
    | 'table_data'
    | 'any';

export type SocketDataType = PrimitiveType | ComplexType;

// Для dropdown - можно использовать integer для ID или string для значений
export type DropdownValueType = 'integer' | 'string';