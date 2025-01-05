import WidgetKit
import SwiftUI

@main
struct HabitWidgetsBundle: WidgetBundle {
    var body: some Widget {
        HabitWidget()
        HabitWidgetsLiveActivity()
    }
}
