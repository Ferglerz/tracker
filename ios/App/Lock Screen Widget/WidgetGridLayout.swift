import SwiftUI
import WidgetKit
import AppIntents

struct WidgetGridLayout: View {
    let habits: [WidgetPosition?]
    let type: WidgetType
    let widgetFamily: WidgetFamily
    let timelineDate: Date

    var columns: [GridItem] {
        let columnCount = type.columns
        return Array(repeating: GridItem(.flexible(), spacing: 12), count: columnCount)
    }

    var body: some View {
        LazyVGrid(columns: columns, spacing: 10) {
            ForEach(0..<habits.count, id: \.self) { index in
                if let position = habits[index] {
                    HabitRow(habit: position.habit, widgetFamily: widgetFamily, timelineDate: timelineDate)
                } else {
                    Color.clear
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
    }
}
