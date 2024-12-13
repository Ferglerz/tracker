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

class IonicStorageManager {
    static let shared = IonicStorageManager()
    private let userDefaults: UserDefaults?
    
    private init() {
        // Check both locations
        let standardDefaults = UserDefaults.standard
        let groupDefaults = UserDefaults(suiteName: "group.io.ionic.tracker")
        
        print("=== DEBUG STORAGE LOCATIONS ===")
        print("Standard app UserDefaults:")
        print("- habits:", standardDefaults.string(forKey: "habits") ?? "nil")
        print("- all keys:", standardDefaults.dictionaryRepresentation().keys)
        
        print("\nApp Group UserDefaults:")
        print("- habits:", groupDefaults?.string(forKey: "habits") ?? "nil")
        print("- all keys:", groupDefaults?.dictionaryRepresentation().keys ?? [])
        
        userDefaults = groupDefaults
        
        // Check app group container access
        if let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.io.ionic.tracker") {
            print("App Group URL:", groupURL.path)
            let contents = try? FileManager.default.contentsOfDirectory(at: groupURL, includingPropertiesForKeys: nil)
            print("App Group Contents:", contents?.map { $0.lastPathComponent } ?? [])
        } else {
            print("⚠️ Could not access app group container")
        }
    }
    
    func loadHabits() throws -> [Habit] {
        guard let userDefaults = userDefaults else {
            print("⚠️ UserDefaults not initialized")
            return []
        }
        
        // Debug the raw habits data
        print("Raw habits data:", userDefaults.string(forKey: "habits") ?? "nil")
        
        guard let habitsData = userDefaults.string(forKey: "habits") else {
            print("No habits found")
            print("Available keys:", userDefaults.dictionaryRepresentation().keys)
            return []
        }
        
        print("Found habits data:", habitsData)
        
        
        let decoder = JSONDecoder()
        guard let jsonData = habitsData.data(using: .utf8) else {
            throw NSError(domain: "IonicStorage", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid data format"])
        }
        
        return try decoder.decode([Habit].self, from: jsonData)
    }
    
    func updateHabitValue(habitId: String, value: Any) throws {
        guard let userDefaults = userDefaults else { return }
        
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
            let encoder = JSONEncoder()
            let jsonData = try encoder.encode(habits)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                userDefaults.set(jsonString, forKey: "habits")
            }
        }
    }
}
