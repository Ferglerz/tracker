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
    let isBegun: Bool
    let bgColor: String?
}

enum HabitType: String, Codable {
    case checkbox
    case quantity
}

struct HabitsData: Codable {
    var habits: [Habit]
    var history: [String: [String: Any]]
    
    init(habits: [Habit]) {
        self.habits = habits
        self.history = [:]
    }
    
    private enum CodingKeys: String, CodingKey {
        case habits
        case history
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        habits = try container.decode([Habit].self, forKey: .habits)
        
        // Handle history as a JSON string
        if let historyString = try? container.decode(String.self, forKey: .history),
           let historyData = historyString.data(using: .utf8),
           let historyDict = try? JSONSerialization.jsonObject(with: historyData) as? [String: [String: Any]] {
            history = historyDict
        } else {
            history = [:]
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(habits, forKey: .habits)
        
        // Convert history to JSON string
        if let historyData = try? JSONSerialization.data(withJSONObject: history),
           let historyString = String(data: historyData, encoding: .utf8) {
            try container.encode(historyString, forKey: .history)
        } else {
            try container.encode("{}", forKey: .history)
        }
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
            let habitsContainer = try JSONDecoder().decode(HabitsData.self, from: jsonData)
            return habitsContainer.habits
        } catch {
            print("Failed to decode habits:", error)
            return []
        }
    }
    
    func updateHabitValue(habitId: String, value: Any) throws {
        guard let userDefaults = userDefaults else { return }
        
        var currentData = try loadHabits()
        
        if let index = currentData.firstIndex(where: { $0.id == habitId }) {
            var updatedHabit = currentData[index]
            
            switch value {
            case let checked as Bool:
                updatedHabit = Habit(
                    id: updatedHabit.id,
                    name: updatedHabit.name,
                    type: updatedHabit.type,
                    unit: updatedHabit.unit,
                    quantity: updatedHabit.quantity,
                    goal: updatedHabit.goal,
                    isChecked: checked,
                    isComplete: checked,
                    isBegun: checked,
                    bgColor: updatedHabit.bgColor
                )
            case let quantity as Int:
                updatedHabit = Habit(
                    id: updatedHabit.id,
                    name: updatedHabit.name,
                    type: updatedHabit.type,
                    unit: updatedHabit.unit,
                    quantity: quantity,
                    goal: updatedHabit.goal,
                    isChecked: updatedHabit.isChecked,
                    isComplete: quantity >= (updatedHabit.goal ?? Int.max),
                    isBegun: quantity > 0,
                    bgColor: updatedHabit.bgColor
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
                userDefaults.synchronize()
                
                if #available(iOS 14.0, *) {
                    WidgetCenter.shared.reloadAllTimelines()
                }
            }
        }
    }
}
