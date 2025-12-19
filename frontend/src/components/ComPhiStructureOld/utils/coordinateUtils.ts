export const screenToWorldCoordinates = (
    screenX: number,
    screenY: number,
    canvas: HTMLCanvasElement,
    transform: { x: number; y: number },
    scale: number
): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    const worldX = (canvasX - transform.x) / scale;
    const worldY = (canvasY - transform.y) / scale;

    return { x: worldX, y: worldY };
};

export const getCanvasCoordinates = (
    screenX: number,
    screenY: number,
    canvas: HTMLCanvasElement
): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: screenX - rect.left,
        y: screenY - rect.top
    };
};

export const worldToScreenCoordinates = (
    worldX: number,
    worldY: number,
    canvas: HTMLCanvasElement,
    transform: { x: number; y: number },
    scale: number
): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const canvasX = worldX * scale + transform.x;
    const canvasY = worldY * scale + transform.y;

    const screenX = canvasX + rect.left;
    const screenY = canvasY + rect.top;

    return { x: screenX, y: screenY };
};