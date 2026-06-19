// StudyFlow Course Management Module
(function() {
    class CourseManager {
        constructor() {
            this.init();
        }

        init() {
            window.StudyRouter.register('courses', () => this.renderCoursesView());
        }

        renderCoursesView() {
            const container = document.getElementById('view-courses');
            if (!container) return;

            const state = window.StudyState.state;
            const courses = state.courses;

            let coursesHtml = '';
            if (courses.length === 0) {
                coursesHtml = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <p>No courses added yet. Start by adding one below!</p>
                    </div>
                `;
            } else {
                coursesHtml = `
                    <div class="courses-grid">
                        ${courses.map(course => {
                            const courseTasks = state.tasks.filter(t => t.courseId === course.id);
                            const pendingTasks = courseTasks.filter(t => !t.completed).length;
                            const notesCount = state.notes.filter(n => n.courseId === course.id).length;

                            return `
                                <div class="course-card glass-panel" style="border-top: 4px solid ${course.color}">
                                    <div class="course-card-header">
                                        <span class="course-code" style="background: ${course.color}22; color: ${course.color}">${course.code}</span>
                                        <div class="course-card-actions">
                                            <button class="edit-course-btn card-action-btn" data-id="${course.id}" title="Edit Course"><i class="fas fa-edit"></i></button>
                                            <button class="delete-course-btn card-action-btn" data-id="${course.id}" title="Delete Course"><i class="fas fa-trash-alt"></i></button>
                                        </div>
                                    </div>
                                    <h3 class="course-name">${course.name}</h3>
                                    
                                    <div class="course-meta">
                                        <div class="meta-item">
                                            <i class="fas fa-tasks"></i>
                                            <span>${pendingTasks} pending task${pendingTasks === 1 ? '' : 's'}</span>
                                        </div>
                                        <div class="meta-item">
                                            <i class="fas fa-sticky-note"></i>
                                            <span>${notesCount} note${notesCount === 1 ? '' : 's'}</span>
                                        </div>
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
                        <h1>Course Manager</h1>
                        <p>Organize your academic materials and color-code your subjects</p>
                    </div>
                    <button class="action-btn" id="add-course-btn"><i class="fas fa-plus"></i> Add Course</button>
                </div>

                ${coursesHtml}

                <!-- Course Modal (Add / Edit) -->
                <div class="modal-overlay" id="course-modal">
                    <div class="modal-content glass-panel">
                        <div class="modal-header">
                            <h3 id="course-modal-title">Add New Course</h3>
                            <button class="close-modal-btn" id="close-course-modal">&times;</button>
                        </div>
                        <form id="course-form">
                            <input type="hidden" id="course-edit-id" value="">
                            <div class="form-group">
                                <label for="course-name-input">Course Name</label>
                                <input type="text" id="course-name-input" placeholder="e.g. Advanced Calculus" required>
                            </div>
                            <div class="form-group">
                                <label for="course-code-input">Course Code</label>
                                <input type="text" id="course-code-input" placeholder="e.g. MATH 301" required>
                            </div>
                            <div class="form-group">
                                <label>Course Tag Color</label>
                                <div class="color-palette-picker">
                                    <input type="color" id="course-color-input" value="#ec4899" class="color-picker-wheel">
                                    <div class="color-presets">
                                        <span class="color-preset active" data-color="#ec4899" style="background-color: #ec4899"></span>
                                        <span class="color-preset" data-color="#3b82f6" style="background-color: #3b82f6"></span>
                                        <span class="color-preset" data-color="#10b981" style="background-color: #10b981"></span>
                                        <span class="color-preset" data-color="#f59e0b" style="background-color: #f59e0b"></span>
                                        <span class="color-preset" data-color="#ef4444" style="background-color: #ef4444"></span>
                                        <span class="color-preset" data-color="#ec4899" style="background-color: #ec4899"></span>
                                        <span class="color-preset" data-color="#f472b6" style="background-color: #f472b6"></span>
                                        <span class="color-preset" data-color="#06b6d4" style="background-color: #06b6d4"></span>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="modal-submit-btn">Save Course</button>
                        </form>
                    </div>
                </div>
            `;

            // Setup listeners
            const modal = document.getElementById('course-modal');
            const openModalBtn = document.getElementById('add-course-btn');
            const closeModalBtn = document.getElementById('close-course-modal');
            const form = document.getElementById('course-form');
            const colorInput = document.getElementById('course-color-input');
            const presets = document.querySelectorAll('.color-preset');

            const openModal = (title, editId = '') => {
                document.getElementById('course-modal-title').textContent = title;
                document.getElementById('course-edit-id').value = editId;

                if (editId) {
                    const course = state.courses.find(c => c.id === editId);
                    if (course) {
                        document.getElementById('course-name-input').value = course.name;
                        document.getElementById('course-code-input').value = course.code;
                        colorInput.value = course.color;
                        
                        presets.forEach(p => {
                            if (p.getAttribute('data-color') === course.color) {
                                p.classList.add('active');
                            } else {
                                p.classList.remove('active');
                            }
                        });
                    }
                } else {
                    form.reset();
                    colorInput.value = '#ec4899';
                    presets.forEach(p => {
                        if (p.getAttribute('data-color') === '#ec4899') {
                            p.classList.add('active');
                        } else {
                            p.classList.remove('active');
                        }
                    });
                }
                modal.classList.add('active');
            };

            const closeModal = () => {
                modal.classList.remove('active');
            };

            openModalBtn.addEventListener('click', () => openModal('Add New Course'));
            closeModalBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            // Preset colors handler
            presets.forEach(preset => {
                preset.addEventListener('click', () => {
                    presets.forEach(p => p.classList.remove('active'));
                    preset.classList.add('active');
                    colorInput.value = preset.getAttribute('data-color');
                });
            });

            colorInput.addEventListener('input', () => {
                // Remove active class from presets if value doesn't match
                presets.forEach(p => {
                    if (p.getAttribute('data-color') === colorInput.value) {
                        p.classList.add('active');
                    } else {
                        p.classList.remove('active');
                    }
                });
            });

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const editId = document.getElementById('course-edit-id').value;
                const name = document.getElementById('course-name-input').value.trim();
                const code = document.getElementById('course-code-input').value.trim();
                const color = colorInput.value;

                if (editId) {
                    window.StudyState.updateCourse(editId, { name, code, color });
                    if (window.showNotification) window.showNotification('Course updated successfully!', 'success');
                } else {
                    window.StudyState.addCourse(name, code, color);
                    if (window.showNotification) window.showNotification('Course added successfully!', 'success');
                }

                closeModal();
                this.renderCoursesView();
            });

            // Card action handlers
            container.querySelectorAll('.edit-course-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const courseId = btn.getAttribute('data-id');
                    openModal('Edit Course', courseId);
                });
            });

            container.querySelectorAll('.delete-course-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const courseId = btn.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this course? All tasks and notes linked to it will lose their association.')) {
                        window.StudyState.deleteCourse(courseId);
                        if (window.showNotification) window.showNotification('Course deleted successfully.', 'success');
                        this.renderCoursesView();
                    }
                });
            });
        }
    }

    window.StudyCourses = new CourseManager();
})();
