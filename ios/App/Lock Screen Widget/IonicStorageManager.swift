import Foundation
import WidgetKit

struct Habit: Codable {
    let id: String
    let name: String
    let type: HabitType
    let unit: String?
    let quantity: Int
    let goal: Int?
    let isChecked: Bool
    let isComplete: Bool
    let bgColor: String?
    let history: [String: HistoryValue] // Add history field
}

// New type to handle both boolean and number array history values
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
        case .boolean(let value):
            try container.encode(value)
        case .quantity(let value):
            try container.encode(value)
        }
    }
}

enum HabitType: String, Codable {
    case checkbox
    case quantity
}

struct HabitsData: Codable {
    var habits: [Habit]
    
    init(habits: [Habit]) {
        self.habits = habits
    }
}

class IonicStorageManager {
    static let shared = IonicStorageManager()
    private let userDefaults: UserDefaults?
    private let suiteName = "group.io.ionic.tracker"
    private let storageKey = "habitData"
    
    private init() {
        userDefaults = UserDefaults(suiteName: suiteName)
    }
    
    func loadHabits() throws -> [Habit] {
        guard let userDefaults = userDefaults,
              let habitsData = userDefaults.string(forKey: storageKey),
              let jsonData = habitsData.data(using: .utf8) else {
            return []
        }
        
        do {
            //print("JSON String: \(String(describing: String(data: jsonData, encoding: .utf8)))") // Print the JSON

            let habitsContainer = try JSONDecoder().decode(HabitsData.self, from: jsonData)
            return habitsContainer.habits
        } catch {
            //print("Failed to decode habits:", error)
            return []
        }
    }
    
    func updateHabitValue(habitId: String, value: Any, date: String? = nil) throws {
        guard let userDefaults = userDefaults else { return }
        
        var currentData = try loadHabits()
        
        if let index = currentData.firstIndex(where: { $0.id == habitId }) {
            var updatedHabit = currentData[index]
            var updatedHistory = updatedHabit.history
            
            // Get today's date if not provided
            let dateKey = date ?? ISO8601DateFormatter().string(from: Date())
            
            switch value {
            case let checked as Bool:
                // Update the history for checkbox type
                updatedHistory[dateKey] = .boolean(checked)
                
                updatedHabit = Habit(
                    id: updatedHabit.id,
                    name: updatedHabit.name,
                    type: updatedHabit.type,
                    unit: updatedHabit.unit,
                    quantity: updatedHabit.quantity,
                    goal: updatedHabit.goal,
                    isChecked: checked,
                    isComplete: checked,
                    bgColor: updatedHabit.bgColor,
                    history: updatedHistory
                )
                
            case let quantity as Int:
                // Update the history for quantity type
                let historyValue: [Int] = [quantity, updatedHabit.goal ?? 0]
                updatedHistory[dateKey] = .quantity(historyValue)
                
                updatedHabit = Habit(
                    id: updatedHabit.id,
                    name: updatedHabit.name,
                    type: updatedHabit.type,
                    unit: updatedHabit.unit,
                    quantity: quantity,
                    goal: updatedHabit.goal,
                    isChecked: updatedHabit.isChecked,
                    isComplete: quantity >= (updatedHabit.goal ?? Int.max),
                    bgColor: updatedHabit.bgColor,
                    history: updatedHistory
                )
                
            default:
                throw NSError(domain: "IonicStorage", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid value type"])
            }
            
            currentData[index] = updatedHabit
            
            let habitsContainer = HabitsData(habits: currentData)
            let encoder = JSONEncoder()
            if let jsonData = try? encoder.encode(habitsContainer),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                userDefaults.set(jsonString, forKey: storageKey)
                userDefaults.synchronize() // Force synchronization
                
                if #available(iOS 14.0, *) {
                    WidgetCenter.shared.reloadAllTimelines()
                }
            }
        }
    }
}
