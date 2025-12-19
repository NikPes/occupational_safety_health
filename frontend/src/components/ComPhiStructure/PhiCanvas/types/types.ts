// PhiCanvas/utils/types.ts
export type ContainerMode = 'choice' | 'node' | 'scheme';
export type CanvasMode = 'choice' | 'node' | 'scheme' | 'none';

export interface UserSettings {
  theme: 'dark' | 'light';
  uiPhiNode: {
    scale: number;
    animations: boolean;
    gridMode: 'lines' | 'dots' | 'none';
  };
}

export interface ContainerSize {
  width: number;
  height: number;
}