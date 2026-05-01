// ==========================================
// BACKGROUND ANIMATION (Copied from main script for consistency)
// ==========================================
const canvas = document.getElementById('nokey');
let can_w = window.innerWidth;
let can_h = window.innerHeight;
const ctx = canvas.getContext('2d');
const BALL_NUM = 30;
const R = 2;
let balls = [];
const ball_color = { r: 255, g: 255, b: 255 };
const alpha_f = 0.03;
const dis_limit = 260;
const link_line_width = 0.8;

function initCanvas() {
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
    can_w = window.innerWidth;
    can_h = window.innerHeight;
}

function getRandomSpeed(pos) {
    const min = -1, max = 1;
    switch(pos) {
        case 'top': return [randomNumFrom(min, max), randomNumFrom(0.1, max)];
        case 'right': return [randomNumFrom(min, -0.1), randomNumFrom(min, max)];
        case 'bottom': return [randomNumFrom(min, max), randomNumFrom(min, -0.1)];
        case 'left': return [randomNumFrom(0.1, max), randomNumFrom(min, max)];
        default: return [0,0];
    }
}

function randomNumFrom(min, max) { return Math.random() * (max - min) + min; }

function getRandomBall() {
    const pos = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)];
    const b = { r: R, alpha: 1, phase: randomNumFrom(0, 10) };
    if (pos === 'top') { b.x = Math.random() * can_w; b.y = -R; [b.vx, b.vy] = getRandomSpeed('top'); }
    else if (pos === 'right') { b.x = can_w + R; b.y = Math.random() * can_h; [b.vx, b.vy] = getRandomSpeed('right'); }
    else if (pos === 'bottom') { b.x = Math.random() * can_w; b.y = can_h + R; [b.vx, b.vy] = getRandomSpeed('bottom'); }
    else { b.x = -R; b.y = Math.random() * can_h; [b.vx, b.vy] = getRandomSpeed('left'); }
    return b;
}

function render() {
    ctx.clearRect(0, 0, can_w, can_h);
    balls.forEach(b => {
        ctx.fillStyle = `rgba(${ball_color.r},${ball_color.g},${ball_color.b},${b.alpha})`;
        ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, Math.PI * 2); ctx.fill();
        b.x += b.vx; b.y += b.vy;
        if (b.x < -50 || b.x > can_w + 50 || b.y < -50 || b.y > can_h + 50) {
            Object.assign(b, getRandomBall());
        }
        b.phase += alpha_f; b.alpha = Math.abs(Math.cos(b.phase));
    });

    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const dist = Math.sqrt((balls[i].x - balls[j].x)**2 + (balls[i].y - balls[j].y)**2);
            if (dist < dis_limit) {
                ctx.strokeStyle = `rgba(150,150,150,${1 - dist / dis_limit})`;
                ctx.lineWidth = link_line_width;
                ctx.beginPath(); ctx.moveTo(balls[i].x, balls[i].y); ctx.lineTo(balls[j].x, balls[j].y); ctx.stroke();
            }
        }
    }
    requestAnimationFrame(render);
}

// ==========================================
// ADMIN DASHBOARD LOGIC
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Start Animation
    initCanvas();
    for (let i = 0; i < BALL_NUM; i++) {
        const b = getRandomBall();
        b.x = Math.random() * can_w; b.y = Math.random() * can_h;
        balls.push(b);
    }
    render();
    window.addEventListener('resize', initCanvas);

    // Sidebar Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.dashboard-section');
    const sectionTitle = document.getElementById('section-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionId = link.getAttribute('data-section');
            if (!sectionId) return; // Exit link

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');

            sectionTitle.innerText = link.querySelector('span').innerText;
        });
    });

    // API Integration
    const loader = document.getElementById('admin-loader');
    let allLogs = [];
    let allStudents = [];

    async function fetchData(endpoint) {
        try {
            const res = await fetch(endpoint);
            if (res.status === 401) {
                window.location.href = '/login';
                return null;
            }
            return await res.json();
        } catch (err) {
            console.error(`Error fetching ${endpoint}:`, err);
            return null;
        }
    }

    // ======== Chart.js instances (Phase 8A) ========
    let barChart = null;
    let lineChart = null;

    function renderCharts(monthLogs, uniqueStudentNames, displayNames, totalWorkingDays) {
        // --- Bar Chart: Attendance % per student ---
        const barLabels = displayNames.slice(0, 15); // limit for readability
        const barData = barLabels.map(name => {
            const logs = monthLogs.filter(l => l.name.trim().toLowerCase() === name.toLowerCase());
            const days = new Set(logs.map(l => l.date)).size;
            return totalWorkingDays > 0 ? Math.round((days / totalWorkingDays) * 100) : 0;
        });

        const barCtx = document.getElementById('chart-bar');
        if (barCtx) {
            if (barChart) barChart.destroy();
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: barLabels,
                    datasets: [{
                        label: 'Attendance %',
                        data: barData,
                        backgroundColor: barData.map(v => v >= 75 ? 'rgba(76,175,80,0.7)' : v >= 50 ? 'rgba(255,235,59,0.7)' : 'rgba(255,82,82,0.7)'),
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { max: 100, ticks: { color: '#aaa', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#aaa', maxRotation: 35, font: { size: 11 } }, grid: { display: false } }
                    }
                }
            });
        }

        // --- Line Chart: Daily attendance count ---
        const dateMap = {};
        monthLogs.forEach(l => { dateMap[l.date] = (dateMap[l.date] || 0) + 1; });
        const sortedDates = Object.keys(dateMap).sort();

        const lineCtx = document.getElementById('chart-line');
        if (lineCtx) {
            if (lineChart) lineChart.destroy();
            lineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: sortedDates.map(d => d.slice(5)),  // Show MM-DD
                    datasets: [{
                        label: 'Students Present',
                        data: sortedDates.map(d => dateMap[d]),
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76,175,80,0.08)',
                        pointBackgroundColor: '#4CAF50',
                        tension: 0.4,
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: '#aaa' } } },
                    scales: {
                        y: { ticks: { color: '#aaa', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#aaa', font: { size: 11 } }, grid: { display: false } }
                    }
                }
            });
        }
    }

    async function refreshDashboard() {
        loader.style.display = 'flex';
        
        // Fetch Stats
        const stats = await fetchData('/api/admin/stats');
        if (stats) {
            document.getElementById('stat-total-students').innerText = stats.total_students;
            document.getElementById('stat-today-attendance').innerText = stats.today_attendance;
            document.getElementById('stat-total-records').innerText = stats.total_records;
        }

        // Fetch pending device request count for badge
        const pendingData = await fetchData('/api/admin/pending_count');
        if (pendingData) {
            const count = pendingData.count || 0;
            const badge = document.getElementById('pending-badge');
            const statPending = document.getElementById('stat-pending-requests');
            if (badge) { badge.innerText = count; badge.style.display = count > 0 ? 'inline-block' : 'none'; }
            if (statPending) statPending.innerText = count;
        }

        // Fetch Students
        allStudents = await fetchData('/api/admin/students') || [];

        // Fetch Logs
        allLogs = await fetchData('/api/admin/attendance') || [];
        if (allLogs.length >= 0) {
            const recentBody = document.getElementById('recent-activity-body');
            const fullLogsBody = document.getElementById('logs-body');
            
            recentBody.innerHTML = '';
            fullLogsBody.innerHTML = '';

            const sortedLogs = [...allLogs].reverse();

            sortedLogs.forEach((log, index) => {
                const row = `
                    <tr>
                        <td>${log.name}</td>
                        <td>${log.inTime || 'N/A'}</td>
                        <td>${log.outTime || 'N/A'}</td>
                        <td>${log.date}</td>
                        <td><span class="confidence-badge">${Math.round((log.confidence || 1) * 100)}% Match</span></td>
                    </tr>
                `;
                if (index < 10) recentBody.innerHTML += row;
                fullLogsBody.innerHTML += row;
            });
        }

        // Fetch Students table
        const students = await fetchData('/api/admin/students');
        if (students) {
            const studentsBody = document.getElementById('students-body');
            studentsBody.innerHTML = '';
            students.forEach(student => {
                const row = `
                    <tr>
                        <td>${student.name}</td>
                        <td>${student.reg_date}</td>
                        <td>
                            <button class="action-btn delete-btn" onclick="deleteStudent('${student.name}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
                studentsBody.innerHTML += row;
            });
        }

        // Fetch Devices
        const devices = await fetchData('/api/admin/devices');
        if (devices) {
            const devicesBody = document.getElementById('devices-body');
            devicesBody.innerHTML = '';
            devices.forEach(device => {
                const isBound = device.deviceId !== "Not Bound";
                const row = `
                    <tr>
                        <td>${device.name}</td>
                        <td style="font-family: monospace; font-size: 0.8rem;">${device.deviceId}</td>
                        <td style="color: var(--text-muted); font-size: 0.9rem;">${device.deviceInfo || '-'}</td>
                        <td>
                            <span class="confidence-badge" style="background: ${isBound ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)'}; color: ${isBound ? '#4CAF50' : '#FF9800'}; border: 1px solid ${isBound ? '#4CAF50' : '#FF9800'};">
                                ${isBound ? '✅ Bound' : '⚠️ Unbound'}
                            </span>
                        </td>
                        <td>
                            ${isBound ? `
                                <button class="action-btn" style="background: rgba(255, 152, 0, 0.1); color: #FF9800; border: 1px solid #FF9800;" onclick="resetDevice('${device.name}')">
                                    <i class="fas fa-undo"></i> Reset Device
                                </button>
                            ` : '-'}
                        </td>
                    </tr>
                `;
                devicesBody.innerHTML += row;
            });
        }

        // Fetch Device Requests (Phase 4)
        const deviceReqs = await fetchData('/api/admin/device_requests');
        if (deviceReqs) {
            const reqBody = document.getElementById('device-requests-body');
            reqBody.innerHTML = '';
            if (deviceReqs.length === 0) {
                reqBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No device change requests yet.</td></tr>';
            } else {
                deviceReqs.forEach(req => {
                    const statusColor = req.status === 'approved' ? '#4CAF50' : req.status === 'rejected' ? '#ff5252' : '#FF9800';
                    const isPending = req.status === 'pending';
                    const row = `
                        <tr>
                            <td><strong>${req.studentName}</strong></td>
                            <td style="color:var(--text-muted); font-size:0.85rem;">${req.createdAt}</td>
                            <td style="font-family:monospace; font-size:0.8rem;">${req.newDeviceInfo}<br><span style="opacity:0.5;">${req.newDeviceId.substring(0,20)}...</span></td>
                            <td style="max-width:200px; font-size:0.85rem;">${req.reason}</td>
                            <td>
                                <span class="confidence-badge" style="background:rgba(0,0,0,0.2); color:${statusColor}; border:1px solid ${statusColor};">
                                    ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                </span>
                            </td>
                            <td style="display:flex; gap:8px;">
                                ${isPending ? `
                                    <button class="action-btn" style="background:rgba(76,175,80,0.15); color:#4CAF50; border:1px solid #4CAF50;" onclick="approveDevice(${req.id})">
                                        <i class="fas fa-check"></i> Approve
                                    </button>
                                    <button class="action-btn delete-btn" onclick="rejectDevice(${req.id})">
                                        <i class="fas fa-times"></i> Reject
                                    </button>
                                ` : '—'}
                            </td>
                        </tr>
                    `;
                    reqBody.innerHTML += row;
                });
            }
        }

        renderAnalytics();
        loader.style.display = 'none';
    }

    window.approveDevice = async (reqId) => {
        if (!confirm('Approve this device change request?')) return;
        loader.style.display = 'flex';
        try {
            const res = await fetch('/api/admin/approve_device', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: reqId })
            });
            const result = await res.json();
            alert(result.message);
            refreshDashboard();
        } catch { alert('Failed to approve device.'); }
        finally { loader.style.display = 'none'; }
    };

    window.rejectDevice = async (reqId) => {
        if (!confirm('Reject this device change request?')) return;
        loader.style.display = 'flex';
        try {
            const res = await fetch('/api/admin/reject_device', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: reqId })
            });
            const result = await res.json();
            alert(result.message);
            refreshDashboard();
        } catch { alert('Failed to reject device.'); }
        finally { loader.style.display = 'none'; }
    };

    window.resetDevice = async (name) => {
        if (!confirm(`Are you sure you want to reset the device binding for ${name}? This will allow them to use a different device.`)) return;

        loader.style.display = 'flex';
        try {
            const res = await fetch('/api/admin/reset_device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const result = await res.json();
            if (result.success) {
                alert(result.message);
                refreshDashboard();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (err) {
            alert('Failed to reset device.');
        } finally {
            loader.style.display = 'none';
        }
    };

    window.deleteStudent = async (name) => {
        if (!confirm(`Are you sure you want to delete ${name}? This will remove their face data permanently.`)) return;

        loader.style.display = 'flex';
        try {
            const res = await fetch('/api/admin/delete_student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const result = await res.json();
            if (result.success) {
                alert(result.message);
                refreshDashboard();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (err) {
            alert('Failed to delete student.');
        } finally {
            loader.style.display = 'none';
        }
    };

    // Initial Load
    refreshDashboard();

    // Refresh Button
    document.getElementById('refresh-data').addEventListener('click', refreshDashboard);

    // Search Logic
    document.getElementById('student-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#students-table tbody tr');
        rows.forEach(row => {
            const name = row.cells[0].innerText.toLowerCase();
            row.style.display = name.includes(term) ? '' : 'none';
        });
    });

    // CSV Export
    document.getElementById('download-logs').addEventListener('click', () => {
        const table = document.getElementById('logs-table');
        let csv = [];
        for (let i = 0; i < table.rows.length; i++) {
            let row = [], cols = table.rows[i].cells;
            for (let j = 0; j < cols.length; j++) row.push(cols[j].innerText);
            csv.push(row.join(","));
        }
        const blob = new Blob([csv.join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'attendance_logs.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Sync from Google Logic
    document.getElementById('sync-google').addEventListener('click', async () => {
        loader.style.display = 'flex';
        try {
            const res = await fetch('/api/admin/sync_sheets');
            const result = await res.json();
            if (result.success) {
                alert(result.message);
                refreshDashboard();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (err) {
            alert('Failed to sync from Google Sheets.');
        } finally {
            loader.style.display = 'none';
        }
    });
    // Analytics Logic
    const monthPicker = document.getElementById('analytics-month');
    if (monthPicker) {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        monthPicker.value = currentMonth;
        monthPicker.addEventListener('change', renderAnalytics);
    }

    function renderAnalytics() {
        if (!monthPicker) return;
        const selectedMonth = monthPicker.value;
        if (!selectedMonth) return;

        const monthLogs = allLogs.filter(log => log.date && log.date.startsWith(selectedMonth));
        const uniqueDates = new Set(monthLogs.map(log => log.date));
        const totalWorkingDays = uniqueDates.size;
        document.getElementById('analytics-working-days').innerText = totalWorkingDays;

        const analyticsBody = document.getElementById('analytics-body');
        if (!analyticsBody) return;
        analyticsBody.innerHTML = '';

        const uniqueStudentNames = new Set();
        allStudents.forEach(s => uniqueStudentNames.add(s.name.trim().toLowerCase()));
        allLogs.forEach(l => uniqueStudentNames.add(l.name.trim().toLowerCase()));

        if (uniqueStudentNames.size === 0) {
            analyticsBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No students found.</td></tr>';
            return;
        }

        const displayNames = Array.from(uniqueStudentNames).map(lowerName => {
            const student = allStudents.find(s => s.name.trim().toLowerCase() === lowerName);
            if (student) return student.name;
            const log = allLogs.find(l => l.name.trim().toLowerCase() === lowerName);
            return log ? log.name : lowerName;
        });

        displayNames.sort().forEach(studentName => {
            const studentLogs = monthLogs.filter(log => log.name.trim().toLowerCase() === studentName.toLowerCase());
            const studentUniqueDates = new Set(studentLogs.map(log => log.date));
            const presentDays = studentUniqueDates.size;

            let absentDays = 0, percentage = 0, percentStr = 'N/A', percentColor = 'var(--text-muted)';
            if (totalWorkingDays > 0) {
                absentDays = Math.max(0, totalWorkingDays - presentDays);
                percentage = Math.round((presentDays / totalWorkingDays) * 100);
                percentStr = `${percentage}%`;
                percentColor = percentage >= 75 ? '#4CAF50' : percentage >= 50 ? '#ffeb3b' : '#ff5252';
            }

            const row = `
                <tr>
                    <td>${studentName}</td>
                    <td><span style="color: #4CAF50; font-weight: bold;">${presentDays}</span></td>
                    <td><span style="color: #ff5252; font-weight: bold;">${absentDays}</span></td>
                    <td><span class="confidence-badge" style="background: rgba(255,255,255,0.05); border: 1px solid ${percentColor}; color: ${percentColor};">${percentStr}</span></td>
                </tr>
            `;
            analyticsBody.innerHTML += row;
        });

        // Phase 8A: Render charts
        renderCharts(monthLogs, uniqueStudentNames, displayNames, totalWorkingDays);
    }

    // Phase 5: Register Student form handler
    const adminRegForm = document.getElementById('admin-reg-form');
    if (adminRegForm) {
        adminRegForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            const msgBox = document.getElementById('admin-reg-msg');
            const btn = document.getElementById('admin-reg-btn');

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

            try {
                const res = await fetch('/api/admin/register_student', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const result = await res.json();
                msgBox.style.display = 'block';
                msgBox.style.background = result.success ? 'rgba(76,175,80,0.15)' : 'rgba(255,82,82,0.15)';
                msgBox.style.color = result.success ? '#4CAF50' : '#ff5252';
                msgBox.style.border = `1px solid ${result.success ? '#4CAF50' : '#ff5252'}`;
                msgBox.innerText = result.message;
                if (result.success) { adminRegForm.reset(); refreshDashboard(); }
            } catch {
                msgBox.style.display = 'block';
                msgBox.innerText = 'Network error. Please try again.';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Register Student';
            }
        });
    }

});
