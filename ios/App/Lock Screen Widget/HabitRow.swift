import SwiftUI
import WidgetKit

struct NoDoubleClickButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.7 : 1.0)
            .allowsHitTesting(!configuration.isPressed)
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onEnded({ _ in })
            )
            .simultaneousGesture(
                TapGesture()
                    .onEnded({ _ in })
            )
    }
}

struct HabitRow: View {
    let habit: Habit
    let widgetFamily: WidgetFamily
    @Environment(\.widgetRenderingMode) private var renderingMode
    
    private var habitColor: Color {
        Color(hex: habit.bgColor) ?? .blue
    }
    
    private var todayValue: Int {
        let todayString = getCurrentDateString()
        return habit.history[todayString]?.quantity ?? 0
    }
    
    private var todayDisplay: String {
        if habit.type == .quantity {
            return "\(todayValue)"
        }
        return ""
    }

    private var todayWidth: CGFloat {
        switch todayDisplay.count {
        case 4:
            return 35
        case 3:
            return 29
        case 2:
            return 22
        case 1:
            return 17
        default:
            return 28
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            if habit.type == .quantity {
                // Name and quantity for quantity type
                HStack(spacing: 1) {
                    Text(habit.name)
                        .font(.system(size: 14))
                        .fontWeight(renderingMode == .vibrant ? .bold : .medium)
                        .lineLimit(2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(maxWidth: .infinity)
                
                // Compact controls
                HStack(spacing: 0) {
                    Button(intent: UpdateQuantityIntent(habitId: habit.id, increment: false)) {
                        Image(systemName: "minus.square.fill")
                            .font(.system(size: renderingMode == .vibrant ? 24 : 20)) // Larger buttons in vibrant mode
                            .foregroundColor(habitColor)
                    }
                    .buttonStyle(NoDoubleClickButtonStyle())
                    
                    Text(todayDisplay)
                        .font(.system(size: 15))
                        .fontWeight(renderingMode == .vibrant ? .heavy : .medium)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                        .allowsTightening(true)
                        .kerning(todayDisplay.count == 4 ? -1 : 0)
                        .frame(minWidth: todayWidth, alignment: .center)
                    
                    Button(intent: UpdateQuantityIntent(habitId: habit.id)) {
                        Image(systemName: "plus.square.fill")
                            .font(.system(size: renderingMode == .vibrant ? 24 : 20)) // Larger buttons in vibrant mode
                            .foregroundColor(habitColor)
                    }
                    .buttonStyle(NoDoubleClickButtonStyle())
                }
            } else {
                Text(habit.name)
                    .font(.system(size: 15))
                    .fontWeight(renderingMode == .vibrant ? .bold : .medium) // Bold text in vibrant mode
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                Button(intent: ToggleHabitIntent(habitId: habit.id)) {
                    Image(systemName: todayValue > 0 ? "checkmark.square.fill" : "square")
                        .font(.system(size: renderingMode == .vibrant ? 24 : 20)) // Larger checkbox in vibrant mode
                        .foregroundColor(habitColor)
                }
                .buttonStyle(NoDoubleClickButtonStyle())
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 0)
        .padding(.vertical, 0)
    }
}
