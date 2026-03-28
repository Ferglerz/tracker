import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Helper Structures
struct WidgetPosition {
    let habit: Habit
    let order: Int
}

// MARK: - Timeline Provider
struct Provider: TimelineProvider {
    private var lastCheck = Date()
    
    private func isNewDay(_ currentDate: Date = Date()) -> Bool {
        let calendar = Calendar.current
        return !calendar.isDate(lastCheck, inSameDayAs: currentDate)
    }
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: Date(),
            habits: [],
            error: nil,
            widgetID: String(context.family.rawValue),
            quantityStepperSides: QuantityStepperStateStore.loadMap()
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        do {
            let habits = try IonicStorageManager.shared.loadHabits()
            completion(SimpleEntry(
                date: Date(),
                habits: habits,
                error: nil,
                widgetID: String(context.family.rawValue),
                quantityStepperSides: QuantityStepperStateStore.loadMap()
            ))
        } catch {
            completion(SimpleEntry(
                date: Date(),
                habits: [],
                error: error,
                widgetID: String(context.family.rawValue),
                quantityStepperSides: QuantityStepperStateStore.loadMap()
            ))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        do {
            let habits = try IonicStorageManager.shared.loadHabits()
            let entry = SimpleEntry(
                date: Date(),
                habits: habits,
                error: nil,
                widgetID: String(context.family.rawValue),
                quantityStepperSides: QuantityStepperStateStore.loadMap()
            )
            
            // Calculate next midnight
            let calendar = Calendar.current
            guard let tomorrow = calendar.date(byAdding: .day, value: 1, to: Date()),
                  let nextMidnight = calendar.date(bySettingHour: 0, minute: 0, second: 0, of: tomorrow) else {
                throw NSError(domain: "Timeline Error", code: -1, userInfo: nil)
            }
            
            let timeline = Timeline(entries: [entry], policy: .after(nextMidnight))
            lastCheck = Date()
            completion(timeline)
        } catch {
            let entry = SimpleEntry(
                date: Date(),
                habits: [],
                error: error,
                widgetID: String(context.family.rawValue),
                quantityStepperSides: QuantityStepperStateStore.loadMap()
            )
            let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(60)))
            completion(timeline)
        }
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let habits: [Habit]
    let error: Error?
    let widgetID: String?
    /// Per-habit expanded stepper: `.plus` / `.minus` / `.none` (default via map lookup).
    let quantityStepperSides: [String: QuantityStepperSide]
}

// MARK: - Main Widget Configuration
struct HabitWidget: Widget {
    let kind: String = "HabitWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                WidgetView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                    WidgetView(entry: entry)
                    .padding()
                    .background()
                }
        }
        .configurationDisplayName("Simple Habits")
        .description("Track your daily habits")
            .supportedFamilies([.accessoryRectangular, .systemSmall, .systemMedium])
            .contentMarginsDisabled()
    }
}

// MARK: - Main Widget View
struct WidgetView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .accessoryRectangular:
            if let habit = getHabitForLockScreen(entry.habits) {
                HabitRow(
                    habit: habit,
                    widgetFamily: family,
                    stepperSide: entry.quantityStepperSides[habit.id] ?? .none
                )
            } else {
                    Text("No habit configured")
                }
            
        case .systemSmall:
            let type: WidgetType = entry.widgetID?.contains("2") == true ? .small2 : .small1
            let habits = organizeHabitsForWidget(entry.habits, type: type)
            WidgetGridLayout(
                habits: habits,
                type: type,
                widgetFamily: family,
                quantityStepperSides: entry.quantityStepperSides
            )

        case .systemMedium:
            let type: WidgetType = entry.widgetID?.contains("2") == true ? .medium2 : .medium1
            let habits = organizeHabitsForWidget(entry.habits, type: type)
            WidgetGridLayout(
                habits: habits,
                type: type,
                widgetFamily: family,
                quantityStepperSides: entry.quantityStepperSides
            )
            
        @unknown default:
            Text("Unsupported widget size")
        }
}
    
    func getHabitForLockScreen(_ habits: [Habit]) -> Habit? {
        let type: WidgetType = entry.widgetID?.contains("2") == true ? .lock2 : .lock1
        return habits.first { habit in
            habit.widgets?.assignments.contains { assignment in
                assignment.type == type.rawValue
            } == true
        }
    }
}

// MARK: - Preview Provider
#Preview(as: .systemMedium) {
    HabitWidget()
} timeline: {
    SimpleEntry(date: .now, habits: [], error: nil, widgetID: "medium1", quantityStepperSides: [:])
}

#Preview(as: .accessoryRectangular) {
    HabitWidget()
} timeline: {
    SimpleEntry(date: .now, habits: [], error: nil, widgetID: "lock1", quantityStepperSides: [:])
}

