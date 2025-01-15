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
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), habits: [], error: nil, widgetID: String(context.family.rawValue))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        do {
            let habits = try IonicStorageManager.shared.loadHabits()
            completion(SimpleEntry(date: Date(), habits: habits, error: nil, widgetID: String(context.family.rawValue)))
        } catch {
                completion(SimpleEntry(date: Date(), habits: [], error: error, widgetID: String(context.family.rawValue)))
            }
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        do {
            let habits = try IonicStorageManager.shared.loadHabits()
            let entry = SimpleEntry(date: Date(), habits: habits, error: nil, widgetID: String(context.family.rawValue))
            let timeline = Timeline(entries: [entry], policy: .after(Calendar.current.date(byAdding: .minute, value: 15, to: Date())!))
            completion(timeline)
        } catch {
                let entry = SimpleEntry(date: Date(), habits: [], error: error, widgetID: String(context.family.rawValue))
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
                HabitRow(habit: habit, widgetFamily: family)
            } else {
                    Text("No habit configured")
                }
            
        case .systemSmall:
            let type: WidgetType = entry.widgetID?.contains("2") == true ? .small2 : .small1
            let habits = organizeHabitsForWidget(entry.habits, type: type)
            WidgetGridLayout(habits: habits, type: type, widgetFamily: family)
            
        case .systemMedium:
            let type: WidgetType = entry.widgetID?.contains("2") == true ? .medium2 : .medium1
            let habits = organizeHabitsForWidget(entry.habits, type: type)
            WidgetGridLayout(habits: habits, type: type, widgetFamily: family)
            
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
    SimpleEntry(date: .now, habits: [], error: nil, widgetID: "medium1")
}

#Preview(as: .accessoryRectangular) {
    HabitWidget()
} timeline: {
    SimpleEntry(date: .now, habits: [], error: nil, widgetID: "lock1")
}

