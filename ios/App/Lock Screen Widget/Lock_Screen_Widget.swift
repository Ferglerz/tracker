import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Intents
struct ToggleHabitIntent: AppIntent {
  static var title: LocalizedStringResource = "Toggle Habit"

  @Parameter(title: "Habit ID")
  var habitId: String

  init(habitId: String) {
    self.habitId = habitId
  }

  init() {
    self.habitId = ""
  }

  func perform() async throws -> some IntentResult {
    // Load current habit state
    let habits = try IonicStorageManager.shared.loadHabits()
    if let habit = habits.first(where: { $0.id == habitId }) {
      // Toggle to opposite of current state
      try IonicStorageManager.shared.updateHabitValue(habitId: habitId, value: !habit.isChecked)
    }
    // Trigger widget refresh
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
    return .result()
  }
}

struct RefreshWidgetIntent: AppIntent {
  static var title: LocalizedStringResource = "Refresh Widget"

  init() {}

  func perform() async throws -> some IntentResult {
    print("🔄 Refresh button pressed")
    
    if let userDefaults = UserDefaults(suiteName: "group.io.ionic.tracker") {
      print("📱 UserDefaults accessed")
      let success = userDefaults.synchronize()
      print("🔄 UserDefaults sync: \(success)")
      
      if let data = userDefaults.string(forKey: "habitData") {
        print("📊 Current data: \(data)")
      } else {
        print("⚠️ No habit data found")
      }
    } else {
      print("❌ Failed to access UserDefaults")
    }

    print("🔄 Reloading widget timelines")
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
    
    return .result()
  }
}

struct UpdateQuantityIntent: AppIntent {
  static var title: LocalizedStringResource = "Update Quantity"

  @Parameter(title: "Habit ID")
  var habitId: String

  @Parameter(title: "Increment")
  var increment: Bool

  init(habitId: String, increment: Bool) {
    self.habitId = habitId
    self.increment = increment
  }

  init() {
    self.habitId = ""
    self.increment = true
  }

  func perform() async throws -> some IntentResult {
    let habits = try IonicStorageManager.shared.loadHabits()
    if let habit = habits.first(where: { $0.id == habitId }) {
      let newValue = increment ? habit.quantity + 1 : max(0, habit.quantity - 1)
      try IonicStorageManager.shared.updateHabitValue(habitId: habitId, value: newValue)
    }
    // Trigger widget refresh
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
    return .result()
  }
}

// MARK: - Timeline Provider
struct Provider: TimelineProvider {
  let storage = IonicStorageManager.shared

  func placeholder(in context: Context) -> SimpleEntry {
    SimpleEntry(date: Date(), habits: [], error: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
    do {
      let habits = try storage.loadHabits()
      let entry = SimpleEntry(date: Date(), habits: habits, error: nil)
      completion(entry)
    } catch {
      completion(SimpleEntry(date: Date(), habits: [], error: error))
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    do {
      let habits = try storage.loadHabits()
      let currentDate = Date()
      let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!

      let entry = SimpleEntry(date: currentDate, habits: habits, error: nil)
      let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
      completion(timeline)
    } catch {
      let entry = SimpleEntry(date: Date(), habits: [], error: error)
      let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(60)))
      completion(timeline)
    }
  }
}

struct SimpleEntry: TimelineEntry {
  let date: Date
  let habits: [Habit]
  let error: Error?
}

// MARK: - Widget View
struct HabitWidgetEntryView: View {
  var entry: Provider.Entry
  var habit: Habit

  @Environment(\.widgetFamily) var widgetFamily

  @ViewBuilder
  private func refreshButton(color: Color) -> some View {
    Button(intent: RefreshWidgetIntent()) {
      Image(systemName: "arrow.clockwise")
        .font(.system(size: widgetFamily == .systemMedium ? 14 : 12))
        .foregroundColor(color)
    }
  }

  @ViewBuilder
  private func habitControls(color: Color) -> some View {
    if habit.type == .checkbox {
      Button(intent: ToggleHabitIntent(habitId: habit.id)) {
        Image(systemName: habit.isChecked ? "checkmark.square.fill" : "square")
          .font(.title2)
          .foregroundColor(color)
      }
    } else {
      HStack {
        Button(intent: UpdateQuantityIntent(habitId: habit.id, increment: false)) {
          Image(systemName: "minus.circle.fill")
            .font(.title2)
            .foregroundColor(color)
        }

        Spacer()

        Button(intent: UpdateQuantityIntent(habitId: habit.id, increment: true)) {
          Image(systemName: "plus.circle.fill")
            .font(.title2)
            .foregroundColor(color)
        }
      }
    }
  }

  @ViewBuilder

  private func habitLabel() -> some View {
    VStack(spacing: 2) {
      Text(habit.name)
        .font(.system(size: widgetFamily == .systemMedium ? 16 : 14))
        .fontWeight(.semibold)
        .lineLimit(1)
      if habit.type == .quantity {
        Text("\(habit.quantity)\(habit.goal.map { "/\($0)" } ?? "") \(habit.unit ?? "")")
          .font(.system(size: widgetFamily == .systemMedium ? 14 : 12))
          .lineLimit(1)
      }
    }
  }

  var body: some View {
    HStack {
      if habit.type == .checkbox {
        habitControls(color: widgetFamily == .systemMedium ? .blue : .white)
        Spacer()
        habitLabel()
        Spacer()
        refreshButton(color: widgetFamily == .systemMedium ? .gray : .white)
      } else {
        habitControls(color: widgetFamily == .systemMedium ? .blue : .white)
          .overlay(
            habitLabel()
              .frame(maxWidth: .infinity)
          )
        refreshButton(color: widgetFamily == .systemMedium ? .gray : .white)
          .padding(.leading, 8)
      }
    }
    .padding(.horizontal, widgetFamily == .systemMedium ? 20 : 12)
  }
}

// MARK: - Widget Configuration
struct Lock_Screen_Widget: Widget {
  let kind: String = "Lock_Screen_Widget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      ForEach(entry.habits, id: \.id) { habit in
        if #available(iOS 17.0, *) {
          HabitWidgetEntryView(entry: entry, habit: habit)
            .containerBackground(.fill.tertiary, for: .widget)
        } else {
          HabitWidgetEntryView(entry: entry, habit: habit)
            .padding()
            .background()
        }
      }
    }
    .configurationDisplayName("Habit Tracker")
    .description("Track your daily habits")
    .supportedFamilies([.accessoryRectangular, .systemMedium])
  }
}
// MARK: - Previews
#Preview(as: .systemMedium) {
  Lock_Screen_Widget()
} timeline: {
  SimpleEntry(date: .now, habits: [], error: nil)
}

#Preview(as: .accessoryRectangular) {
  Lock_Screen_Widget()
} timeline: {
  SimpleEntry(date: .now, habits: [], error: nil)
}
