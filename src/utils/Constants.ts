import { IconCategory } from "./TypesAndProps";

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
    '#2eb82e', // Dark Green
    '#FA8072', // Salmon 
    '#CC3333', // Red 
    '#1B4B9E', // Dark Blue (8.25)
    '#33b8c1', // Sea Foam
    '#F4781D', // Orange (2.78)
    '#CC9933', // Ocre Yellow (2.57)
    '#663399', // Purple (8.41)
  ] as const,
  WIDGET_SECTIONS: [
    { title: 'Lock Screen 1', spaces: 2, type: 'lock1' },
    { title: 'Lock Screen 2', spaces: 2, type: 'lock2' },
    { title: 'Small Widget 1', spaces: 4, type: 'small1' },
    { title: 'Small Widget 2', spaces: 4, type: 'small2' },
    { title: 'Medium Widget 1', spaces: 8, type: 'medium1' },
    { title: 'Medium Widget 2', spaces: 8, type: 'medium2' }
  ] as const,
  HISTORY_GRID: { // New category for HistoryGrid constants
    DEFAULT_GRAY: 'rgba(128, 128, 128, 0.1)',
    DEFAULT_ROWS_COUNT: 3
  }
} as const;

export const ICON_CATEGORIES: IconCategory[] = [
  {
    name: "General/Routine",
    icons: [
      { name: "Checkmark Circle", icon: "checkmarkCircle", tags: "success, completion, done, finished, accomplished, achieved" },
      { name: "Calendar", icon: "calendar", tags: "daily, weekly, tracking, schedule, planner, dates, events" },
      { name: "Time", icon: "time", tags: "duration, tracking, clock, hours, minutes, timing, schedule" },
      { name: "Alarm", icon: "alarm", tags: "reminders, alerts, notifications, wake-up, schedule, timer" },
      { name: "Refresh", icon: "refresh", tags: "reset, restart, renew, begin again, streaks, cycles" },
      { name: "Sync", icon: "sync", tags: "synchronization, backup, cloud, update, data, transfer" },
      { name: "List", icon: "list", tags: "habits, tasks, todos, checklist, items, organize" },
      { name: "Grid", icon: "grid", tags: "overview, dashboard, layout, organization, structure" },
      { name: "Stats Chart", icon: "statsChart", tags: "progress, visualization, data, metrics, analytics, graphs" },
      { name: "Analytics", icon: "analytics", tags: "statistics, tracking, metrics, data, insights, progress" },
      { name: "Notifications", icon: "notifications", tags: "alerts, reminders, updates, messages, prompts" },
      { name: "Star", icon: "star", tags: "favorite, important, priority, bookmark, special" },
      { name: "Ribbon", icon: "ribbon", tags: "milestones, achievements, awards, recognition, success" },
      { name: "Trophy", icon: "trophy", tags: "achievements, goals, success, victory, accomplishment, win" },
      { name: "Trending Up", icon: "trendingUp", tags: "progress, improvement, growth, increase, advancement" },
      { name: "Pulse", icon: "pulse", tags: "activity, energy, vitality, rhythm, frequency, intensity" },
      { name: "Hourglass", icon: "hourglass", tags: "time management, deadline, countdown, duration, waiting" },
      { name: "Medal", icon: "medal", tags: "achievements, awards, recognition, success, honor" },
      { name: "Shield Checkmark", icon: "shieldCheckmark", tags: "challenges, protection, security, completion, success" },
      { name: "Timer", icon: "timer", tags: "countdown, tracking, duration, stopwatch, timing" },
      { name: "Sparkles", icon: "sparkles", tags: "new, achievements, celebration, special, highlight" }
    ]
  },
  {
    name: "Fitness",
    icons: [
      { name: "Barbell", icon: "barbell", tags: "weight training, strength, gym, lifting, exercise, muscles" },
      { name: "Walk", icon: "walk", tags: "walking, running, jogging, steps, cardio, movement" },
      { name: "Bicycle", icon: "bicycle", tags: "cycling, biking, cardio, outdoor, exercise, spinning" },
      { name: "Fitness", icon: "fitness", tags: "exercise, workout, health, training, wellness, activity" },
      { name: "Body", icon: "body", tags: "measurements, progress, physique, weight, shape, form" },
      { name: "Heart", icon: "heart", tags: "cardio, health, pulse, heart-rate, cardiovascular, intensity" },
      { name: "Flame", icon: "flame", tags: "calories, burning, energy, metabolism, intensity, heat" },
      { name: "Stopwatch", icon: "stopwatch", tags: "workouts, timing, intervals, duration, sets, training" },
      { name: "Compass", icon: "compass", tags: "outdoor, navigation, hiking, direction, adventure" },
      { name: "Medkit", icon: "medkit", tags: "health, medical, wellness, recovery, first-aid" },
      { name: "Hand Right", icon: "handRight", tags: "stretching, flexibility, mobility, yoga, reach" },
      { name: "People", icon: "people", tags: "group workouts, classes, social, team, partners" },
      { name: "Speedometer", icon: "speedometer", tags: "intensity, pace, speed, performance, effort" },
      { name: "Footsteps", icon: "footsteps", tags: "steps, walking, distance, movement, tracking, pedometer" }
    ]
  },
  {
    name: "Food",
    icons: [
      { name: "Restaurant", icon: "restaurant", tags: "meals, dining, food, eating, nutrition, cooking" },
      { name: "Pizza", icon: "pizza", tags: "junk food, fast food, treats, cheat meals, snacks" },
      { name: "Nutrition", icon: "nutrition", tags: "healthy eating, diet, nutrients, vitamins, minerals" },
      { name: "Fast Food", icon: "fastFood", tags: "junk food, quick meals, unhealthy, convenience" },
      { name: "Cafe", icon: "cafe", tags: "coffee, tea, beverages, drinks, caffeine, morning" },
      { name: "Water Bottle", icon: "water", tags: "hydration, drinking, fluids, water intake, beverages" },
      { name: "Wine", icon: "wine", tags: "alcohol, drinks, beverages, moderation, social" },
      { name: "Scale", icon: "scale", tags: "weight, portions, measuring, balance, control" },
      { name: "Leaf", icon: "leaf", tags: "vegetarian, vegan, plant-based, healthy, organic" },
      { name: "Fish", icon: "fish", tags: "seafood, protein, omega-3, healthy fats, marine" }
    ]
  },
  {
    name: "Work/Productivity",
    icons: [
      { name: "Briefcase", icon: "briefcase", tags: "work, career, business, professional, job, office" },
      { name: "Laptop", icon: "laptop", tags: "computer, work, digital, technology, remote, online" },
      { name: "Document Text", icon: "documentText", tags: "writing, reading, documents, papers, notes, text" },
      { name: "Checkmark Done", icon: "checkmarkDone", tags: "completed, finished, accomplished, tasks, done" },
      { name: "Folder", icon: "folder", tags: "projects, files, organization, storage, documents" },
      { name: "Bulb", icon: "bulb", tags: "creative, ideas, inspiration, innovation, thinking" },
      { name: "Terminal", icon: "terminal", tags: "coding, programming, development, tech, software" },
      { name: "Desktop", icon: "desktop", tags: "screen time, computer, monitor, display, work" },
      { name: "Phone Portrait", icon: "phonePortrait", tags: "mobile, device, screen time, digital, apps" },
      { name: "Timer Outline", icon: "timerOutline", tags: "pomodoro, focus, time blocks, productivity" },
      { name: "Glasses", icon: "glasses", tags: "screen breaks, eye strain, vision, rest, reading" }
    ]
  },
  {
    name: "Education",
    icons: [
      { name: "Book", icon: "book", tags: "reading, studying, learning, literature, education, knowledge" },
      { name: "School", icon: "school", tags: "classes, courses, education, learning, academics, study" },
      { name: "Pencil", icon: "pencil", tags: "writing, notes, homework, assignments, drawing" },
      { name: "Library", icon: "library", tags: "research, learning, books, study, knowledge, resources" },
      { name: "Language", icon: "language", tags: "languages, learning, translation, communication, international" },
      { name: "Calculator", icon: "calculator", tags: "math, calculations, numbers, arithmetic, computing" },
      { name: "Headset", icon: "headset", tags: "audio learning, listening, podcasts, lectures, music" },
      { name: "Mic", icon: "mic", tags: "speaking, pronunciation, presentation, voice, recording" }
    ]
  },
  {
    name: "Sports",
    icons: [
      { name: "Basketball", icon: "basketball", tags: "basketball, sports, game, exercise, team, court" },
      { name: "Football", icon: "football", tags: "soccer, football, sports, game, team, field" },
      { name: "Tennisball", icon: "tennisball", tags: "tennis, sports, game, racket, court, exercise" },
      { name: "Golf", icon: "golf", tags: "golf, sports, game, outdoor, course, putting" },
      { name: "Baseball", icon: "baseball", tags: "baseball, sports, game, team, field, batting" },
      { name: "Bowling Ball", icon: "bowlingBall", tags: "bowling, sports, game, pins, alley, strike" }
    ]
  },
  {
    name: "Other/Mood",
    icons: [
      { name: "Happy", icon: "happy", tags: "positive mood, happiness, joy, emotions, well-being, mental health" },
      { name: "Sad", icon: "sad", tags: "negative mood, sadness, emotions, feelings, mental health" },
      { name: "Bed", icon: "bed", tags: "sleep, rest, bedtime, nap, relaxation, recovery" },
      { name: "Water", icon: "water", tags: "hydration, drinking, fluids, health, wellness, intake" },
      { name: "Sunny", icon: "sunny", tags: "weather, sunshine, outdoors, mood, daylight, energy" },
      { name: "Moon", icon: "moon", tags: "evening, night, sleep, routine, rest, relaxation" },
      { name: "Musical Notes", icon: "musicalNotes", tags: "music, practice, instruments, playing, performance" },
      { name: "Brush", icon: "brush", tags: "art, painting, creativity, drawing, expression" },
      { name: "Bandage", icon: "bandage", tags: "health, symptoms, injury, healing, recovery, treatment" },
      { name: "Eye", icon: "eye", tags: "vision, screen breaks, sight, rest, eye strain" },
      { name: "Ear", icon: "ear", tags: "meditation, mindfulness, listening, hearing, relaxation, focus" }
    ]
  }
];

export type PresetColor = typeof CONSTANTS.PRESET_COLORS[number];
export type WidgetType = typeof CONSTANTS.WIDGET_SECTIONS[number]['type'];