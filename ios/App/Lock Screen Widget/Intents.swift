// MARK: - Intents

import Foundation
import AppIntents
import WidgetKit
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
            let todayString = getCurrentDateString()
            let currentQuantity = habit.history[todayString]?.quantity ?? 0
            let newQuantity = currentQuantity > 0 ? 0 : 1
            try IonicStorageManager.shared.updateHabitValue(habitId: habitId, value: newQuantity, date: todayString)
        }
        WidgetCenter.shared.reloadAllTimelines()
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
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
