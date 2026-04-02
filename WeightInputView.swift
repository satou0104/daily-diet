import SwiftUI

struct WeightInputView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss
    let date: Date
    @State private var weightInput: String = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                Text(dateString)
                    .font(.title2)
                    .fontWeight(.semibold)
                
                VStack(alignment: .leading, spacing: 10) {
                    Text("体重")
                        .font(.headline)
                    TextField("kg", text: $weightInput)
                        .keyboardType(.decimalPad)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .font(.title)
                }
                .padding(.horizontal)
                
                Button(action: {
                    if let weight = Double(weightInput) {
                        appState.saveWeight(for: date, weight: weight)
                        dismiss()
                    }
                }) {
                    Text("保存")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(weightInput.isEmpty ? Color.gray : Color.blue)
                        .cornerRadius(15)
                }
                .padding(.horizontal)
                .disabled(weightInput.isEmpty)
                
                Spacer()
            }
            .padding(.top, 50)
            .navigationBarItems(trailing: Button("閉じる") {
                dismiss()
            })
        }
        .onAppear {
            if let existingWeight = appState.getWeight(for: date) {
                weightInput = String(format: "%.1f", existingWeight)
            }
        }
    }
    
    private var dateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy年M月d日"
        return formatter.string(from: date)
    }
}
