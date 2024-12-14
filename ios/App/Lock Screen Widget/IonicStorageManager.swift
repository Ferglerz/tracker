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

// Updated wrapper structure with both initializers
struct HabitsData: Codable {
    var habits: [Habit]
    var history: [String: Any]
    
    // Standard initializer
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
        history = [:] // Initialize as empty dictionary
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(habits, forKey: .habits)
        // Encode history as empty object
        try container.encode("{}" as String, forKey: .history)
    }
}

class IonicStorageManager {
    static let shared = IonicStorageManager()
    private let userDefaults: UserDefaults?
    
    private init() {
        let groupDefaults = UserDefaults(suiteName: "group.io.ionic.tracker")
        print("=== DEBUG: Storage Initialization ===")
        print("App Group UserDefaults:", groupDefaults != nil ? "initialized" : "failed")
        userDefaults = groupDefaults
        
        if let existingData = groupDefaults?.string(forKey: "habitData") {
            print("Existing habit data found:", existingData)
        } else {
            print("No existing habit data found")
        }
    }
    
    func loadHabits() throws -> [Habit] {
        guard let userDefaults = userDefaults else {
            print("⚠️ UserDefaults not initialized")
            return []
        }
        
        print("\n=== DEBUG: Loading Habits ===")
        guard let habitsData = userDefaults.string(forKey: "habitData") else {
            print("No habits data found in storage")
            return []
        }
        
        print("Raw habits data:", habitsData)
        
        guard let jsonData = habitsData.data(using: .utf8) else {
            print("⚠️ Failed to convert string to UTF8 data")
            throw NSError(domain: "IonicStorage", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid data format"])
        }
        
        do {
            let habitsContainer = try JSONDecoder().decode(HabitsData.self, from: jsonData)
            print("Successfully decoded \(habitsContainer.habits.count) habits")
            return habitsContainer.habits
        } catch {
            print("⚠️ JSON Decoding failed:", error)
            print("JSON Structure:", String(data: jsonData, encoding: .utf8) ?? "invalid UTF8")
            throw error
        }
    }
    
    func updateHabitValue(habitId: String, value: Any) throws {
        guard let userDefaults = userDefaults else { return }
        
        print("\n=== DEBUG: Updating Habit ===")
        print("Updating habit:", habitId)
        print("New value:", value)
        
        var habits = try loadHabits()
        if let index = habits.firstIndex(where: { $0.id == habitId }) {
            var updatedHabit = habits[index]
            
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
            
            habits[index] = updatedHabit
            
            // Create wrapper structure with new initializer
            let habitsContainer = HabitsData(habits: habits)
            
            let encoder = JSONEncoder()
            let jsonData = try encoder.encode(habitsContainer)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print("Saving updated JSON:", jsonString)
                userDefaults.set(jsonString, forKey: "habitData")
                userDefaults.synchronize() // Force synchronization after updates
            }
        }
    }
}
