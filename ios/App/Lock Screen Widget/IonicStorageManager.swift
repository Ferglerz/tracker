import Foundation
import SQLite3
import WidgetKit

// MARK: - Error Handling
enum DatabaseError: Error {
    case connectionFailed
    case queryFailed(String)
    case invalidData
}

// MARK: - Data Models
struct Habit: Codable {
    let id: String
    let name: String
    let type: HabitType
    let unit: String?
    let goal: Int?
    var quantity: Int
    var isChecked: Bool
    var isComplete: Bool
    var isBegun: Bool
    var bgColor: String?
}

enum HabitType: String, Codable {
    case checkbox
    case quantity
}

enum HabitValue: Codable {
    case number(Int)
    case boolean(Bool)
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let boolValue = try? container.decode(Bool.self) {
            self = .boolean(boolValue)
        } else if let intValue = try? container.decode(Int.self) {
            self = .number(intValue)
        } else {
            throw DecodingError.typeMismatch(HabitValue.self, DecodingError.Context(
                codingPath: decoder.codingPath,
                debugDescription: "Expected boolean or number"
            ))
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .boolean(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        }
    }
}

// MARK: - Database Manager
@available(iOS 14.0, *)
class IonicStorageManager {
    static let shared = IonicStorageManager()
    private var db: OpaquePointer?
    
    private init() {
        connectToDatabase()
    }
    
    private func connectToDatabase() {
        // Get the app group container URL
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.yourapp") else {
            print("Failed to get container URL")
            return
        }
        
        // Ionic's SQLite database path
        let dbPath = containerURL.appendingPathComponent("_ionicstorage.db").path
        
        if sqlite3_open(dbPath, &db) != SQLITE_OK {
            print("Error opening database")
            return
        }
    }
    
    func loadHabits() throws -> [Habit] {
        guard let db = db else { throw DatabaseError.connectionFailed }
        
        let query = "SELECT value FROM _ionickv WHERE key = 'habits'"
        var statement: OpaquePointer?
        
        guard sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK else {
            throw DatabaseError.queryFailed("Failed to prepare query")
        }
        defer { sqlite3_finalize(statement) }
        
        if sqlite3_step(statement) == SQLITE_ROW {
            guard let jsonData = sqlite3_column_text(statement, 0) else {
                throw DatabaseError.invalidData
            }
            
            let data = Data(String(cString: jsonData).utf8)
            return try JSONDecoder().decode([Habit].self, from: data)
        }
        
        return []
    }
    
    func loadHistory() throws -> [String: [String: HabitValue]] {
        guard let db = db else { throw DatabaseError.connectionFailed }
        
        let query = "SELECT value FROM _ionickv WHERE key = 'habitHistory'"
        var statement: OpaquePointer?
        
        guard sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK else {
            throw DatabaseError.queryFailed("Failed to prepare query")
        }
        defer { sqlite3_finalize(statement) }
        
        if sqlite3_step(statement) == SQLITE_ROW {
            guard let jsonData = sqlite3_column_text(statement, 0) else {
                throw DatabaseError.invalidData
            }
            
            let data = Data(String(cString: jsonData).utf8)
            return try JSONDecoder().decode([String: [String: HabitValue]].self, from: data)
        }
        
        return [:]
    }
    
    func updateHabitValue(habitId: String, value: HabitValue, date: Date = Date()) throws {
        guard let db = db else { throw DatabaseError.connectionFailed }
        
        // First get existing history
        var history = try loadHistory()
        
        // Update the value
        let dateKey = DateFormatter.habitDate.string(from: date)
        if history[habitId] == nil {
            history[habitId] = [:]
        }
        history[habitId]?[dateKey] = value
        
        // Convert to JSON
        let jsonData = try JSONEncoder().encode(history)
        guard let jsonString = String(data: jsonData, encoding: .utf8) else {
            throw DatabaseError.invalidData
        }
        
        // Update in database
        let query = "UPDATE _ionickv SET value = ? WHERE key = 'habitHistory'"
        var statement: OpaquePointer?
        
        guard sqlite3_prepare_v2(db, query, -1, &statement, nil) == SQLITE_OK else {
            throw DatabaseError.queryFailed("Failed to prepare update query")
        }
        defer { sqlite3_finalize(statement) }
        
        sqlite3_bind_text(statement, 1, (jsonString as NSString).utf8String, -1, nil)
        
        if sqlite3_step(statement) != SQLITE_DONE {
            throw DatabaseError.queryFailed("Failed to update history")
        }
        
        // Refresh widget timeline
        WidgetCenter.shared.reloadTimelines(ofKind: "Lock_Screen_Widget")
    }
}

// MARK: - Date Formatter
extension DateFormatter {
    static let habitDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}
