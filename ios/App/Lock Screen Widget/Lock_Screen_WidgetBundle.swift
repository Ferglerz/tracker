//
//  Lock_Screen_WidgetBundle.swift
//  Lock Screen Widget
//
//  Created by Fearghas Gundy on 2024-12-06.
//

import WidgetKit
import SwiftUI

@main
struct Lock_Screen_WidgetBundle: WidgetBundle {
    var body: some Widget {
        Lock_Screen_Widget()
        Lock_Screen_WidgetLiveActivity()
    }
}
