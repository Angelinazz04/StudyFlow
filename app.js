// StudyFlow Application Coordinator
(function() {
    class AppController {
        constructor() {
            this.init();
        }

        init() {
            document.addEventListener('DOMContentLoaded', () => {
                this.initAppShell();
                this.initNotificationSystem();
                this.bindThemeAndProfileSync();
                
                // Initialize Router and navigate to appropriate initial view
                const stateObj = window.StudyState.state;
                if (stateObj.currentUser) {
                    document.body.classList.remove('unauthenticated');
                    document.body.classList.add('authenticated');
                    window.StudyRouter.navigate('dashboard');
                } else {
                    document.body.classList.add('unauthenticated');
                    document.body.classList.remove('authenticated');
                    window.StudyRouter.navigate('auth');
                }
            });
        }

        initAppShell() {
            // Mobile hamburger menu toggle
            const burger = document.getElementById('mobile-menu-burger');
            const sidebar = document.querySelector('.sidebar');
            
            if (burger && sidebar) {
                burger.addEventListener('click', () => {
                    sidebar.classList.toggle('open');
                });
            }

            // Bind logout buttons
            const logoutBtns = document.querySelectorAll('.logout-btn');
            logoutBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Are you sure you want to sign out?')) {
                        window.StudyAuth.logout();
                    }
                });
            });
        }

        initNotificationSystem() {
            // Create toast container dynamically
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);

            // Global toast notifier helper
            window.showNotification = (message, type = 'info') => {
                const toast = document.createElement('div');
                toast.className = `toast-message ${type}`;
                
                let iconClass = 'fa-info-circle';
                if (type === 'success') iconClass = 'fa-check-circle';
                else if (type === 'error') iconClass = 'fa-exclamation-triangle';
                else if (type === 'warning') iconClass = 'fa-exclamation-circle';

                toast.innerHTML = `
                    <i class="fas ${iconClass}"></i>
                    <span>${message}</span>
                `;
                
                container.appendChild(toast);
                
                // Animate entrance
                setTimeout(() => {
                    toast.classList.add('visible');
                }, 10);

                // Auto remove after 3.5s
                setTimeout(() => {
                    toast.classList.remove('visible');
                    setTimeout(() => {
                        toast.remove();
                    }, 300);
                }, 3500);
            };
        }

        bindThemeAndProfileSync() {
            const state = window.StudyState.state;

            const syncProfileDetails = (currentState) => {
                const profile = currentState.settings.profile;
                
                // Update User Display name in sidebar and headers
                const userNames = document.querySelectorAll('.sync-profile-name');
                userNames.forEach(el => {
                    el.textContent = currentState.currentUser ? profile.name : 'Guest User';
                });

                // Update User Role/Major/University
                const userRoles = document.querySelectorAll('.profile-role');
                userRoles.forEach(el => {
                    if (profile.major || profile.university) {
                        let roleText = [];
                        if (profile.major) roleText.push(profile.major);
                        if (profile.university) roleText.push(profile.university);
                        el.textContent = roleText.join(' @ ');
                    } else {
                        el.textContent = 'Student';
                    }
                });

                // Update User Avatar SVG in sidebar and headers
                const avatars = document.querySelectorAll('.sync-profile-avatar');
                avatars.forEach(el => {
                    if (window.StudySettings) {
                        el.innerHTML = window.StudySettings.getAvatarSvg(profile.avatar);
                    }
                });

                // Set theme tag
                if (currentState.theme === 'light') {
                    document.body.classList.add('light-theme');
                    document.body.classList.remove('dark-theme');
                } else {
                    document.body.classList.add('dark-theme');
                    document.body.classList.remove('light-theme');
                }
            };

            // Initial Sync
            syncProfileDetails(state);

            // Subscribe to state updates to sync profile / theme changes across components
            window.StudyState.subscribe((updatedState) => {
                syncProfileDetails(updatedState);
            });
        }
    }

    new AppController();
})();
