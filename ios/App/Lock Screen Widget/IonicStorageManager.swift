import Foundation
import WidgetKit

struct HistoryEntry: Codable {
    var quantity: Int
    var goal: Int
}

struct WidgetsAssignment: Codable {
    var type: String
    var order: Int
}

struct Widgets: Codable {
    var assignments: [WidgetsAssignment]
}

struct Habit: Codable {
    var id: String
    var name: String
    var type: HabitType
    var unit: String?
    var goal: Int?
    var bgColor: String
    var quantity: Int
    var listOrder: Int
    var widget: Widgets?
    var history: [String: HistoryEntry]
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

        do {
            let decoder = JSONDecoder()
            let habitsContainer = try decoder.decode(HabitsData.self, from: jsonData)
            return habitsContainer.habits
        } catch {
            print("Error decoding habits: \(error)")
            throw error
        }
    }

    func updateHabitValue(habitId: String, value: Int, date: String? = nil) throws {
        guard let userDefaults = userDefaults else { return }
        var currentData = try loadHabits()
        guard let index = currentData.firstIndex(where: { $0.id == habitId }) else { return }

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateKey = date ?? dateFormatter.string(from: Date())

        var updatedHabit = currentData[index]
        let currentEntry = updatedHabit.history[dateKey] ?? HistoryEntry(quantity: 0, goal: updatedHabit.goal ?? 0)
        
        updatedHabit.history[dateKey] = HistoryEntry(quantity: value, goal: currentEntry.goal)
        updatedHabit.quantity = value
        currentData[index] = updatedHabit

        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        
        do {
            if let jsonString = String(data: try encoder.encode(HabitsData(habits: currentData)), encoding: .utf8) {
                userDefaults.set(jsonString, forKey: storageKey)
                userDefaults.synchronize()
                
                DispatchQueue.main.async {
                    if #available(iOS 14.0, *) {
                        WidgetCenter.shared.reloadAllTimelines()
                    }
                }
            }
        } catch {
            print("Error encoding habits: \(error)")
            throw error
        }
    }
    
}
