// アプリの状態管理
const AppState = {
    isFirstLaunch: true,
    currentWeight: 0,
    targetWeight: 0,
    startDate: null,
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
            this.startDate = localStorage.getItem('startDate');
            this.targetDate = localStorage.getItem('targetDate');
            
            const records = localStorage.getItem('weightRecords');
            this.weightRecords = records ? JSON.parse(records) : {};
        }
    },

    saveToStorage() {
        localStorage.setItem('hasLaunched', 'true');
        localStorage.setItem('currentWeight', this.currentWeight);
        localStorage.setItem('targetWeight', this.targetWeight);
        localStorage.setItem('startDate', this.startDate);
        localStorage.setItem('targetDate', this.targetDate);
        localStorage.setItem('weightRecords', JSON.stringify(this.weightRecords));
    },

    completeSetup(currentWeight, targetWeight, startDate, targetDate) {
        // 体重を999.99kgまでに制限、小数第2位まで
        currentWeight = Math.min(999.99, Math.round(currentWeight * 100) / 100);
        targetWeight = Math.min(999.99, Math.round(targetWeight * 100) / 100);
        
        this.currentWeight = currentWeight;
        this.targetWeight = targetWeight;
        this.startDate = startDate;
        this.targetDate = targetDate;
        this.isFirstLaunch = false;
        this.saveToStorage();
        this.render();
    },

    saveWeight(date, weight) {
        // 999.99kgまでに制限、小数第2位まで
        if (weight > 999.99) {
            weight = 999.99;
        }
        weight = Math.round(weight * 100) / 100;
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
        if (!this.startDate || !this.targetDate || !this.currentWeight || !this.targetWeight) {
            return null;
        }

        const startDate = new Date(this.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(this.targetDate);
        endDate.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // 終了日を過ぎている場合はnullを返す（表示しない）
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

    // 1日あたりの減量目標を計算（kg）
    calculateDailyGoal() {
        if (!this.startDate || !this.targetDate || !this.currentWeight || !this.targetWeight) {
            return null;
        }

        const startDate = new Date(this.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(this.targetDate);
        endDate.setHours(0, 0, 0, 0);

        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (totalDays <= 0) {
            return null;
        }

        const totalDiff = this.currentWeight - this.targetWeight;
        const dailyDiff = Math.round(totalDiff / totalDays * 100) / 100;

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
        const todayStr = this.dateToString(today);
        const nextMonthStr = this.dateToString(nextMonth);
        document.getElementById('startDate').value = todayStr;
        document.getElementById('targetDate').value = nextMonthStr;
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
            dailyGoalElement.textContent = `1日あたりの減量目標 ${dailyGoal}kg`;
        } else {
            dailyGoalElement.textContent = '';
        }

        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        // 曜日ヘッダーを追加
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        weekdays.forEach(day => {
            const weekdayCell = document.createElement('div');
            weekdayCell.className = 'weekday-header';
            weekdayCell.textContent = day;
            grid.appendChild(weekdayCell);
        });

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
            
            // 目標達成予定日かチェック
            if (this.targetDate) {
                const targetDate = new Date(this.targetDate);
                targetDate.setHours(0, 0, 0, 0);
                const currentDate = new Date(date);
                currentDate.setHours(0, 0, 0, 0);
                
                if (currentDate.getTime() === targetDate.getTime()) {
                    cell.classList.add('target-date');
                }
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            cell.appendChild(dayNumber);

            const weight = this.getWeight(date);
            const dailyTarget = this.calculateDailyTarget(date);

            // 目標体重を先に表示
            if (dailyTarget !== null) {
                const targetText = document.createElement('div');
                targetText.className = 'day-target';
                targetText.textContent = `目${dailyTarget}kg`;
                cell.appendChild(targetText);
            }

            if (weight) {
                cell.classList.add('has-weight');
                
                // 目標体重より重い場合は赤く表示
                if (dailyTarget !== null && weight > dailyTarget) {
                    cell.classList.add('over-target');
                }
                
                const weightText = document.createElement('div');
                weightText.className = 'day-weight actual';
                weightText.textContent = `現${weight}kg`;
                cell.appendChild(weightText);
            }

            cell.addEventListener('click', () => this.openWeightModal(date));
            grid.appendChild(cell);
        }

        // 月末後の空白セル（カレンダーを6行に統一）
        const totalCells = startDay + daysInMonth;
        const remainingCells = 42 - totalCells; // 6行 × 7列 = 42セル
        for (let i = 0; i < remainingCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell empty';
            grid.appendChild(emptyCell);
        }

        // グラフを描画
        setTimeout(() => this.renderChart(this.chartDays || 7), 50);
    },

    openWeightModal(date) {
        this.selectedDate = date;
        const modal = document.getElementById('weightModal');
        const modalDate = document.getElementById('modalDate');
        const modalTargetWeight = document.getElementById('modalTargetWeight');
        const weightInput = document.getElementById('weightInput');
        const deleteBtn = document.getElementById('deleteWeight');

        const dateStr = date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        modalDate.textContent = dateStr;

        // 目標体重を表示
        const dailyTarget = this.calculateDailyTarget(date);
        if (dailyTarget !== null) {
            modalTargetWeight.textContent = `目標体重: ${dailyTarget}kg`;
            modalTargetWeight.style.display = 'block';
        } else {
            modalTargetWeight.style.display = 'none';
        }

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
        // 体重入力のリアルタイムバリデーション
        const validateWeightInput = (input) => {
            input.addEventListener('input', (e) => {
                let value = e.target.value;
                
                // 999.99を超える場合は999.99に制限
                if (parseFloat(value) > 999.99) {
                    e.target.value = '999.99';
                    return;
                }
                
                // 小数点以下の桁数をチェック
                if (value.includes('.')) {
                    const parts = value.split('.');
                    if (parts[1] && parts[1].length > 2) {
                        e.target.value = parseFloat(value).toFixed(2);
                    }
                }
            });
        };
        
        // すべての体重入力欄にバリデーションを適用
        validateWeightInput(document.getElementById('currentWeight'));
        validateWeightInput(document.getElementById('targetWeight'));
        validateWeightInput(document.getElementById('weightInput'));

        // 初回設定
        document.getElementById('setupBtn').addEventListener('click', () => {
            const currentWeightValue = document.getElementById('currentWeight').value;
            const targetWeightValue = document.getElementById('targetWeight').value;
            const startDateValue = document.getElementById('startDate').value;
            const targetDateValue = document.getElementById('targetDate').value;

            if (!currentWeightValue || !targetWeightValue || !startDateValue || !targetDateValue) {
                alert('すべての項目を入力してください');
                return;
            }

            const currentWeight = parseFloat(currentWeightValue);
            const targetWeight = parseFloat(targetWeightValue);

            if (isNaN(currentWeight) || isNaN(targetWeight) || currentWeight <= 0 || targetWeight <= 0) {
                alert('正しい体重を入力してください');
                return;
            }

            this.completeSetup(currentWeight, targetWeight, startDateValue, targetDateValue);
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

        // 設定ボタン - 設定モーダルを開く
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('hidden');
        });

        // 設定モーダルを閉じる
        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('hidden');
        });

        // 目標体重設定ボタン
        document.getElementById('goToTargetSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('hidden');
            this.isFirstLaunch = true;
            document.getElementById('currentWeight').value = this.currentWeight;
            document.getElementById('targetWeight').value = this.targetWeight;
            document.getElementById('startDate').value = this.startDate;
            document.getElementById('targetDate').value = this.targetDate;
            this.render();
        });

        // 操作説明ボタン
        document.getElementById('showHelp').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('hidden');
            document.getElementById('helpModal').classList.remove('hidden');
        });

        // 操作説明モーダルを閉じる
        document.getElementById('closeHelp').addEventListener('click', () => {
            document.getElementById('helpModal').classList.add('hidden');
        });

        // モーダル背景クリックで閉じる
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                document.getElementById('settingsModal').classList.add('hidden');
            }
        });

        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                document.getElementById('helpModal').classList.add('hidden');
            }
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

        // カレンダーのスワイプ機能
        this.addSwipeListeners();

        // グラフ切り替えボタン
        this.chartDays = 7;
        document.getElementById('chart7days').addEventListener('click', () => {
            this.chartDays = 7;
            document.getElementById('chart7days').classList.add('active');
            document.getElementById('chart30days').classList.remove('active');
            this.renderChart(7);
        });
        document.getElementById('chart30days').addEventListener('click', () => {
            this.chartDays = 30;
            document.getElementById('chart30days').classList.add('active');
            document.getElementById('chart7days').classList.remove('active');
            this.renderChart(30);
        });
    },

    renderChart(days = 7) {
        const canvas = document.getElementById('weightChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // canvas解像度をデバイスピクセル比に合わせる
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const width = rect.width - 30;
        const height = 180;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        // 開始日を基準にデータを収集
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dataPoints = [];

        // 開始日が設定されていればそこから、なければ今日から過去N日
        let startBase;
        if (this.startDate) {
            startBase = new Date(this.startDate);
            startBase.setHours(0, 0, 0, 0);
        } else {
            startBase = new Date(today);
            startBase.setDate(today.getDate() - (days - 1));
        }

        for (let i = 0; i < days; i++) {
            const date = new Date(startBase);
            date.setDate(startBase.getDate() + i);
            const weight = this.getWeight(date);
            const target = this.calculateDailyTarget(date);
            dataPoints.push({ date, weight, target });
        }

        // グラフ情報を更新（日付範囲表示）
        const chartInfo = document.getElementById('chartInfo');
        const firstDate = dataPoints[0].date;
        const lastDate = dataPoints[dataPoints.length - 1].date;
        const firstStr = `${firstDate.getMonth()+1}/${firstDate.getDate()}`;
        const lastStr = `${lastDate.getMonth()+1}/${lastDate.getDate()}`;
        chartInfo.innerHTML = `${firstStr}～${lastStr}`;

        // Y軸の範囲を計算（体重データのみ基準、目標体重は参考程度）
        const allWeights = dataPoints.filter(d => d.weight).map(d => d.weight);
        const allTargets = dataPoints.filter(d => d.target !== null).map(d => d.target);
        if (allWeights.length === 0 && allTargets.length === 0) {
            ctx.fillStyle = '#ccc';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('体重を入力するとグラフが表示されます', width / 2, height / 2);
            return;
        }
        const baseValues = allWeights.length > 0 ? allWeights : allTargets;
        const allValues = [...allWeights, ...allTargets];
        const minVal = Math.min(...baseValues) - 1;
        const maxVal = Math.max(...baseValues) + 1;
        const range = maxVal - minVal || 1;

        // パディング
        const padLeft = 40;
        const padRight = 15;
        const padTop = 15;
        const padBottom = 30;
        const chartW = width - padLeft - padRight;
        const chartH = height - padTop - padBottom;

        const xStep = chartW / (days - 1);
        const toY = val => padTop + chartH - ((val - minVal) / range) * chartH;
        const toX = i => padLeft + i * xStep;

        // グリッド線とY軸ラベル（最大5本、0.5単位に丸める）
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        const tickMin = Math.floor(minVal * 2) / 2;
        const tickMax = Math.ceil(maxVal * 2) / 2;
        // 範囲に応じてステップを決定
        const rawRange = tickMax - tickMin;
        let step = 0.5;
        if (rawRange > 4) step = 1;
        if (rawRange > 8) step = 2;
        const ticks = [];
        for (let v = tickMin; v <= tickMax + 0.01; v += step) {
            ticks.push(Math.round(v * 10) / 10);
        }
        ticks.forEach(val => {
            const y = toY(val);
            if (y < padTop || y > height - padBottom) return;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(width - padRight, y);
            ctx.stroke();
            ctx.fillStyle = '#aaa';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(1), padLeft - 4, y + 4);
        });

        // X軸ラベル（曜日）
        const weekdays = ['日','月','火','水','木','金','土'];
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        dataPoints.forEach((d, i) => {
            if (days <= 7 || i % Math.ceil(days / 7) === 0) {
                ctx.fillText(weekdays[d.date.getDay()], toX(i), height - padBottom + 14);
            }
        });

        // 目標体重ライン（緑点線）
        const targetPoints = dataPoints.filter(d => d.target !== null);
        if (targetPoints.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#81c784';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 4]);
            dataPoints.forEach((d, i) => {
                if (d.target !== null) {
                    if (ctx.currentX === undefined) ctx.moveTo(toX(i), toY(d.target));
                    else ctx.lineTo(toX(i), toY(d.target));
                    ctx.currentX = i;
                }
            });
            // 再描画
            ctx.beginPath();
            let first = true;
            dataPoints.forEach((d, i) => {
                if (d.target !== null) {
                    if (first) { ctx.moveTo(toX(i), toY(d.target)); first = false; }
                    else ctx.lineTo(toX(i), toY(d.target));
                }
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 実際の体重ライン（青実線）+ 塗りつぶし
        const weightPoints = dataPoints.filter(d => d.weight);
        if (weightPoints.length > 0) {
            // 塗りつぶし
            ctx.beginPath();
            let firstIdx = dataPoints.findIndex(d => d.weight);
            ctx.moveTo(toX(firstIdx), toY(dataPoints[firstIdx].weight));
            dataPoints.forEach((d, i) => {
                if (d.weight) ctx.lineTo(toX(i), toY(d.weight));
            });
            const lastIdx = dataPoints.map(d => d.weight).lastIndexOf(dataPoints.filter(d=>d.weight).slice(-1)[0]?.weight);
            let li = -1;
            for (let i = dataPoints.length - 1; i >= 0; i--) {
                if (dataPoints[i].weight) { li = i; break; }
            }
            if (li >= 0) {
                ctx.lineTo(toX(li), height - padBottom);
                ctx.lineTo(toX(firstIdx), height - padBottom);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
            ctx.fill();

            // 実線
            ctx.beginPath();
            ctx.strokeStyle = '#64b5f6';
            ctx.lineWidth = 2;
            let firstPoint = true;
            dataPoints.forEach((d, i) => {
                if (d.weight) {
                    if (firstPoint) { ctx.moveTo(toX(i), toY(d.weight)); firstPoint = false; }
                    else ctx.lineTo(toX(i), toY(d.weight));
                }
            });
            ctx.stroke();

            // ドット
            dataPoints.forEach((d, i) => {
                if (d.weight) {
                    const isLast = i === dataPoints.map((x,j)=>x.weight?j:-1).filter(j=>j>=0).slice(-1)[0];
                    ctx.beginPath();
                    ctx.arc(toX(i), toY(d.weight), isLast ? 5 : 4, 0, Math.PI * 2);
                    ctx.fillStyle = isLast ? '#81c784' : '#64b5f6';
                    ctx.fill();
                }
            });

            // 最後のデータラベル
            if (li >= 0) {
                const ld = dataPoints[li];
                const dateStr = `${ld.date.getMonth()+1}/${ld.date.getDate()} ${weekdays[ld.date.getDay()]}${ld.weight}kg`;
                ctx.fillStyle = '#555';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(dateStr, width - padRight, toY(ld.weight) - 8);
            }
        }
    },

    addSwipeListeners() {
        const container = document.querySelector('.calendar-container');
        let touchStartX = 0;
        let touchCurrentX = 0;
        let isSwiping = false;

        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchCurrentX = touchStartX;
            isSwiping = true;
            container.style.transition = 'none';
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            touchCurrentX = e.changedTouches[0].screenX;
            const diff = touchCurrentX - touchStartX;
            container.style.transform = `translateX(${diff * 0.3}px)`;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            isSwiping = false;
            const diff = touchStartX - touchCurrentX;
            const swipeThreshold = 40;

            container.style.transition = 'transform 0.25s ease';

            if (Math.abs(diff) > swipeThreshold) {
                const direction = diff > 0 ? 1 : -1;
                container.style.transform = `translateX(${-direction * 100}px)`;
                setTimeout(() => {
                    if (direction > 0) {
                        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
                    } else {
                        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
                    }
                    container.style.transition = 'none';
                    container.style.transform = `translateX(${direction * 100}px)`;
                    this.renderCalendar();
                    requestAnimationFrame(() => {
                        container.style.transition = 'transform 0.25s ease';
                        container.style.transform = 'translateX(0)';
                    });
                }, 150);
            } else {
                container.style.transform = 'translateX(0)';
            }
        }, { passive: true });
    }
};

// アプリ起動
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
    initAdMob();
});

async function initAdMob() {
    try {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;

        const { AdMob } = Capacitor.Plugins;
        if (!AdMob) return;

        await AdMob.initialize({
            requestTrackingAuthorization: true,
        });

        await AdMob.showBanner({
            adId: 'ca-app-pub-8707369701475326/7496865188',
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: false,
        });
    } catch (e) {
        console.error('AdMob error:', e);
    }
}
