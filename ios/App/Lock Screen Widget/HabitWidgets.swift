import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Helper Structures
struct WidgetPosition {
    let habit: Habit
    let order: Int
}

// MARK: - Timeline Provider
struct HabitTimelineProvider: TimelineProvider {
    let widgetType: WidgetType

    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), habits: [], error: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        do {
            let habits = try IonicStorageManager.shared.loadHabits()
            completion(SimpleEntry(date: Date(), habits: habits, error: nil))
        } catch {
            completion(SimpleEntry(date: Date(), habits: [], error: error))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        do {
            let habits = try IonicStorageManager.shared.loadHabits()
            let entry = SimpleEntry(date: Date(), habits: habits, error: nil)

            let calendar = Calendar.current
            guard let tomorrow = calendar.date(byAdding: .day, value: 1, to: Date()),
                  let nextMidnight = calendar.date(bySettingHour: 0, minute: 0, second: 0, of: tomorrow) else {
                throw NSError(domain: "Timeline Error", code: -1, userInfo: nil)
            }

            let timeline = Timeline(entries: [entry], policy: .after(nextMidnight))
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

// MARK: - Views

private func supportedFamilies(for type: WidgetType) -> [WidgetFamily] {
    switch type {
    case .lock1, .lock2:
        return [.accessoryRectangular]
    case .small1, .small2:
        return [.systemSmall]
    case .medium1, .medium2:
        return [.systemMedium]
    }
}

private func displayName(for type: WidgetType) -> String {
    switch type {
    case .lock1: return "Habits — Lock 1"
    case .lock2: return "Habits — Lock 2"
    case .small1: return "Habits — Small 1"
    case .small2: return "Habits — Small 2"
    case .medium1: return "Habits — Medium 1"
    case .medium2: return "Habits — Medium 2"
    }
}

private func lockScreenHabits(_ habits: [Habit], type: WidgetType) -> [Habit?] {
    var slots: [Habit?] = Array(repeating: nil, count: type.capacity)
    for habit in habits {
        guard let assignment = habit.widgets?.assignments.first(where: { $0.type == type.rawValue }) else {
            continue
        }
        let index = assignment.order - 1
        if index >= 0 && index < slots.count {
            slots[index] = habit
        }
    }
    return slots
}

struct LockWidgetSlotsView: View {
    let habits: [Habit]
    let type: WidgetType
    let widgetFamily: WidgetFamily
    let timelineDate: Date

    var body: some View {
        let slots = lockScreenHabits(habits, type: type)
        VStack(alignment: .leading, spacing: 6) {
            ForEach(Array(slots.enumerated()), id: \.offset) { _, habit in
                if let habit {
                    HabitRow(habit: habit, widgetFamily: widgetFamily, timelineDate: timelineDate)
                } else {
                    Text("Empty slot")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct TypedWidgetView: View {
    var entry: SimpleEntry
    let widgetType: WidgetType
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch widgetType {
        case .lock1, .lock2:
            LockWidgetSlotsView(
                habits: entry.habits,
                type: widgetType,
                widgetFamily: family,
                timelineDate: entry.date
            )

        case .small1, .small2, .medium1, .medium2:
            let positions = organizeHabitsForWidget(entry.habits, type: widgetType)
            WidgetGridLayout(
                habits: positions,
                type: widgetType,
                widgetFamily: family,
                timelineDate: entry.date
            )
        }
    }
}

struct SingleKindHabitWidget: Widget {
    let kind: String
    let widgetType: WidgetType

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HabitTimelineProvider(widgetType: widgetType)) { entry in
            if #available(iOS 17.0, *) {
                TypedWidgetView(entry: entry, widgetType: widgetType)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                TypedWidgetView(entry: entry, widgetType: widgetType)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName(displayName(for: widgetType))
        .description("Track your daily habits")
        .supportedFamilies(supportedFamilies(for: widgetType))
        .contentMarginsDisabled()
    }
}

// MARK: - Previews
#Preview(as: .systemMedium) {
    SingleKindHabitWidget(kind: "HabitWidgetMedium1", widgetType: .medium1)
} timeline: {
    SimpleEntry(date: .now, habits: [], error: nil)
}

#Preview(as: .accessoryRectangular) {
    SingleKindHabitWidget(kind: "HabitWidgetLock1", widgetType: .lock1)
} timeline: {
    SimpleEntry(date: .now, habits: [], error: nil)
}
