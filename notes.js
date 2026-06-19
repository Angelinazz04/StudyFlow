// StudyFlow Note-Taking Workspace
(function() {
    class NotesWorkspace {
        constructor() {
            this.activeNoteId = null;
            this.noteSearchQuery = '';
            this.noteCourseFilter = 'all';
            this.init();
        }

        init() {
            window.StudyRouter.register('notes', () => this.renderNotesView());
        }

        renderNotesView() {
            const container = document.getElementById('view-notes');
            if (!container) return;

            const state = window.StudyState.state;
            const courses = state.courses;
            const notes = state.notes;

            // Filters & search
            const filteredNotes = notes.filter(note => {
                const matchesSearch = note.title.toLowerCase().includes(this.noteSearchQuery.toLowerCase()) || 
                                      note.content.toLowerCase().includes(this.noteSearchQuery.toLowerCase());
                const matchesCourse = this.noteCourseFilter === 'all' || note.courseId === this.noteCourseFilter;
                return matchesSearch && matchesCourse;
            });

            // Set active note if not set and notes exist
            if (filteredNotes.length > 0 && (!this.activeNoteId || !notes.find(n => n.id === this.activeNoteId))) {
                this.activeNoteId = filteredNotes[0].id;
            }

            const activeNote = notes.find(n => n.id === this.activeNoteId) || null;

            // Generate notes list sidebar HTML
            let notesListHtml = '';
            if (filteredNotes.length === 0) {
                notesListHtml = `<div class="notes-sidebar-empty">No notes found</div>`;
            } else {
                notesListHtml = filteredNotes.map(note => {
                    const course = courses.find(c => c.id === note.courseId);
                    const color = course ? course.color : '#94a3b8';
                    const code = course ? course.code : 'General';
                    const isActive = note.id === this.activeNoteId;
                    
                    return `
                        <div class="note-sidebar-item glass-panel ${isActive ? 'active' : ''}" data-id="${note.id}">
                            <div class="note-sidebar-header">
                                <span class="note-sidebar-code" style="color: ${color}">${code}</span>
                                <span class="note-sidebar-date">${new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <h4 class="note-sidebar-title">${note.title || 'Untitled Note'}</h4>
                            <p class="note-sidebar-snippet">${note.content ? note.content.substring(0, 45).replace(/[#*`_-]/g, '') + '...' : 'Empty note'}</p>
                        </div>
                    `;
                }).join('');
            }

            // Generate Editor HTML
            let editorHtml = '';
            if (activeNote) {
                const activeCourse = courses.find(c => c.id === activeNote.courseId);
                editorHtml = `
                    <div class="note-editor-wrapper glass-panel">
                        <div class="note-editor-header">
                            <div class="note-editor-meta-inputs">
                                <input type="text" id="note-edit-title" value="${activeNote.title}" placeholder="Note Title">
                                <select id="note-edit-course">
                                    <option value="">No Course (General)</option>
                                    ${courses.map(c => `<option value="${c.id}" ${c.id === activeNote.courseId ? 'selected' : ''}>${c.code} - ${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="note-editor-actions">
                                <button class="action-btn-danger" id="note-delete-btn"><i class="fas fa-trash-alt"></i> Delete</button>
                                <button class="action-btn" id="note-save-btn"><i class="fas fa-save"></i> Save</button>
                            </div>
                        </div>
                        
                        <div class="note-editor-tabs">
                            <button class="editor-tab active" id="editor-tab-write">Write</button>
                            <button class="editor-tab" id="editor-tab-preview">Preview</button>
                        </div>

                        <div class="note-editor-body">
                            <textarea id="note-textarea" placeholder="Start writing notes... Use Markdown tags for formatting (# Headers, - bullets, etc.)">${activeNote.content}</textarea>
                            <div id="note-preview-area" class="note-preview-markdown" style="display: none;"></div>
                        </div>
                    </div>
                `;
            } else {
                editorHtml = `
                    <div class="note-editor-empty glass-panel">
                        <i class="fas fa-edit"></i>
                        <p>Select a note from the list, or create a new note to start writing.</p>
                        <button class="action-btn" id="create-first-note-btn"><i class="fas fa-plus"></i> Create Note</button>
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="view-header">
                    <div class="header-title">
                        <h1>Notes Workspace</h1>
                        <p>Write notes, organize research summaries, and compile lectures</p>
                    </div>
                    <button class="action-btn" id="notes-new-btn"><i class="fas fa-plus"></i> New Note</button>
                </div>

                <div class="notes-layout">
                    <!-- Notes Sidebar List -->
                    <div class="notes-sidebar">
                        <div class="notes-sidebar-filters glass-panel">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="notes-search" placeholder="Search notes..." value="${this.noteSearchQuery}">
                            </div>
                            <select id="notes-course-filter">
                                <option value="all" ${this.noteCourseFilter === 'all' ? 'selected' : ''}>All Courses</option>
                                ${courses.map(c => `<option value="${c.id}" ${this.noteCourseFilter === c.id ? 'selected' : ''}>${c.code}</option>`).join('')}
                            </select>
                        </div>

                        <div class="notes-sidebar-list-container">
                            ${notesListHtml}
                        </div>
                    </div>

                    <!-- Editor Workspace -->
                    <div class="notes-editor-pane">
                        ${editorHtml}
                    </div>
                </div>
            `;

            // Setup bindings
            const searchInput = document.getElementById('notes-search');
            const courseSelect = document.getElementById('notes-course-filter');
            const newNoteBtn = document.getElementById('notes-new-btn');
            const createFirstNoteBtn = document.getElementById('create-first-note-btn');

            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    this.noteSearchQuery = searchInput.value;
                    this.renderNotesView();
                });
            }

            if (courseSelect) {
                courseSelect.addEventListener('change', () => {
                    this.noteCourseFilter = courseSelect.value;
                    this.renderNotesView();
                });
            }

            const triggerNewNote = () => {
                const newNote = window.StudyState.addNote('New Note', '# Study Flow Notes\n\nStart typing here...', this.noteCourseFilter !== 'all' ? this.noteCourseFilter : '');
                this.activeNoteId = newNote.id;
                this.renderNotesView();
            };

            if (newNoteBtn) newNoteBtn.addEventListener('click', triggerNewNote);
            if (createFirstNoteBtn) createFirstNoteBtn.addEventListener('click', triggerNewNote);

            // Select note item click handlers
            container.querySelectorAll('.note-sidebar-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.activeNoteId = item.getAttribute('data-id');
                    this.renderNotesView();
                });
            });

            // Editor controls bindings
            if (activeNote) {
                const textEditor = document.getElementById('note-textarea');
                const titleInput = document.getElementById('note-edit-title');
                const noteCourseSelect = document.getElementById('note-edit-course');
                const deleteBtn = document.getElementById('note-delete-btn');
                const saveBtn = document.getElementById('note-save-btn');
                const tabWrite = document.getElementById('editor-tab-write');
                const tabPreview = document.getElementById('editor-tab-preview');
                const previewArea = document.getElementById('note-preview-area');

                // Quick tabs for editor
                tabWrite.addEventListener('click', () => {
                    tabWrite.classList.add('active');
                    tabPreview.classList.remove('active');
                    textEditor.style.display = 'block';
                    previewArea.style.display = 'none';
                });

                tabPreview.addEventListener('click', () => {
                    tabPreview.classList.add('active');
                    tabWrite.classList.remove('active');
                    textEditor.style.display = 'none';
                    previewArea.style.display = 'block';

                    // Parse basic Markdown
                    previewArea.innerHTML = this.parseMarkdown(textEditor.value);
                });

                const saveNote = () => {
                    const title = titleInput.value.trim() || 'Untitled Note';
                    const content = textEditor.value;
                    const courseId = noteCourseSelect.value;

                    window.StudyState.updateNote(activeNote.id, { title, content, courseId });
                    if (window.showNotification) window.showNotification('Note saved successfully!', 'success');
                    
                    // Maintain scroll position / selection
                    const currentId = this.activeNoteId;
                    this.renderNotesView();
                    this.activeNoteId = currentId;
                };

                saveBtn.addEventListener('click', saveNote);

                // Auto-save typing changes (debounced save)
                let autoSaveTimeout;
                textEditor.addEventListener('input', () => {
                    clearTimeout(autoSaveTimeout);
                    autoSaveTimeout = setTimeout(() => {
                        window.StudyState.updateNote(activeNote.id, { 
                            title: titleInput.value.trim() || 'Untitled Note', 
                            content: textEditor.value, 
                            courseId: noteCourseSelect.value 
                        });
                    }, 1500); // Save state silently in background
                });

                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this note?')) {
                        window.StudyState.deleteNote(activeNote.id);
                        if (window.showNotification) window.showNotification('Note deleted successfully.', 'success');
                        this.activeNoteId = null;
                        this.renderNotesView();
                    }
                });
            }
        }

        parseMarkdown(markdownText) {
            if (!markdownText) return '<p>Empty note</p>';
            
            let html = markdownText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Headers
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
            html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
            html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

            // Bold & Italics
            html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
            html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');

            // Bullets
            html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
            html = html.replace(/<\/li>\s*<li>/g, '</li><li>'); // Group list items
            
            // Newlines to paragraphs
            html = html.split('\n').map(line => {
                if (line.trim().startsWith('<h') || line.trim().startsWith('<li') || line.trim() === '') {
                    return line;
                }
                return `<p>${line}</p>`;
            }).join('\n');

            return html;
        }
    }

    window.StudyNotes = new NotesWorkspace();
})();
