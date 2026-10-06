import type { ThemeName } from '../types';
import { tokens } from './tokens';

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Writes the theme's colors to CSS variables: --bg, --ink-soft, --c-tx, --c-token-a ... */
export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  const t = tokens[theme];
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  for (const [k, v] of Object.entries(t.ui)) root.style.setProperty(`--${kebab(k)}`, v);
  for (const [k, v] of Object.entries(t.scene)) root.style.setProperty(`--c-${kebab(k)}`, v);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.ui.bg);
}
