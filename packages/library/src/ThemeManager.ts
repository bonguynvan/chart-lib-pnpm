import type { Theme, ThemeName } from '@tradecanvas/commons';
import { DARK_THEME, LIGHT_THEME } from '@tradecanvas/commons';

export class ThemeManager {
  private theme: Theme;

  constructor(themeOrName?: ThemeName | Theme) {
    if (!themeOrName || themeOrName === 'dark') {
      this.theme = { ...DARK_THEME };
    } else if (themeOrName === 'light') {
      this.theme = { ...LIGHT_THEME };
    } else {
      this.theme = { ...themeOrName };
    }
  }

  getTheme(): Theme {
    return this.theme;
  }

  setTheme(themeOrName: ThemeName | Theme): void {
    if (themeOrName === 'dark') {
      this.theme = { ...DARK_THEME };
    } else if (themeOrName === 'light') {
      this.theme = { ...LIGHT_THEME };
    } else {
      this.theme = { ...themeOrName };
    }
  }
}
