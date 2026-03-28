import Foundation

private let appGroupId = "group.io.ionic.tracker"
private let habitsStorageKey = "habitData"
private let quantityStepperStateKey = "widgetQuantityStepperState"

struct HistoryEntry: Codable, Hashable {
    var quantity: Int
    var goal: Int
}

struct WidgetAssignment: Codable, Hashable {
    var type: String
    var order: Int
}

struct WidgetsData: Codable, Hashable {
    var assignments: [WidgetAssignment]
}

enum HabitType: String, Codable {
    case checkbox
    case quantity
}

struct Habit: Codable, Identifiable, Hashable {
    let id: String
    var name: String
    var type: HabitType
    var unit: String?
    var goal: Int
    var bgColor: String
    var icon: String?
    var quantity: Int
    var history: [String: HistoryEntry]
    var listOrder: Int?
    var widgets: WidgetsData?
}

struct HabitsPayload: Codable {
    var habits: [Habit]
}

enum QuantityStepperSide: String, Codable {
    case none
    case plus
    case minus
}

enum QuantityStepperStateStore {
    static func loadMap() -> [String: QuantityStepperSide] {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: quantityStepperStateKey),
              let decoded = try? JSONDecoder().decode([String: String].self, from: data) else {
            return [:]
        }
        var out: [String: QuantityStepperSide] = [:]
        for (k, v) in decoded {
            if let side = QuantityStepperSide(rawValue: v) {
                out[k] = side
            }
        }
        return out
    }

    static func setSide(_ side: QuantityStepperSide, for habitId: String) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        var map = loadMap()
        if side == .none {
            map.removeValue(forKey: habitId)
        } else {
            map[habitId] = side
        }
        var enc: [String: String] = [:]
        for (k, v) in map {
            enc[k] = v.rawValue
        }
        if let data = try? JSONEncoder().encode(enc) {
            defaults.set(data, forKey: quantityStepperStateKey)
        }
    }
}

final class IonicStorageManager {
    static let shared = IonicStorageManager()

    private init() {}

    private var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroupId)
    }

    func loadHabits() throws -> [Habit] {
        guard let defaults = defaults else {
            throw NSError(domain: "IonicStorageManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "App group unavailable"])
        }
        guard let value = defaults.value(forKey: habitsStorageKey) as? String,
              let data = value.data(using: .utf8) else {
            return []
        }
        let payload = try JSONDecoder().decode(HabitsPayload.self, from: data)
        return payload.habits
    }

    private func savePayload(_ payload: HabitsPayload) throws {
        guard let defaults = defaults else {
            throw NSError(domain: "IonicStorageManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "App group unavailable"])
        }
        let data = try JSONEncoder().encode(payload)
        guard let string = String(data: data, encoding: .utf8) else {
            throw NSError(domain: "IonicStorageManager", code: 2, userInfo: [NSLocalizedDescriptionKey: "Encode failed"])
        }
        defaults.set(string, forKey: habitsStorageKey)
    }

    func updateHabitValue(habitId: String, value: Int, date: String) throws {
        var payload = HabitsPayload(habits: try loadHabits())
        guard let idx = payload.habits.firstIndex(where: { $0.id == habitId }) else { return }
        var habit = payload.habits[idx]
        var history = habit.history
        var entry = history[date] ?? HistoryEntry(quantity: 0, goal: habit.goal)
        entry.quantity = value
        history[date] = entry
        habit.history = history
        if date == getCurrentDateString() {
            habit.quantity = value
        }
        payload.habits[idx] = habit
        try savePayload(payload)
    }

    func updateHabitValue(habitId: String, value: Int) throws {
        try updateHabitValue(habitId: habitId, value: value, date: getCurrentDateString())
    }

    func adjustQuantityForToday(habitId: String, delta: Int) throws {
        let today = getCurrentDateString()
        let habits = try loadHabits()
        guard let habit = habits.first(where: { $0.id == habitId }) else { return }
        let current = habit.history[today]?.quantity ?? 0
        let newValue = max(0, current + delta)
        try updateHabitValue(habitId: habitId, value: newValue, date: today)
    }
}
