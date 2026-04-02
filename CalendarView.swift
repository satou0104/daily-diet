import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var appState: AppState
    @State private var currentMonth = Date()
    @State private var selectedDate: Date?
    @State private var showWeightInput = false
    
    var body: some View {
        NavigationView {
            VStack {
                monthHeader
                weekdayHeader
                calendarGrid
                Spacer()
            }
            .navigationTitle("日割りダイエット")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showWeightInput) {
                if let date = selectedDate {
                    WeightInputView(date: date)
                        .environmentObject(appState)
                }
            }
        }
    }
    
    private var monthHeader: some View {
        HStack {
            Button(action: { changeMonth(by: -1) }) {
                Image(systemName: "chevron.left")
            }
            
            Spacer()
            
            Text(monthYearString)
                .font(.title2)
                .fontWeight(.semibold)
            
            Spacer()
            
            Button(action: { changeMonth(by: 1) }) {
                Image(systemName: "chevron.right")
            }
        }
        .padding()
    }
    
    private var weekdayHeader: some View {
        HStack(spacing: 0) {
            ForEach(["日", "月", "火", "水", "木", "金", "土"], id: \.self) { day in
                Text(day)
                    .font(.caption)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal)
    }
    
    private var calendarGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 10) {
            ForEach(daysInMonth, id: \.self) { date in
                if let date = date {
                    DayCell(date: date, weight: appState.getWeight(for: date))
                        .onTapGesture {
                            selectedDate = date
                            showWeightInput = true
                        }
                } else {
                    Color.clear
                        .frame(height: 60)
                }
            }
        }
        .padding(.horizontal)
    }
    
    private var monthYearString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy年M月"
        return formatter.string(from: currentMonth)
    }
    
    private var daysInMonth: [Date?] {
        guard let monthInterval = Calendar.current.dateInterval(of: .month, for: currentMonth),
              let monthFirstWeek = Calendar.current.dateInterval(of: .weekOfMonth, for: monthInterval.start) else {
            return []
        }
        
        var days: [Date?] = []
        var date = monthFirstWeek.start
        
        while days.count < 42 {
            if Calendar.current.isDate(date, equalTo: currentMonth, toGranularity: .month) {
                days.append(date)
            } else {
                days.append(nil)
            }
            date = Calendar.current.date(byAdding: .day, value: 1, to: date)!
        }
        
        return days
    }
    
    private func changeMonth(by value: Int) {
        if let newMonth = Calendar.current.date(byAdding: .month, value: value, to: currentMonth) {
            currentMonth = newMonth
        }
    }
}

struct DayCell: View {
    let date: Date
    let weight: Double?
    
    var body: some View {
        VStack(spacing: 4) {
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.system(size: 16))
            
            if let weight = weight {
                Text(String(format: "%.1f", weight))
                    .font(.caption2)
                    .foregroundColor(.blue)
            }
        }
        .frame(height: 60)
        .frame(maxWidth: .infinity)
        .background(weight != nil ? Color.blue.opacity(0.1) : Color.clear)
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
        )
    }
}
