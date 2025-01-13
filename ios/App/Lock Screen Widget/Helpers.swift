// MARK: - Helper Functions

import Foundation
import SwiftUI
func getCurrentDateString() -> String {
    let calendar = Calendar.current
    let now = Date()
    let components = calendar.dateComponents([.year, .month, .day], from: now)
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd"
    dateFormatter.timeZone = calendar.timeZone
    return dateFormatter.string(from: calendar.date(from: components)!)
}

func organizeHabitsForWidget(_ habits: [Habit], type: WidgetType) -> [WidgetPosition?] {
    var positions = Array<WidgetPosition?>(repeating: nil, count: type.capacity)
    
    for habit in habits {
        guard let assignment = habit.widgets?.assignments.first(where: { $0.type == type.rawValue }) else {
            continue
        }
        
        let index = assignment.order - 1 // Convert 1-based to 0-based index
        if index >= 0 && index < positions.count {
            positions[index] = WidgetPosition(habit: habit, order: assignment.order)
        }
    }
    
    return positions
}

// MARK: - Color Extension
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
