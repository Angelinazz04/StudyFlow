// StudyFlow Task Management Module
(function() {
    class TaskManager {
        constructor() {
            this.init();
        }

        init() {
            window.StudyRouter.register('tasks', () => this.renderTasksView());
        }

        renderTasksView() {
            const container = document.getElementById('view-tasks');
            if (!container) return;

            const state = window.StudyState.state;
            const courses = state.courses;
            const tasks = state.tasks;

            // Retain search and filter states
            if (this.currentSearch === undefined) this.currentSearch = '';
            if (this.currentCourseFilter === undefined) this.currentCourseFilter = 'all';
            if (this.currentPriorityFilter === undefined) this.currentPriorityFilter = 'all';
            if (this.currentStatusFilter === undefined) this.currentStatusFilter = 'pending'; // Default to show pending tasks
            if (this.currentSort === undefined) this.currentSort = 'date-asc';

            // Filter tasks
            const filteredTasks = tasks.filter(task => {
                // Search query
                const matchesSearch = task.title.toLowerCase().includes(this.currentSearch.toLowerCase()) || 
                                      task.description.toLowerCase().includes(this.currentSearch.toLowerCase());
                
                // Course filter
                const matchesCourse = this.currentCourseFilter === 'all' || task.courseId === this.currentCourseFilter;

                // Priority filter
                const matchesPriority = this.currentPriorityFilter === 'all' || task.priority === this.currentPriorityFilter;

                // Status filter
                let matchesStatus = true;
                if (this.currentStatusFilter === 'pending') matchesStatus = !task.completed;
                else if (this.currentStatusFilter === 'completed') matchesStatus = task.completed;

                return matchesSearch && matchesCourse && matchesPriority && matchesStatus;
            });

            // Sort tasks
            filteredTasks.sort((a, b) => {
                if (this.currentSort === 'date-asc') {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                } else if (this.currentSort === 'date-desc') {
                    return new Date(b.dueDate) - new Date(a.dueDate);
                } else if (this.currentSort === 'priority') {
                    const priorityWeight = { high: 3, medium: 2, low: 1 };
                    return priorityWeight[b.priority] - priorityWeight[a.priority];
                }
                return 0;
            });

            // Render list of tasks
            let tasksListHtml = '';
            if (filteredTasks.length === 0) {
                tasksListHtml = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No tasks found matching your filters.</p>
                    </div>
                `;
            } else {
                tasksListHtml = `
                    <div class="tasks-list">
                        ${filteredTasks.map(task => {
                            const course = courses.find(c => c.id === task.courseId);
                            const courseColor = course ? course.color : '#94a3b8';
                            const courseCode = course ? course.code : 'No Course';
                            
                            // Check if overdue
                            const todayStr = new Date().toISOString().split('T')[0];
                            const isOverdue = !task.completed && task.dueDate < todayStr;
                            
                            return `
                                <div class="task-item glass-panel ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                                    <div class="task-checkbox-wrapper">
                                        <button class="task-checkbox-btn" data-id="${task.id}" title="${task.completed ? 'Mark Incomplete' : 'Mark Complete'}">
                                            <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                                        </button>
                                    </div>
                                    
                                    <div class="task-content">
                                        <h4 class="task-title">${task.title}</h4>
                                        <p class="task-desc">${task.description}</p>
                                        
                                        <div class="task-badges">
                                            <span class="task-badge course-badge" style="background: ${courseColor}1a; color: ${courseColor}; border: 1px solid ${courseColor}44">
                                                <i class="fas fa-tag" style="color: ${courseColor}"></i> ${courseCode}
                                            </span>
                                            <span class="task-badge priority-badge priority-${task.priority}">
                                                <i class="fas fa-exclamation-circle"></i> ${task.priority.toUpperCase()}
                                            </span>
                                            <span class="task-badge deadline-badge ${isOverdue ? 'overdue-badge' : ''}">
                                                <i class="far fa-calendar-alt"></i> Due: ${task.dueDate} ${isOverdue ? '(Overdue)' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="task-actions">
                                        <button class="edit-task-btn card-action-btn" data-id="${task.id}" title="Edit Task"><i class="fas fa-edit"></i></button>
                                        <button class="delete-task-btn card-action-btn" data-id="${task.id}" title="Delete Task"><i class="fas fa-trash-alt"></i></button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="view-header">
                    <div class="header-title">
                        <h1>Task Organizer</h1>
                        <p>Keep track of homework, assignments, and exam prep</p>
                    </div>
                    <button class="action-btn" id="add-task-btn"><i class="fas fa-plus"></i> Add Task</button>
                </div>

                <!-- Filters Panel -->
                <div class="filters-panel glass-panel">
                    <div class="filter-search">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="task-search-input" placeholder="Search tasks..." value="${this.currentSearch}">
                    </div>
                    <div class="filter-options">
                        <div class="filter-group">
                            <label>Course</label>
                            <select id="task-filter-course">
                                <option value="all" ${this.currentCourseFilter === 'all' ? 'selected' : ''}>All Courses</option>
                                ${courses.map(c => `<option value="${c.id}" ${this.currentCourseFilter === c.id ? 'selected' : ''}>${c.code}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Priority</label>
                            <select id="task-filter-priority">
                                <option value="all" ${this.currentPriorityFilter === 'all' ? 'selected' : ''}>All Priorities</option>
                                <option value="high" ${this.currentPriorityFilter === 'high' ? 'selected' : ''}>High</option>
                                <option value="medium" ${this.currentPriorityFilter === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="low" ${this.currentPriorityFilter === 'low' ? 'selected' : ''}>Low</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Status</label>
                            <select id="task-filter-status">
                                <option value="all" ${this.currentStatusFilter === 'all' ? 'selected' : ''}>All Tasks</option>
                                <option value="pending" ${this.currentStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="completed" ${this.currentStatusFilter === 'completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Sort By</label>
                            <select id="task-sort">
                                <option value="date-asc" ${this.currentSort === 'date-asc' ? 'selected' : ''}>Date (Ascending)</option>
                                <option value="date-desc" ${this.currentSort === 'date-desc' ? 'selected' : ''}>Date (Descending)</option>
                                <option value="priority" ${this.currentSort === 'priority' ? 'selected' : ''}>Priority</option>
                            </select>
                        </div>
                    </div>
                </div>

                ${tasksListHtml}

                <!-- Task Modal (Add / Edit) -->
                <div class="modal-overlay" id="task-modal">
                    <div class="modal-content glass-panel">
                        <div class="modal-header">
                            <h3 id="task-modal-title">Add New Task</h3>
                            <button class="close-modal-btn" id="close-task-modal">&times;</button>
                        </div>
                        <form id="task-form">
                            <input type="hidden" id="task-edit-id" value="">
                            <div class="form-group">
                                <label for="task-title-input">Task Title</label>
                                <input type="text" id="task-title-input" placeholder="e.g. Solve exercises 1-5" required>
                            </div>
                            <div class="form-group">
                                <label for="task-desc-input">Description</label>
                                <textarea id="task-desc-input" rows="3" placeholder="Provide extra details..."></textarea>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="task-course-input">Course</label>
                                    <select id="task-course-input">
                                        <option value="">No Course</option>
                                        ${courses.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="task-priority-input">Priority</label>
                                    <select id="task-priority-input" required>
                                        <option value="low">Low</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="task-date-input">Due Date</label>
                                <input type="date" id="task-date-input" required>
                            </div>
                            <button type="submit" class="modal-submit-btn">Save Task</button>
                        </form>
                    </div>
                </div>
            `;

            // Elements
            const modal = document.getElementById('task-modal');
            const openModalBtn = document.getElementById('add-task-btn');
            const closeModalBtn = document.getElementById('close-task-modal');
            const form = document.getElementById('task-form');

            const searchInput = document.getElementById('task-search-input');
            const courseSelect = document.getElementById('task-filter-course');
            const prioritySelect = document.getElementById('task-filter-priority');
            const statusSelect = document.getElementById('task-filter-status');
            const sortSelect = document.getElementById('task-sort');

            // Wire filter triggers
            const applyFilters = () => {
                this.currentSearch = searchInput.value;
                this.currentCourseFilter = courseSelect.value;
                this.currentPriorityFilter = prioritySelect.value;
                this.currentStatusFilter = statusSelect.value;
                this.currentSort = sortSelect.value;
                this.renderTasksView();
            };

            searchInput.addEventListener('input', () => {
                // Throttle/debounce can be added, but simple input works well for local array
                this.currentSearch = searchInput.value;
                applyFilters();
            });
            courseSelect.addEventListener('change', applyFilters);
            prioritySelect.addEventListener('change', applyFilters);
            statusSelect.addEventListener('change', applyFilters);
            sortSelect.addEventListener('change', applyFilters);

            // Modal Handlers
            const openModal = (title, editId = '') => {
                document.getElementById('task-modal-title').textContent = title;
                document.getElementById('task-edit-id').value = editId;

                const todayStr = new Date().toISOString().split('T')[0];

                if (editId) {
                    const task = state.tasks.find(t => t.id === editId);
                    if (task) {
                        document.getElementById('task-title-input').value = task.title;
                        document.getElementById('task-desc-input').value = task.description;
                        document.getElementById('task-course-input').value = task.courseId;
                        document.getElementById('task-priority-input').value = task.priority;
                        document.getElementById('task-date-input').value = task.dueDate;
                    }
                } else {
                    form.reset();
                    document.getElementById('task-date-input').value = todayStr;
                    document.getElementById('task-priority-input').value = 'medium';
                }
                modal.classList.add('active');
            };

            const closeModal = () => {
                modal.classList.remove('active');
            };

            openModalBtn.addEventListener('click', () => openModal('Add New Task'));
            closeModalBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const editId = document.getElementById('task-edit-id').value;
                const title = document.getElementById('task-title-input').value.trim();
                const description = document.getElementById('task-desc-input').value.trim();
                const courseId = document.getElementById('task-course-input').value;
                const priority = document.getElementById('task-priority-input').value;
                const dueDate = document.getElementById('task-date-input').value;

                if (editId) {
                    window.StudyState.updateTask(editId, { title, description, courseId, priority, dueDate });
                    if (window.showNotification) window.showNotification('Task updated successfully!', 'success');
                } else {
                    window.StudyState.addTask(title, description, dueDate, priority, courseId);
                    if (window.showNotification) window.showNotification('Task created successfully!', 'success');
                }

                closeModal();
                this.renderTasksView();
            });

            // Inline complete toggle handler
            container.querySelectorAll('.task-checkbox-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const taskId = btn.getAttribute('data-id');
                    window.StudyState.toggleTask(taskId);
                    
                    const isCompletedNow = window.StudyState.state.tasks.find(t => t.id === taskId).completed;
                    if (window.showNotification) {
                        window.showNotification(isCompletedNow ? 'Task completed! Keep it up!' : 'Task set to incomplete.', 'success');
                    }
                    this.renderTasksView();
                });
            });

            // Card Edit / Delete action handlers
            container.querySelectorAll('.edit-task-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const taskId = btn.getAttribute('data-id');
                    openModal('Edit Task', taskId);
                });
            });

            container.querySelectorAll('.delete-task-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const taskId = btn.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this task?')) {
                        window.StudyState.deleteTask(taskId);
                        if (window.showNotification) window.showNotification('Task deleted successfully.', 'success');
                        this.renderTasksView();
                    }
                });
            });
        }
    }

    window.StudyTasks = new TaskManager();
})();
