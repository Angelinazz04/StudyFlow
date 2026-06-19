// StudyFlow Calendar System
(function() {
    class CalendarSystem {
        constructor() {
            this.currentDate = new Date();
            this.viewMode = 'month'; // 'month' or 'week'
            this.init();
        }

        init() {
            window.StudyRouter.register('calendar', () => this.renderCalendarView());
        }

        renderCalendarView() {
            const container = document.getElementById('view-calendar');
            if (!container) return;

            const state = window.StudyState.state;
            if (!state.calendarEvents) {
                state.calendarEvents = [];
            }

            container.innerHTML = `
                <div class="view-header">
                    <div class="header-title">
                        <h1>Calendar System</h1>
                        <p>Track your schedule, class times, and assignment due dates</p>
                    </div>
                    <div class="calendar-header-actions">
                        <div class="calendar-view-toggle">
                            <button class="toggle-btn active" id="cal-btn-month">Month</button>
                            <button class="toggle-btn" id="cal-btn-week">Week</button>
                        </div>
                        <button class="action-btn" id="add-cal-event-btn"><i class="fas fa-plus"></i> Add Event</button>
                    </div>
                </div>

                <!-- Calendar Shell -->
                <div class="calendar-workspace glass-panel">
                    <div class="calendar-nav-bar">
                        <button class="cal-nav-btn" id="cal-prev-btn"><i class="fas fa-chevron-left"></i></button>
                        <h2 class="calendar-month-year" id="cal-month-year">June 2026</h2>
                        <button class="cal-nav-btn" id="cal-next-btn"><i class="fas fa-chevron-right"></i></button>
                    </div>

                    <div class="calendar-grid-container" id="calendar-grid-container">
                        <!-- Calendar will be injected here -->
                    </div>
                </div>

                <!-- Calendar Event Modal -->
                <div class="modal-overlay" id="cal-modal">
                    <div class="modal-content glass-panel">
                        <div class="modal-header">
                            <h3>Add Calendar Event</h3>
                            <button class="close-modal-btn" id="close-cal-modal">&times;</button>
                        </div>
                        <form id="cal-form">
                            <div class="form-group">
                                <label for="cal-title-input">Event Title</label>
                                <input type="text" id="cal-title-input" placeholder="e.g. Math Study Group" required>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="cal-course-input">Course Category</label>
                                    <select id="cal-course-input">
                                        <option value="">No Course</option>
                                        ${state.courses.map(c => `<option value="${c.id}">${c.code}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="cal-date-input">Date</label>
                                    <input type="date" id="cal-date-input" required>
                                </div>
                            </div>
                            <button type="submit" class="modal-submit-btn">Save Event</button>
                        </form>
                    </div>
                </div>
            `;

            // Setup bindings
            const monthBtn = document.getElementById('cal-btn-month');
            const weekBtn = document.getElementById('cal-btn-week');
            const prevBtn = document.getElementById('cal-prev-btn');
            const nextBtn = document.getElementById('cal-next-btn');
            const addEventBtn = document.getElementById('add-cal-event-btn');
            const closeModalBtn = document.getElementById('close-cal-modal');
            const modal = document.getElementById('cal-modal');
            const form = document.getElementById('cal-form');

            monthBtn.addEventListener('click', () => {
                this.viewMode = 'month';
                monthBtn.classList.add('active');
                weekBtn.classList.remove('active');
                this.renderGrid();
            });

            weekBtn.addEventListener('click', () => {
                this.viewMode = 'week';
                weekBtn.classList.add('active');
                monthBtn.classList.remove('active');
                this.renderGrid();
            });

            prevBtn.addEventListener('click', () => {
                if (this.viewMode === 'month') {
                    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                } else {
                    this.currentDate.setDate(this.currentDate.getDate() - 7);
                }
                this.renderGrid();
            });

            nextBtn.addEventListener('click', () => {
                if (this.viewMode === 'month') {
                    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                } else {
                    this.currentDate.setDate(this.currentDate.getDate() + 7);
                }
                this.renderGrid();
            });

            addEventBtn.addEventListener('click', () => {
                form.reset();
                document.getElementById('cal-date-input').value = new Date().toISOString().split('T')[0];
                modal.classList.add('active');
            });

            closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = document.getElementById('cal-title-input').value.trim();
                const courseId = document.getElementById('cal-course-input').value;
                const date = document.getElementById('cal-date-input').value;

                if (!state.calendarEvents) state.calendarEvents = [];
                
                state.calendarEvents.push({
                    id: 'event-' + Date.now(),
                    title,
                    courseId,
                    date
                });
                
                window.StudyState.saveState();
                if (window.showNotification) window.showNotification('Event added to calendar!', 'success');
                modal.classList.remove('active');
                this.renderGrid();
            });

            this.renderGrid();
        }

        renderGrid() {
            const gridContainer = document.getElementById('calendar-grid-container');
            const monthYearLabel = document.getElementById('cal-month-year');
            if (!gridContainer || !monthYearLabel) return;

            const state = window.StudyState.state;
            const courses = state.courses;
            const tasks = state.tasks;
            const events = state.calendarEvents || [];

            if (this.viewMode === 'month') {
                const year = this.currentDate.getFullYear();
                const month = this.currentDate.getMonth();
                
                monthYearLabel.textContent = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                // First day of month
                const firstDayIndex = new Date(year, month, 1).getDay();
                // Number of days in month
                const totalDays = new Date(year, month + 1, 0).getDate();
                // Number of days in previous month
                const prevTotalDays = new Date(year, month, 0).getDate();

                let gridHtml = `
                    <div class="calendar-weekdays">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div class="calendar-days-grid">
                `;

                // Fill previous month overlap days
                for (let i = firstDayIndex - 1; i >= 0; i--) {
                    const dayNum = prevTotalDays - i;
                    gridHtml += `<div class="cal-day-cell adjacent-month"><span class="day-num-lbl">${dayNum}</span></div>`;
                }

                // Fill current month days
                const todayStr = new Date().toISOString().split('T')[0];
                for (let day = 1; day <= totalDays; day++) {
                    const cellDate = new Date(year, month, day);
                    const cellDateStr = cellDate.toISOString().split('T')[0];
                    const isToday = cellDateStr === todayStr;

                    // Fetch tasks and events on this date
                    const cellTasks = tasks.filter(t => t.dueDate === cellDateStr);
                    const cellEvents = events.filter(e => e.date === cellDateStr);

                    let dayItemsHtml = '';
                    
                    // Render events
                    cellEvents.forEach(evt => {
                        const course = courses.find(c => c.id === evt.courseId);
                        const color = course ? course.color : '#94a3b8';
                        dayItemsHtml += `
                            <div class="cal-item event-item" style="border-left: 3px solid ${color}" title="Event: ${evt.title}">
                                <span>${evt.title}</span>
                            </div>
                        `;
                    });

                    // Render tasks as deadlines
                    cellTasks.forEach(task => {
                        const course = courses.find(c => c.id === task.courseId);
                        const color = course ? course.color : '#e2e8f0';
                        dayItemsHtml += `
                            <div class="cal-item task-item ${task.completed ? 'completed' : ''}" style="border-left: 3px solid ${color}" title="Deadline: ${task.title}">
                                <i class="fas fa-hourglass-half"></i> <span>${task.title}</span>
                            </div>
                        `;
                    });

                    gridHtml += `
                        <div class="cal-day-cell ${isToday ? 'today' : ''}" data-date="${cellDateStr}">
                            <span class="day-num-lbl">${day}</span>
                            <div class="cal-cell-items">
                                ${dayItemsHtml}
                            </div>
                        </div>
                    `;
                }

                // Fill next month overlap days
                const totalCells = firstDayIndex + totalDays;
                const remainingCells = (7 - (totalCells % 7)) % 7;
                for (let day = 1; day <= remainingCells; day++) {
                    gridHtml += `<div class="cal-day-cell adjacent-month"><span class="day-num-lbl">${day}</span></div>`;
                }

                gridHtml += `</div>`;
                gridContainer.innerHTML = gridHtml;

            } else {
                // Render Week View
                // Get start of the current week (Sunday)
                const startOfWeek = new Date(this.currentDate);
                startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
                
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                monthYearLabel.textContent = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

                let weekHtml = `<div class="calendar-week-view-grid">`;
                
                const todayStr = new Date().toISOString().split('T')[0];
                const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                for (let i = 0; i < 7; i++) {
                    const cellDate = new Date(startOfWeek);
                    cellDate.setDate(startOfWeek.getDate() + i);
                    const cellDateStr = cellDate.toISOString().split('T')[0];
                    const isToday = cellDateStr === todayStr;

                    const cellTasks = tasks.filter(t => t.dueDate === cellDateStr);
                    const cellEvents = events.filter(e => e.date === cellDateStr);

                    let itemsHtml = '';

                    cellEvents.forEach(evt => {
                        const course = courses.find(c => c.id === evt.courseId);
                        const color = course ? course.color : '#94a3b8';
                        itemsHtml += `
                            <div class="week-event-card" style="border-left: 4px solid ${color}; background: ${color}11">
                                <span class="time-lbl">Event</span>
                                <p class="title-lbl">${evt.title}</p>
                            </div>
                        `;
                    });

                    cellTasks.forEach(task => {
                        const course = courses.find(c => c.id === task.courseId);
                        const color = course ? course.color : '#94a3b8';
                        itemsHtml += `
                            <div class="week-event-card task-card ${task.completed ? 'completed' : ''}" style="border-left: 4px solid ${color}; background: ${color}11">
                                <span class="time-lbl"><i class="fas fa-hourglass-half"></i> Deadline</span>
                                <p class="title-lbl">${task.title}</p>
                            </div>
                        `;
                    });

                    if (cellEvents.length === 0 && cellTasks.length === 0) {
                        itemsHtml = `<div class="week-empty-cell">No scheduled events or deadlines</div>`;
                    }

                    weekHtml += `
                        <div class="calendar-week-day-col glass-panel ${isToday ? 'today' : ''}" data-date="${cellDateStr}">
                            <div class="week-day-col-header">
                                <span class="day-name">${weekdays[i]}</span>
                                <span class="day-date">${cellDate.getDate()}</span>
                            </div>
                            <div class="week-day-col-body">
                                ${itemsHtml}
                            </div>
                        </div>
                    `;
                }

                weekHtml += `</div>`;
                gridContainer.innerHTML = weekHtml;
            }

            // Bind click to cells to add event on that date
            gridContainer.querySelectorAll('.cal-day-cell:not(.adjacent-month), .calendar-week-day-col').forEach(cell => {
                cell.addEventListener('click', (e) => {
                    // Check if clicked inside a specific event card
                    if (e.target.closest('.cal-item') || e.target.closest('.week-event-card')) return;
                    
                    const dateVal = cell.getAttribute('data-date');
                    if (dateVal) {
                        document.getElementById('cal-form').reset();
                        document.getElementById('cal-date-input').value = dateVal;
                        document.getElementById('cal-modal').classList.add('active');
                    }
                });
            });
        }
    }

    window.StudyCalendar = new CalendarSystem();
})();
