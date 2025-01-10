export const CONSTANTS = {
  STORAGE: {
    KEY: 'habitData',
    GROUP: 'group.io.ionic.tracker'
  },
  UI: {
    CELLS_PER_ROW: 14,
    LONG_PRESS_DELAY: 350,
    DEFAULT_COLOR: '#657c9a',
    DEFAULT_CORNER_RADIUS: 5,
    DEFAULT_BASE_SIZE: 8,
    DEFAULT_GAP: 1,
    MAX_ROW_OPACITY: 0.7,
    ROW_OPACITY_DECREMENT: 0.15
  },
  PRESET_COLORS: [
    '#657c9a', // Muted Blue 
    '#228B22', // Dark Green (4.39)
    '#FA8072', // Salmon (2.50)
    '#CC0000', // Red (5.89)
    '#1B4B9E', // Dark Blue (8.25)
    '#33cca1', // Sea Foam
    '#F4781D', // Orange (2.78)
    '#CC9933', // Ocre Yellow (2.57)
    '#663399', // Purple (8.41)
    '#8B4513'  // Brown (7.10)
  ] as const,
  WIDGET_SECTIONS: [
    { title: 'Lock Screen 1', spaces: 1, type: 'lock1' },
    { title: 'Lock Screen 2', spaces: 1, type: 'lock2' },
    { title: 'Small Widget 1', spaces: 3, type: 'small1' },
    { title: 'Small Widget 2', spaces: 3, type: 'small2' },
    { title: 'Medium Widget 1', spaces: 6, type: 'medium1' },
    { title: 'Medium Widget 2', spaces: 6, type: 'medium2' },
    { title: 'Large Widget 1', spaces: 8, type: 'large1' },
    { title: 'Large Widget 2', spaces: 8, type: 'large2' }
  ] as const
} as const;

export type PresetColor = typeof CONSTANTS.PRESET_COLORS[number];
export type WidgetType = typeof CONSTANTS.WIDGET_SECTIONS[number]['type'];