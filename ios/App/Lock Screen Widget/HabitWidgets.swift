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
        let dummyHabits = [
            Habit(id: "dummy1", name: "Drink Water", type: .quantity, unit: "oz", goal: 64, bgColor: "#3880f4", icon: "water", quantity: 32, history: [:], listOrder: 1, widgets: nil),
            Habit(id: "dummy2", name: "Read", type: .checkbox, unit: nil, goal: 1, bgColor: "#ff9933", icon: "book", quantity: 1, history: [:], listOrder: 2, widgets: nil)
        ]
        return SimpleEntry(date: Date(), habits: dummyHabits, error: nil)
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
        let isEmpty = slots.allSatisfy { $0 == nil }

        if isEmpty {
            Text("Tap to assign")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                .widgetURL(URL(string: "tracker://widget-config"))
        } else {
            VStack(alignment: .leading, spacing: 6) {
                ForEach(Array(slots.enumerated()), id: \.offset) { _, habit in
                    if let habit {
                        HabitRow(habit: habit, widgetFamily: widgetFamily, timelineDate: timelineDate)
                            .widgetURL(URL(string: "tracker://habit/\(habit.id)"))
                    } else {
                        Text("Empty slot")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .widgetURL(URL(string: "tracker://widget-config"))
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
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
            if positions.isEmpty || positions.allSatisfy({ $0 == nil }) {
                VStack(spacing: 8) {
                    Image(systemName: "plus.square.dashed")
                        .font(.system(size: 24))
                        .foregroundColor(.secondary)
                    Text("Tap to assign habits")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .widgetURL(URL(string: "tracker://widget-config"))
            } else {
                WidgetGridLayout(
                    habits: positions,
                    type: widgetType,
                    widgetFamily: family,
                    timelineDate: entry.date
                )
            }
        }
    }
}

struct HabitWidgetLock1: Widget {
    let kind: String = "HabitWidgetLock1"
    let widgetType: WidgetType = .lock1

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

struct HabitWidgetLock2: Widget {
    let kind: String = "HabitWidgetLock2"
    let widgetType: WidgetType = .lock2

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

struct HabitWidgetSmall1: Widget {
    let kind: String = "HabitWidgetSmall1"
    let widgetType: WidgetType = .small1

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

struct HabitWidgetSmall2: Widget {
    let kind: String = "HabitWidgetSmall2"
    let widgetType: WidgetType = .small2

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

struct HabitWidgetMedium1: Widget {
    let kind: String = "HabitWidgetMedium1"
    let widgetType: WidgetType = .medium1

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

struct HabitWidgetMedium2: Widget {
    let kind: String = "HabitWidgetMedium2"
    let widgetType: WidgetType = .medium2

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
    HabitWidgetMedium1()
} timeline: {
    let dummyHabits = [
        Habit(id: "dummy1", name: "Drink Water", type: .quantity, unit: "oz", goal: 64, bgColor: "#3880f4", icon: "water", quantity: 32, history: [:], listOrder: 1, widgets: WidgetsData(assignments: [WidgetAssignment(type: "medium1", order: 1)])),
        Habit(id: "dummy2", name: "Read", type: .checkbox, unit: nil, goal: 1, bgColor: "#ff9933", icon: "book", quantity: 1, history: [:], listOrder: 2, widgets: WidgetsData(assignments: [WidgetAssignment(type: "medium1", order: 2)]))
    ]
    SimpleEntry(date: .now, habits: dummyHabits, error: nil)
}

#Preview(as: .accessoryRectangular) {
    HabitWidgetLock1()
} timeline: {
    let dummyHabits = [
        Habit(id: "dummy1", name: "Drink Water", type: .quantity, unit: "oz", goal: 64, bgColor: "#3880f4", icon: "water", quantity: 32, history: [:], listOrder: 1, widgets: WidgetsData(assignments: [WidgetAssignment(type: "lock1", order: 1)])),
    ]
    SimpleEntry(date: .now, habits: dummyHabits, error: nil)
}
