// StudyFlow Social Module
(function() {
    class SocialManager {
        constructor() {
            this.activeChat = null; // currently open chat student id
            this.init();
        }

        init() {
            window.StudyRouter.register('social', () => this.renderSocialView());
        }

        getSocial() {
            return window.StudyState.state.social || { friends: [], pendingOut: [], pendingIn: [], messages: {}, sharedNotes: [] };
        }

        getStudents() {
            return window.StudyState.state.mockStudents || [];
        }

        getProfile() {
            return window.StudyState.state.settings.profile;
        }

        getAvatarHtml(avatarKey, size = 44) {
            if (window.StudySettings) {
                return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0;">${window.StudySettings.getAvatarSvg(avatarKey)}</div>`;
            }
            return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--accent-indigo);flex-shrink:0;"></div>`;
        }

        saveSocial(social) {
            window.StudyState.state.social = social;
            window.StudyState.saveState();
        }

        renderSocialView() {
            const container = document.getElementById('view-social');
            if (!container) return;

            const social = this.getSocial();
            const profile = this.getProfile();
            const students = this.getStudents();

            // Figure out suggested students: same uni or same major, not already friends/pending
            const excluded = new Set([...social.friends, ...social.pendingOut, ...social.pendingIn]);
            const suggested = students.filter(s => !excluded.has(s.id) &&
                (s.university === profile.university || s.major === profile.major));
            const others = students.filter(s => !excluded.has(s.id) && !suggested.find(sg => sg.id === s.id));

            const friendStudents = students.filter(s => social.friends.includes(s.id));
            const pendingInStudents = students.filter(s => social.pendingIn.includes(s.id));

            container.innerHTML = `
                <div class="view-header">
                    <div class="header-title">
                        <h1><i class="fas fa-users" style="color:var(--accent-indigo);margin-right:10px;"></i>Study Network</h1>
                        <p>Discover students, connect with friends, and share your notes</p>
                    </div>
                </div>

                <div class="social-layout">
                    <!-- Left Column: Friends + Pending -->
                    <div class="social-left-col">
                        <!-- Pending Requests -->
                        ${pendingInStudents.length > 0 ? `
                        <div class="social-panel glass-panel">
                            <h3 class="social-panel-title"><i class="fas fa-bell"></i> Friend Requests <span class="social-badge">${pendingInStudents.length}</span></h3>
                            <div class="social-list">
                                ${pendingInStudents.map(s => `
                                    <div class="social-friend-item">
                                        ${this.getAvatarHtml(s.avatar)}
                                        <div class="social-friend-info">
                                            <strong>${s.name}</strong>
                                            <span>${s.major}</span>
                                        </div>
                                        <div class="social-request-actions">
                                            <button class="social-btn-accept" onclick="window.StudySocial.acceptFriend('${s.id}')"><i class="fas fa-check"></i></button>
                                            <button class="social-btn-decline" onclick="window.StudySocial.declineFriend('${s.id}')"><i class="fas fa-times"></i></button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>` : ''}

                        <!-- Friends List -->
                        <div class="social-panel glass-panel">
                            <h3 class="social-panel-title"><i class="fas fa-user-friends"></i> My Friends <span class="social-count">${friendStudents.length}</span></h3>
                            ${friendStudents.length === 0 ? `
                                <div class="social-empty">
                                    <i class="fas fa-user-plus" style="font-size:28px;opacity:0.3;"></i>
                                    <p>No friends yet — discover students on the right!</p>
                                </div>
                            ` : `
                                <div class="social-list">
                                    ${friendStudents.map(s => `
                                        <div class="social-friend-item social-friend-clickable" onclick="window.StudySocial.openChat('${s.id}')">
                                            ${this.getAvatarHtml(s.avatar)}
                                            <div class="social-friend-info">
                                                <strong>${s.name}</strong>
                                                <span>${s.university}</span>
                                            </div>
                                            <div class="social-friend-actions">
                                                <button class="social-btn-chat" title="Message"><i class="fas fa-comment"></i></button>
                                                <button class="social-btn-share" title="Share a Note" onclick="event.stopPropagation(); window.StudySocial.openShareNote('${s.id}')"><i class="fas fa-share-alt"></i></button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>

                        <!-- Shared Notes Inbox -->
                        <div class="social-panel glass-panel">
                            <h3 class="social-panel-title"><i class="fas fa-inbox"></i> Shared Notes</h3>
                            ${(!social.sharedNotes || social.sharedNotes.length === 0) ? `
                                <div class="social-empty">
                                    <i class="fas fa-file-alt" style="font-size:28px;opacity:0.3;"></i>
                                    <p>No notes shared with you yet.</p>
                                </div>
                            ` : `
                                <div class="social-list">
                                    ${social.sharedNotes.map((n, i) => `
                                        <div class="social-shared-note-item" onclick="window.StudySocial.viewSharedNote(${i})">
                                            <div class="social-note-icon"><i class="fas fa-sticky-note"></i></div>
                                            <div class="social-friend-info">
                                                <strong>${n.title}</strong>
                                                <span>from ${n.fromName} · ${new Date(n.ts).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Right Column: Discovery + Chat -->
                    <div class="social-right-col">
                        <!-- Chat Window -->
                        <div id="social-chat-panel" class="social-panel glass-panel" style="display:none;">
                            <div id="social-chat-content"></div>
                        </div>

                        <!-- Discovery -->
                        <div class="social-panel glass-panel">
                            <h3 class="social-panel-title"><i class="fas fa-search"></i> Discover Students</h3>
                            <div class="social-search-bar">
                                <i class="fas fa-search"></i>
                                <input type="text" id="social-search-input" placeholder="Search by name, major, or university..." oninput="window.StudySocial.filterStudents(this.value)">
                            </div>

                            ${suggested.length > 0 ? `
                                <p class="social-section-label"><i class="fas fa-star"></i> Suggested for you (same uni/major)</p>
                                <div class="social-discover-grid" id="social-suggested-grid">
                                    ${suggested.map(s => this.renderStudentCard(s, social)).join('')}
                                </div>
                            ` : ''}

                            ${others.length > 0 ? `
                                <p class="social-section-label" style="margin-top:20px;"><i class="fas fa-globe"></i> Other Students</p>
                                <div class="social-discover-grid" id="social-others-grid">
                                    ${others.map(s => this.renderStudentCard(s, social)).join('')}
                                </div>
                            ` : ''}

                            ${suggested.length === 0 && others.length === 0 ? `
                                <div class="social-empty">
                                    <i class="fas fa-users" style="font-size:28px;opacity:0.3;"></i>
                                    <p>You're already connected with everyone!</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Note Viewer Modal -->
                <div id="social-note-modal" class="social-modal-overlay" style="display:none;" onclick="this.style.display='none'">
                    <div class="social-modal-box" onclick="event.stopPropagation()">
                        <div class="social-modal-header">
                            <h3 id="social-note-modal-title">Shared Note</h3>
                            <button onclick="document.getElementById('social-note-modal').style.display='none'" class="social-modal-close"><i class="fas fa-times"></i></button>
                        </div>
                        <div id="social-note-modal-content" class="social-note-modal-body"></div>
                    </div>
                </div>

                <!-- Share Note Modal -->
                <div id="social-share-modal" class="social-modal-overlay" style="display:none;" onclick="this.style.display='none'">
                    <div class="social-modal-box" onclick="event.stopPropagation()">
                        <div class="social-modal-header">
                            <h3>Share a Note</h3>
                            <button onclick="document.getElementById('social-share-modal').style.display='none'" class="social-modal-close"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="social-modal-body" id="social-share-modal-body"></div>
                    </div>
                </div>
            `;

            // If there was an active chat, reopen it
            if (this.activeChat) {
                this.openChat(this.activeChat);
            }
        }

        renderStudentCard(s, social) {
            const isPending = social.pendingOut.includes(s.id);
            const isFriend = social.friends.includes(s.id);
            return `
                <div class="social-student-card">
                    <div class="social-student-avatar">${this.getAvatarHtml(s.avatar, 54)}</div>
                    <div class="social-student-name">${s.name}</div>
                    <div class="social-student-meta">${s.major}</div>
                    <div class="social-student-uni"><i class="fas fa-university"></i> ${s.university}</div>
                    ${s.bio ? `<div class="social-student-bio">${s.bio}</div>` : ''}
                    <div class="social-student-gpa"><i class="fas fa-star"></i> GPA ${s.gpa}</div>
                    ${isFriend ? `<button class="social-btn-added" disabled><i class="fas fa-check"></i> Friends</button>` :
                      isPending ? `<button class="social-btn-pending" disabled><i class="fas fa-clock"></i> Pending</button>` :
                      `<button class="social-btn-add" onclick="window.StudySocial.sendRequest('${s.id}')"><i class="fas fa-user-plus"></i> Add Friend</button>`}
                </div>
            `;
        }

        sendRequest(studentId) {
            const social = this.getSocial();
            if (!social.pendingOut.includes(studentId)) {
                social.pendingOut.push(studentId);
                this.saveSocial(social);
                if (window.showNotification) window.showNotification('Friend request sent!', 'success');
                this.renderSocialView();
            }
        }

        acceptFriend(studentId) {
            const social = this.getSocial();
            social.pendingIn = social.pendingIn.filter(id => id !== studentId);
            if (!social.friends.includes(studentId)) social.friends.push(studentId);
            this.saveSocial(social);
            if (window.showNotification) window.showNotification('Friend added!', 'success');
            this.renderSocialView();
        }

        declineFriend(studentId) {
            const social = this.getSocial();
            social.pendingIn = social.pendingIn.filter(id => id !== studentId);
            this.saveSocial(social);
            this.renderSocialView();
        }

        openChat(studentId) {
            this.activeChat = studentId;
            const students = this.getStudents();
            const student = students.find(s => s.id === studentId);
            if (!student) return;

            const chatPanel = document.getElementById('social-chat-panel');
            const chatContent = document.getElementById('social-chat-content');
            if (!chatPanel || !chatContent) return;

            chatPanel.style.display = 'block';

            const social = this.getSocial();
            const messages = (social.messages[studentId]) || [];
            const profile = this.getProfile();

            chatContent.innerHTML = `
                <div class="social-chat-header">
                    ${this.getAvatarHtml(student.avatar, 36)}
                    <div>
                        <strong>${student.name}</strong>
                        <span style="font-size:11px;color:var(--text-muted);display:block;">${student.major} · ${student.university}</span>
                    </div>
                    <button class="social-modal-close" style="margin-left:auto;" onclick="window.StudySocial.closeChat()"><i class="fas fa-times"></i></button>
                </div>
                <div class="social-chat-messages" id="chat-messages-${studentId}">
                    ${messages.length === 0 ? `<div class="social-chat-empty"><i class="fas fa-comment-dots"></i><p>Start the conversation!</p></div>` :
                      messages.map(m => `
                        <div class="social-chat-msg ${m.from === 'me' ? 'social-chat-msg-mine' : 'social-chat-msg-theirs'}">
                            <div class="social-chat-bubble">${m.text}</div>
                            <span class="social-chat-ts">${new Date(m.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                      `).join('')}
                </div>
                <div class="social-chat-input-row">
                    <input type="text" id="chat-input-${studentId}" class="social-chat-input" placeholder="Type a message…" onkeydown="if(event.key==='Enter') window.StudySocial.sendMessage('${studentId}')">
                    <button class="social-chat-send" onclick="window.StudySocial.sendMessage('${studentId}')"><i class="fas fa-paper-plane"></i></button>
                </div>
            `;

            // scroll to bottom
            const msgBox = document.getElementById(`chat-messages-${studentId}`);
            if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
        }

        closeChat() {
            this.activeChat = null;
            const chatPanel = document.getElementById('social-chat-panel');
            if (chatPanel) chatPanel.style.display = 'none';
        }

        sendMessage(studentId) {
            const input = document.getElementById(`chat-input-${studentId}`);
            if (!input || !input.value.trim()) return;
            const text = input.value.trim();

            const social = this.getSocial();
            if (!social.messages[studentId]) social.messages[studentId] = [];
            social.messages[studentId].push({ from: 'me', text, ts: new Date().toISOString() });

            this.saveSocial(social);

            // Simulate a reply after 1.5s
            const students = this.getStudents();
            const student = students.find(s => s.id === studentId);
            const replies = [
                'That sounds great! 📚',
                'Totally agree with you!',
                'Thanks for sharing 😊',
                'Let\'s study together sometime!',
                'Interesting point! I\'ll think about it.',
                'Can you share your notes on that?',
                '👍 Got it!',
                'That helps a lot, thanks!'
            ];
            setTimeout(() => {
                const s2 = this.getSocial();
                if (!s2.messages[studentId]) s2.messages[studentId] = [];
                const reply = replies[Math.floor(Math.random() * replies.length)];
                s2.messages[studentId].push({ from: studentId, text: reply, ts: new Date().toISOString() });
                this.saveSocial(s2);
                if (this.activeChat === studentId) this.openChat(studentId);
            }, 1500);

            this.openChat(studentId);
        }

        openShareNote(studentId) {
            const notes = window.StudyState.state.notes;
            const student = this.getStudents().find(s => s.id === studentId);
            const modal = document.getElementById('social-share-modal');
            const body = document.getElementById('social-share-modal-body');
            if (!modal || !body || !student) return;

            if (notes.length === 0) {
                body.innerHTML = `<div class="social-empty"><i class="fas fa-file-alt" style="font-size:28px;opacity:0.3;"></i><p>You have no notes to share. Create some in Notes Workspace first!</p></div>`;
            } else {
                body.innerHTML = `
                    <p style="margin-bottom:16px;color:var(--text-secondary);">Choose a note to share with <strong>${student.name}</strong>:</p>
                    <div class="social-note-picker">
                        ${notes.map(n => `
                            <div class="social-note-pick-item" onclick="window.StudySocial.shareNote('${studentId}', '${n.id}')">
                                <i class="fas fa-sticky-note" style="color:var(--accent-indigo);"></i>
                                <div>
                                    <strong>${n.title}</strong>
                                    <span>${n.content.substring(0, 60)}…</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            modal.style.display = 'flex';
        }

        shareNote(studentId, noteId) {
            const notes = window.StudyState.state.notes;
            const note = notes.find(n => n.id === noteId);
            const profile = this.getProfile();
            if (!note) return;

            const social = this.getSocial();
            if (!social.sharedNotes) social.sharedNotes = [];
            social.sharedNotes.unshift({ noteId, title: note.title, content: note.content, fromName: profile.name, ts: new Date().toISOString() });
            this.saveSocial(social);

            document.getElementById('social-share-modal').style.display = 'none';
            if (window.showNotification) window.showNotification(`Note "${note.title}" shared!`, 'success');
            this.renderSocialView();
        }

        viewSharedNote(index) {
            const social = this.getSocial();
            const note = social.sharedNotes[index];
            if (!note) return;

            document.getElementById('social-note-modal-title').textContent = note.title;
            document.getElementById('social-note-modal-content').innerHTML = `
                <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">Shared by <strong>${note.fromName}</strong> on ${new Date(note.ts).toLocaleDateString()}</p>
                <div style="white-space:pre-wrap;line-height:1.8;color:var(--text-secondary);">${note.content}</div>
            `;
            document.getElementById('social-note-modal').style.display = 'flex';
        }

        filterStudents(query) {
            const q = query.toLowerCase().trim();
            const allCards = document.querySelectorAll('.social-student-card');
            allCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(q) ? '' : 'none';
            });
        }
    }

    window.StudySocial = new SocialManager();
})();
