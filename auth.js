// StudyFlow Authentication Module
(function() {
    const USERS_KEY = 'studyflow_users_db';

    class AuthManager {
        constructor() {
            this.init();
        }

        init() {
            // Register auth view renderer
            window.StudyRouter.register('auth', () => this.renderAuthView());
        }

        getUsers() {
            const users = localStorage.getItem(USERS_KEY);
            return users ? JSON.parse(users) : {};
        }

        saveUsers(users) {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }

        register(username, password) {
            const users = this.getUsers();
            if (users[username]) {
                return { success: false, message: 'Username already exists' };
            }
            users[username] = {
                username,
                password, // In a real app we would hash, but simple string is fine for this simulated client app
                createdAt: new Date().toISOString()
            };
            this.saveUsers(users);
            return { success: true };
        }

        login(username, password) {
            const users = this.getUsers();
            if (!users[username] || users[username].password !== password) {
                return { success: false, message: 'Invalid username or password' };
            }
            window.StudyState.setCurrentUser(username);
            return { success: true };
        }

        logout() {
            window.StudyState.setCurrentUser(null);
            window.StudyRouter.navigate('auth');
            // Force reload or hide app container
            document.body.classList.add('unauthenticated');
            document.body.classList.remove('authenticated');
        }

        renderAuthView() {
            const container = document.getElementById('view-auth');
            if (!container) return;

            // Simple check to make sure app layout matches auth state
            document.body.classList.add('unauthenticated');
            document.body.classList.remove('authenticated');

            container.innerHTML = `
                <div class="auth-card glass-panel">
                    <div class="auth-brand">
                        <i class="fas fa-graduation-cap brand-icon"></i>
                        <h2>StudyFlow</h2>
                        <p>Your ultimate academic command center</p>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab-btn active" id="tab-login-btn">Sign In</button>
                        <button class="auth-tab-btn" id="tab-register-btn">Create Account</button>
                    </div>

                    <form id="auth-form" class="auth-form">
                        <div class="form-group">
                            <label for="auth-username">Username</label>
                            <div class="input-wrapper">
                                <i class="fas fa-user"></i>
                                <input type="text" id="auth-username" required placeholder="Enter your username">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="auth-password">Password</label>
                            <div class="input-wrapper">
                                <i class="fas fa-lock"></i>
                                <input type="password" id="auth-password" required placeholder="Enter your password">
                            </div>
                        </div>

                        <button type="submit" class="auth-submit-btn" id="auth-submit-btn-text">Sign In</button>
                    </form>
                    <div class="auth-alert" id="auth-alert"></div>
                </div>
            `;

            const authForm = document.getElementById('auth-form');
            const tabLoginBtn = document.getElementById('tab-login-btn');
            const tabRegisterBtn = document.getElementById('tab-register-btn');
            const submitBtnText = document.getElementById('auth-submit-btn-text');
            const alertBox = document.getElementById('auth-alert');
            let mode = 'login'; // 'login' or 'register'

            const setAlert = (message, type) => {
                alertBox.textContent = message;
                alertBox.className = `auth-alert ${type}`;
                alertBox.style.display = 'block';
                setTimeout(() => {
                    alertBox.style.opacity = '1';
                }, 10);
            };

            const hideAlert = () => {
                alertBox.style.display = 'none';
                alertBox.style.opacity = '0';
            };

            tabLoginBtn.addEventListener('click', () => {
                mode = 'login';
                tabLoginBtn.classList.add('active');
                tabRegisterBtn.classList.remove('active');
                submitBtnText.textContent = 'Sign In';
                hideAlert();
            });

            tabRegisterBtn.addEventListener('click', () => {
                mode = 'register';
                tabRegisterBtn.classList.add('active');
                tabLoginBtn.classList.remove('active');
                submitBtnText.textContent = 'Create Account';
                hideAlert();
            });

            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                hideAlert();

                const username = document.getElementById('auth-username').value.trim();
                const password = document.getElementById('auth-password').value;

                if (!username || !password) {
                    setAlert('All fields are required.', 'error');
                    return;
                }

                if (mode === 'login') {
                    const result = this.login(username, password);
                    if (result.success) {
                        setAlert('Login successful! Redirecting...', 'success');
                        setTimeout(() => {
                            document.body.classList.remove('unauthenticated');
                            document.body.classList.add('authenticated');
                            window.StudyRouter.navigate('dashboard');
                        }, 800);
                    } else {
                        setAlert(result.message, 'error');
                    }
                } else {
                    const result = this.register(username, password);
                    if (result.success) {
                        setAlert('Account created successfully! Logging you in...', 'success');
                        setTimeout(() => {
                            this.login(username, password);
                            document.body.classList.remove('unauthenticated');
                            document.body.classList.add('authenticated');
                            window.StudyRouter.navigate('dashboard');
                        }, 1000);
                    } else {
                        setAlert(result.message, 'error');
                    }
                }
            });
        }
    }

    window.StudyAuth = new AuthManager();
})();
