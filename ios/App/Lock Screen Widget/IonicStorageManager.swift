import Foundation
import WidgetKit

struct Habit: Codable, Identifiable { // Added Identifiable
    var id: String
    var name: String
    var type: HabitType
    var unit: String?
    var quantity: Int
    var goal: Int?
    var isChecked: Bool
    var isComplete: Bool
    var bgColor: String?
    var history: [String: HistoryValue]
    var widget: WidgetAssignment? // Added widget property
}

struct WidgetAssignment: Codable { // Added WidgetAssignment struct
    var assignments: [Assignment]
}

struct Assignment: Codable, Hashable { // Added Assignment struct
    let type: String
    let order: Int
}

enum HistoryValue: Codable {
    case boolean(Bool)
    case quantity([Int])

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let boolValue = try? container.decode(Bool.self) {
            self = .boolean(boolValue)
        } else if let arrayValue = try? container.decode([Int].self) {
            self = .quantity(arrayValue)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "History value must be either Bool or [Int]")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .boolean(let value): try container.encode(value)
        case .quantity(let value): try container.encode(value)
        }
    }
}

enum HabitType: String, Codable {
    case checkbox
    case quantity
}

struct HabitsData: Codable {
    var habits: [Habit]
}

class IonicStorageManager {
    static let shared = IonicStorageManager()
    private let userDefaults = UserDefaults(suiteName: "group.io.ionic.tracker")
    private let storageKey = "habitData"

    private init() {}

    func loadHabits() throws -> [Habit] {
        guard let habitsData = userDefaults?.string(forKey: storageKey),
              let jsonData = habitsData.data(using: .utf8) else { return [] }

        return try JSONDecoder().decode(HabitsData.self, from: jsonData).habits
    }

    func updateHabitValue(habitId: String, value: Any, date: String? = nil) throws {
        guard let userDefaults = userDefaults else { return }

        var currentData = try loadHabits()

        if let index = currentData.firstIndex(where: { $0.id == habitId }) {
            var updatedHabit = currentData[index]
            var updatedHistory = updatedHabit.history
            let dateKey = date ?? ISO8601DateFormatter().string(from: Date())

            switch value {
            case let checked as Bool:
                updatedHistory[dateKey] = .boolean(checked)
                updatedHabit.isChecked = checked
                updatedHabit.isComplete = checked
                updatedHabit.history = updatedHistory
            case let quantity as Int:
                updatedHistory[dateKey] = .quantity([quantity, updatedHabit.goal ?? 0])
                updatedHabit.quantity = quantity
                updatedHabit.isComplete = quantity >= (updatedHabit.goal ?? Int.max)
                updatedHabit.history = updatedHistory
            default:
                throw NSError(domain: "IonicStorage", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid value type"])
            }

            currentData[index] = updatedHabit

            let habitsContainer = HabitsData(habits: currentData)
            let encoder = JSONEncoder()
            if let jsonData = try? encoder.encode(habitsContainer),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                userDefaults.set(jsonString, forKey: storageKey)
                userDefaults.synchronize()

                if #available(iOS 14.0, *) {
                    WidgetCenter.shared.reloadAllTimelines()
                }
            }
        }
    }
}
