//
//  Lock_Screen_WidgetLiveActivity.swift
//  Lock Screen Widget
//
//  Created by Fearghas Gundy on 2024-12-06.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct Lock_Screen_WidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct Lock_Screen_WidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: Lock_Screen_WidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension Lock_Screen_WidgetAttributes {
    fileprivate static var preview: Lock_Screen_WidgetAttributes {
        Lock_Screen_WidgetAttributes(name: "World")
    }
}

extension Lock_Screen_WidgetAttributes.ContentState {
    fileprivate static var smiley: Lock_Screen_WidgetAttributes.ContentState {
        Lock_Screen_WidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: Lock_Screen_WidgetAttributes.ContentState {
         Lock_Screen_WidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: Lock_Screen_WidgetAttributes.preview) {
   Lock_Screen_WidgetLiveActivity()
} contentStates: {
    Lock_Screen_WidgetAttributes.ContentState.smiley
    Lock_Screen_WidgetAttributes.ContentState.starEyes
}
