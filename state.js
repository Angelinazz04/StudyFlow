// StudyFlow State Engine
(function() {
    const STORAGE_KEY = 'studyflow_app_state';

    const defaultState = {
        currentUser: null,
        theme: 'light',
        courses: [],
        tasks: [],
        notes: [],
        timerLogs: [],
        settings: {
            profile: {
                name: 'Student',
                avatar: 'avatar-1',
                weeklyGoalHours: 10,
                gpaScale: 4.0,
                major: 'Undeclared',
                university: 'My University',
                bio: ''
            },
            gpaCourses: []
        },
        achievements: [
            { id: 'ach-1', title: 'First Steps', description: 'Complete your first focus session.', icon: 'fa-baby', unlocked: false, unlockedAt: null },
            { id: 'ach-2', title: 'Focused Mind', description: 'Accumulate 100 study minutes.', icon: 'fa-brain', unlocked: false, unlockedAt: null },
            { id: 'ach-3', title: 'Clean Slate', description: 'Complete all pending tasks.', icon: 'fa-check-double', unlocked: false, unlockedAt: null },
            { id: 'ach-4', title: 'Streak Starter', description: 'Maintain a 3-day study streak.', icon: 'fa-fire', unlocked: false, unlockedAt: null }
        ],
        // Social feature data
        social: {
            friends: [],        // array of student ids that are friends
            pendingOut: [],     // friend requests sent by user
            pendingIn: [],      // friend requests received by user
            messages: {},       // { studentId: [ {from, text, ts} ] }
            sharedNotes: []     // notes shared with the user { noteId, title, content, fromName, ts }
        },
        // Mock student directory (simulated "other users" on the platform)
        mockStudents: [
            { id: 'ms-1', name: 'Lena Fischer',      major: 'Computer Engineering', university: 'Karabuk University', bio: 'Love algorithms and coffee ☕',        avatar: 'avatar-2', gpa: '3.82' },
            { id: 'ms-2', name: 'Omar Khalil',       major: 'Computer Science',     university: 'Karabuk University', bio: 'Open source enthusiast 🚀',             avatar: 'avatar-3', gpa: '3.65' },
            { id: 'ms-3', name: 'Sofia Reyes',       major: 'Computer Engineering', university: 'Istanbul Tech',      bio: 'AI research & robotics 🤖',             avatar: 'avatar-4', gpa: '3.91' },
            { id: 'ms-4', name: 'Yusuf Aydın',       major: 'Mathematics',          university: 'Karabuk University', bio: 'Math olympiad champion 📐',             avatar: 'avatar-1', gpa: '3.74' },
            { id: 'ms-5', name: 'Amara Diallo',      major: 'Computer Science',     university: 'Ankara University',  bio: 'Building the future one line at a time', avatar: 'avatar-2', gpa: '3.55' },
            { id: 'ms-6', name: 'Jana Kowalski',     major: 'Computer Engineering', university: 'Karabuk University', bio: 'Circuit boards and late nights 🔧',      avatar: 'avatar-3', gpa: '3.78' },
            { id: 'ms-7', name: 'Tariq Mansour',     major: 'Physics',              university: 'Istanbul Tech',      bio: 'Quantum mechanics fanatic ⚛️',          avatar: 'avatar-4', gpa: '3.60' },
            { id: 'ms-8', name: 'Mei Lin',           major: 'Computer Science',     university: 'Karabuk University', bio: 'Full-stack dev & tea lover 🍵',         avatar: 'avatar-1', gpa: '3.88' }
        ]
    };

    class StateManager {
        constructor() {
            this.state = this.loadState();
            this.subscribers = [];
        }

        loadState() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Merge loaded with default to ensure any new keys are present
                    return { ...defaultState, ...parsed };
                }
            } catch (e) {
                console.error("Failed to load state from localStorage:", e);
            }
            return JSON.parse(JSON.stringify(defaultState)); // Deep copy defaults
        }

        saveState() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
                this.notify();
            } catch (e) {
                console.error("Failed to save state to localStorage:", e);
            }
        }

        resetState() {
            this.state = JSON.parse(JSON.stringify(defaultState));
            this.saveState();
        }

        subscribe(callback) {
            this.subscribers.push(callback);
            return () => {
                this.subscribers = this.subscribers.filter(sub => sub !== callback);
            };
        }

        notify() {
            this.subscribers.forEach(callback => callback(this.state));
        }

        // Actions
        setCurrentUser(user) {
            this.state.currentUser = user;
            this.saveState();
        }

        setTheme(theme) {
            this.state.theme = theme;
            this.saveState();
        }

        // Courses
        addCourse(name, code, color) {
            const newCourse = {
                id: 'course-' + Date.now(),
                name,
                code,
                color
            };
            this.state.courses.push(newCourse);
            this.saveState();
            return newCourse;
        }

        updateCourse(id, updatedFields) {
            const course = this.state.courses.find(c => c.id === id);
            if (course) {
                Object.assign(course, updatedFields);
                this.saveState();
            }
        }

        deleteCourse(id) {
            this.state.courses = this.state.courses.filter(c => c.id !== id);
            // Also clean up course context in tasks and notes
            this.state.tasks.forEach(t => {
                if (t.courseId === id) t.courseId = '';
            });
            this.state.notes.forEach(n => {
                if (n.courseId === id) n.courseId = '';
            });
            this.saveState();
        }

        // Tasks
        addTask(title, description, dueDate, priority, courseId) {
            const newTask = {
                id: 'task-' + Date.now(),
                title,
                description,
                dueDate,
                priority,
                courseId,
                completed: false
            };
            this.state.tasks.push(newTask);
            this.checkCleanSlateAchievement();
            this.saveState();
            return newTask;
        }

        updateTask(id, updatedFields) {
            const task = this.state.tasks.find(t => t.id === id);
            if (task) {
                Object.assign(task, updatedFields);
                this.checkCleanSlateAchievement();
                this.saveState();
            }
        }

        deleteTask(id) {
            this.state.tasks = this.state.tasks.filter(t => t.id !== id);
            this.checkCleanSlateAchievement();
            this.saveState();
        }

        toggleTask(id) {
            const task = this.state.tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                this.checkCleanSlateAchievement();
                this.saveState();
            }
        }

        // Notes
        addNote(title, content, courseId) {
            const newNote = {
                id: 'note-' + Date.now(),
                title,
                content,
                courseId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.state.notes.push(newNote);
            this.saveState();
            return newNote;
        }

        updateNote(id, updatedFields) {
            const note = this.state.notes.find(n => n.id === id);
            if (note) {
                Object.assign(note, updatedFields);
                note.updatedAt = new Date().toISOString();
                this.saveState();
            }
        }

        deleteNote(id) {
            this.state.notes = this.state.notes.filter(n => n.id !== id);
            this.saveState();
        }

        // Timer log and study stats
        addTimerLog(minutes, courseId) {
            const today = new Date().toISOString().split('T')[0];
            const newLog = {
                date: today,
                minutes: parseInt(minutes),
                courseId: courseId || ''
            };
            this.state.timerLogs.push(newLog);

            // Check timer achievements
            this.checkTimerAchievements();
            this.saveState();
        }

        // Settings and Profile
        updateProfile(profileFields) {
            this.state.settings.profile = { ...this.state.settings.profile, ...profileFields };
            this.saveState();
        }

        // GPA courses
        addGpaCourse(name, credits, grade, gpaValue) {
            const newGpa = {
                id: 'gpa-' + Date.now(),
                name,
                credits: parseFloat(credits),
                grade,
                gpa: parseFloat(gpaValue)
            };
            this.state.settings.gpaCourses.push(newGpa);
            this.saveState();
            return newGpa;
        }

        deleteGpaCourse(id) {
            this.state.settings.gpaCourses = this.state.settings.gpaCourses.filter(g => g.id !== id);
            this.saveState();
        }

        // Achievements check
        unlockAchievement(id) {
            const ach = this.state.achievements.find(a => a.id === id);
            if (ach && !ach.unlocked) {
                ach.unlocked = true;
                ach.unlockedAt = new Date().toISOString();
                // trigger a visual notification if the app is active
                if (window.showNotification) {
                    window.showNotification(`🏆 Achievement Unlocked: ${ach.title}!`, 'success');
                }
            }
        }

        checkTimerAchievements() {
            // Unlocks "First Steps" if focus sessions > 0
            if (this.state.timerLogs.length > 0) {
                this.unlockAchievement('ach-1');
            }
            
            // Unlocks "Focused Mind" if study minutes > 100
            const totalMins = this.state.timerLogs.reduce((acc, log) => acc + log.minutes, 0);
            if (totalMins >= 100) {
                this.unlockAchievement('ach-2');
            }

            // Streak check
            const streak = this.calculateStreak();
            if (streak >= 3) {
                this.unlockAchievement('ach-4');
            }
        }

        checkCleanSlateAchievement() {
            const pendingTasks = this.state.tasks.filter(t => !t.completed);
            if (pendingTasks.length === 0 && this.state.tasks.length > 0) {
                this.unlockAchievement('ach-3');
            }
        }

        calculateStreak() {
            const dates = [...new Set(this.state.timerLogs.map(log => log.date))].sort();
            if (dates.length === 0) return 0;

            let currentStreak = 0;
            let maxStreak = 0;
            const oneDay = 24 * 60 * 60 * 1000; // in milliseconds
            let todayStr = new Date().toISOString().split('T')[0];
            let yesterdayStr = new Date(Date.now() - oneDay).toISOString().split('T')[0];

            // Verify if studied yesterday or today to see if streak is active
            if (!dates.includes(todayStr) && !dates.includes(yesterdayStr)) {
                return 0;
            }

            let lastDate = null;
            for (let i = 0; i < dates.length; i++) {
                const currentDate = new Date(dates[i]);
                if (lastDate === null) {
                    currentStreak = 1;
                } else {
                    const diffTime = Math.abs(currentDate - lastDate);
                    const diffDays = Math.ceil(diffTime / oneDay);
                    if (diffDays === 1) {
                        currentStreak++;
                    } else if (diffDays > 1) {
                        currentStreak = 1;
                    }
                }
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
                lastDate = currentDate;
            }

            return currentStreak;
        }
    }

    // Instantiation
    window.StudyState = new StateManager();
})();
