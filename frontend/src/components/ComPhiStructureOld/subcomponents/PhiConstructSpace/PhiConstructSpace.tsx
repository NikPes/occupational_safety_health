import React, { forwardRef, useRef, useEffect, useImperativeHandle, useState, useCallback } from 'react';
import { PhiConstructSpaceView } from './PhiConstructSpaceView';
import { PhiConstructSpaceProps, ThemeMode, GridMode } from './types';

export interface PhiConstructSpaceHandle {
    addNode: () => void;
    setTheme: (theme: ThemeMode) => void;
    setGridMode: (mode: GridMode) => void;
    resize: (width: number, height: number) => void;
    getTitle: () => string;
    getCurrentTransform: () => { scale: number; position: { x: number; y: number } } | undefined;
    onTransformChange: (callback: (transform: { scale: number; position: { x: number; y: number } }) => void) => void;
}

export const PhiConstructSpace = forwardRef<PhiConstructSpaceHandle, PhiConstructSpaceProps>(
    ({ theme = 'dark', gridMode = 'lines', onAddNode, className }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const phiViewRef = useRef<PhiConstructSpaceView | null>(null);
        const [isInitialized, setIsInitialized] = useState(false);
        const resizeObserverRef = useRef<ResizeObserver | null>(null);

        // Состояние для трансформаций (для использования в useNodeDrag)
        const [currentTransform, setCurrentTransform] = useState({
            scale: 1,
            position: { x: 0, y: 0 }
        });

        // ✅ Создаем стабильную функцию updateSize
        const updateSize = useCallback(() => {
            if (containerRef.current && phiViewRef.current && isInitialized) {
                const rect = containerRef.current.getBoundingClientRect();
                const width = Math.max(rect.width, 100);
                const height = Math.max(rect.height, 100);

                if (phiViewRef.current.resize) {
                    phiViewRef.current.resize(width, height);
                }
            }
        }, [isInitialized]);

        // ✅ Используем useRef для хранения текущей функции
        const updateSizeRef = useRef(updateSize);
        updateSizeRef.current = updateSize;

        useImperativeHandle(ref, () => ({
            addNode: () => phiViewRef.current?.addNode(),
            setTheme: (theme: ThemeMode) => phiViewRef.current?.setTheme(theme),
            setGridMode: (mode: GridMode) => phiViewRef.current?.setGridMode(mode),
            resize: (width: number, height: number) => phiViewRef.current?.resize(width, height),
            getTitle: () => phiViewRef.current?.getTitle() || 'Phi Node',
            getCurrentTransform: () => {
                if (phiViewRef.current && phiViewRef.current.getCurrentTransform) {
                    return phiViewRef.current.getCurrentTransform();
                }
                return { scale: 1, position: { x: 0, y: 0 } };
            },
            onTransformChange: (callback: (transform: { scale: number; position: { x: number; y: number } }) => void) => {
                if (phiViewRef.current && phiViewRef.current.reactonTransformChange) {
                    phiViewRef.current.reactonTransformChange(callback);
                }
            }
        }));

        useEffect(() => {
            if (!containerRef.current) return;

            let isMounted = true;
            const phiView = new PhiConstructSpaceView();
            phiViewRef.current = phiView;

            const initialize = async () => {
                try {
                    await phiView.waitForInitialization();

                    if (!isMounted || !containerRef.current) return;

                    if (phiView.app && phiView.app.canvas && phiView.app.stage) {
                        containerRef.current.innerHTML = '';

                        phiView.app.canvas.style.display = 'block';
                        phiView.app.canvas.style.width = '100%';
                        phiView.app.canvas.style.height = '100%';

                        containerRef.current.appendChild(phiView.app.canvas);

                        // Подписываемся на изменения трансформаций
                        if (phiView.reactonTransformChange) {
                            phiView.reactonTransformChange((transform) => {
                                if (isMounted) {
                                    setCurrentTransform(transform);
                                }
                            });
                        }

                        // Устанавливаем тему и сетку через новую архитектуру
                        phiView.setTheme(theme);
                        phiView.setGridMode(gridMode);

                        updateSizeRef.current();

                        if (isMounted) {
                            setIsInitialized(true);
                        }
                    }
                } catch (error) {
                    console.error('Failed to initialize PhiConstructSpace:', error);
                    if (isMounted) {
                        setIsInitialized(true);
                    }
                }
            };

            initialize();

            return () => {
                isMounted = false;

                if (resizeObserverRef.current) {
                    resizeObserverRef.current.disconnect();
                    resizeObserverRef.current = null;
                }

                if (phiViewRef.current) {
                    const viewToDestroy = phiViewRef.current;
                    phiViewRef.current = null;

                    viewToDestroy.safeDestroy();
                }
            };
        }, [theme, gridMode]);

        // ✅ Настройка ResizeObserver
        useEffect(() => {
            if (!containerRef.current || !isInitialized) return;

            const handleResize = () => {
                updateSizeRef.current();
            };

            resizeObserverRef.current = new ResizeObserver(handleResize);
            resizeObserverRef.current.observe(containerRef.current);

            const handleWindowResize = () => {
                updateSizeRef.current();
            };

            window.addEventListener('resize', handleWindowResize);

            return () => {
                if (resizeObserverRef.current) {
                    resizeObserverRef.current.disconnect();
                    resizeObserverRef.current = null;
                }
                window.removeEventListener('resize', handleWindowResize);
            };
        }, [isInitialized]);

        // ✅ Обновление темы
        useEffect(() => {
            if (isInitialized && phiViewRef.current) {
                phiViewRef.current.setTheme(theme);
            }
        }, [theme, isInitialized]);

        // ✅ Обновление режима сетки
        useEffect(() => {
            if (isInitialized && phiViewRef.current) {
                phiViewRef.current.setGridMode(gridMode);
            }
        }, [gridMode, isInitialized]);

        // ✅ Обработчик добавления нода
        useEffect(() => {
            if (isInitialized && onAddNode) {
                // Можно добавить логику обработки onAddNode callback
            }
        }, [isInitialized, onAddNode]);

        return (
            <div
                ref={containerRef}
                className={className}
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                    minWidth: '100px',
                    minHeight: '100px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            />
        );
    }
);

PhiConstructSpace.displayName = 'PhiConstructSpace';
