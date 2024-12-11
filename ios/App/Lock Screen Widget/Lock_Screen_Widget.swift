import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct Provider: TimelineProvider {
    let storage = IonicStorageManager.shared
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), habits: [], error: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        do {
            let habits = try storage.loadHabits()
            let entry = SimpleEntry(date: Date(), habits: habits, error: nil)
            completion(entry)
        } catch {
            completion(SimpleEntry(date: Date(), habits: [], error: error))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
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
struct Lock_Screen_WidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var widgetFamily
    @State private var currentIndex: Int = 0
    
    private var currentHabit: Habit? {
        guard !entry.habits.isEmpty else { return nil }
        return entry.habits[currentIndex]
    }
    
    private func nextHabit() {
        guard !entry.habits.isEmpty else { return }
        withAnimation {
            currentIndex = (currentIndex + 1) % entry.habits.count
        }
    }
    
    private func previousHabit() {
        guard !entry.habits.isEmpty else { return }
        withAnimation {
            currentIndex = (currentIndex - 1 + entry.habits.count) % entry.habits.count
        }
    }
    
    private func updateHabitValue(_ value: Any) {
        guard let habit = currentHabit else { return }
        try? IonicStorageManager.shared.updateHabitValue(habitId: habit.id, value: value as! HabitValue)
    }
    
    @ViewBuilder
    private func habitControls(habit: Habit, color: Color) -> some View {
        if habit.type == .checkbox {
            Button(action: {
                updateHabitValue(!habit.isChecked)
            }) {
                Image(systemName: habit.isChecked ? "checkmark.square.fill" : "square")
                    .font(.title2)
                    .foregroundColor(color)
            }
        } else {
            HStack {
                Button(action: {
                    updateHabitValue(max(0, habit.quantity - 1))
                }) {
                    Image(systemName: "minus.circle.fill")
                        .font(.title2)
                        .foregroundColor(color)
                }
                
                Spacer()
                
                Button(action: {
                    updateHabitValue(habit.quantity + 1)
                }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(color)
                }
            }
        }
    }
    
    @ViewBuilder
    private func habitLabel(habit: Habit) -> some View {
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
        if let error = entry.error {
            Text("Error: \(error.localizedDescription)")
                .font(.caption)
        } else if entry.habits.isEmpty {
            Text("No habits configured")
        } else if let habit = currentHabit {
            HStack {
                if habit.type == .checkbox {
                    habitControls(habit: habit, color: widgetFamily == .systemMedium ? .blue : .white)
                    Spacer()
                    habitLabel(habit: habit)
                    Spacer()
                } else {
                    habitControls(habit: habit, color: widgetFamily == .systemMedium ? .blue : .white)
                        .overlay(
                            habitLabel(habit: habit)
                                .frame(maxWidth: .infinity)
                        )
                }
            }
            .padding(.horizontal, widgetFamily == .systemMedium ? 20 : 12)
            .gesture(
                DragGesture(minimumDistance: 20)
                    .onEnded { value in
                        if value.translation.width < 0 {
                            nextHabit()
                        } else {
                            previousHabit()
                        }
                    }
            )
        }
    }
}

// MARK: - Widget Configuration
struct Lock_Screen_Widget: Widget {
    let kind: String = "Lock_Screen_Widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                Lock_Screen_WidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                Lock_Screen_WidgetEntryView(entry: entry)
                    .padding()
                    .background()
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
