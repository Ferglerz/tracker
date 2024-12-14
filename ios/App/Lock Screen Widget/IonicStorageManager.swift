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
        
        // Handle history as a JSON string that we'll parse manually
        if let historyString = try? container.decode(String.self, forKey: .history),
           let historyData = historyString.data(using: .utf8),
           let historyDict = try? JSONSerialization.jsonObject(with: historyData) as? [String: [String: Any]] {
            history = historyDict
        } else {
            history = [:] // Initialize as empty if parsing fails
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(habits, forKey: .habits)
        
        // Convert history to JSON string
        let historyData = try JSONSerialization.data(withJSONObject: history)
        if let historyString = String(data: historyData, encoding: .utf8) {
            try container.encode(historyString, forKey: .history)
        } else {
            try container.encode("{}", forKey: .history)
        }
    }
}

class IonicStorageManager {
    static let shared = IonicStorageManager()
    private let userDefaults: UserDefaults?
    
    private init() {
        userDefaults = UserDefaults(suiteName: "group.io.ionic.tracker")
        print("=== DEBUG: Storage Initialization ===")
        print("App Group UserDefaults:", userDefaults != nil ? "initialized" : "failed")
    }
    
    func loadHabits() throws -> [Habit] {
        guard let userDefaults = userDefaults else {
            print("⚠️ UserDefaults not initialized")
            return []
        }
        
        guard let habitsData = userDefaults.string(forKey: "habitData") else {
            print("No habits data found in storage")
            return []
        }
        
        print("DEBUG: Loading habits data:", habitsData)
        
        guard let jsonData = habitsData.data(using: .utf8) else {
            throw NSError(domain: "IonicStorage", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid data format"])
        }
        
        do {
            let habitsContainer = try JSONDecoder().decode(HabitsData.self, from: jsonData)
            print("DEBUG: Successfully decoded habits:", habitsContainer.habits.count)
            return habitsContainer.habits
        } catch {
            print("⚠️ JSON Decoding failed:", error)
            throw error
        }
    }
    
    func updateHabitValue(habitId: String, value: Any) throws {
        guard let userDefaults = userDefaults else { return }
        
        // Load existing data first
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
            
            // Create container with empty history to preserve existing history
            let habitsContainer = HabitsData(habits: currentData)
            let encoder = JSONEncoder()
            let jsonData = try encoder.encode(habitsContainer)
            
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print("DEBUG: Saving updated habit data:", jsonString)
                userDefaults.set(jsonString, forKey: "habitData")
                userDefaults.synchronize()
                
                if #available(iOS 14.0, *) {
                    WidgetCenter.shared.reloadAllTimelines()
                }
            }
        }
    }
}
