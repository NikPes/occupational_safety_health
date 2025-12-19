// types.ts
export type ThemeMode = 'dark' | 'light';
export type GridMode = 'lines' | 'dots' | 'none';

export interface PhiConstructSpaceProps {
  theme?: ThemeMode;
  gridMode?: GridMode;
  onAddNode?: (nodeData: unknown) => void;
  className?: string;
}