import SwiftUI

@main
struct DailyDietApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            if appState.isFirstLaunch {
                SetupView()
                    .environmentObject(appState)
            } else {
                CalendarView()
                    .environmentObject(appState)
            }
        }
    }
}
