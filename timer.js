// StudyFlow Focus Timer Module
(function() {
    class FocusTimer {
        constructor() {
            this.minutes = 25;
            this.seconds = 0;
            this.timerInterval = null;
            this.isRunning = false;
            this.currentMode = 'focus'; // 'focus', 'short-break', 'long-break'
            this.selectedCourseId = '';
            this.initialDurationInSeconds = 25 * 60;
            
            // Audio context for synthesizer
            this.audioCtx = null;
            
            this.init();
        }

        init() {
            window.StudyRouter.register('timer', () => this.renderTimerView());
            window.StudyTimerInstance = this; // Expose instance for dashboard mini-timer
        }

        getFormattedTime() {
            const minStr = String(this.minutes).padStart(2, '0');
            const secStr = String(this.seconds).padStart(2, '0');
            return `${minStr}:${secStr}`;
        }

        renderTimerView() {
            const container = document.getElementById('view-timer');
            if (!container) return;

            const state = window.StudyState.state;
            const courses = state.courses;

            container.innerHTML = `
                <div class="view-header">
                    <div class="header-title">
                        <h1>Focus Pomodoro</h1>
                        <p>Eliminate distractions, focus on a course, and build study habits</p>
                    </div>
                </div>

                <div class="timer-workspace">
                    <!-- Timer Circle Section -->
                    <div class="timer-display-card glass-panel">
                        <div class="timer-modes">
                            <button class="timer-mode-btn ${this.currentMode === 'focus' ? 'active' : ''}" data-mode="focus">Focus Session</button>
                            <button class="timer-mode-btn ${this.currentMode === 'short-break' ? 'active' : ''}" data-mode="short-break">Short Break</button>
                            <button class="timer-mode-btn ${this.currentMode === 'long-break' ? 'active' : ''}" data-mode="long-break">Long Break</button>
                        </div>
                        
                        <!-- SVG Ring Progress -->
                        <div class="timer-circle-container">
                            <svg class="timer-ring-svg" width="280" height="280">
                                <circle class="timer-ring-bg" cx="140" cy="140" r="130"></circle>
                                <circle class="timer-ring-progress" cx="140" cy="140" r="130" id="timer-progress-circle"></circle>
                            </svg>
                            <div class="timer-text-content">
                                <span class="timer-countdown" id="timer-clock">${this.getFormattedTime()}</span>
                                <span class="timer-subtext" id="timer-state-lbl">${this.isRunning ? 'Active' : 'Idle'}</span>
                            </div>
                        </div>

                        <div class="timer-controls">
                            <button class="timer-control-btn btn-sec" id="timer-reset-btn"><i class="fas fa-undo"></i> Reset</button>
                            <button class="timer-control-btn btn-prim" id="timer-start-btn">
                                <i class="fas ${this.isRunning ? 'fa-pause' : 'fa-play'}"></i> ${this.isRunning ? 'Pause' : 'Start'}
                            </button>
                        </div>
                    </div>

                    <!-- Course Attribution Config -->
                    <div class="timer-settings-card glass-panel">
                        <h3>Session Configuration</h3>
                        
                        <div class="form-group">
                            <label for="timer-course-select">Associate Study Session with Course</label>
                            <select id="timer-course-select" ${this.isRunning ? 'disabled' : ''}>
                                <option value="" ${this.selectedCourseId === '' ? 'selected' : ''}>General / No Course</option>
                                ${courses.map(c => `<option value="${c.id}" ${this.selectedCourseId === c.id ? 'selected' : ''}>${c.code} - ${c.name}</option>`).join('')}
                            </select>
                            <span class="field-hint">Time studied will be logged under this course's statistics.</span>
                        </div>

                        <div class="focus-tips">
                            <h4><i class="fas fa-lightbulb"></i> Pomodoro Guide</h4>
                            <ul>
                                <li><strong>Focus:</strong> Concentrate fully for 25 minutes.</li>
                                <li><strong>Short Break:</strong> Take a 5-minute breather (walk, stretch).</li>
                                <li><strong>Long Break:</strong> Every 4 focus cycles, take a longer 15-minute rest.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;

            // Setup bindings
            const startBtn = document.getElementById('timer-start-btn');
            const resetBtn = document.getElementById('timer-reset-btn');
            const modeBtns = document.querySelectorAll('.timer-mode-btn');
            const courseSelect = document.getElementById('timer-course-select');

            startBtn.addEventListener('click', () => {
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
                this.updateUI();
            });

            resetBtn.addEventListener('click', () => {
                this.reset();
                this.updateUI();
            });

            modeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (this.isRunning && !confirm('Changing focus mode will discard your current session. Continue?')) {
                        return;
                    }
                    const mode = btn.getAttribute('data-mode');
                    this.setMode(mode);
                    this.updateUI();
                });
            });

            courseSelect.addEventListener('change', () => {
                this.selectedCourseId = courseSelect.value;
            });

            // Initial visual update of ring
            this.updateProgressBar();
        }

        setMode(mode) {
            this.currentMode = mode;
            this.pause();
            
            if (mode === 'focus') {
                this.minutes = 25;
                this.initialDurationInSeconds = 25 * 60;
            } else if (mode === 'short-break') {
                this.minutes = 5;
                this.initialDurationInSeconds = 5 * 60;
            } else if (mode === 'long-break') {
                this.minutes = 15;
                this.initialDurationInSeconds = 15 * 60;
            }
            this.seconds = 0;
            
            // Re-render to update classes
            this.renderTimerView();
        }

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            
            this.timerInterval = setInterval(() => {
                this.tick();
            }, 1000);
        }

        pause() {
            if (!this.isRunning) return;
            this.isRunning = false;
            clearInterval(this.timerInterval);
        }

        reset() {
            this.pause();
            this.setMode(this.currentMode);
        }

        tick() {
            if (this.seconds === 0) {
                if (this.minutes === 0) {
                    this.completeSession();
                    return;
                }
                this.minutes--;
                this.seconds = 59;
            } else {
                this.seconds--;
            }
            this.updateClockText();
            this.updateProgressBar();
        }

        updateClockText() {
            const clockEl = document.getElementById('timer-clock');
            if (clockEl) {
                clockEl.textContent = this.getFormattedTime();
            }
        }

        updateProgressBar() {
            const circle = document.getElementById('timer-progress-circle');
            if (!circle) return;

            const radius = circle.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            
            // Calculate elapsed
            const totalSec = this.initialDurationInSeconds;
            const currentSec = (this.minutes * 60) + this.seconds;
            const percentage = currentSec / totalSec;

            // Offset calculation
            const strokeDashoffset = circumference - (percentage * circumference);
            
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = strokeDashoffset;
        }

        updateUI() {
            const startBtn = document.getElementById('timer-start-btn');
            const stateLbl = document.getElementById('timer-state-lbl');
            const courseSelect = document.getElementById('timer-course-select');

            if (startBtn) {
                startBtn.innerHTML = `<i class="fas ${this.isRunning ? 'fa-pause' : 'fa-play'}"></i> ${this.isRunning ? 'Pause' : 'Start'}`;
            }

            if (stateLbl) {
                stateLbl.textContent = this.isRunning ? 'Active' : 'Paused';
            }

            if (courseSelect) {
                courseSelect.disabled = this.isRunning;
            }
        }

        completeSession() {
            this.pause();
            this.playChime();

            // Log time if focused
            if (this.currentMode === 'focus') {
                const elapsedMinutes = Math.round(this.initialDurationInSeconds / 60);
                window.StudyState.addTimerLog(elapsedMinutes, this.selectedCourseId);
                
                if (window.showNotification) {
                    const course = window.StudyState.state.courses.find(c => c.id === this.selectedCourseId);
                    const courseName = course ? course.name : 'General study';
                    window.showNotification(`🎉 Great job! You completed a 25-minute study session in ${courseName}.`, 'success');
                }
                
                // Auto transition to short-break
                this.setMode('short-break');
            } else {
                if (window.showNotification) {
                    window.showNotification(`⏱️ Break completed. Ready to get back to work?`, 'success');
                }
                
                // Auto transition to focus
                this.setMode('focus');
            }
            
            this.renderTimerView();
        }

        playChime() {
            // Synthesize a beautiful double bell sound using Web Audio API
            try {
                // Lazy initialize AudioContext on user gesture completion
                if (!this.audioCtx) {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    this.audioCtx = new AudioContextClass();
                }
                
                const playBell = (frequency, startTime, duration) => {
                    const osc = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(frequency, startTime);
                    
                    // Simple envelope
                    gain.gain.setValueAtTime(0.5, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                    
                    osc.connect(gain);
                    gain.connect(this.audioCtx.destination);
                    
                    osc.start(startTime);
                    osc.stop(startTime + duration);
                };

                const now = this.audioCtx.currentTime;
                // Double chime: E5 followed by A5
                playBell(659.25, now, 0.8); // E5
                playBell(880.00, now + 0.15, 1.2); // A5
            } catch (err) {
                console.error("Synthesizer error playing notification chime:", err);
            }
        }
    }

    window.StudyTimer = new FocusTimer();
})();
