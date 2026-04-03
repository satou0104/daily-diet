// アプリの状態管理
const AppState = {
    isFirstLaunch: true,
    currentWeight: 0,
    targetWeight: 0,
    targetDate: null,
    weightRecords: {},
    currentMonth: new Date(),
    selectedDate: null,

    init() {
        this.loadFromStorage();
        this.render();
        this.attachEventListeners();
    },

    loadFromStorage() {
        const hasLaunched = localStorage.getItem('hasLaunched');
        this.isFirstLaunch = !hasLaunched;
        
        if (!this.isFirstLaunch) {
            this.currentWeight = parseFloat(localStorage.getItem('currentWeight')) || 0;
            this.targetWeight = parseFloat(localStorage.getItem('targetWeight')) || 0;
            this.targetDate = localStorage.getItem('targetDate');
            
            const records = localStorage.getItem('weightRecords');
            this.weightRecords = records ? JSON.parse(records) : {};
        }
    },

    saveToStorage() {
        localStorage.setItem('hasLaunched', 'true');
        localStorage.setItem('currentWeight', this.currentWeight);
        localStorage.setItem('targetWeight', this.targetWeight);
        localStorage.setItem('targetDate', this.targetDate);
        localStorage.setItem('weightRecords', JSON.stringify(this.weightRecords));
    },

    completeSetup(currentWeight, targetWeight, targetDate) {
        this.currentWeight = currentWeight;
        this.targetWeight = targetWeight;
        this.targetDate = targetDate;
        this.isFirstLaunch = false;
        this.saveToStorage();
        this.render();
    },

    saveWeight(date, weight) {
        // 999.99kgまでに制限
        if (weight > 999.99) {
            weight = 999.99;
        }
        const key = this.dateToString(date);
        this.weightRecords[key] = weight;
        this.saveToStorage();
        this.renderCalendar();
    },

    deleteWeight(date) {
        const key = this.dateToString(date);
        delete this.weightRecords[key];
        this.saveToStorage();
        this.renderCalendar();
    },

    getWeight(date) {
        const key = this.dateToString(date);
        return this.weightRecords[key];
    },

    dateToString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // 日割り目標体重を計算
    calculateDailyTarget(date) {
        if (!this.targetDate || !this.currentWeight || !this.targetWeight) {
            return null;
        }

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(this.targetDate);
        endDate.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // 達成予定日を過ぎている場合はnullを返す（表示しない）
        if (targetDate > endDate) {
            return null;
        }

        // 開始日より前の場合はnull
        if (targetDate < startDate) {
            return null;
        }

        // 総日数を計算
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (totalDays <= 0) {
            return this.targetWeight;
        }

        // 経過日数を計算
        const elapsedDays = Math.ceil((targetDate - startDate) / (1000 * 60 * 60 * 24));

        // 差分（グラム単位）
        const totalDiff = (this.currentWeight - this.targetWeight) * 1000;
        
        // 1日あたりの減量（グラム）- 小数第1位で四捨五入
        const dailyDiff = Math.round(totalDiff / totalDays * 10) / 10;

        // その日の目標体重（kg）
        const dailyTarget = this.currentWeight - (dailyDiff * elapsedDays / 1000);

        return Math.round(dailyTarget * 100) / 100; // 小数第2位まで
    },

    // 1日あたりの減量目標を計算（グラム）
    calculateDailyGoal() {
        if (!this.targetDate || !this.currentWeight || !this.targetWeight) {
            return null;
        }

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(this.targetDate);
        endDate.setHours(0, 0, 0, 0);

        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (totalDays <= 0) {
            return null;
        }

        const totalDiff = (this.currentWeight - this.targetWeight) * 1000;
        const dailyDiff = Math.round(totalDiff / totalDays * 10) / 10;

        return dailyDiff;
    },

    render() {
        const setupScreen = document.getElementById('setupScreen');
        const calendarScreen = document.getElementById('calendarScreen');

        if (this.isFirstLaunch) {
            setupScreen.classList.remove('hidden');
            calendarScreen.classList.add('hidden');
            this.setDefaultTargetDate();
        } else {
            setupScreen.classList.add('hidden');
            calendarScreen.classList.remove('hidden');
            this.renderCalendar();
        }
    },

    setDefaultTargetDate() {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
        const dateStr = this.dateToString(nextMonth);
        document.getElementById('targetDate').value = dateStr;
    },

    renderCalendar() {
        const monthYear = this.currentMonth.toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'long' 
        });
        document.getElementById('currentMonth').textContent = monthYear;

        // 1日あたりの減量目標を表示
        const dailyGoalElement = document.getElementById('dailyGoal');
        const dailyGoal = this.calculateDailyGoal();
        if (dailyGoal !== null) {
            dailyGoalElement.textContent = `1日あたりの減量目標 ${dailyGoal}g`;
        } else {
            dailyGoalElement.textContent = '';
        }

        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // 空白セル
        for (let i = 0; i < startDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell empty';
            grid.appendChild(emptyCell);
        }

        // 日付セル
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            cell.appendChild(dayNumber);

            const weight = this.getWeight(date);
            const dailyTarget = this.calculateDailyTarget(date);

            if (weight) {
                cell.classList.add('has-weight');
                
                // 目標体重より重い場合は赤く表示
                if (dailyTarget !== null && weight > dailyTarget) {
                    cell.classList.add('over-target');
                }
                
                const weightText = document.createElement('div');
                weightText.className = 'day-weight actual';
                weightText.textContent = `${weight}kg`;
                cell.appendChild(weightText);
            }

            // 目標体重を表示
            if (dailyTarget !== null) {
                const targetText = document.createElement('div');
                targetText.className = 'day-target';
                targetText.textContent = `目標${dailyTarget}kg`;
                cell.appendChild(targetText);
            }

            cell.addEventListener('click', () => this.openWeightModal(date));
            grid.appendChild(cell);
        }
    },

    openWeightModal(date) {
        this.selectedDate = date;
        const modal = document.getElementById('weightModal');
        const modalDate = document.getElementById('modalDate');
        const weightInput = document.getElementById('weightInput');
        const deleteBtn = document.getElementById('deleteWeight');

        const dateStr = date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        modalDate.textContent = dateStr;

        const existingWeight = this.getWeight(date);
        if (existingWeight) {
            weightInput.value = existingWeight;
            deleteBtn.classList.remove('hidden');
        } else {
            weightInput.value = '';
            deleteBtn.classList.add('hidden');
        }

        modal.classList.remove('hidden');
        weightInput.focus();
    },

    closeWeightModal() {
        document.getElementById('weightModal').classList.add('hidden');
        this.selectedDate = null;
    },

    attachEventListeners() {
        // 初回設定
        document.getElementById('setupBtn').addEventListener('click', () => {
            const currentWeightValue = document.getElementById('currentWeight').value;
            const targetWeightValue = document.getElementById('targetWeight').value;
            const targetDateValue = document.getElementById('targetDate').value;

            if (!currentWeightValue || !targetWeightValue || !targetDateValue) {
                alert('すべての項目を入力してください');
                return;
            }

            const currentWeight = parseFloat(currentWeightValue);
            const targetWeight = parseFloat(targetWeightValue);

            if (isNaN(currentWeight) || isNaN(targetWeight) || currentWeight <= 0 || targetWeight <= 0) {
                alert('正しい体重を入力してください');
                return;
            }
            
            if (currentWeight > 999.99 || targetWeight > 999.99) {
                alert('体重は999.99kg以下で入力してください');
                return;
            }
            
            // 小数第2位までチェック
            const currentDecimal = currentWeightValue.split('.')[1];
            const targetDecimal = targetWeightValue.split('.')[1];
            if ((currentDecimal && currentDecimal.length > 2) || (targetDecimal && targetDecimal.length > 2)) {
                alert('小数は第2位までで入力してください');
                return;
            }

            this.completeSetup(currentWeight, targetWeight, targetDateValue);
        });

        // カレンダーナビゲーション
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
            this.renderCalendar();
        });

        // 設定ボタン
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.isFirstLaunch = true;
            document.getElementById('currentWeight').value = this.currentWeight;
            document.getElementById('targetWeight').value = this.targetWeight;
            document.getElementById('targetDate').value = this.targetDate;
            this.render();
        });

        // カレンダーに戻るボタン
        document.getElementById('backToCalendar').addEventListener('click', () => {
            this.isFirstLaunch = false;
            this.render();
        });

        // モーダル
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeWeightModal();
        });

        document.getElementById('saveWeight').addEventListener('click', () => {
            const weightValue = document.getElementById('weightInput').value;
            if (!weightValue) {
                alert('体重を入力してください');
                return;
            }
            
            const weight = parseFloat(weightValue);
            
            if (isNaN(weight) || weight <= 0) {
                alert('正しい体重を入力してください');
                return;
            }
            
            if (weight > 999.99) {
                alert('体重は999.99kg以下で入力してください');
                return;
            }
            
            // 小数第2位までチェック
            const decimalPart = weightValue.split('.')[1];
            if (decimalPart && decimalPart.length > 2) {
                alert('小数は第2位までで入力してください');
                return;
            }
            
            if (this.selectedDate) {
                this.saveWeight(this.selectedDate, weight);
                this.closeWeightModal();
            }
        });

        document.getElementById('deleteWeight').addEventListener('click', () => {
            if (this.selectedDate) {
                this.deleteWeight(this.selectedDate);
                this.closeWeightModal();
            }
        });

        // モーダル背景クリックで閉じる
        document.getElementById('weightModal').addEventListener('click', (e) => {
            if (e.target.id === 'weightModal') {
                this.closeWeightModal();
            }
        });
    }
};

// アプリ起動
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
});
