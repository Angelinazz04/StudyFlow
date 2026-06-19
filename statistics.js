// StudyFlow Analytics and Statistics Module
(function() {
    class AnalyticsWorkspace {
        constructor() {
            this.studyChart = null;
            this.taskChart = null;
            this.courseChart = null;
            this.init();
        }

        init() {
            window.StudyRouter.register('analytics', () => this.renderAnalyticsView());
        }

        renderAnalyticsView() {
            const container = document.getElementById('view-analytics');
            if (!container) return;

            const state = window.StudyState.state;
            const logs = state.timerLogs;
            const tasks = state.tasks;
            const courses = state.courses;

            // 1. Calculate Summary Cards
            const totalMinutes = logs.reduce((acc, log) => acc + log.minutes, 0);
            const totalHoursStr = (totalMinutes / 60).toFixed(1);
            
            const completedCount = tasks.filter(t => t.completed).length;
            const pendingCount = tasks.filter(t => !t.completed).length;
            const totalTasks = tasks.length;
            const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
            
            const avgSessionLength = logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0;
            const streak = window.StudyState.calculateStreak();

            container.innerHTML = `
                <div class="view-header">
                    <div class="header-title">
                        <h1>Performance Analytics</h1>
                        <p>Evaluate your focus habits and monitor task completion milestones</p>
                    </div>
                </div>

                <!-- Stats summary grid -->
                <div class="stats-grid">
                    <div class="stat-card glass-panel">
                        <div class="stat-icon" style="color: #ec4899; background: #ec48991a;"><i class="fas fa-clock"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${totalHoursStr} hrs</span>
                            <span class="stat-label">Total Focused Time</span>
                        </div>
                    </div>
                    <div class="stat-card glass-panel">
                        <div class="stat-icon" style="color: #10b981; background: #10b9811a;"><i class="fas fa-percentage"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${completionRate}%</span>
                            <span class="stat-label">Task Completion Rate</span>
                        </div>
                    </div>
                    <div class="stat-card glass-panel">
                        <div class="stat-icon" style="color: #06b6d4; background: #06b6d41a;"><i class="fas fa-history"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${avgSessionLength} mins</span>
                            <span class="stat-label">Avg. Session Length</span>
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

                <!-- Chart Workspaces -->
                <div class="charts-layout">
                    <!-- Main Study Hours Chart -->
                    <div class="chart-container-card glass-panel double-width">
                        <h3>Weekly Study Progress</h3>
                        <div class="chart-wrapper">
                            <canvas id="studyHoursChart"></canvas>
                        </div>
                    </div>

                    <!-- Tasks Breakdown Chart -->
                    <div class="chart-container-card glass-panel">
                        <h3>Task Ratio</h3>
                        <div class="chart-wrapper">
                            <canvas id="taskRatioChart"></canvas>
                        </div>
                    </div>

                    <!-- Course Distribution Bar Chart -->
                    <div class="chart-container-card glass-panel double-width">
                        <h3>Study Distribution by Course</h3>
                        <div class="chart-wrapper">
                            <canvas id="courseDistributionChart"></canvas>
                        </div>
                    </div>
                </div>
            `;

            // Render charts asynchronously to ensure DOM is fully painted
            setTimeout(() => {
                this.renderStudyChart(logs);
                this.renderTaskChart(completedCount, pendingCount);
                this.renderCourseChart(logs, courses);
            }, 50);
        }

        renderStudyChart(logs) {
            const canvas = document.getElementById('studyHoursChart');
            if (!canvas) return;

            // Generate last 7 days labels and values
            const days = [];
            const dayLabels = [];
            const studyHours = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                days.push(dateStr);
                dayLabels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }));
                
                // Sum study hours for this day
                const dayMins = logs.filter(l => l.date === dateStr).reduce((acc, l) => acc + l.minutes, 0);
                studyHours.push((dayMins / 60).toFixed(2));
            }

            if (this.studyChart) this.studyChart.destroy();

            // Set styling configurations based on theme (read active theme)
            const isDark = document.body.classList.contains('dark-theme');
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
            const labelColor = isDark ? '#94a3b8' : '#64748b';

            this.studyChart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: dayLabels,
                    datasets: [{
                        label: 'Study Hours',
                        data: studyHours,
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#ec4899',
                        pointBorderColor: 'rgba(255, 255, 255, 0.4)',
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            grid: { color: gridColor },
                            ticks: { color: labelColor },
                            beginAtZero: true,
                            title: { display: true, text: 'Hours', color: labelColor }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: labelColor }
                        }
                    }
                }
            });
        }

        renderTaskChart(completed, pending) {
            const canvas = document.getElementById('taskRatioChart');
            if (!canvas) return;

            if (this.taskChart) this.taskChart.destroy();

            const isDark = document.body.classList.contains('dark-theme');
            const labelColor = isDark ? '#e2e8f0' : '#1e293b';

            this.taskChart = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Pending'],
                    datasets: [{
                        data: [completed, pending],
                        backgroundColor: ['#10b981', '#ec4899'],
                        borderColor: isDark ? '#1e1b4b' : '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: labelColor,
                                boxWidth: 15,
                                font: { family: 'Inter', size: 12 }
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
        }

        renderCourseChart(logs, courses) {
            const canvas = document.getElementById('courseDistributionChart');
            if (!canvas) return;

            if (this.courseChart) this.courseChart.destroy();

            const labels = [];
            const dataMins = [];
            const colors = [];

            courses.forEach(course => {
                const totalMins = logs.filter(l => l.courseId === course.id).reduce((acc, l) => acc + l.minutes, 0);
                labels.push(course.code);
                dataMins.push(totalMins);
                colors.push(course.color);
            });

            // Handle general study log
            const generalMins = logs.filter(l => l.courseId === '').reduce((acc, l) => acc + l.minutes, 0);
            if (generalMins > 0) {
                labels.push('General');
                dataMins.push(generalMins);
                colors.push('#94a3b8');
            }

            const isDark = document.body.classList.contains('dark-theme');
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
            const labelColor = isDark ? '#94a3b8' : '#64748b';

            this.courseChart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataMins,
                        backgroundColor: colors,
                        borderRadius: 6,
                        maxBarThickness: 35
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { color: gridColor },
                            ticks: { color: labelColor },
                            title: { display: true, text: 'Total Minutes', color: labelColor }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: labelColor }
                        }
                    }
                }
            });
        }
    }

    window.StudyAnalytics = new AnalyticsWorkspace();
})();
