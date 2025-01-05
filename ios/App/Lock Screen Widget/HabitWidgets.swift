import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Intents
struct ToggleHabitIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Habit"
    
    @Parameter(title: "Habit ID")
    var habitId: String

    init() { }
    
    init(habitId: String) {
        self.habitId = habitId
    }

    func perform() async throws -> some IntentResult {
        let habits = try IonicStorageManager.shared.loadHabits()
        if let habit = habits.first(where: { $0.id == habitId }) {
            try IonicStorageManager.shared.updateHabitValue(habitId: habitId, value: !habit.isChecked)
        }
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

    init() { }
    
    init(habitId: String, increment: Bool = true) {
        self.habitId = habitId
        self.increment = increment
    }

    func perform() async throws -> some IntentResult {
        let habits = try IonicStorageManager.shared.loadHabits()
        if let habit = habits.first(where: { $0.id == habitId }) {
            let newValue = increment ? habit.quantity + 1 : max(0, habit.quantity - 1)
            try IonicStorageManager.shared.updateHabitValue(habitId: habitId, value: newValue)
        }
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
            completion(SimpleEntry(date: Date(), habits: habits, error: nil))
        } catch {
            completion(SimpleEntry(date: Date(), habits: [], error: error))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        do {
            let habits = try storage.loadHabits()
            let entry = SimpleEntry(date: Date(), habits: habits, error: nil)
            let timeline = Timeline(entries: [entry], policy: .after(Calendar.current.date(byAdding: .minute, value: 15, to: Date())!))
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

// MARK: - Widget Views
struct HabitWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var widgetFamily

    var body: some View {
        if entry.habits.isEmpty {
            Text("No habits to display")
                .font(.system(size: 16))
                .foregroundColor(.secondary)
        } else {
            switch widgetFamily {
            case .accessoryRectangular:
                // Lock Screen widgets
                Group {
                    if !getHabitsForWidget(type: "lock1", entry: entry).isEmpty {
                        LockScreenWidget(entry: entry, widgetType: "lock1")
                    } else if !getHabitsForWidget(type: "lock2", entry: entry).isEmpty {
                        LockScreenWidget(entry: entry, widgetType: "lock2")
                    }
                }
            case .systemSmall:
                // Small widgets (2x2)
                Group {
                    if !getHabitsForWidget(type: "small1", entry: entry).isEmpty {
                        SmallWidget(entry: entry, widgetType: "small1")
                    } else if !getHabitsForWidget(type: "small2", entry: entry).isEmpty {
                        SmallWidget(entry: entry, widgetType: "small2")
                    }
                }
            case .systemMedium:
                // Medium widgets (2x4)
                Group {
                    if !getHabitsForWidget(type: "medium1", entry: entry).isEmpty {
                        MediumWidget(entry: entry, widgetType: "medium1")
                    } else if !getHabitsForWidget(type: "medium2", entry: entry).isEmpty {
                        MediumWidget(entry: entry, widgetType: "medium2")
                    }
                }
            case .systemLarge:
                // Large widgets (4x4)
                Group {
                    if !getHabitsForWidget(type: "large1", entry: entry).isEmpty {
                        LargeWidget(entry: entry, widgetType: "large1")
                    } else if !getHabitsForWidget(type: "large2", entry: entry).isEmpty {
                        LargeWidget(entry: entry, widgetType: "large2")
                    }
                }
            default:
                Text("This widget size is not supported")
            }
        }
    }
}

// Lock Screen Widget (Accessory Rectangular)
struct LockScreenWidget: View {
    let entry: Provider.Entry
    let widgetType: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            ForEach(getHabitsForWidget(type: widgetType, entry: entry), id: \.id) { habit in
                HabitRow(habit: habit, widgetFamily: .accessoryRectangular)
            }
        }
        .padding(.horizontal, 8)
    }
}

// Small Widget (2x2)
struct SmallWidget: View {
    let entry: Provider.Entry
    let widgetType: String
    
    var body: some View {
        VStack(spacing: 8) {
            ForEach(getHabitsForWidget(type: widgetType, entry: entry), id: \.id) { habit in
                HabitRow(habit: habit, widgetFamily: .systemSmall)
            }
        }
        .padding(12)
    }
}

// Medium Widget (2x4)
struct MediumWidget: View {
    let entry: Provider.Entry
    let widgetType: String
    
    var body: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            ForEach(getHabitsForWidget(type: widgetType, entry: entry), id: \.id) { habit in
                WidgetHabitColumn(habit: habit)
            }
        }
        .padding(16)
    }
}

// Large Widget (4x4)
struct LargeWidget: View {
    let entry: Provider.Entry
    let widgetType: String
    
    var body: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            ForEach(getHabitsForWidget(type: widgetType, entry: entry), id: \.id) { habit in
                WidgetHabitColumn(habit: habit)
            }
        }
        .padding(16)
    }
}

// MARK: - Helper Views
struct HabitRow: View {
    let habit: Habit
    let widgetFamily: WidgetFamily
    
    private var habitColor: Color {
        Color(hex: habit.bgColor ?? "#000000") ?? .blue
    }
    
    var body: some View {
        if widgetFamily == .accessoryRectangular {
            VStack(alignment: .leading, spacing: 2) {
                Text(habit.name)
                    .font(.system(size: 12))
                    .fontWeight(.medium)
                    .lineLimit(1)
                
                HStack {
                    if habit.type == .quantity {
                        Text("\(habit.quantity)\(habit.goal.map { "/\($0)" } ?? "")")
                            .font(.system(size: 12))
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        HStack(spacing: 4) {
                            Button(intent: UpdateQuantityIntent(habitId: habit.id, increment: false)) {
                                Image(systemName: "minus.circle.fill")
                                    .font(.system(size: 24))
                                    .foregroundColor(habitColor)
                            }
                            .buttonStyle(.plain)
                            Button(intent: UpdateQuantityIntent(habitId: habit.id)) {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 24))
                                    .foregroundColor(habitColor)
                            }
                            .buttonStyle(.plain)
                        }
                    } else {
                        Spacer()
                        Button(intent: ToggleHabitIntent(habitId: habit.id)) {
                            Image(systemName: habit.isChecked ? "checkmark.square.fill" : "square")
                                .font(.system(size: 24))
                                .foregroundColor(habitColor)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, 8)
        } else {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(habit.name)
                        .font(.system(size: widgetFamily == .systemMedium ? 16 : 14))
                        .fontWeight(.semibold)
                        .lineLimit(1)
                    if habit.type == .quantity {
                        Text("\(habit.quantity)\(habit.goal.map { "/\($0)" } ?? "") \(habit.unit ?? "")")
                            .font(.system(size: widgetFamily == .systemMedium ? 14 : 12))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
                
                Spacer()
                
                if habit.type == .quantity {
                    HStack(spacing: 8) {
                        Button(intent: UpdateQuantityIntent(habitId: habit.id, increment: false)) {
                            Image(systemName: "minus.circle.fill")
                                .font(.system(size: widgetFamily == .systemMedium ? 20 : 16))
                                .foregroundColor(habitColor)
                        }
                        .buttonStyle(.plain)
                        Button(intent: UpdateQuantityIntent(habitId: habit.id)) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: widgetFamily == .systemMedium ? 20 : 16))
                                .foregroundColor(habitColor)
                        }
                        .buttonStyle(.plain)
                    }
                } else {
                    Button(intent: ToggleHabitIntent(habitId: habit.id)) {
                        Image(systemName: habit.isChecked ? "checkmark.square.fill" : "square")
                            .font(.system(size: widgetFamily == .systemMedium ? 20 : 16))
                            .foregroundColor(habitColor)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, widgetFamily == .systemMedium ? 16 : 12)
        }
    }
}

struct WidgetHabitColumn: View {
    let habit: Habit

    private var habitColor: Color {
        Color(hex: habit.bgColor ?? "#000000") ?? .blue
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(habit.name)
                .font(.system(size: 16))
                .fontWeight(.semibold)
                .lineLimit(1)
            if habit.type == .quantity {
                Text("\(habit.quantity)\(habit.goal.map { "/\($0)" } ?? "") \(habit.unit ?? "")")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            HStack(spacing: 8) {
                if habit.type == .quantity {
                    Button(intent: UpdateQuantityIntent(habitId: habit.id, increment: false)) {
                        Image(systemName: "minus.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(habitColor)
                    }
                    .buttonStyle(.plain)
                    Button(intent: UpdateQuantityIntent(habitId: habit.id)) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(habitColor)
                    }
                    .buttonStyle(.plain)
                } else {
                    Button(intent: ToggleHabitIntent(habitId: habit.id)) {
                        Image(systemName: habit.isChecked ? "checkmark.square.fill" : "square")
                            .font(.system(size: 20))
                            .foregroundColor(habitColor)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// MARK: - Helper Functions
func getHabitsForWidget(type: String, entry: Provider.Entry) -> [Habit] {
    var habits: [Habit] = []
    var order = 1

    while let habit = entry.habits.first(where: { habit in
        guard let assignments = habit.widgets?.assignments else { return false }
        let matchingAssignment = assignments.contains { $0.type == type && $0.order == order }
        return matchingAssignment
    }) {
        habits.append(habit)
        order += 1
    }

    return habits
}

extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }

        self.init(
            red: Double((rgb & 0xFF0000) >> 16) / 255.0,
            green: Double((rgb & 0x00FF00) >> 8) / 255.0,
            blue: Double(rgb & 0x0000FF) / 255.0
        )
    }
}

// MARK: - Widget Configuration
struct HabitWidgets: Widget {
    let kind: String = "Habit_Widgets"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                HabitWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                HabitWidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("Habit Tracker")
        .description("Track your daily habits")
        .supportedFamilies([
            .accessoryRectangular,  // Lock Screen
            .systemSmall,           // Home Screen 2x2
            .systemMedium,          // Home Screen 2x4
            .systemLarge            // Home Screen 4x4
                    ])
                }
            }

