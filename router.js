// StudyFlow SPA Router
(function() {
    class Router {
        constructor() {
            this.routes = {};
            this.currentView = 'dashboard';
            this.initListeners();
        }

        register(viewId, renderCallback) {
            this.routes[viewId] = renderCallback;
        }

        initListeners() {
            document.addEventListener('click', (e) => {
                const navLink = e.target.closest('[data-view]');
                if (navLink) {
                    e.preventDefault();
                    const viewId = navLink.getAttribute('data-view');
                    this.navigate(viewId);
                }
            });
        }

        navigate(viewId) {
            // Check authentication
            const stateObj = window.StudyState.state;
            if (!stateObj.currentUser && viewId !== 'auth') {
                this.navigate('auth');
                return;
            }

            if (stateObj.currentUser && viewId === 'auth') {
                viewId = 'dashboard';
            }

            this.currentView = viewId;

            // Update UI elements visibility
            const views = document.querySelectorAll('.app-view');
            views.forEach(view => {
                if (view.id === `view-${viewId}`) {
                    view.classList.add('active');
                } else {
                    view.classList.remove('active');
                }
            });

            // Update sidebar nav states
            const navLinks = document.querySelectorAll('[data-view]');
            navLinks.forEach(link => {
                if (link.getAttribute('data-view') === viewId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Trigger registered render callbacks
            if (this.routes[viewId]) {
                try {
                    this.routes[viewId]();
                } catch (err) {
                    console.error(`Error rendering view: ${viewId}`, err);
                }
            }

            // Close mobile sidebar if open
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.remove('open');
            }
        }
    }

    window.StudyRouter = new Router();
})();
