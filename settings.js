// StudyFlow Settings Module
(function() {
    class SettingsManager {
        constructor() {
            this.avatars = {
                'avatar-1': `<svg class="avatar-svg" viewBox="0 0 100 100" style="background: linear-gradient(135deg, #f9a8d4, #db2777)"><circle cx="50" cy="40" r="20" fill="#ffffff" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80" fill="#ffffff" /></svg>`,
                'avatar-2': `<svg class="avatar-svg" viewBox="0 0 100 100" style="background: linear-gradient(135deg, #f472b6, #db2777)"><circle cx="50" cy="40" r="20" fill="#ffffff" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80" fill="#ffffff" /></svg>`,
                'avatar-3': `<svg class="avatar-svg" viewBox="0 0 100 100" style="background: linear-gradient(135deg, #34d399, #059669)"><circle cx="50" cy="40" r="20" fill="#ffffff" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80" fill="#ffffff" /></svg>`,
                'avatar-4': `<svg class="avatar-svg" viewBox="0 0 100 100" style="background: linear-gradient(135deg, #fbbf24, #d97706)"><circle cx="50" cy="40" r="20" fill="#ffffff" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80" fill="#ffffff" /></svg>`
            };
            this.init();
        }

        init() {
            window.StudyRouter.register('settings', () => this.renderSettingsView());
            this.applyThemeOnInit();
        }

        applyThemeOnInit() {
            const state = window.StudyState.loadState();
            if (state.theme === 'dark') {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
            }
        }

        getAvatarSvg(key) {
            if (key && key.startsWith('data:image')) {
                return `<img src="${key}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
            return this.avatars[key] || this.avatars['avatar-1'];
        }

        renderSettingsView() {
            const container = document.getElementById('view-settings');
            if (!container) return;

            const state = window.StudyState.state;
            const profile = state.settings.profile;

            // Generate Avatars Selector HTML
            const avatarOptionsHtml = Object.keys(this.avatars).map(key => {
                const isActive = profile.avatar === key;
                return `
                    <div class="avatar-option ${isActive ? 'active' : ''}" data-avatar-id="${key}">
                        ${this.avatars[key]}
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <div class="view-header">
                    <div class="header-title">
                        <h1>Account Settings</h1>
                        <p>Customize your profile, goals, and visual dashboard theme</p>
                    </div>
                </div>

                <div class="settings-workspace">
                    <div class="settings-card glass-panel">
                        <h3>Edit Profile</h3>
                        <form id="settings-profile-form" class="settings-form">
                            <div class="form-group">
                                <label>Profile Picture</label>
                                <div class="avatar-upload-wrapper" style="display: flex; align-items: center; gap: 16px;">
                                    <div id="avatar-preview-container" style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2px solid var(--border-color);">
                                        ${this.getAvatarSvg(profile.avatar)}
                                    </div>
                                    <input type="file" id="profile-upload" accept="image/*" style="display: none;">
                                    <button type="button" class="action-btn" onclick="document.getElementById('profile-upload').click()">Upload Image</button>
                                </div>
                                <input type="hidden" id="settings-avatar-input" value="${profile.avatar}">
                            </div>

                            <div class="form-group">
                                <label for="settings-name-input">Display Name</label>
                                <input type="text" id="settings-name-input" value="${profile.name}" placeholder="e.g. Alex Mercer" required>
                            </div>

                            <div class="form-group">
                                <label for="settings-goal-input">Weekly Study Goal (Hours)</label>
                                <input type="number" id="settings-goal-input" value="${profile.weeklyGoalHours}" min="1" max="168" required>
                            </div>

                            <div class="form-group">
                                <label for="settings-university-input">University</label>
                                <input type="text" id="settings-university-input" value="${profile.university || ''}" placeholder="e.g. Stanford University">
                            </div>

                            <div class="form-group">
                                <label for="settings-major-input">Major</label>
                                <input type="text" id="settings-major-input" value="${profile.major || ''}" placeholder="e.g. Computer Science">
                            </div>

                            <div class="form-group">
                                <label for="settings-bio-input">Bio</label>
                                <textarea id="settings-bio-input" rows="3" placeholder="Tell us a bit about yourself..." style="resize: vertical; font-family: inherit; font-size: 14px; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); width: 100%; box-sizing: border-box;">${profile.bio || ''}</textarea>
                            </div>

                            <button type="submit" class="modal-submit-btn">Save Changes</button>
                        </form>
                    </div>

                    <div class="settings-card glass-panel">
                        <h3>Visual Appearance</h3>
                        <div class="settings-form">
                            <div class="appearance-settings-row">
                                <div class="appearance-info">
                                    <h3 style="margin-bottom: 8px;">Interface Theme</h3>
                                    <p style="color: var(--text-secondary); font-size: 15px;">Choose between light and dark modes for comfortable studying</p>
                                </div>
                                <div class="theme-toggle-wrapper">
                                    <button class="theme-select-btn ${state.theme === 'dark' ? 'active' : ''}" id="theme-dark-btn">
                                        <i class="fas fa-moon"></i> Dark Mode
                                    </button>
                                    <button class="theme-select-btn ${state.theme === 'light' ? 'active' : ''}" id="theme-light-btn">
                                        <i class="fas fa-sun"></i> Light Mode
                                    </button>
                                </div>
                            </div>
                            

                            <div class="danger-zone-section">
                                <h3 style="color: var(--accent-rose); margin-bottom: 8px;">Danger Zone</h3>
                                <p style="margin-bottom: 16px; color: var(--text-secondary); font-size: 15px;">Reset the dashboard configuration and purge all local storage data.</p>
                                <button class="action-btn-danger" id="purge-data-btn"><i class="fas fa-trash-alt"></i> Reset All Data</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Bindings
            const form = document.getElementById('settings-profile-form');
            const avatarInput = document.getElementById('settings-avatar-input');
            const avatarOptions = container.querySelectorAll('.avatar-option');
            
            const darkBtn = document.getElementById('theme-dark-btn');
            const lightBtn = document.getElementById('theme-light-btn');
            const purgeBtn = document.getElementById('purge-data-btn');

            // Avatar picker
            avatarOptions.forEach(opt => {
                opt.addEventListener('click', () => {
                    avatarOptions.forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    avatarInput.value = opt.getAttribute('data-avatar-id');
                });
            });

            // File upload logic
            const profileUpload = document.getElementById('profile-upload');
            const previewContainer = document.getElementById('avatar-preview-container');

            profileUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64String = event.target.result;
                        avatarInput.value = base64String;
                        previewContainer.innerHTML = this.getAvatarSvg(base64String);
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Save profile details
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('settings-name-input').value.trim();
                const weeklyGoalHours = parseInt(document.getElementById('settings-goal-input').value);
                const university = document.getElementById('settings-university-input').value.trim();
                const major = document.getElementById('settings-major-input').value.trim();
                const bio = document.getElementById('settings-bio-input').value.trim();
                const avatar = avatarInput.value;

                window.StudyState.updateProfile({ name, weeklyGoalHours, university, major, bio, avatar });
                
                // Update header avatars in real-time
                const headerAvatars = document.querySelectorAll('.sync-profile-avatar');
                headerAvatars.forEach(av => {
                    av.innerHTML = this.getAvatarSvg(avatar);
                });

                if (window.showNotification) window.showNotification('Profile updated successfully!', 'success');
                this.renderSettingsView();
            });

            // Theme toggles
            darkBtn.addEventListener('click', () => {
                window.StudyState.setTheme('dark');
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
                darkBtn.classList.add('active');
                lightBtn.classList.remove('active');
                if (window.showNotification) window.showNotification('Switched to Dark Theme.', 'success');
            });

            lightBtn.addEventListener('click', () => {
                window.StudyState.setTheme('light');
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
                lightBtn.classList.add('active');
                darkBtn.classList.remove('active');
                if (window.showNotification) window.showNotification('Switched to Light Theme.', 'success');
            });

            // Reset data
            purgeBtn.addEventListener('click', () => {
                if (confirm('CRITICAL WARNING: This will permanently delete ALL courses, tasks, study history logs, notes, achievements, and settings. Are you absolutely sure?')) {
                    window.StudyState.resetState();
                    alert('Data restored to default settings. Re-loading application.');
                    window.location.reload();
                }
            });
        }
    }

    window.StudySettings = new SettingsManager();
})();
