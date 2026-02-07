import { ref, watch } from 'vue'

export type ThemeColorName =
  | 'base' | 'mantle' | 'crust'
  | 'surface0' | 'surface1' | 'surface2'
  | 'overlay0' | 'overlay1' | 'overlay2'
  | 'subtext0' | 'subtext1' | 'text'
  | 'lavender' | 'blue' | 'sapphire' | 'sky' | 'teal'
  | 'green' | 'yellow' | 'peach' | 'maroon' | 'red'
  | 'mauve' | 'pink' | 'flamingo' | 'rosewater'

export type ThemeName = 'latte' | 'frappe' | 'macchiato' | 'mocha'

const themeDisplayNames: Record<ThemeName, string> = {
  latte: 'Latte',
  frappe: 'Frappe',
  macchiato: 'Macchiato',
  mocha: 'Mocha',
}

const themeNames: ThemeName[] = ['latte', 'frappe', 'macchiato', 'mocha']

const STORAGE_KEY = 'doto-theme'

function loadSavedTheme(): ThemeName {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && themeNames.includes(saved as ThemeName)) {
    return saved as ThemeName
  }
  return 'mocha'
}

const currentThemeName = ref<ThemeName>(loadSavedTheme())

function syncDataTheme(name: ThemeName) {
  document.documentElement.dataset.theme = name
}

// Set immediately on load
syncDataTheme(currentThemeName.value)

// Keep in sync when theme changes
watch(currentThemeName, syncDataTheme)

export function themeColor(name: string): string {
  return `var(--ctp-${name})`
}

export function useTheme() {
  function setTheme(name: ThemeName) {
    currentThemeName.value = name
    localStorage.setItem(STORAGE_KEY, name)
  }

  function cycleTheme() {
    const currentIndex = themeNames.indexOf(currentThemeName.value)
    const nextIndex = (currentIndex + 1) % themeNames.length
    currentThemeName.value = themeNames[nextIndex] as ThemeName
  }

  return {
    themeName: currentThemeName,
    themeNames,
    themeDisplayNames,
    setTheme,
    cycleTheme,
  }
}
