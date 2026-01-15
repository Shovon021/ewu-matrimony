
        // Auth Guard - Check localStorage for login status (workaround for serverless)
        if (localStorage.getItem('admin_logged_in') !== 'true') {
            window.location.href = 'admin_login.html';
        }

        // View Switching Logic
        function switchView(viewId, linkElement) {
            // Update Menu Active State
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            if (linkElement) linkElement.classList.add('active');

            // Update View Visibility
            document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
            const target = document.getElementById('view-' + viewId);
            if (target) target.style.display = 'block';

            // Update Header Title
            const titles = {
                'dashboard': 'Dashboard Overview',
                'verifications': 'Verification Queues',
                'messages': 'User Inquiries',
                'users': 'User Management',
                'blog': 'Blog CMS',
                'settings': 'System Settings'
            };
            const titleEl = document.querySelector('.admin-header h3');
            if (titleEl && titles[viewId]) titleEl.textContent = titles[viewId];

            // Auto-load data based on view
            if (viewId === 'messages') loadMessages();
        }

        let currentMessages = [];

        async function loadMessages() {
            const tbody = document.querySelector('#messagesTable tbody');
            const thead = document.querySelector('#messagesTable thead tr');

            // Ensure Action column exists
            if (!thead.querySelector('.col-actions')) {
                const th = document.createElement('th');
                th.className = 'col-actions';
                th.textContent = 'Actions';
                thead.appendChild(th);
            }

            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">Loading messages...</td></tr>';

            try {
                const response = await fetch('api/admin?action=get_messages');
                const data = await response.json();

                if (data.success && data.messages.length > 0) {
                    currentMessages = data.messages;
                    tbody.innerHTML = data.messages.map((msg, index) => `
                        <tr>
                            <td>${new Date(msg.submitted_at).toLocaleDateString()}</td>
                            <td><strong>${msg.name}</strong></td>
                            <td>
                                <div>${msg.email}</div>
                                <div style="font-size:0.8em; color:gray;">${msg.phone}</div>
                            </td>
                            <td><span class="status-badge status-pending">${msg.subject}</span></td>
                            <td class="truncate" style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${msg.message.substring(0, 50)}...</td>
                            <td>
                                <button class="btn btn-sm btn-outline" onclick="openMessageModal(${index})">
                                    &#128065; View
                                </button>
                            </td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">No messages found.</td></tr>';
                }
            } catch (err) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error loading messages</td></tr>';
            }
        }

        function openMessageModal(index) {
            const msg = currentMessages[index];
            if (!msg) return;

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-card">
                    <div class="modal-header">
                        <h3>Message Details</h3>
                        <button onclick="this.closest('.modal-overlay').remove()">Ã—</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>From:</strong> ${msg.name} (${msg.email})</p>
                        <p><strong>Phone:</strong> ${msg.phone || 'N/A'}</p>
                        <p><strong>Subject:</strong> ${msg.subject}</p>
                        <p><strong>Date:</strong> ${new Date(msg.submitted_at).toLocaleString()}</p>
                        <hr style="margin: 1rem 0; border:0; border-top:1px solid #eee;">
                        <div style="background:#f8f9fa; padding:1rem; border-radius:0.5rem; max-height:300px; overflow-y:auto;">
                            ${msg.message}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Load Pending Users on Page Load
        async function loadPendingUsers() {
            try {
                console.log('Fetching pending users...');
                const response = await fetch('api/admin?action=get_pending');
                const text = await response.text();
                console.log('API Response:', text);

                let users;
                try {
                    users = JSON.parse(text);
                } catch (e) {
                    console.error('JSON Parse Error:', e);
                    document.getElementById('usersTableBody').innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">API Error: ${text}</td></tr>`;
                    return;
                }

                const tbody = document.getElementById('usersTableBody');
                tbody.innerHTML = '';

                if (users.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--gray-500); padding:2rem;">No pending verifications found.</td></tr>';
                    return;
                }

                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', user.student_id);
                    // Handle ID Card View Logic
                    let idAction = '<span style="color:var(--gray-400);">No ID</span>';
                    if (user.id_card_image) {
                        const imgUrl = user.id_card_image.startsWith('http') ? user.id_card_image : 'uploads/' + user.id_card_image;
                        idAction = `<a href="${imgUrl}" target="_blank" style="color:var(--primary); text-decoration:underline;">View ID</a>`;
                    }

                    row.innerHTML = `
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar" style="background:#e0e7ff; color:#3730a3; display:flex; align-items:center; justify-content:center; font-weight:bold;">${user.first_name ? user.first_name[0] : '?'}</div>
                                <div>
                                    <div style="font-weight:600;">${user.first_name} ${user.last_name}</div>
                                    <div style="font-size:0.8rem; color:var(--gray-600);">Batch: ${user.batch_year}</div>
                                </div>
                            </div>
                        </td>
                        <td>${user.student_id}</td>
                        <td>${user.status || 'Student'}</td>
                        <td>
                            ${idAction}
                        </td>
                        <td><span class="status-badge status-pending">Pending</span></td>
                        <td>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="action-btn btn-view" onclick="viewUserDetails('${user.student_id}')" title="View Details" style="background:#f3f4f6; color:#1f2937;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </button>
                                <button class="action-btn btn-check" onclick="verifyUser('${user.student_id}', 'approve', this)" title="Approve">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                                </button>
                                <button class="action-btn btn-x" onclick="verifyUser('${user.student_id}', 'reject', this)" title="Reject">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

            } catch (e) {
                console.error("Error loading users", e);
                document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">Connection Failed</td></tr>';
            }
        }

        async function verifyUser(studentId, action, btn) {
            const row = btn.closest('tr');

            if (!confirm(`Are you sure you want to ${action} this user?`)) return;

            try {
                const response = await fetch('api/admin?action=verify_user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId, action })
                });

                const result = await response.json();

                if (result.success) {
                    if (action === 'approve') {
                        row.style.background = '#f0fdf4';
                        row.querySelector('.status-badge').textContent = 'Verified';
                        row.querySelector('.status-badge').classList.replace('status-pending', 'status-verified');
                        btn.parentElement.innerHTML = '<span style="color:#15803d; font-size:0.9rem;">Verified </span>';
                    } else {
                        row.style.opacity = '0.5';
                        row.querySelector('.status-badge').textContent = 'Rejected';
                        btn.parentElement.innerHTML = '<span style="color:#b91c1c; font-size:0.9rem;">Rejected</span>';
                    }
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (e) {
                alert('Connection error');
            }

            async function viewUserDetails(studentId) {
                document.getElementById('userModal').classList.add('active');
                const content = document.getElementById('userDetailsContent');
                content.innerHTML = '<div style="text-align:center; padding:2rem;">Loading details...</div>';

                // Find current row button for actions
                const row = document.querySelector(`tr[data-id="${studentId}"]`);
                const approveBtn = row ? row.querySelector('.btn-check') : null;
                const rejectBtn = row ? row.querySelector('.btn-x') : null;

                // Bind Modal Buttons
                document.getElementById('userModalApprove').onclick = () => {
                    if (approveBtn) verifyUser(studentId, 'approve', approveBtn);
                    closeUserModal();
                };
                document.getElementById('userModalReject').onclick = () => {
                    if (rejectBtn) verifyUser(studentId, 'reject', rejectBtn);
                    closeUserModal();
                };

                try {
                    // Reuse the biodata details endpoint which fetches FULL user info
                    const response = await fetch(`api/admin?action=get_biodata_details&student_id=${studentId}`);
                    const result = await response.json();

                    if (result.success && result.data) {
                        const u = result.data;
                        const imgUrl = u.id_card_image ? (u.id_card_image.startsWith('http') ? u.id_card_image : 'uploads/' + u.id_card_image) : '';

                        content.innerHTML = `
                        <div style="text-align:center; margin-bottom:1.5rem; background:#f3f4f6; padding:1rem; border-radius:8px;">
                           ${imgUrl ?
                                `<a href="${imgUrl}" target="_blank"><img src="${imgUrl}" style="max-width:100%; max-height:250px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1);" alt="ID Card"></a><br><small style="color:#666;">Click to enlarge</small>` :
                                '<div style="padding:1rem; color:#666;">No ID Card Uploaded</div>'}
                        </div>
                        <div class="detail-row"><span class="detail-label">Full Name:</span> <span class="detail-value">${u.first_name} ${u.last_name}</span></div>
                        <div class="detail-row"><span class="detail-label">Student ID:</span> <span class="detail-value">${u.student_id}</span></div>
                        <div class="detail-row"><span class="detail-label">Email:</span> <span class="detail-value">${u.email || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Phone:</span> <span class="detail-value">${u.phone || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Gender:</span> <span class="detail-value">${u.gender || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Religion:</span> <span class="detail-value">${u.religion || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Date of Birth:</span> <span class="detail-value">${u.dob || 'N/A'}</span></div>
                        <div class="detail-row"><span class="detail-label">Registered:</span> <span class="detail-value">${new Date(u.created_at).toLocaleString()}</span></div>
                    `;
                    } else {
                        content.innerHTML = '<div style="color:red; text-align:center;">Failed to load user details.</div>';
                    }
                } catch (e) {
                    console.error(e);
                    content.innerHTML = '<div style="color:red; text-align:center;">Connection Error.</div>';
                }
            }

            function closeUserModal() {
                document.getElementById('userModal').classList.remove('active');
            }

            // ========== BIODATA VERIFICATION ==========
            async function loadPendingBiodatas() {
                try {
                    const response = await fetch('api/admin?action=get_pending_biodatas');
                    const biodatas = await response.json();

                    const tbody = document.querySelector('#biodataTable tbody');
                    tbody.innerHTML = '';

                    if (biodatas.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--gray-500); padding:2rem;">No pending biodata verifications</td></tr>';
                        return;
                    }

                    biodatas.forEach(bio => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar" style="background:#fce7f3; color:#db2777; display:flex; align-items:center; justify-content:center; font-weight:bold;">${bio.first_name[0]}</div>
                                <div>
                                    <div style="font-weight:600;">${bio.first_name} ${bio.last_name}</div>
                                    <div style="font-size:0.8rem; color:var(--gray-600);">${bio.gender}</div>
                                </div>
                            </div>
                        </td>
                        <td>${bio.student_id}</td>
                        <td>${bio.occupation || 'Not specified'}</td>
                        <td>${new Date(bio.updated_at).toLocaleDateString()}</td>
                        <td>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn-view" onclick="viewBiodataDetails('${bio.student_id}')" title="View Details">View</button>
                                <button class="action-btn btn-check" onclick="verifyBiodata('${bio.student_id}', 'approve', this)" title="Approve">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                                </button>
                                <button class="action-btn btn-x" onclick="verifyBiodata('${bio.student_id}', 'reject', this)" title="Reject">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                            </div>
                        </td>
                    `;
                        tbody.appendChild(row);
                    });

                } catch (e) {
                    console.error("Error loading biodatas", e);
                }
            }

            async function verifyBiodata(studentId, action, btn) {
                const row = btn.closest('tr');

                if (!confirm(`Are you sure you want to ${action} this biodata?`)) return;

                try {
                    const response = await fetch('api/admin?action=verify_biodata', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId, action })
                    });

                    const result = await response.json();

                    if (result.success) {
                        if (action === 'approve') {
                            row.style.background = '#f0fdf4';
                            btn.parentElement.innerHTML = '<span style="color:#15803d; font-size:0.9rem;">Published </span>';
                        } else {
                            row.style.opacity = '0.5';
                            btn.parentElement.innerHTML = '<span style="color:#b91c1c; font-size:0.9rem;">Rejected</span>';
                        }
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (e) {
                    alert('Connection error');
                }
            }

            // ========== VIEW BIODATA MODAL ==========
            let currentBiodataStudentId = null;

            async function viewBiodataDetails(studentId) {
                currentBiodataStudentId = studentId;
                document.getElementById('biodataModal').classList.add('active');
                document.getElementById('biodataDetails').innerHTML = 'Loading...';

                try {
                    const response = await fetch(`api/admin?action=get_biodata_details&student_id=${studentId}`);
                    const result = await response.json();

                    if (result.success) {
                        const d = result.data;
                        document.getElementById('biodataDetails').innerHTML = `
                        <div style="text-align:center; margin-bottom:1rem;">
                            <img src="${d.photo ? (d.photo.startsWith('http') ? d.photo : 'uploads/' + d.photo) : 'default.png'}" 
                                 onerror="this.src='https://ui-avatars.com/api/?name=${d.first_name}+${d.last_name}&size=100'" 
                                 style="width:100px; height:100px; border-radius:50%; object-fit:cover;">
                            <h3 style="margin-top:0.5rem;">${d.first_name} ${d.last_name}</h3>
                            <p style="color:#666;">${d.student_id}</p>
                        </div>
                        <hr>
                        <h4 style="margin:1rem 0 0.5rem;">Personal Information</h4>
                        <div class="detail-row"><span class="detail-label">Gender</span><span class="detail-value">${d.gender || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Date of Birth</span><span class="detail-value">${d.dob || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Religion</span><span class="detail-value">${d.religion || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${d.phone || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Height</span><span class="detail-value">${d.height || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Weight</span><span class="detail-value">${d.weight || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Skin Tone</span><span class="detail-value">${d.skin_tone || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Blood Group</span><span class="detail-value">${d.blood_group || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Marital Status</span><span class="detail-value">${d.marital_status || '-'}</span></div>
                        
                        <h4 style="margin:1rem 0 0.5rem;">Education & Career</h4>
                        <div class="detail-row"><span class="detail-label">Education</span><span class="detail-value">${d.education || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Occupation</span><span class="detail-value">${d.occupation || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${d.company || '-'}</span></div>
                        <div class="detail-row"><span class="detail-label">Income</span><span class="detail-value">${d.income || '-'}</span></div>
                        
                        <h4 style="margin:1rem 0 0.5rem;">About</h4>
                        <p style="background:#f9f9f9; padding:1rem; border-radius:8px;">${d.about_me || 'No description provided.'}</p>
                    `;

                        // Set up approve/reject buttons
                        document.getElementById('modalApproveBtn').onclick = () => {
                            verifyBiodataFromModal('approve');
                        };
                        document.getElementById('modalRejectBtn').onclick = () => {
                            verifyBiodataFromModal('reject');
                        };
                    } else {
                        document.getElementById('biodataDetails').innerHTML = '<p style="color:red;">Error loading details</p>';
                    }
                } catch (e) {
                    document.getElementById('biodataDetails').innerHTML = '<p style="color:red;">Connection error</p>';
                }
            }

            function closeModal() {
                document.getElementById('biodataModal').classList.remove('active');
            }

            async function verifyBiodataFromModal(action) {
                if (!currentBiodataStudentId) return;
                if (!confirm(`Are you sure you want to ${action} this biodata?`)) return;

                try {
                    const response = await fetch('api/admin?action=verify_biodata', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId: currentBiodataStudentId, action })
                    });
                    const result = await response.json();

                    if (result.success) {
                        alert(`Biodata ${action}d successfully!`);
                        closeModal();
                        loadPendingBiodatas();
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (e) {
                    alert('Connection error');
                }
            }

            // Load real stats
            async function loadStats() {
                try {
                    const response = await fetch('api/admin?action=stats');
                    const result = await response.json();

                    if (result.success) {
                        const s = result.stats;
                        document.getElementById('statTotalUsers').textContent = s.total_users;
                        document.getElementById('statPending').textContent = s.pending_accounts;
                        document.getElementById('statVerified').textContent = s.verified_biodatas;
                        document.getElementById('statMatches').textContent = s.total_matches;
                    }
                } catch (e) {
                    console.error('Error loading stats:', e);
                }
            }

            // Initialize on page load
            document.addEventListener('DOMContentLoaded', () => {
                loadPendingUsers();
                loadPendingBiodatas();
                loadStats(); // Add this
            });

            // Update Admin Credentials
            async function updateCredentials(event) {
                event.preventDefault();

                const newUsername = document.getElementById('newUsername').value.trim();
                const newPassword = document.getElementById('newPassword').value;
                const currentPassword = document.getElementById('currentPassword').value;

                if (!newUsername || newUsername.length < 3) {
                    alert('Username must be at least 3 characters');
                    return;
                }

                if (newPassword && newPassword.length < 6) {
                    alert('Password must be at least 6 characters');
                    return;
                }

                if (!currentPassword) {
                    alert('Please enter your current password to confirm changes');
                    return;
                }

                try {
                    const response = await fetch('api/admin?action=update_credentials', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            current_password: currentPassword,
                            new_username: newUsername,
                            new_password: newPassword
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert(result.message);
                        if (result.logout) {
                            window.location.href = 'admin_login.html';
                        }
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (e) {
                    alert('Connection error. Please try again.');
                }
            }

            // User Details Modal Logic
            async function viewUserDetails(studentId) {
                const modal = document.getElementById('userDetailsModal');
                const content = document.getElementById('userDetailsContent');
                modal.style.display = 'block';
                content.innerHTML = '<div style="text-align:center; padding:2rem;">Loading details...</div>';

                try {
                    const response = await fetch(`api/admin?action=get_biodata_details&student_id=${studentId}`);
                    const result = await response.json();

                    if (result.success && result.data) {
                        const user = result.data;
                        content.innerHTML = `
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                            <div style="grid-column:span 2; display:flex; align-items:center; gap:1rem; padding-bottom:1rem; border-bottom:1px solid #eee;">
                                <div style="width:64px; height:64px; background:#e0e7ff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:bold; color:#3730a3;">
                                    ${user.first_name ? user.first_name[0] : '?'}
                                </div>
                                <div>
                                    <h3 style="margin:0;">${user.first_name} ${user.last_name}</h3>
                                    <p style="margin:0; color:#666;">${user.student_id}</p>
                                </div>
                            </div>

                            <div><label style="font-weight:600; font-size:0.85rem; color:#666;">Email</label><div>${user.email || 'N/A'}</div></div>
                            <div><label style="font-weight:600; font-size:0.85rem; color:#666;">Phone</label><div>${user.phone || 'N/A'}</div></div>
                            <div><label style="font-weight:600; font-size:0.85rem; color:#666;">Gender</label><div>${user.gender || 'N/A'}</div></div>
                            <div><label style="font-weight:600; font-size:0.85rem; color:#666;">Date of Birth</label><div>${user.dob || 'N/A'}</div></div>
                            <div><label style="font-weight:600; font-size:0.85rem; color:#666;">Religion</label><div>${user.religion || 'N/A'}</div></div>
                            <div><label style="font-weight:600; font-size:0.85rem; color:#666;">Batch</label><div>${user.batch_year || 'N/A'}</div></div>
                            <div><label style="font-weight:600; font-size:0.85rem; color:#666;">Status</label><div>${user.status || 'N/A'}</div></div>
                            
                            <div style="grid-column: span 2;">
                                <label style="font-weight:600; font-size:0.85rem; color:#666;">ID Card Preview</label>
                                <div style="margin-top:0.5rem; border:1px solid #eee; padding:1rem; border-radius:8px; text-align:center; background:#f9fafb;">
                                     ${user.id_card_image ?
                                `<img src="${user.id_card_image.startsWith('http') ? user.id_card_image : 'uploads/' + user.id_card_image}" style="max-width:100%; max-height:300px; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">` :
                                '<span style="color:#ef4444; font-weight:500;">No ID Card Uploaded</span>'}
                                </div>
                            </div>
                        </div>
                    `;
                    } else {
                        content.innerHTML = '<div style="color:red; text-align:center;">User details not found.</div>';
                    }
                } catch (e) {
                    content.innerHTML = '<div style="color:red; text-align:center;">Error loading details.</div>';
                }
            }
    