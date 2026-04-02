import SwiftUI

class AppState: ObservableObject {
    @Published var isFirstLaunch: Bool
    @Published var currentWeight: Double
    @Published var targetWeight: Double
    @Published var targetDate: Date
    @Published var weightRecords: [String: Double] = [:]
    
    private let userDefaults = UserDefaults.standard
    
    init() {
        self.isFirstLaunch = !userDefaults.bool(forKey: "hasLaunched")
        self.currentWeight = userDefaults.double(forKey: "currentWeight")
        self.targetWeight = userDefaults.double(forKey: "targetWeight")
        
        if let savedDate = userDefaults.object(forKey: "targetDate") as? Date {
            self.targetDate = savedDate
        } else {
            self.targetDate = Date()
        }
        
        if let data = userDefaults.data(forKey: "weightRecords"),
           let decoded = try? JSONDecoder().decode([String: Double].self, from: data) {
            self.weightRecords = decoded
        }
    }
    
    func completeSetup(currentWeight: Double, targetWeight: Double, targetDate: Date) {
        self.currentWeight = currentWeight
        self.targetWeight = targetWeight
        self.targetDate = targetDate
        self.isFirstLaunch = false
        
        userDefaults.set(true, forKey: "hasLaunched")
        userDefaults.set(currentWeight, forKey: "currentWeight")
        userDefaults.set(targetWeight, forKey: "targetWeight")
        userDefaults.set(targetDate, forKey: "targetDate")
    }
    
    func saveWeight(for date: Date, weight: Double) {
        let key = dateToString(date)
        weightRecords[key] = weight
        
        if let encoded = try? JSONEncoder().encode(weightRecords) {
            userDefaults.set(encoded, forKey: "weightRecords")
        }
    }
    
    func getWeight(for date: Date) -> Double? {
        let key = dateToString(date)
        return weightRecords[key]
    }
    
    private func dateToString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}
