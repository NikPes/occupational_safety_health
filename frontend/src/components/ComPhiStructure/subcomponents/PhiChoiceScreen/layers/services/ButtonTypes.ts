// src/subcomponents/PhiChoiceScreen/layers/services/ButtonTypes.ts
import { Container, Graphics, Text, Sprite } from 'pixi.js';

export type ButtonType = 'node' | 'scheme';
export type ButtonVariant = 'primary' | 'neutral' | 'positive' | 'negative';

export interface ButtonConfig {
  id: ButtonType;
  label: string;
  width: number;
  height: number;
  svgPath: string;
  variant: ButtonVariant;
}

export interface ButtonElements {
  container: Container;
  background: Graphics;
  icon: Sprite;
  title: Text;
  outline: Graphics;
}

export interface ButtonTheme {
  backgroundColor: number;
  textColor: number;
}

export interface ThemeColors {
  dark: ButtonTheme;
  light: ButtonTheme;
}

export type ColorElement = 'icon' | 'text';