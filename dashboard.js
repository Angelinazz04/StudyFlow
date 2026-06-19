// StudyFlow Dashboard Controller
(function() {
    class DashboardController {
        constructor() {
            this.init();
        }

        init() {
            window.StudyRouter.register('dashboard', () => this.renderDashboardView());
        }

        renderDashboardView() {
            const container = document.getElementById('view-dashboard');
            if (!container) return;

            const state = window.StudyState.state;
            const profile = state.settings.profile;

            // 1. Gather stats
            const totalHours = (state.timerLogs.reduce((acc, log) => acc + log.minutes, 0) / 60).toFixed(1);
            const completedTasks = state.tasks.filter(t => t.completed).length;
            const activeCourses = state.courses.length;
            const streak = window.StudyState.calculateStreak();

            // 2. Generate Weekly Planner Data
            const startOfWeek = this.getStartOfWeek(new Date());
            const daysOfWeek = [];
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                daysOfWeek.push(day);
            }

            const weekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const plannerHtml = daysOfWeek.map((day, idx) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayTasks = state.tasks.filter(t => t.dueDate === dateStr);
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                let dayTasksHtml = dayTasks.map(t => {
                    const course = state.courses.find(c => c.id === t.courseId);
                    const color = course ? course.color : '#94a3b8';
                    return `
                        <div class="planner-task-pill ${t.completed ? 'done' : ''}" style="border-left: 3px solid ${color}" title="${t.title}">
                            <span>${t.title}</span>
                        </div>
                    `;
                }).join('');

                if (dayTasks.length === 0) {
                    dayTasksHtml = `<div class="planner-empty">No tasks</div>`;
                }

                return `
                    <div class="planner-day-col glass-panel ${isToday ? 'today' : ''}">
                        <div class="planner-day-header">
                            <span class="day-name">${weekNames[idx]}</span>
                            <span class="day-num">${day.getDate()}</span>
                        </div>
                        <div class="planner-day-body">
                            ${dayTasksHtml}
                        </div>
                    </div>
                `;
            }).join('');

            // 3. Mini Focus Timer widget calculations
            const isTimerRunning = window.StudyTimerInstance && window.StudyTimerInstance.isRunning;
            const timerLabel = isTimerRunning ? 'Session Active' : 'Start Focus Session';
            const timerTimeLeft = window.StudyTimerInstance ? window.StudyTimerInstance.getFormattedTime() : '25:00';

            // 4. Smart Dashboard Insights (Premium feature preview)
            const upcomingTask = state.tasks
                .filter(t => !t.completed)
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
            
            let insightHtml = '';
            if (upcomingTask) {
                const todayStr = new Date().toISOString().split('T')[0];
                if (upcomingTask.dueDate === todayStr) {
                    insightHtml = `🔥 <strong>Action needed:</strong> "${upcomingTask.title}" is due TODAY!`;
                } else {
                    insightHtml = `📅 <strong>Up next:</strong> "${upcomingTask.title}" is due on ${upcomingTask.dueDate}.`;
                }
            } else {
                insightHtml = `🎉 <strong>All caught up!</strong> You have no pending deadlines. Time to study ahead?`;
            }

            container.innerHTML = `
                <div class="dashboard-welcome">
                    <div class="welcome-text">
                        <h1>Welcome back, <span class="profile-highlight">${profile.name}</span> !</h1>
                        <p>Let's make today productive. Keep your learning momentum going!</p>
                    </div>
                    <div class="welcome-date glass-panel">
                        <i class="far fa-calendar-check"></i>
                        <span>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>

                <!-- Smart Insight Panel -->
                <div class="smart-insight-bar glass-panel">
                    <div class="insight-content">
                        <i class="fas fa-lightbulb"></i>
                        <span id="dashboard-insight-text">${insightHtml}</span>
                    </div>
                    <a href="#" class="insight-action" data-view="tasks">View Tasks <i class="fas fa-arrow-right"></i></a>
                </div>

                <!-- Stats Grid -->
                <div class="stats-grid">
                    <div class="stat-card glass-panel">
                        <div class="stat-icon" style="color: #ec4899; background: #ec48991a;"><i class="fas fa-hourglass-half"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${totalHours}h</span>
                            <span class="stat-label">Study Hours</span>
                        </div>
                    </div>
                    <div class="stat-card glass-panel">
                        <div class="stat-icon" style="color: #10b981; background: #10b9811a;"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${completedTasks}</span>
                            <span class="stat-label">Tasks Done</span>
                        </div>
                    </div>
                    <div class="stat-card glass-panel">
                        <div class="stat-icon" style="color: #3b82f6; background: #3b82f61a;"><i class="fas fa-graduation-cap"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${activeCourses}</span>
                            <span class="stat-label">Active Courses</span>
                        </div>
                    </div>
                    <div class="stat-card glass-panel">
                        <div class="stat-icon" style="color: #f59e0b; background: #f59e0b1a;"><i class="fas fa-fire"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${streak} days</span>
                            <span class="stat-label">Current Streak</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-row">
                    <!-- Weekly Planner -->
                    <div class="weekly-planner-section glass-panel">
                        <div class="section-header">
                            <h3>Weekly Planner</h3>
                            <span class="week-range">Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div class="planner-grid">
                            ${plannerHtml}
                        </div>
                    </div>

                    <!-- Side Widgets Column -->
                    <div class="dashboard-sidebar-widgets">
                        <!-- Quick Focus Timer Widget -->
                        <div class="focus-widget glass-panel">
                            <h3>Focus Timer</h3>
                            <div class="mini-timer-display">
                                <span class="mini-timer-time" id="mini-timer-time">${timerTimeLeft}</span>
                            </div>
                            <p class="mini-timer-status" id="mini-timer-status">${timerLabel}</p>
                            <div class="mini-timer-actions">
                                <button class="action-btn" id="mini-timer-action-btn" data-view="timer">
                                    <i class="fas ${isTimerRunning ? 'fa-pause' : 'fa-play'}"></i> Open Timer
                                </button>
                            </div>
                        </div>

                        <!-- Quick Task Adder -->
                        <div class="quick-add-task-widget glass-panel">
                            <h3>Quick Add Task</h3>
                            <form id="quick-task-form">
                                <input type="text" id="quick-task-title" placeholder="What needs to be done?" required>
                                <div class="quick-add-row">
                                    <select id="quick-task-course" required>
                                        <option value="" disabled selected>Select Course</option>
                                        ${state.courses.map(c => `<option value="${c.id}">${c.code}</option>`).join('')}
                                    </select>
                                    <input type="date" id="quick-task-date" required>
                                </div>
                                <button type="submit" class="submit-btn-solid">Add Task</button>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            // Setup listeners
            const quickTaskForm = document.getElementById('quick-task-form');
            if (quickTaskForm) {
                // Set default date to today
                document.getElementById('quick-task-date').value = new Date().toISOString().split('T')[0];

                quickTaskForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const title = document.getElementById('quick-task-title').value.trim();
                    const courseId = document.getElementById('quick-task-course').value;
                    const dueDate = document.getElementById('quick-task-date').value;

                    if (title && courseId && dueDate) {
                        window.StudyState.addTask(title, 'Quick added from dashboard.', dueDate, 'medium', courseId);
                        if (window.showNotification) window.showNotification('Task added to Planner!', 'success');
                        this.renderDashboardView();
                    }
                });
            }

            // Sync mini timer UI updates if timer runs
            if (window.StudyTimerInstance) {
                this.updateMiniTimerDisplay();
                
                // Clear any existing interval
                if (this.miniTimerInterval) clearInterval(this.miniTimerInterval);

                this.miniTimerInterval = setInterval(() => {
                    this.updateMiniTimerDisplay();
                }, 1000);
            }
        }

        updateMiniTimerDisplay() {
            const timeEl = document.getElementById('mini-timer-time');
            const statusEl = document.getElementById('mini-timer-status');
            if (!timeEl || !statusEl) return;

            if (window.StudyTimerInstance) {
                timeEl.textContent = window.StudyTimerInstance.getFormattedTime();
                if (window.StudyTimerInstance.isRunning) {
                    statusEl.textContent = `Focus Session Active (${window.StudyTimerInstance.currentMode === 'focus' ? 'Study' : 'Break'})`;
                } else {
                    statusEl.textContent = 'Session Paused / Idle';
                }
            }
        }

        getStartOfWeek(date) {
            const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1); // Adjust for Monday start, or Sunday if desired. Let's make it start of week (Sunday).
            const start = new Date(date);
            start.setDate(date.getDate() - date.getDay());
            return start;
        }
    }

    window.StudyDashboard = new DashboardController();
})();
