// core/types/settings.ts
export interface UserSettings {
  theme: 'dark' | 'light';
  uiPhiNode: {
    scale: number;
    animations: boolean;
    gridMode: 'lines' | 'dots' | 'none';
  };
}