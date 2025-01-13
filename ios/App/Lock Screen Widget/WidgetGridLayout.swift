import SwiftUI
import WidgetKit
import AppIntents

struct WidgetGridLayout: View {
    let habits: [WidgetPosition?]
    let type: WidgetType
    let widgetFamily: WidgetFamily
    
    var columns: [GridItem] {
        let columnCount = type.columns
        return Array(repeating: GridItem(.flexible(), spacing: 12), count: columnCount)
    }
    
    var body: some View {
        LazyVGrid(columns: columns, spacing: 10) {
            ForEach(0..<habits.count, id: \.self) { index in
                if let position = habits[index] {
                    HabitRow(habit: position.habit, widgetFamily: widgetFamily)
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
