const STORAGE_KEY = 'tutbus_theme';

export type Theme = 'light' | 'dark';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

/** Applies the theme to <html> and persists it. Call on toggle. */
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
}

/** Inlined into the root layout's <head> so the theme is set before first
 * paint — without this, the page would flash light mode for a moment
 * before React hydrates and can apply the stored preference. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;
