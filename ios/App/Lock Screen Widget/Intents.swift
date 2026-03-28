// MARK: - Intents

import Foundation
import AppIntents
import WidgetKit

struct ToggleHabitIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Habit"

    @Parameter(title: "Habit ID")
    var habitId: String

    init() {}

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

    init() {}

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

struct OpenQuantityStepperIntent: AppIntent {
    static var title: LocalizedStringResource = "Open quantity stepper"

    @Parameter(title: "Habit ID")
    var habitId: String

    /// `true` = show +10/+5/+1 (or +5/+1), `false` = show -10/-5/-1 (or -5/-1).
    @Parameter(title: "Increments")
    var showIncrements: Bool

    init() {}

    init(habitId: String, showIncrements: Bool) {
        self.habitId = habitId
        self.showIncrements = showIncrements
    }

    func perform() async throws -> some IntentResult {
        QuantityStepperStateStore.setSide(showIncrements ? .plus : .minus, for: habitId)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

struct ClearQuantityStepperIntent: AppIntent {
    static var title: LocalizedStringResource = "Close quantity stepper"

    @Parameter(title: "Habit ID")
    var habitId: String

    init() {}

    init(habitId: String) {
        self.habitId = habitId
    }

    func perform() async throws -> some IntentResult {
        QuantityStepperStateStore.setSide(.none, for: habitId)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

struct AdjustQuantityDeltaIntent: AppIntent {
    static var title: LocalizedStringResource = "Adjust quantity by delta"

    @Parameter(title: "Habit ID")
    var habitId: String

    @Parameter(title: "Delta")
    var delta: Int

    init() {}

    init(habitId: String, delta: Int) {
        self.habitId = habitId
        self.delta = delta
    }

    func perform() async throws -> some IntentResult {
        try IonicStorageManager.shared.adjustQuantityForToday(habitId: habitId, delta: delta)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
