import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []

        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate)
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
}

struct Lock_Screen_WidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var widgetFamily
    
    // Reusable button function
    @ViewBuilder
    private func controlButton(systemName: String, color: Color, fontSize: Font = .title) -> some View {
        Button(action: {}) {
            Image(systemName: systemName)
                .font(fontSize)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
    }
    
    // Reusable content layout
    @ViewBuilder
    private func contentLayout(color: Color, timeFont: Font = .body, buttonFont: Font = .title) -> some View {
        HStack {
            controlButton(systemName: "minus.circle.fill", color: color, fontSize: buttonFont)
            
            Spacer()
            
            VStack(alignment: .center) {
                Text(entry.date, style: .time)
                    .font(timeFont)
                    .fontWeight(.semibold)
            }
            
            Spacer()
            
            controlButton(systemName: "plus.circle.fill", color: color, fontSize: buttonFont)
        }
    }
    
    var body: some View {
        switch widgetFamily {
        case .accessoryCircular:
            Text("N/A")
            
        case .accessoryRectangular:
            // Lock screen layout
            contentLayout(color: .white, timeFont: .body, buttonFont: .title2)
                .padding(.horizontal, 12)
            
        case .accessoryInline:
            Text("N/A")
            
        case .systemMedium:
            // Home screen layout
            contentLayout(color: .blue, timeFont: .title, buttonFont: .system(size: 32))
                .padding()
            
        default:
            Text("N/A")
        }
    }
}

struct Lock_Screen_Widget: Widget {
    let kind: String = "Lock_Screen_Widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                Lock_Screen_WidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                Lock_Screen_WidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("My Widget")
        .description("This is an example widget.")
        .supportedFamilies([.accessoryRectangular, .systemMedium])
    }
}

// Preview for the home screen medium widget
#Preview(as: .systemMedium) {
    Lock_Screen_Widget()
} timeline: {
    SimpleEntry(date: .now)
}

// Preview for the lock screen rectangular widget
#Preview(as: .accessoryRectangular) {
    Lock_Screen_Widget()
} timeline: {
    SimpleEntry(date: .now)
}
