// constants.ts
export const CONSTANTS = {
  STORAGE: {
    HABITS_KEY: 'habitData',
    SETTINGS_KEY: 'settings',
    GROUP: 'group.io.ionic.tracker'
  },
  UI: {
    CELLS_PER_ROW: 12,
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
  ] as const,
  HISTORY_GRID: { // New category for HistoryGrid constants
    DEFAULT_GRAY: 'rgba(128, 128, 128, 0.1)',
    DEFAULT_ROWS_COUNT: 3
  }
} as const;

// Add to Constants.ts

export interface IconCategoryItem {
  name: string;
  icon: string;
  description: string;
}

export interface IconCategory {
  name: string;
  icons: IconCategoryItem[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    name: "General/Routine",
    icons: [
      { name: "Checkmark Circle", icon: "checkmarkCircle", description: "Success/completion" },
      { name: "Calendar", icon: "calendar", description: "Daily/weekly tracking" },
      { name: "Time", icon: "time", description: "Time spent on habits" },
      { name: "Alarm", icon: "alarm", description: "Reminders" },
      { name: "Refresh", icon: "refresh", description: "Resetting streaks" },
      { name: "Sync", icon: "sync", description: "Data synchronization" },
      { name: "List", icon: "list", description: "Habit lists" },
      { name: "Grid", icon: "grid", description: "Overview of habits" },
      { name: "Stats Chart", icon: "statsChart", description: "Progress visualization" },
      { name: "Analytics", icon: "analytics", description: "Tracking statistics" },
      { name: "Notifications", icon: "notifications", description: "Reminders and updates" },
      { name: "Star", icon: "star", description: "Favorite habits" },
      { name: "Ribbon", icon: "ribbon", description: "Achieving milestones" },
      { name: "Trophy", icon: "trophy", description: "Achievements/goals reached" },
      { name: "Trending Up", icon: "trendingUp", description: "Progress tracking" },
      { name: "Pulse", icon: "pulse", description: "Activity level" },
      { name: "Hourglass", icon: "hourglass", description: "Time management" },
      { name: "Medal", icon: "medal", description: "Achievements" },
      { name: "Shield Checkmark", icon: "shieldCheckmark", description: "Completed challenges" },
      { name: "Timer", icon: "timer", description: "Time tracking" },
      { name: "Sparkles", icon: "sparkles", description: "New habits/achievements" }
    ]
  },
  {
    name: "Fitness",
    icons: [
      { name: "Barbell", icon: "barbell", description: "Weight training" },
      { name: "Walk", icon: "walk", description: "Walking/running" },
      { name: "Bicycle", icon: "bicycle", description: "Cycling" },
      { name: "Fitness", icon: "fitness", description: "General fitness" },
      { name: "Body", icon: "body", description: "Body measurements/progress" },
      { name: "Heart", icon: "heart", description: "Cardio/heart health" },
      { name: "Flame", icon: "flame", description: "Calories burned" },
      { name: "Stopwatch", icon: "stopwatch", description: "Timed workouts" },
      { name: "Compass", icon: "compass", description: "Outdoor activities" },
      { name: "Medkit", icon: "medkit", description: "Health tracking" },
      { name: "Hand Right", icon: "handRight", description: "Stretching" },
      { name: "People", icon: "people", description: "Group workouts" },
      { name: "Speedometer", icon: "speedometer", description: "Intensity tracking" },
      { name: "Footsteps", icon: "footsteps", description: "Step counting" }
    ]
  },
  {
    name: "Food",
    icons: [
      { name: "Restaurant", icon: "restaurant", description: "Meals" },
      { name: "Pizza", icon: "pizza", description: "Less healthy food tracking" },
      { name: "Nutrition", icon: "nutrition", description: "Nutrition tracking" },
      { name: "Fast Food", icon: "fastFood", description: "Fast food tracking" },
      { name: "Cafe", icon: "cafe", description: "Coffee/tea consumption" },
      { name: "Water Bottle", icon: "water", description: "Hydration" },
      { name: "Wine", icon: "wine", description: "Alcohol tracking" },
      { name: "Scale", icon: "scale", description: "Weight/portions" },
      { name: "Leaf", icon: "leaf", description: "Vegetarian meals" },
      { name: "Fish", icon: "fish", description: "Seafood intake" }
    ]
  },
  {
    name: "Work/Productivity",
    icons: [
      { name: "Briefcase", icon: "briefcase", description: "Work/career" },
      { name: "Laptop", icon: "laptop", description: "Computer work" },
      { name: "Document Text", icon: "documentText", description: "Writing/reading" },
      { name: "Checkmark Done", icon: "checkmarkDone", description: "Tasks completed" },
      { name: "Folder", icon: "folder", description: "Project tracking" },
      { name: "Bulb", icon: "bulb", description: "Creative work" },
      { name: "Terminal", icon: "terminal", description: "Coding" },
      { name: "Desktop", icon: "desktop", description: "Screen time" },
      { name: "Phone Portrait", icon: "phonePortrait", description: "Phone usage" },
      { name: "Timer Outline", icon: "timerOutline", description: "Pomodoro sessions" },
      { name: "Glasses", icon: "glasses", description: "Screen breaks" }
    ]
  },
  {
    name: "Education",
    icons: [
      { name: "Book", icon: "book", description: "Reading/studying" },
      { name: "School", icon: "school", description: "Classes/courses" },
      { name: "Pencil", icon: "pencil", description: "Writing/notes" },
      { name: "Library", icon: "library", description: "Research/learning" },
      { name: "Language", icon: "language", description: "Language learning" },
      { name: "Calculator", icon: "calculator", description: "Math practice" },
      { name: "Headset", icon: "headset", description: "Audio learning" },
      { name: "Mic", icon: "mic", description: "Speaking practice" }
    ]
  },
  {
    name: "Sports",
    icons: [
      { name: "Basketball", icon: "basketball", description: "Basketball" },
      { name: "Football", icon: "football", description: "Football/soccer" },
      { name: "Tennisball", icon: "tennisball", description: "Tennis" },
      { name: "Golf", icon: "golf", description: "Golf" },
      { name: "Swim", icon: "swim", description: "Swimming" },
      { name: "Baseball", icon: "baseball", description: "Baseball" },
      { name: "Volleyball", icon: "volleyball", description: "Volleyball" },
      { name: "Bowling Ball", icon: "bowlingBall", description: "Bowling" }
    ]
  },
  {
    name: "Other/Mood",
    icons: [
      { name: "Happy", icon: "happy", description: "Positive mood tracking" },
      { name: "Sad", icon: "sad", description: "Negative mood tracking" },
      { name: "Bed", icon: "bed", description: "Sleep tracking" },
      { name: "Water", icon: "water", description: "Hydration tracking" },
      { name: "Sunny", icon: "sunny", description: "Weather impact" },
      { name: "Moon", icon: "moon", description: "Evening routine" },
      { name: "Musical Notes", icon: "musicalNotes", description: "Music practice" },
      { name: "Brush", icon: "brush", description: "Art practice" },
      { name: "Bandage", icon: "bandage", description: "Health symptoms" },
      { name: "Eye", icon: "eye", description: "Screen time breaks" },
      { name: "Ear", icon: "ear", description: "Meditation/mindfulness" }
    ]
  }    
];

export type PresetColor = typeof CONSTANTS.PRESET_COLORS[number];
export type WidgetType = typeof CONSTANTS.WIDGET_SECTIONS[number]['type'];