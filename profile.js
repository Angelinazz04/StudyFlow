// StudyFlow Profile Page Module
(function() {
    class ProfileManager {
        constructor() {
            this.init();
        }

        init() {
            window.StudyRouter.register('profile', () => this.renderProfileView());
        }

        renderProfileView() {
            const container = document.getElementById('view-profile');
            if (!container) return;

            const state = window.StudyState.state;
            const profile = state.settings.profile;

            // Compute stats
            const totalMinutes = state.timerLogs.reduce((sum, log) => sum + log.minutes, 0);
            const totalHours = (totalMinutes / 60).toFixed(1);
            const completedTasks = state.tasks.filter(t => t.completed).length;
            const totalTasks = state.tasks.length;
            const unlockedAchievements = state.achievements.filter(a => a.unlocked);
            const gpaCourses = state.settings.gpaCourses;
            const cumulativeGpa = gpaCourses.length > 0
                ? (gpaCourses.reduce((sum, c) => sum + c.gpa * c.credits, 0) /
                   gpaCourses.reduce((sum, c) => sum + c.credits, 0)).toFixed(2)
                : null;

            const roleText = [profile.major, profile.university].filter(Boolean).join(' @ ') || 'Student';
            const avatarHtml = window.StudySettings ? window.StudySettings.getAvatarSvg(profile.avatar) : '';

            container.innerHTML = `
                <div class="view-header">
                    <div class="header-title">
                        <h1>My Profile</h1>
                        <p>Your personal academic overview</p>
                    </div>
                    <button class="action-btn" onclick="window.StudyRouter.navigate('settings')" style="display:flex;align-items:center;gap:8px;">
                        <i class="fas fa-cog"></i> Edit Profile
                    </button>
                </div>

                <div class="profile-page-layout">
                    <!-- Left: Profile Card -->
                    <div class="profile-card glass-panel">
                        <div class="profile-avatar-large">
                            ${avatarHtml}
                        </div>
                        <h2 class="profile-page-name">${profile.name}</h2>
                        <p class="profile-page-role">${roleText}</p>

                        ${profile.bio ? `
                        <div class="profile-bio-box">
                            <p>${profile.bio}</p>
                        </div>` : `
                        <div class="profile-bio-box profile-bio-empty">
                            <p><i class="fas fa-pen" style="margin-right:6px;opacity:0.5;"></i>No bio yet. <span style="cursor:pointer;color:var(--accent-indigo);" onclick="window.StudyRouter.navigate('settings')">Add one in Settings →</span></p>
                        </div>`}

                        <div class="profile-info-pills">
                            ${profile.university ? `<div class="profile-pill"><i class="fas fa-university"></i> ${profile.university}</div>` : ''}
                            ${profile.major ? `<div class="profile-pill"><i class="fas fa-book-open"></i> ${profile.major}</div>` : ''}
                            ${cumulativeGpa ? `<div class="profile-pill profile-pill-gpa"><i class="fas fa-star"></i> GPA: ${cumulativeGpa}</div>` : ''}
                        </div>
                    </div>

                    <!-- Right: Stats + Achievements -->
                    <div class="profile-right-col">
                        <!-- Stats Grid -->
                        <div class="profile-stats-grid glass-panel">
                            <h3 class="profile-section-title"><i class="fas fa-chart-bar"></i> Academic Stats</h3>
                            <div class="profile-stats-row">
                                <div class="profile-stat-item">
                                    <span class="profile-stat-value">${totalHours}</span>
                                    <span class="profile-stat-label">Study Hours</span>
                                </div>
                                <div class="profile-stat-item">
                                    <span class="profile-stat-value">${completedTasks}</span>
                                    <span class="profile-stat-label">Tasks Done</span>
                                </div>
                                <div class="profile-stat-item">
                                    <span class="profile-stat-value">${state.settings.gpaCourses.length}</span>
                                    <span class="profile-stat-label">Courses Logged</span>
                                </div>
                                <div class="profile-stat-item">
                                    <span class="profile-stat-value">${unlockedAchievements.length}</span>
                                    <span class="profile-stat-label">Achievements</span>
                                </div>
                            </div>
                        </div>

                        <!-- Achievements -->
                        <div class="profile-achievements-box glass-panel">
                            <h3 class="profile-section-title"><i class="fas fa-trophy"></i> Unlocked Achievements</h3>
                            ${unlockedAchievements.length === 0 ? `
                                <div class="profile-empty-state">
                                    <i class="fas fa-lock" style="font-size:28px;opacity:0.3;"></i>
                                    <p>No achievements unlocked yet. Keep studying!</p>
                                </div>
                            ` : `
                                <div class="profile-achievements-list">
                                    ${unlockedAchievements.map(ach => `
                                        <div class="profile-ach-item">
                                            <div class="profile-ach-icon">
                                                <i class="fas ${ach.icon}"></i>
                                            </div>
                                            <div class="profile-ach-details">
                                                <strong>${ach.title}</strong>
                                                <span>${ach.description}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.StudyProfile = new ProfileManager();
})();
