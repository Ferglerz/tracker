import SwiftUI
import WidgetKit

// Widget extension deployment target is iOS 17.2 because these widgets use
// interactive AppIntent buttons and iOS 17 widget container APIs.
@main
struct HabitWidgetsBundle: WidgetBundle {
    var body: some Widget {
        HabitWidgetLock1()
        HabitWidgetLock2()
        HabitWidgetSmall1()
        HabitWidgetSmall2()
        HabitWidgetMedium1()
        HabitWidgetMedium2()
    }
}
