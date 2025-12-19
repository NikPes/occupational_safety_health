export type ThemeMode = 'dark' | 'light';
export type GridMode = 'lines' | 'dots' | 'none';

// Другие общие типы которые могут понадобиться
export interface Vector2 {
    x: number;
    y: number;
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}