import SwiftUI
import WidgetKit

@main
struct HabitWidgetsBundle: WidgetBundle {
    var body: some Widget {
        SingleKindHabitWidget(kind: "HabitWidgetLock1", widgetType: .lock1)
        SingleKindHabitWidget(kind: "HabitWidgetLock2", widgetType: .lock2)
        SingleKindHabitWidget(kind: "HabitWidgetSmall1", widgetType: .small1)
        SingleKindHabitWidget(kind: "HabitWidgetSmall2", widgetType: .small2)
        SingleKindHabitWidget(kind: "HabitWidgetMedium1", widgetType: .medium1)
        SingleKindHabitWidget(kind: "HabitWidgetMedium2", widgetType: .medium2)
    }
}
