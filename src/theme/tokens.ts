import type { ThemeName } from '../types';

/** Colors with a fixed meaning across every lesson. */
export interface SceneColors {
  bg: string;
  ground: string;
  platform: string;
  block: string;
  tx: string;
  valid: string;
  invalid: string;
  actor: string;
  tokenA: string;
  tokenB: string;
  contract: string;
  neutral: string;
  chain: string;
  ink: string;
}

export type ColorKey = keyof SceneColors;

export interface UiColors {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  inkSoft: string;
  line: string;
  accent: string;
  accentInk: string;
  shadow: string;
}

export interface ThemeTokens {
  ui: UiColors;
  scene: SceneColors;
  /** Emissive strength for highlighted objects. */
  glow: number;
  ambient: number;
  sun: number;
}

export const tokens: Record<ThemeName, ThemeTokens> = {
  light: {
    ui: {
      bg: '#F3EEE6',
      surface: '#FBF8F3',
      surface2: '#EAE3D7',
      ink: '#1F2430',
      inkSoft: '#5B6170',
      line: '#D9D0C1',
      accent: '#4A6BE0',
      accentInk: '#FFFFFF',
      shadow: 'rgba(60, 45, 20, 0.14)',
    },
    scene: {
      bg: '#F3EEE6',
      ground: '#E7DFD2',
      platform: '#FBF8F3',
      block: '#6C8EF5',
      tx: '#F5A623',
      valid: '#3FB58A',
      invalid: '#E5546B',
      actor: '#9B6CF5',
      tokenA: '#F06FA5',
      tokenB: '#38B6C9',
      contract: '#7C8AA5',
      neutral: '#CFC6B6',
      chain: '#8C8474',
      ink: '#1F2430',
    },
    glow: 0.12,
    ambient: 1.9,
    sun: 2.4,
  },
  dark: {
    ui: {
      bg: '#12141C',
      surface: '#1B1E2A',
      surface2: '#252938',
      ink: '#E8E9F0',
      inkSoft: '#A0A6B8',
      line: '#333850',
      accent: '#8CA5FF',
      accentInk: '#10131C',
      shadow: 'rgba(0, 0, 0, 0.5)',
    },
    scene: {
      bg: '#12141C',
      ground: '#191C28',
      platform: '#272B3C',
      block: '#7C9BFF',
      tx: '#FFB84D',
      valid: '#4FD1A1',
      invalid: '#FF6B81',
      actor: '#B28CFF',
      tokenA: '#FF7FB6',
      tokenB: '#4CCFE0',
      contract: '#94A3C4',
      neutral: '#3D4359',
      chain: '#6B7391',
      ink: '#E8E9F0',
    },
    glow: 0.55,
    ambient: 1.1,
    sun: 1.7,
  },
};
