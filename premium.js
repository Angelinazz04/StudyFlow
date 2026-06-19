// StudyFlow Premium Features Module
(function() {
    class PremiumManager {
        constructor() {
            this.gradeScale = {
                'A': 4.0,
                'A-': 3.7,
                'B+': 3.3,
                'B': 3.0,
                'B-': 2.7,
                'C+': 2.3,
                'C': 2.0,
                'C-': 1.7,
                'D+': 1.3,
                'D': 1.0,
                'F': 0.0
            };
            this.init();
        }

        init() {
            window.StudyRouter.register('premium', () => this.renderPremiumView());
        }

        calculateGpa(gpaCourses) {
            if (!gpaCourses || gpaCourses.length === 0) return '0.00';
            
            let totalWeightedPoints = 0;
            let totalCredits = 0;

            gpaCourses.forEach(course => {
                totalWeightedPoints += (course.credits * course.gpa);
                totalCredits += course.credits;
            });

            if (totalCredits === 0) return '0.00';
            return (totalWeightedPoints / totalCredits).toFixed(2);
        }

        renderPremiumView() {
            const container = document.getElementById('view-premium');
            if (!container) return;

            const state = window.StudyState.state;
            const profile = state.settings.profile;
            const gpaCourses = state.settings.gpaCourses || [];
            const achievements = state.achievements;

            const cumulativeGpa = this.calculateGpa(gpaCourses);

            // Render GPA List rows
            let gpaRowsHtml = '';
            if (gpaCourses.length === 0) {
                gpaRowsHtml = `<tr><td colspan="5" class="table-empty">No grades logged. Add a course below to begin calculating.</td></tr>`;
            } else {
                gpaRowsHtml = gpaCourses.map(course => `
                    <tr>
                        <td><strong>${course.name}</strong></td>
                        <td>${course.credits}</td>
                        <td><span class="grade-badge">${course.grade}</span></td>
                        <td>${course.gpa.toFixed(1)}</td>
                        <td>
                            <button class="delete-gpa-btn table-action-btn" data-id="${course.id}" title="Delete Record">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }

            // Render Achievements Shelf
            const achievementsHtml = achievements.map(ach => {
                const dateStr = ach.unlocked ? new Date(ach.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Locked';
                return `
                    <div class="achievement-card glass-panel ${ach.unlocked ? 'unlocked' : 'locked'}">
                        <div class="achievement-icon">
                            <i class="fas ${ach.icon}"></i>
                        </div>
                        <div class="achievement-details">
                            <h4>${ach.title}</h4>
                            <p>${ach.description}</p>
                            <span class="achievement-status-date">${ach.unlocked ? `Unlocked: ${dateStr}` : 'Complete requirements to unlock'}</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Monthly Goals Progress calculations
            const totalStudyMins = state.timerLogs.reduce((acc, log) => acc + log.minutes, 0);
            const studyHours = Math.round(totalStudyMins / 60);
            const studyHoursGoal = 20; // Hardcoded monthly goal preview
            const studyPct = Math.min(Math.round((studyHours / studyHoursGoal) * 100), 100);

            const completedTasks = state.tasks.filter(t => t.completed).length;
            const tasksGoal = 10;
            const tasksPct = Math.min(Math.round((completedTasks / tasksGoal) * 100), 100);

            container.innerHTML = `
                <div class="view-header">
                    <div class="header-title">
                        <h1>GPA & Achievements</h1>
                        <p>Access advanced GPA trackers, review gamified goals, and check achievements</p>
                    </div>
                </div>

                <div class="premium-workspace">
                    
                    <!-- Left: GPA Calculator -->
                    <div class="premium-panel glass-panel double-width">
                        <div class="panel-header-with-badge">
                            <h3>Academic GPA Tracker</h3>
                            <div class="gpa-large-display">
                                <span class="gpa-num-val">${cumulativeGpa}</span>
                                <span class="gpa-lbl-text">Cumulative GPA</span>
                            </div>
                        </div>

                        <!-- Grades Table -->
                        <div class="gpa-table-wrapper">
                            <table class="gpa-table">
                               <thead>
                                   <tr>
                                       <th>Course Name</th>
                                       <th>Credits</th>
                                       <th>Letter Grade</th>
                                       <th>Grade Value</th>
                                       <th>Actions</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   ${gpaRowsHtml}
                               </tbody>
                            </table>
                        </div>

                        <!-- GPA Inputs Form -->
                        <form id="gpa-adder-form" class="gpa-adder-form">
                            <h4>Log Course Grade</h4>
                            <div class="gpa-form-grid">
                                <div class="form-group">
                                    <input type="text" id="gpa-course-name" placeholder="Course Name (e.g. Chemistry)" required>
                                </div>
                                <div class="form-group">
                                    <input type="number" id="gpa-course-credits" placeholder="Credits (e.g. 3)" min="0.5" max="10" step="0.5" required>
                                </div>
                                <div class="form-group">
                                    <select id="gpa-course-grade" required>
                                        <option value="" disabled selected>Grade</option>
                                        ${Object.keys(this.gradeScale).map(g => `<option value="${g}">${g}</option>`).join('')}
                                    </select>
                                </div>
                                <button type="submit" class="submit-btn-solid">Add</button>
                            </div>
                        </form>
                    </div>

                    <!-- Right: Goals & Achievements -->
                    <div class="premium-panel-side">
                        <!-- Monthly Goals -->
                        <div class="premium-panel glass-panel">
                            <h3 style="margin-bottom: 24px;">Monthly Milestone Goals</h3>
                            
                            <div class="goal-progress-group">
                                <div class="goal-lbl-row">
                                    <span>Focused Study Time</span>
                                    <span>${studyHours}h / ${studyHoursGoal}h</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: ${studyPct}%; background: #ec4899;"></div>
                                </div>
                            </div>

                            <div class="goal-progress-group" style="margin-top: 16px;">
                                <div class="goal-lbl-row">
                                    <span>Tasks Accomplished</span>
                                    <span>${completedTasks} / ${tasksGoal}</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: ${tasksPct}%; background: #10b981;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Achievements Box -->
                        <div class="premium-panel glass-panel">
                            <h3 style="margin-bottom: 24px;">Achievements Drawer</h3>
                            <div class="achievements-list">
                                ${achievementsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Bind GPA submit
            const gpaForm = document.getElementById('gpa-adder-form');
            if (gpaForm) {
                gpaForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const name = document.getElementById('gpa-course-name').value.trim();
                    const credits = parseFloat(document.getElementById('gpa-course-credits').value);
                    const grade = document.getElementById('gpa-course-grade').value;
                    const gpaValue = this.gradeScale[grade];

                    window.StudyState.addGpaCourse(name, credits, grade, gpaValue);
                    if (window.showNotification) window.showNotification('Course grade logged!', 'success');
                    this.renderPremiumView();
                });
            }

            // Bind Delete GPA record
            container.querySelectorAll('.delete-gpa-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const recordId = btn.getAttribute('data-id');
                    window.StudyState.deleteGpaCourse(recordId);
                    if (window.showNotification) window.showNotification('Grade record removed.', 'success');
                    this.renderPremiumView();
                });
            });
        }
    }

    window.StudyPremium = new PremiumManager();
})();
