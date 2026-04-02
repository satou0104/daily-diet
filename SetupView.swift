import SwiftUI

struct SetupView: View {
    @EnvironmentObject var appState: AppState
    @State private var currentWeight: String = ""
    @State private var targetWeight: String = ""
    @State private var targetDate = Date()
    
    var body: some View {
        VStack(spacing: 30) {
            Text("目標設定")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 10) {
                Text("現在体重")
                    .font(.headline)
                TextField("kg", text: $currentWeight)
                    .keyboardType(.decimalPad)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            .padding(.horizontal)
            
            VStack(alignment: .leading, spacing: 10) {
                Text("目標体重")
                    .font(.headline)
                TextField("kg", text: $targetWeight)
                    .keyboardType(.decimalPad)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            .padding(.horizontal)
            
            VStack(alignment: .leading, spacing: 10) {
                Text("達成予定日")
                    .font(.headline)
                DatePicker("", selection: $targetDate, displayedComponents: .date)
                    .datePickerStyle(WheelDatePickerStyle())
                    .labelsHidden()
            }
            .padding(.horizontal)
            
            Button(action: {
                if let current = Double(currentWeight),
                   let target = Double(targetWeight) {
                    appState.completeSetup(
                        currentWeight: current,
                        targetWeight: target,
                        targetDate: targetDate
                    )
                }
            }) {
                Text("決定")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(15)
            }
            .padding(.horizontal)
            .disabled(currentWeight.isEmpty || targetWeight.isEmpty)
            
            Spacer()
        }
        .padding(.top, 50)
    }
}
