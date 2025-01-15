import Foundation

enum WidgetType: String, CaseIterable {
    case lock1, lock2
    case small1, small2
    case medium1, medium2
    
    var capacity: Int {
        switch self {
        case .lock1, .lock2: return 2
        case .small1, .small2: return 4
        case .medium1, .medium2: return 8
        }
    }
    
    var columns: Int {
        switch self {
        case .lock1, .lock2: return 1
        case .small1, .small2: return 1
        case .medium1, .medium2: return 2
        }
    }
    
    var rows: Int {
        switch self {
        case .lock1, .lock2: return 1
        case .small1, .small2: return 4
        case .medium1, .medium2: return 4
        }
    }
}
