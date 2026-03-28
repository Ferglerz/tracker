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
    /// Which expanded stepper is open (from timeline / App Group).
    let stepperSide: QuantityStepperSide
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

    /// Lock / narrow rows: +5/+1 (or -5/-1). Home screen small & medium: +10/+5/+1.
    private var useThreeStepButtons: Bool {
        widgetFamily != .accessoryRectangular
    }

    private var expandedButtonFont: Font {
        if widgetFamily == .accessoryRectangular {
            return .system(size: 11, weight: .semibold)
        }
        return .system(size: 13, weight: .semibold)
    }

    private var backButtonFont: Font {
        widgetFamily == .accessoryRectangular
            ? .system(size: 18)
            : .system(size: 20)
    }

    var body: some View {
        HStack(spacing: 12) {
            if habit.type == .quantity {
                quantityRow
            } else {
                checkboxRow
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 0)
        .padding(.vertical, 0)
    }

    @ViewBuilder
    private var quantityRow: some View {
        switch stepperSide {
        case .none:
            quantityCollapsedRow
        case .plus:
            quantityExpandedRow(increments: true)
        case .minus:
            quantityExpandedRow(increments: false)
        }
    }

    private var quantityCollapsedRow: some View {
        HStack(spacing: 12) {
            HStack(spacing: 1) {
                Text(habit.name)
                    .font(.system(size: 14))
                    .fontWeight(renderingMode == .vibrant ? .bold : .medium)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxWidth: .infinity)

            HStack(spacing: 0) {
                Button(intent: OpenQuantityStepperIntent(habitId: habit.id, showIncrements: false)) {
                    Image(systemName: "minus.square.fill")
                        .font(.system(size: renderingMode == .vibrant ? 24 : 20))
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

                Button(intent: OpenQuantityStepperIntent(habitId: habit.id, showIncrements: true)) {
                    Image(systemName: "plus.square.fill")
                        .font(.system(size: renderingMode == .vibrant ? 24 : 20))
                        .foregroundColor(habitColor)
                }
                .buttonStyle(NoDoubleClickButtonStyle())
            }
        }
    }

    @ViewBuilder
    private func quantityExpandedRow(increments: Bool) -> some View {
        HStack(spacing: widgetFamily == .accessoryRectangular ? 4 : 8) {
            Button(intent: ClearQuantityStepperIntent(habitId: habit.id)) {
                Image(systemName: "chevron.backward.circle.fill")
                    .font(backButtonFont)
                    .foregroundColor(.secondary)
            }
            .buttonStyle(NoDoubleClickButtonStyle())

            if useThreeStepButtons {
                if increments {
                    deltaButton(label: "+10", delta: 10)
                    deltaButton(label: "+5", delta: 5)
                    deltaButton(label: "+1", delta: 1)
                } else {
                    deltaButton(label: "-10", delta: -10)
                    deltaButton(label: "-5", delta: -5)
                    deltaButton(label: "-1", delta: -1)
                }
            } else if increments {
                deltaButton(label: "+5", delta: 5)
                deltaButton(label: "+1", delta: 1)
            } else {
                deltaButton(label: "-5", delta: -5)
                deltaButton(label: "-1", delta: -1)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func deltaButton(label: String, delta: Int) -> some View {
        Button(intent: AdjustQuantityDeltaIntent(habitId: habit.id, delta: delta)) {
            Text(label)
                .font(expandedButtonFont)
                .foregroundColor(habitColor)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .padding(.horizontal, widgetFamily == .accessoryRectangular ? 4 : 6)
                .padding(.vertical, 4)
        }
        .buttonStyle(NoDoubleClickButtonStyle())
    }

    private var checkboxRow: some View {
        HStack(spacing: 12) {
            Text(habit.name)
                .font(.system(size: 15))
                .fontWeight(renderingMode == .vibrant ? .bold : .medium)
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)

            Button(intent: ToggleHabitIntent(habitId: habit.id)) {
                Image(systemName: todayValue > 0 ? "checkmark.square.fill" : "square")
                    .font(.system(size: renderingMode == .vibrant ? 24 : 20))
                    .foregroundColor(habitColor)
            }
            .buttonStyle(NoDoubleClickButtonStyle())
        }
    }
}
