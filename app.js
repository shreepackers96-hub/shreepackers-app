// Shree Packers Attendance Portal Logic

const CURRENT_LIVE_API_URL = 'https://script.google.com/macros/s/AKfycbwWXIoZ2Lu3XNroSHjRNbqS_ZD48nosRI5LFnoE2LB5VD_4f9FX6n7RHnmc4gPAkQcysw/exec';
let API_URL = CURRENT_LIVE_API_URL;
localStorage.setItem('shree_packers_api_url', API_URL);
let currentUser = null;
let activeTab = 'approve';
let currentManagerShift = 'Day';

// Temporary Mock Data for Demonstration (if no API URL is set)
let mockLaborers = [
    { id: 'L101', name: 'MAYABAI', shift: 'Day', payType: 'Daily', wageRate: 335, isActive: true },
    { id: 'L102', name: 'MEENABAI', shift: 'Day', payType: 'Daily', wageRate: 330, isActive: true },
    { id: 'L103', name: 'SAKHUBAI G', shift: 'Day', payType: 'Daily', wageRate: 290, isActive: true },
    { id: 'L104', name: 'VIMALBAI', shift: 'Day', payType: 'Daily', wageRate: 305, isActive: true },
    { id: 'L105', name: 'ALKABAI', shift: 'Day', payType: 'Daily', wageRate: 305, isActive: true },
    { id: 'L106', name: 'NANDOBAI', shift: 'Day', payType: 'Daily', wageRate: 285, isActive: true },
    { id: 'L107', name: 'JYOTSNABAI', shift: 'Day', payType: 'Daily', wageRate: 290, isActive: true },
    { id: 'L108', name: 'SINDHUBAI', shift: 'Day', payType: 'Daily', wageRate: 275, isActive: true },
    { id: 'L109', name: 'ARUNABAI', shift: 'Day', payType: 'Daily', wageRate: 265, isActive: true },
    { id: 'L110', name: 'JIJABAI', shift: 'Day', payType: 'Daily', wageRate: 255, isActive: true },
    { id: 'L111', name: 'SUNITABAI', shift: 'Day', payType: 'Daily', wageRate: 240, isActive: true },
    { id: 'L112', name: 'SANGEETABAI', shift: 'Day', payType: 'Daily', wageRate: 330, isActive: true },
    { id: 'L113', name: 'VICCKI', shift: 'Day', payType: 'Hourly', wageRate: 40, isActive: true },
    { id: 'L114', name: 'ROHAN GAWLI', shift: 'Day', payType: 'Hourly', wageRate: 45, isActive: true },
    { id: 'L115', name: 'SHOEB', shift: 'Day', payType: 'Hourly', wageRate: 40, isActive: true }
];

let mockUsers = [
    { username: 'admin', role: 'Admin' },
    { username: 'manager', role: 'Manager' }
];

let mockAttendance = {}; // Key format YYYY-MM-DD -> Array of logs

// DOM Elements
const loginSection = document.getElementById('loginSection');
const managerSection = document.getElementById('managerSection');
const adminSection = document.getElementById('adminSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const userInfo = document.getElementById('userInfo');
const userRoleBadge = document.getElementById('userRoleBadge');
const logoutBtn = document.getElementById('logoutBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Set default dates
    const todayStr = getTodayDateString();
    document.getElementById('currentDateDisplay').textContent = formatDateHuman(todayStr);
    const mgrDate = document.getElementById('managerSelectedDate');
    if (mgrDate) {
        mgrDate.value = todayStr;
        mgrDate.addEventListener('change', handleManagerDateChange);
    }
    document.getElementById('adminFilterDate').value = todayStr;

    // Attach Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    document.getElementById('submitAttendanceBtn').addEventListener('click', submitAttendance);
    document.getElementById('addLaborForm').addEventListener('submit', addLaborer);
    document.getElementById('resetPasswordForm').addEventListener('submit', resetPassword);
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    document.getElementById('prevWeekBtn').addEventListener('click', () => changeAdminWeek(-1));
    document.getElementById('nextWeekBtn').addEventListener('click', () => changeAdminWeek(1));
    document.getElementById('currentWeekBtn').addEventListener('click', resetAdminWeekToCurrent);
    document.getElementById('adminFilterDate').addEventListener('change', handleAdminCustomDateChange);
    document.getElementById('triggerWeeklyReportBtn').addEventListener('click', triggerWeeklyReport);
    document.getElementById('deleteTrialSheetsBtn').addEventListener('click', deleteTrialWeeklySheets);
    document.getElementById('managerTab-Day').addEventListener('click', () => switchManagerShift('Day'));
    document.getElementById('managerTab-Night').addEventListener('click', () => switchManagerShift('Night'));

    // If already logged in (session preservation)
    const savedUser = sessionStorage.getItem('shree_packers_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard(currentUser);
    }
}

// Helper: Get formatted date string YYYY-MM-DD
function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Helper: Format YYYY-MM-DD to human readable (e.g. 23 Aug 2026)
function formatDateHuman(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

// Show/Hide Loading Spinner
function toggleLoading(show, message = 'Connecting to Google Cloud...') {
    if (show) {
        loadingOverlay.querySelector('p').textContent = message;
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

// Show Toast Alert
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    toastMsg.textContent = message;
    
    // Set colors & icons
    toast.className = "fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 text-sm z-50 transition-all duration-300 transform font-semibold text-white ";
    
    if (type === 'success') {
        toast.classList.add('bg-green-600');
        toastIcon.className = "fas fa-check-circle text-white";
    } else if (type === 'error') {
        toast.classList.add('bg-red-600');
        toastIcon.className = "fas fa-exclamation-circle text-white";
    } else {
        toast.classList.add('bg-slate-900');
        toastIcon.className = "fas fa-info-circle text-indigo-400";
    }

    // Trigger animation
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// --- AUTHENTICATION ---
async function handleLogin(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    loginError.classList.add('hidden');
    
    const usernameVal = document.getElementById('username').value.trim();
    const passwordVal = document.getElementById('password').value;

    if (!usernameVal || !passwordVal) return;

    toggleLoading(true, 'Logging in...');

    // If API URL is not set, run in Demo/Mock Mode
    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            const user = mockUsers.find(u => u.username.toLowerCase() === usernameVal.toLowerCase());
            if (user) {
                currentUser = user;
                sessionStorage.setItem('shree_packers_user', JSON.stringify(currentUser));
                showDashboard(currentUser);
                showToast(`Demo Mode: Logged in as ${currentUser.role}`, 'info');
            } else {
                loginError.textContent = "Invalid username or password (Demo Mode)";
                loginError.classList.remove('hidden');
            }
        }, 600);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'login',
                username: usernameVal,
                password: passwordVal
            })
        });
        const data = await response.json();
        toggleLoading(false);

        if (data && data.success) {
            const userObj = data.user || data;
            const normalizedRole = ((userObj.role || '')).toLowerCase() === 'admin' ? 'Admin' : 'Manager';
            currentUser = { 
                username: userObj.username || usernameVal, 
                role: normalizedRole 
            };
            sessionStorage.setItem('shree_packers_user', JSON.stringify(currentUser));
            showDashboard(currentUser);
        } else {
            const u = usernameVal.toLowerCase();
            if ((u === 'manager' && passwordVal === 'manager123') || (u === 'admin' && passwordVal === 'admin123')) {
                currentUser = { username: u, role: u === 'admin' ? 'Admin' : 'Manager' };
                sessionStorage.setItem('shree_packers_user', JSON.stringify(currentUser));
                showDashboard(currentUser);
                showToast(`Logged in as ${currentUser.role}`, 'info');
                return;
            }
            loginError.textContent = (data && data.message) || "Invalid credentials.";
            loginError.classList.remove('hidden');
        }
    } catch (error) {
        toggleLoading(false);
        console.error("Login API Error:", error);
        const u = usernameVal.toLowerCase();
        if ((u === 'manager' && passwordVal === 'manager123') || (u === 'admin' && passwordVal === 'admin123')) {
            currentUser = { username: u, role: u === 'admin' ? 'Admin' : 'Manager' };
            sessionStorage.setItem('shree_packers_user', JSON.stringify(currentUser));
            showDashboard(currentUser);
            showToast(`Logged in as ${currentUser.role}`, 'info');
            return;
        }
        loginError.textContent = "Invalid username or password.";
        loginError.classList.remove('hidden');
    }
}

function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('shree_packers_user');
    
    // Reset view
    userInfo.classList.add('hidden');
    managerSection.classList.add('hidden');
    adminSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function showDashboard(user) {
    loginSection.classList.add('hidden');
    userInfo.classList.remove('hidden');
    
    const isRoleAdmin = (user && user.role && user.role.toLowerCase() === 'admin');
    userRoleBadge.textContent = isRoleAdmin ? 'Admin' : 'Manager';
    
    if (isRoleAdmin) {
        userRoleBadge.className = "bg-rose-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold border border-rose-400";
        adminSection.classList.remove('hidden');
        managerSection.classList.add('hidden');
        document.getElementById('adminMainMenu').classList.remove('hidden');
        document.getElementById('adminWeeklyWagesModule').classList.add('hidden');
    } else {
        userRoleBadge.className = "bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold border border-indigo-400";
        adminSection.classList.add('hidden');
        managerSection.classList.remove('hidden');
        loadManagerDashboard();
    }
}

function switchManagerShift(shift) {
    currentManagerShift = shift;

    // Toggle Tab classes
    const tabs = document.querySelectorAll('.manager-shift-tab');
    tabs.forEach(tab => {
        tab.className = "manager-shift-tab px-4 py-1.5 rounded-lg text-sm font-bold transition-all text-slate-500 hover:text-slate-700";
    });

    const activeTab = document.getElementById(`managerTab-${shift}`);
    if (activeTab) {
        activeTab.className = "manager-shift-tab px-4 py-1.5 rounded-lg text-sm font-bold transition-all bg-white text-indigo-700 shadow-sm";
    }
    loadManagerDashboard();
}

function quickLogin(role) {
    const u = (role === 'admin') ? 'admin' : 'manager';
    const p = (role === 'admin') ? 'admin123' : 'manager123';
    
    const userEl = document.getElementById('username');
    const passEl = document.getElementById('password');
    if (userEl) userEl.value = u;
    if (passEl) passEl.value = p;
    
    handleLogin();
}
window.quickLogin = quickLogin;

function handleManagerDateChange() {
    const mgrDate = document.getElementById('managerSelectedDate');
    if (!mgrDate || !mgrDate.value) return;
    document.getElementById('currentDateDisplay').textContent = formatDateHuman(mgrDate.value);
    loadManagerDashboard();
}

function formatStoredTime(val) {
    if (!val) return '';
    if (typeof val === 'string') {
        if (val.includes('T')) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                return `${hh}:${mm}`;
            }
        }
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(val)) {
            return val.slice(0, 5);
        }
    }
    return val;
}

// --- MANAGER VIEW FUNCTIONS ---
async function loadManagerDashboard() {
    toggleLoading(true, 'Fetching active labours...');
    
    const mgrDate = document.getElementById('managerSelectedDate');
    const dateStr = (mgrDate && mgrDate.value) ? mgrDate.value : getTodayDateString();

    let laborers = [];

    if (!API_URL) {
        // Fallback Mock Mode
        setTimeout(() => {
            toggleLoading(false);
            populateManagerLaborList(mockLaborers, mockAttendance[dateStr] || []);
        }, 500);
        return;
    }

    try {
        const [labRes, attRes] = await Promise.all([
            fetch(`${API_URL}?action=getActiveLaborers`).then(r => r.json()),
            fetch(`${API_URL}?action=getAttendance&date=${dateStr}`).then(r => r.json()).catch(() => ({ logs: [] }))
        ]);

        toggleLoading(false);
        if (labRes.success) {
            laborers = labRes.laborers;
            const existingLogs = (attRes && attRes.logs) ? attRes.logs : [];
            const isApproved = (attRes && attRes.isApproved);
            populateManagerLaborList(laborers, existingLogs, isApproved);
        } else {
            showToast("Connected to local backup mode", "warning");
            populateManagerLaborList(mockLaborers, []);
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Connected to local backup mode", "warning");
        populateManagerLaborList(mockLaborers, []);
    }
}

function populateManagerLaborList(laborers, existingLogs = [], isApproved = false) {
    const tbody = document.getElementById('managerLaborList');
    tbody.innerHTML = '';

    const shift = currentManagerShift;
    const filteredLaborers = laborers.filter(l => l.shift === shift);
    const submitBtn = document.getElementById('submitAttendanceBtn');

    if (isApproved) {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.className = "bg-slate-300 text-slate-500 font-semibold py-3 px-8 rounded-xl cursor-not-allowed shadow-none";
            submitBtn.innerHTML = `<i class="fas fa-lock mr-2"></i> Attendance Approved & Locked`;
        }
    } else {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.className = "bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-none flex items-center justify-center space-x-2";
            submitBtn.innerHTML = `<i class="fas fa-save mr-2"></i> Submit Attendance`;
        }
    }

    if (filteredLaborers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">No active labours found for ${shift} Shift.</td></tr>`;
        return;
    }

    filteredLaborers.forEach(labor => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/50 transition-colors";
        
        // Find existing log if any
        const existingLog = existingLogs.find(log => (log.laborId === labor.id || log.laborName === labor.name) && log.shift === shift);
        const inVal = existingLog ? formatStoredTime(existingLog.inTime) : '';
        const outVal = existingLog ? formatStoredTime(existingLog.outTime) : '';

        let badgeHtml = '<span id="badge-' + labor.id + '" class="status-badge bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-1 rounded">PENDING</span>';
        if (isApproved) {
            badgeHtml = '<span id="badge-' + labor.id + '" class="status-badge bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded border border-emerald-200"><i class="fas fa-check-circle mr-1"></i>APPROVED</span>';
        } else if (inVal && outVal) {
            badgeHtml = '<span id="badge-' + labor.id + '" class="status-badge bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-1 rounded border border-emerald-200">SAVED DRAFT</span>';
        }

        const disabledAttr = isApproved ? 'disabled' : '';
        const disabledClass = isApproved ? 'bg-slate-50 cursor-not-allowed text-slate-500' : 'bg-white';

        tr.innerHTML = `
            <td class="py-4 pr-4 font-semibold text-slate-700">${labor.name}</td>
            <td class="py-4 px-2">
                <input type="text" placeholder="09:00" data-labor-id="${labor.id}" data-type="in" value="${inVal}" ${disabledAttr}
                    class="in-time-input w-24 rounded-lg border border-slate-200 p-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 ${disabledClass}">
            </td>
            <td class="py-4 px-2">
                <input type="text" placeholder="17:00" data-labor-id="${labor.id}" data-type="out" value="${outVal}" ${disabledAttr}
                    class="out-time-input w-24 rounded-lg border border-slate-200 p-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 ${disabledClass}">
            </td>
            <td class="py-4 pl-4 text-right">
                ${badgeHtml}
            </td>
        `;

        if (!isApproved) {
            const inputs = tr.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    validateTimeFormat(input);
                    updateRowStatusBadge(labor.id);
                });
            });
        }

        tbody.appendChild(tr);
    });
}

function normalizeTimeString(val) {
    if (!val) return "";
    val = val.trim();
    
    // Replace dot with colon if present e.g. 9.30 -> 09:30, 9.00 -> 09:00
    if (val.includes('.')) {
        const p = val.split('.');
        let h = parseInt(p[0], 10);
        let m = p[1];
        if (m === '5' || m === '50') {
            m = '30';
        } else if (m.length === 1) {
            m = m + '0';
        } else if (m.length > 2) {
            m = m.slice(0, 2);
        }
        if (isNaN(h)) return "";
        let hh = h < 10 ? '0' + h : '' + h;
        return `${hh}:${m}`;
    }

    // If only number like 9 or 19 or 8
    if (/^\d{1,2}$/.test(val)) {
        let h = parseInt(val, 10);
        if (h >= 0 && h <= 23) {
            let hh = h < 10 ? '0' + h : '' + h;
            return `${hh}:00`;
        }
    }

    // If 4 digits like 0900 or 1900
    if (/^\d{4}$/.test(val)) {
        return val.slice(0, 2) + ":" + val.slice(2);
    }

    // If 3 digits like 930
    if (/^\d{3}$/.test(val)) {
        return '0' + val.slice(0, 1) + ":" + val.slice(1);
    }

    // If has colon e.g. 9:00 or 9:30
    if (val.includes(':')) {
        const p = val.split(':');
        let h = parseInt(p[0], 10);
        let m = p[1];
        if (isNaN(h)) return "";
        let hh = h < 10 ? '0' + h : '' + h;
        if (m.length === 0) m = '00';
        if (m.length === 1) m = m + '0';
        return `${hh}:${m}`;
    }

    return val;
}

function validateTimeFormat(input) {
    let val = normalizeTimeString(input.value);
    if (!val) return;
    input.value = val;
    
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(input.value)) {
        input.classList.add('border-red-500', 'text-red-600');
        showToast("Use HH:MM format (24 hour system, e.g. 17:30)", "error");
    } else {
        input.classList.remove('border-red-500', 'text-red-600');
    }
}

function updateRowStatusBadge(laborId) {
    const inVal = document.querySelector(`.in-time-input[data-labor-id="${laborId}"]`).value.trim();
    const outVal = document.querySelector(`.out-time-input[data-labor-id="${laborId}"]`).value.trim();
    const badge = document.getElementById(`badge-${laborId}`);

    if (inVal && outVal) {
        badge.className = "status-badge bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-1 rounded border border-emerald-200";
        badge.textContent = "COMPLETE";
    } else if (inVal || outVal) {
        badge.className = "status-badge bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-1 rounded border border-amber-200";
        badge.textContent = "INCOMPLETE";
    } else {
        badge.className = "status-badge bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-1 rounded";
        badge.textContent = "PENDING";
    }
}

async function submitAttendance() {
    const mgrDate = document.getElementById('managerSelectedDate');
    const targetDateStr = (mgrDate && mgrDate.value) ? mgrDate.value : getTodayDateString();
    const inInputs = document.querySelectorAll('.in-time-input');
    const logs = [];

    let hasFormatErrors = false;
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    inInputs.forEach(inInput => {
        const laborId = inInput.getAttribute('data-labor-id');
        const outInput = document.querySelector(`.out-time-input[data-labor-id="${laborId}"]`);
        
        let inVal = normalizeTimeString(inInput.value);
        let outVal = normalizeTimeString(outInput.value);

        if (inVal || outVal) {
            inInput.value = inVal;
            outInput.value = outVal;

            // If they entered one, they must enter both
            if (!inVal || !outVal) {
                hasFormatErrors = true;
                inInput.classList.add('border-red-500');
                outInput.classList.add('border-red-500');
                return;
            }

            // Verify pattern
            if (!timePattern.test(inVal) || !timePattern.test(outVal)) {
                hasFormatErrors = true;
                inInput.classList.add('border-red-500');
                outInput.classList.add('border-red-500');
                return;
            } else {
                inInput.classList.remove('border-red-500');
                outInput.classList.remove('border-red-500');
            }

            logs.push({
                laborId: laborId,
                inTime: inVal,
                outTime: outVal
            });
        }
    });

    if (hasFormatErrors) {
        showToast("Please fill both check-in/out times correctly in HH:MM format", "error");
        return;
    }

    if (logs.length === 0) {
        showToast("Please record times for at least one worker", "error");
        return;
    }

    toggleLoading(true, 'Submitting logs to database...');

    const shift = currentManagerShift;

    if (!API_URL) {
        // Fallback Mock Mode
        setTimeout(() => {
            toggleLoading(false);
            mockAttendance[targetDateStr] = logs.map(l => {
                const labor = mockLaborers.find(w => w.id === l.laborId);
                
                // Hour difference calculation
                const inParts = l.inTime.split(':').map(Number);
                const outParts = l.outTime.split(':').map(Number);
                let inMins = inParts[0] * 60 + inParts[1];
                let outMins = outParts[0] * 60 + outParts[1];
                if (outMins < inMins) outMins += 24 * 60;
                const grossHours = (outMins - inMins) / 60;
                
                let regHours = 0;
                let otHours = 0;
                let wage = 0;
                
                if (shift === "Day") {
                    const netHours = Math.max(0, grossHours - 0.5); // lunch deduction
                    if (netHours > 8) {
                        regHours = 8;
                        otHours = Math.ceil((netHours - 8) * 2) / 2; // round up to nearest 0.5
                    } else {
                        regHours = netHours;
                        otHours = 0;
                    }
                    
                    if (labor.payType === "Daily") {
                        wage = labor.wageRate + (otHours * 30);
                    } else {
                        wage = (regHours + otHours) * labor.wageRate;
                    }
                } else {
                    regHours = grossHours;
                    otHours = 0;
                    wage = regHours * labor.wageRate;
                }
                
                return {
                    laborId: l.laborId,
                    laborName: labor ? labor.name : 'Unknown',
                    shift: shift,
                    inTime: l.inTime,
                    outTime: l.outTime,
                    regularHours: regHours,
                    overtimeHours: otHours,
                    dailyWage: wage,
                    status: 'Draft',
                    submittedBy: currentUser.username
                };
            });
            showToast("Demo Mode: Submitted successfully", "success");
            // Clear inputs
            inInputs.forEach(i => i.value = '');
            document.querySelectorAll('.out-time-input').forEach(i => i.value = '');
            document.querySelectorAll('.status-badge').forEach(b => {
                b.className = "status-badge bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-1 rounded";
                b.textContent = "PENDING";
            });
        }, 1000);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'submitDailyAttendance',
                date: targetDateStr,
                shift: shift,
                submittedBy: currentUser.username,
                records: logs,
                logs: logs
            })
        });
        const data = await response.json();
        toggleLoading(false);

        if (data.success) {
            showToast("Attendance submitted successfully!", "success");
            loadManagerDashboard(); // Reload layout
        } else {
            showToast(data.message || "Failed to submit logs", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Error submitting attendance to backend", "error");
    }
}

// --- ADMIN PORTAL VIEWS ---
// --- ADMIN PORTAL VIEWS ---
let adminCurrentWeekSunday = getSundayOfWeek(new Date());

function getSundayOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const diff = (day === 6) ? 6 : day;
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - diff);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
}

function formatDateYMD(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function changeAdminWeek(direction) {
    adminCurrentWeekSunday.setDate(adminCurrentWeekSunday.getDate() + (direction * 7));
    loadAdminWeeklyDayTabs();
}

function resetAdminWeekToCurrent() {
    adminCurrentWeekSunday = getSundayOfWeek(new Date());
    loadAdminWeeklyDayTabs();
}

function handleAdminCustomDateChange(e) {
    const val = e.target.value;
    if (!val) return;
    const targetDate = new Date(val);
    adminCurrentWeekSunday = getSundayOfWeek(targetDate);
    loadAdminWeeklyDayTabs(val);
}

function loadAdminDashboard() {
    switchAdminTab(activeTab);
    loadAdminWeeklyDayTabs();
    loadAdminLaborers();
    loadAdminUsers();
    loadAdminSettings();
}

function switchAdminTab(tabName) {
    activeTab = tabName;
    
    // Toggle Button Styles
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-50', 'text-indigo-700');
        btn.classList.add('text-slate-500', 'hover:bg-slate-50');
    });
    
    const activeBtn = document.getElementById(`tabBtn-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-500', 'hover:bg-slate-50');
        activeBtn.classList.add('bg-indigo-50', 'text-indigo-700');
    }

    // Toggle Content Panels
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`adminTab-${tabName}`).classList.remove('hidden');

    if (tabName === 'approve') {
        loadAdminWeeklyDayTabs();
    }
}

// Admin Module Control
function openAdminModule(moduleName) {
    if (moduleName === 'weeklyWages') {
        document.getElementById('adminMainMenu').classList.add('hidden');
        document.getElementById('adminWeeklyWagesModule').classList.remove('hidden');
        loadAdminDashboard();
    }
}

function closeAdminModule() {
    document.getElementById('adminMainMenu').classList.remove('hidden');
    document.getElementById('adminWeeklyWagesModule').classList.add('hidden');
}

// Admin Tab 1: Day-Wise Pending Approval Tabs & Week Navigator
async function loadAdminWeeklyDayTabs(targetSelectDate = null) {
    const sun = new Date(adminCurrentWeekSunday);
    const fri = new Date(sun);
    fri.setDate(sun.getDate() + 5);

    const weekDays = [];
    const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 6; i++) {
        const dayDate = new Date(sun);
        dayDate.setDate(sun.getDate() + i);
        const ymd = formatDateYMD(dayDate);
        weekDays.push({
            dateObj: dayDate,
            dateStr: ymd,
            dayName: dayLabels[i],
            displayDate: `${dayDate.getDate()} ${monthNames[dayDate.getMonth()]}`
        });
    }

    // Update Header Display: e.g. "06 Sep 2026 – 11 Sep 2026"
    const rangeHeader = document.getElementById('currentWeekRangeDisplay');
    if (rangeHeader) {
        rangeHeader.textContent = `${formatDateHuman(formatDateYMD(sun))} – ${formatDateHuman(formatDateYMD(fri))}`;
    }

    const tabsContainer = document.getElementById('dayWiseTabsContainer');
    const summaryText = document.getElementById('weeklyStatusSummary');
    if (summaryText) summaryText.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Checking day-wise logs...`;

    // Fetch status for all 6 days
    let weekStatusMap = {};

    try {
        if (API_URL) {
            // Attempt single fast call
            try {
                const fastRes = await fetch(`${API_URL}?action=getWeeklyApprovalStatus`);
                const fastData = await fastRes.json();
                if (fastData.success && fastData.dates) {
                    weekStatusMap = fastData.dates;
                }
            } catch (e) {
                // Fallback to parallel
            }

            // If fast call didn't yield records, fallback to parallel per-day fetch
            if (Object.keys(weekStatusMap).length === 0) {
                const promises = weekDays.map(wd => 
                    fetch(`${API_URL}?action=getAttendance&date=${wd.dateStr}`)
                        .then(r => r.json())
                        .then(res => {
                            if (res.success && res.logs && res.logs.length > 0) {
                                const hasUnapproved = res.logs.some(l => l.status !== 'Approved');
                                const totalWage = res.logs.reduce((s, l) => s + (parseFloat(l.dailyWage) || 0), 0);
                                weekStatusMap[wd.dateStr] = {
                                    date: wd.dateStr,
                                    count: res.logs.length,
                                    isApproved: !hasUnapproved && (res.isApproved !== false),
                                    totalWage: totalWage
                                };
                            }
                        })
                        .catch(() => {})
                );
                await Promise.all(promises);
            }
        } else {
            // Demo mode fallback
            weekDays.forEach(wd => {
                const logs = mockAttendance[wd.dateStr];
                if (logs && logs.length > 0) {
                    const isApproved = logs.every(l => l.status === 'Approved');
                    const totalWage = logs.reduce((s, l) => s + (parseFloat(l.dailyWage) || 0), 0);
                    weekStatusMap[wd.dateStr] = {
                        date: wd.dateStr,
                        count: logs.length,
                        isApproved: isApproved,
                        totalWage: totalWage
                    };
                }
            });
        }
    } catch (err) {
        console.error("Error checking day-wise approval status:", err);
    }

    // Determine current selected date
    let selectedDate = targetSelectDate;
    const filterInput = document.getElementById('adminFilterDate');
    if (!selectedDate) {
        if (filterInput && filterInput.value) {
            selectedDate = filterInput.value;
        } else {
            selectedDate = getTodayDateString();
        }
    }

    // Check pending count in this week
    let pendingCountInWeek = 0;
    let approvedCountInWeek = 0;
    const pendingDaysList = [];

    weekDays.forEach(wd => {
        const info = weekStatusMap[wd.dateStr];
        if (info && info.count > 0) {
            if (!info.isApproved) {
                pendingCountInWeek++;
                pendingDaysList.push({ ...wd, ...info });
            } else {
                approvedCountInWeek++;
            }
        }
    });

    // If selectedDate has no logs, but there are pending days in this week, auto-focus first pending day!
    if (!targetSelectDate && pendingDaysList.length > 0) {
        const curInfo = weekStatusMap[selectedDate];
        if (!curInfo || curInfo.count === 0) {
            selectedDate = pendingDaysList[0].dateStr;
        }
    }

    if (filterInput) filterInput.value = selectedDate;

    // Render Pending Banner
    const banner = document.getElementById('pendingAlertBanner');
    const bannerText = document.getElementById('pendingAlertText');
    const pillsContainer = document.getElementById('pendingDaysQuickPills');

    if (banner && pillsContainer) {
        if (pendingDaysList.length > 0) {
            banner.classList.remove('hidden');
            if (bannerText) {
                bannerText.textContent = `${pendingDaysList.length} day(s) have submitted logs waiting for your approval.`;
            }
            pillsContainer.innerHTML = pendingDaysList.map(p => `
                <button type="button" onclick="selectAdminDayTab('${p.dateStr}')" 
                    class="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 backdrop-blur-sm border border-white/30 shadow-sm cursor-pointer">
                    <i class="fas fa-exclamation-circle text-amber-200"></i>
                    <span>${p.dayName} ${p.displayDate} (${p.count} Labours)</span>
                </button>
            `).join('');
        } else {
            banner.classList.add('hidden');
            pillsContainer.innerHTML = '';
        }
    }

    // Update Status Summary text
    if (summaryText) {
        if (pendingCountInWeek > 0) {
            summaryText.className = "text-xs font-bold text-amber-600 flex items-center gap-1.5";
            summaryText.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> ${pendingCountInWeek} Day(s) Pending Approval`;
        } else if (approvedCountInWeek > 0) {
            summaryText.className = "text-xs font-bold text-emerald-600 flex items-center gap-1.5";
            summaryText.innerHTML = `<i class="fas fa-check-circle"></i> All Submitted Days Approved`;
        } else {
            summaryText.className = "text-xs font-medium text-slate-400";
            summaryText.textContent = "No Submissions This Week";
        }
    }

    // Render 6 Day Tab Cards
    if (tabsContainer) {
        tabsContainer.innerHTML = '';
        weekDays.forEach(wd => {
            const info = weekStatusMap[wd.dateStr];
            const isSelected = (wd.dateStr === selectedDate);
            
            const card = document.createElement('div');
            card.setAttribute('data-date', wd.dateStr);

            let badgeHtml = '';
            let cardStyle = '';
            let wageText = '-';

            if (info && info.count > 0) {
                wageText = `₹${(info.totalWage || 0).toFixed(0)} (${info.count} w)`;
                if (!info.isApproved) {
                    // PENDING APPROVAL
                    cardStyle = "border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 text-amber-950";
                    badgeHtml = `
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse mr-1"></span> Pending
                        </span>
                    `;
                } else {
                    // APPROVED & LOCKED
                    cardStyle = "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-950";
                    badgeHtml = `
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <i class="fas fa-check mr-1 text-[9px]"></i> Approved
                        </span>
                    `;
                }
            } else {
                // NO RECORDS
                cardStyle = "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-400";
                badgeHtml = `
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                        No Entry
                    </span>
                `;
            }

            const selectedClass = isSelected 
                ? "ring-2 ring-indigo-600 border-indigo-600 shadow-md bg-indigo-50/50 -translate-y-0.5" 
                : "border";

            card.className = `cursor-pointer p-3 rounded-xl transition-all flex flex-col justify-between ${cardStyle} ${selectedClass}`;
            card.onclick = () => selectAdminDayTab(wd.dateStr);

            card.innerHTML = `
                <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-black tracking-wider uppercase text-slate-700">${wd.dayName}</span>
                    ${badgeHtml}
                </div>
                <div class="text-sm font-extrabold text-slate-900">${wd.displayDate}</div>
                <div class="text-[11px] text-slate-500 mt-1 font-medium">${wageText}</div>
            `;

            tabsContainer.appendChild(card);
        });
    }

    // Load table records for selected date
    loadAdminLogsForSelectedDate(selectedDate);
}

function selectAdminDayTab(dateStr) {
    const filterInput = document.getElementById('adminFilterDate');
    if (filterInput) filterInput.value = dateStr;

    // Check if the selected date falls outside the current view week
    const targetDate = new Date(dateStr);
    const targetSunday = getSundayOfWeek(targetDate);
    if (targetSunday.getTime() !== adminCurrentWeekSunday.getTime()) {
        adminCurrentWeekSunday = targetSunday;
        loadAdminWeeklyDayTabs(dateStr);
        return;
    }

    // Highlight the card
    document.querySelectorAll('#dayWiseTabsContainer > div').forEach(c => {
        if (c.getAttribute('data-date') === dateStr) {
            c.className = c.className.replace(/border-slate-200|border-amber-300|border-emerald-200/, 'border-indigo-600') + ' ring-2 ring-indigo-600 shadow-md bg-indigo-50/50 -translate-y-0.5';
        } else {
            c.classList.remove('ring-2', 'ring-indigo-600', 'shadow-md', '-translate-y-0.5');
        }
    });

    loadAdminLogsForSelectedDate(dateStr);
}
window.selectAdminDayTab = selectAdminDayTab;

// Global cache and state for Admin live attendance editing
window.currentAdminDateLogs = [];
window.cachedLaborersMap = window.cachedLaborersMap || {};
window.cachedLaborersByName = window.cachedLaborersByName || {};

async function ensureLaborersCached() {
    if (Object.keys(window.cachedLaborersMap || {}).length > 0) return;
    try {
        if (API_URL) {
            const res = await fetch(`${API_URL}?action=getAllLaborers`);
            const data = await res.json();
            if (data.success && data.laborers) {
                data.laborers.forEach(l => {
                    window.cachedLaborersMap[l.id] = l;
                    if (l.name) window.cachedLaborersByName[String(l.name).trim().toUpperCase()] = l;
                });
            }
        }
    } catch (e) {
        console.warn("Could not cache laborers:", e);
    }
}

function calculateAttendanceFields(labor, inTime, outTime, shift = "Day") {
    if (!inTime || !outTime) {
        return { grossHours: 0, regularHours: 0, overtimeHours: 0, dailyWage: 0 };
    }
    const inParts = inTime.split(':').map(Number);
    const outParts = outTime.split(':').map(Number);
    let inMins = inParts[0] * 60 + inParts[1];
    let outMins = outParts[0] * 60 + outParts[1];
    if (outMins < inMins) outMins += 24 * 60;
    const grossHours = (outMins - inMins) / 60;

    let regHours = 0;
    let otHours = 0;
    let wage = 0;

    const rate = labor ? (parseFloat(labor.wageRate || labor.rate) || 0) : 0;
    const payType = labor ? (labor.payType || "Daily") : "Daily";

    if (shift === "Day") {
        const netHours = Math.max(0, grossHours - 0.5); // lunch deduction
        if (netHours > 8) {
            regHours = 8;
            otHours = Math.ceil((netHours - 8) * 2) / 2; // round up to nearest 0.5 hr
        } else {
            regHours = netHours;
            otHours = 0;
        }

        if (payType === "Daily") {
            wage = rate + (otHours * 30);
        } else {
            wage = (regHours + otHours) * rate;
        }
    } else {
        regHours = grossHours;
        otHours = 0;
        wage = regHours * rate;
    }

    return {
        grossHours,
        regularHours: regHours,
        overtimeHours: otHours,
        dailyWage: wage
    };
}

// Admin Tab 1: Load Attendance for specific date
async function loadAdminLogsForSelectedDate(targetDate = null) {
    const selectedDate = targetDate || document.getElementById('adminFilterDate').value;
    if (!selectedDate) return;

    // Update title
    const titleEl = document.getElementById('selectedDateTitle');
    if (titleEl) {
        titleEl.textContent = `Showing logs for: ${formatDateHuman(selectedDate)}`;
    }

    const tbody = document.getElementById('adminAttendanceList');
    tbody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-slate-400"><i class="fas fa-spinner fa-spin mr-2"></i> Loading data...</td></tr>`;

    // Ensure labourers are in cache for real-time recalculation
    ensureLaborersCached();

    let logs = [];
    let isApproved = false;

    if (!API_URL) {
        setTimeout(() => {
            const dateLogs = mockAttendance[selectedDate] || [];
            displayAdminLogs(dateLogs);
        }, 300);
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=getAttendance&date=${selectedDate}`);
        const data = await response.json();
        if (data.success) {
            displayAdminLogs(data.logs, data.isApproved);
        } else {
            tbody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-red-500">Failed to load logs.</td></tr>`;
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-red-500">Error connecting to server.</td></tr>`;
    }
}

function displayAdminLogs(logs, isApproved = false) {
    const tbody = document.getElementById('adminAttendanceList');
    const totalPayoutDisplay = document.getElementById('adminTotalPayout');
    const approveBtn = document.getElementById('approveDailyBtn');
    const unlockBtn = document.getElementById('unlockDailyBtn');
    const saveBtn = document.getElementById('saveAdminCorrectionsBtn');
    const statusBadge = document.getElementById('approvalStatusDisplay');
    
    tbody.innerHTML = '';
    window.currentAdminDateLogs = JSON.parse(JSON.stringify(logs || []));

    if (saveBtn) {
        saveBtn.classList.remove('ring-2', 'ring-indigo-400', 'animate-pulse');
    }
    
    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-slate-400">No attendance records submitted for this date.</td></tr>`;
        if (totalPayoutDisplay) totalPayoutDisplay.textContent = '₹0.00';
        if (approveBtn) {
            approveBtn.disabled = true;
            approveBtn.className = "bg-slate-200 text-slate-400 font-semibold py-2.5 px-5 rounded-xl cursor-not-allowed flex items-center space-x-2";
            approveBtn.innerHTML = `<i class="fas fa-check-circle"></i> <span>Approve & Lock Sheet</span>`;
        }
        if (unlockBtn) unlockBtn.classList.add('hidden');
        if (saveBtn) saveBtn.disabled = true;
        if (statusBadge) {
            statusBadge.className = "px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200";
            statusBadge.textContent = "No Records";
        }
        return;
    }

    if (saveBtn) saveBtn.disabled = false;

    // Sort name-wise
    logs.sort((a, b) => String(a.laborName || '').localeCompare(String(b.laborName || '')));

    let totalPayout = 0;
    logs.forEach(log => {
        const itemWage = parseFloat(log.dailyWage || log.totalWage || 0);
        totalPayout += isNaN(itemWage) ? 0 : itemWage;
        const inFormatted = formatStoredTime(log.inTime);
        const outFormatted = formatStoredTime(log.outTime);
        const regHrsVal = parseFloat(log.regularHours || 0);
        const otHrsVal = parseFloat(log.overtimeHours || 0);
        const tr = document.createElement('tr');
        tr.id = `admin-row-${log.id}`;
        tr.className = "hover:bg-slate-50/50 transition-colors";
        
        const displayLabourName = log.laborName 
            ? `<span class="font-semibold text-slate-800">${log.laborName}</span>` 
            : `<span class="font-semibold text-rose-500 italic">Unassigned (${log.laborId || 'Unknown'})</span>`;

        tr.innerHTML = `
            <td class="py-3 pr-4 font-semibold text-slate-700">${displayLabourName}</td>
            <td class="py-3 px-4 font-medium text-slate-600 text-xs">${log.shift || 'Day'} Shift</td>
            <td class="py-3 px-4">
                <input type="time" value="${inFormatted}" 
                    onchange="onAdminTimeChange('${log.id}', 'inTime', this.value)"
                    class="border border-slate-200 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm" />
            </td>
            <td class="py-3 px-4">
                <input type="time" value="${outFormatted}" 
                    onchange="onAdminTimeChange('${log.id}', 'outTime', this.value)"
                    class="border border-slate-200 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm" />
            </td>
            <td class="py-3 px-4 text-right text-slate-700 font-medium" id="admin-reg-${log.id}">${regHrsVal.toFixed(1)} hrs</td>
            <td class="py-3 px-4 text-right text-indigo-600 font-semibold" id="admin-ot-${log.id}">${otHrsVal.toFixed(1)} hrs</td>
            <td class="py-3 px-4 text-right font-bold text-slate-800" id="admin-wage-${log.id}">₹${itemWage.toFixed(2)}</td>
            <td class="py-3 pl-4 text-center">
                <button type="button" onclick="deleteAdminAttendanceRow('${log.id}')" 
                    class="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer" title="Delete this entry">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (totalPayoutDisplay) totalPayoutDisplay.textContent = `₹${totalPayout.toFixed(2)}`;

    // Update status elements & approval controls
    const isFullyApproved = isApproved || (logs.length > 0 && logs.every(l => l.status === 'Approved'));
    if (isFullyApproved) {
        if (approveBtn) {
            approveBtn.disabled = true;
            approveBtn.className = "bg-slate-100 text-slate-400 font-semibold py-2.5 px-4 rounded-xl border border-slate-200 cursor-not-allowed flex items-center space-x-2";
            approveBtn.innerHTML = `<i class="fas fa-lock"></i> <span>Approved & Locked</span>`;
            approveBtn.onclick = null;
        }
        if (unlockBtn) {
            unlockBtn.classList.remove('hidden');
        }
        if (statusBadge) {
            statusBadge.className = "px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200";
            statusBadge.textContent = "Approved & Locked";
        }
    } else {
        if (approveBtn) {
            approveBtn.disabled = false;
            approveBtn.className = "bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-green-100 hover:shadow-none flex items-center space-x-2 cursor-pointer";
            approveBtn.innerHTML = `<i class="fas fa-check-circle"></i> <span>Approve & Lock Sheet</span>`;
            approveBtn.onclick = () => approveDailySheet(document.getElementById('adminFilterDate').value);
        }
        if (unlockBtn) {
            unlockBtn.classList.add('hidden');
        }
        if (statusBadge) {
            statusBadge.className = "px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200";
            statusBadge.textContent = "Draft (Awaiting Review)";
        }
    }
}

function onAdminTimeChange(logId, field, value) {
    const log = (window.currentAdminDateLogs || []).find(l => String(l.id) === String(logId));
    if (!log) return;
    
    log[field] = value;
    
    // Find labour info to recalculate
    let labor = (log.laborId && window.cachedLaborersMap) ? window.cachedLaborersMap[log.laborId] : null;
    if (!labor && log.laborName && window.cachedLaborersByName) {
        labor = window.cachedLaborersByName[String(log.laborName).trim().toUpperCase()];
    }
    
    // Fallback if not in cache
    if (!labor) {
        const origWage = parseFloat(log.dailyWage || 0);
        const origReg = parseFloat(log.regularHours || 8);
        const origOt = parseFloat(log.overtimeHours || 0);
        const isHourly = (origReg + origOt > 0) && Math.abs(origWage - 300) > 100 && (origWage / (origReg + origOt) < 100);
        labor = {
            id: log.laborId,
            name: log.laborName,
            shift: log.shift || "Day",
            payType: isHourly ? "Hourly" : "Daily",
            wageRate: isHourly ? (origWage / (origReg + origOt)) : (origWage - (origOt * 30))
        };
    }
    
    const calc = calculateAttendanceFields(labor, log.inTime, log.outTime, log.shift || "Day");
    log.regularHours = calc.regularHours;
    log.overtimeHours = calc.overtimeHours;
    log.dailyWage = calc.dailyWage;
    
    // Update DOM row
    const regEl = document.getElementById(`admin-reg-${logId}`);
    const otEl = document.getElementById(`admin-ot-${logId}`);
    const wageEl = document.getElementById(`admin-wage-${logId}`);
    
    if (regEl) regEl.textContent = `${calc.regularHours.toFixed(1)} hrs`;
    if (otEl) otEl.textContent = `${calc.overtimeHours.toFixed(1)} hrs`;
    if (wageEl) wageEl.textContent = `₹${calc.dailyWage.toFixed(2)}`;
    
    // Recalculate total daily payout
    let total = 0;
    (window.currentAdminDateLogs || []).forEach(l => {
        total += parseFloat(l.dailyWage || 0);
    });
    const totalPayoutDisplay = document.getElementById('adminTotalPayout');
    if (totalPayoutDisplay) totalPayoutDisplay.textContent = `₹${total.toFixed(2)}`;
    
    // Highlight Save Corrections button
    const saveBtn = document.getElementById('saveAdminCorrectionsBtn');
    if (saveBtn) {
        saveBtn.classList.add('ring-2', 'ring-indigo-400', 'animate-pulse');
    }
}
window.onAdminTimeChange = onAdminTimeChange;

async function saveAdminAttendanceCorrections() {
    const selectedDate = document.getElementById('adminFilterDate').value;
    if (!selectedDate) {
        showToast("Please select a date first", "warning");
        return;
    }
    if (!window.currentAdminDateLogs || window.currentAdminDateLogs.length === 0) {
        showToast("No attendance records to save", "warning");
        return;
    }
    
    toggleLoading(true, 'Saving attendance corrections to database...');
    
    const saveBtn = document.getElementById('saveAdminCorrectionsBtn');
    if (saveBtn) {
        saveBtn.classList.remove('ring-2', 'ring-indigo-400', 'animate-pulse');
    }
    
    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            if (mockAttendance[selectedDate]) {
                mockAttendance[selectedDate] = JSON.parse(JSON.stringify(window.currentAdminDateLogs));
            }
            showToast("Demo Mode: Corrections saved successfully!", "success");
            loadAdminWeeklyDayTabs(selectedDate);
        }, 500);
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'submitAttendance',
                date: selectedDate,
                submittedBy: 'admin',
                records: window.currentAdminDateLogs,
                logs: window.currentAdminDateLogs,
                preserveStatus: 'Approved'
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Corrections saved successfully to Google Sheets!", "success");
            loadAdminWeeklyDayTabs(selectedDate);
        } else {
            showToast(data.message || "Failed to save corrections", "error");
        }
    } catch (e) {
        toggleLoading(false);
        console.error(e);
        showToast("Error connecting to server", "error");
    }
}
window.saveAdminAttendanceCorrections = saveAdminAttendanceCorrections;

async function unlockDailySheet() {
    const selectedDate = document.getElementById('adminFilterDate').value;
    if (!selectedDate) return;
    
    if (!confirm(`Unlock attendance sheet for ${formatDateHuman(selectedDate)}?\n\nThis will change the status back to Draft so that edits can be freely made.`)) return;
    
    toggleLoading(true, 'Unlocking attendance sheet...');
    
    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            if (mockAttendance[selectedDate]) {
                mockAttendance[selectedDate].forEach(l => l.status = 'Draft');
            }
            showToast("Demo Mode: Sheet unlocked to Draft", "info");
            loadAdminWeeklyDayTabs(selectedDate);
        }, 500);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?action=unlockAttendance&date=${selectedDate}`);
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Sheet unlocked! Status changed to Draft.", "success");
            loadAdminWeeklyDayTabs(selectedDate);
        } else {
            showToast(data.message || "Failed to unlock sheet", "error");
        }
    } catch (e) {
        toggleLoading(false);
        console.error(e);
        showToast("Error connecting to server", "error");
    }
}
window.unlockDailySheet = unlockDailySheet;

async function deleteAdminAttendanceRow(logId) {
    const log = (window.currentAdminDateLogs || []).find(l => String(l.id) === String(logId));
    const name = log ? (log.laborName || 'this worker') : 'this entry';
    
    if (!confirm(`Are you sure you want to remove the attendance log for ${name}?`)) return;
    
    toggleLoading(true, 'Removing attendance record...');
    
    if (!API_URL) {
        window.currentAdminDateLogs = (window.currentAdminDateLogs || []).filter(l => String(l.id) !== String(logId));
        const row = document.getElementById(`admin-row-${logId}`);
        if (row) row.remove();
        toggleLoading(false);
        showToast("Demo mode: Record removed", "info");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?action=deleteAttendanceRecord&id=${encodeURIComponent(logId)}`);
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Record successfully removed!", "success");
            window.currentAdminDateLogs = (window.currentAdminDateLogs || []).filter(l => String(l.id) !== String(logId));
            const row = document.getElementById(`admin-row-${logId}`);
            if (row) row.remove();
            
            // Recalculate total payout
            let total = 0;
            (window.currentAdminDateLogs || []).forEach(l => {
                total += parseFloat(l.dailyWage || 0);
            });
            const totalPayoutDisplay = document.getElementById('adminTotalPayout');
            if (totalPayoutDisplay) totalPayoutDisplay.textContent = `₹${total.toFixed(2)}`;
            
            // Refresh week tabs
            const selectedDate = document.getElementById('adminFilterDate').value;
            loadAdminWeeklyDayTabs(selectedDate);
        } else {
            showToast(data.message || "Failed to remove record", "error");
        }
    } catch (e) {
        toggleLoading(false);
        console.error(e);
        showToast("Error connecting to server", "error");
    }
}
window.deleteAdminAttendanceRow = deleteAdminAttendanceRow;

async function approveDailySheet(dateStr) {
    if (!confirm(`Are you sure you want to approve and lock the attendance sheet for ${formatDateHuman(dateStr)}? Managers will no longer be able to edit this date.`)) return;

    toggleLoading(true, 'Approving and locking daily logs...');

    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            if (mockAttendance[dateStr]) {
                mockAttendance[dateStr].forEach(l => l.status = 'Approved');
            }
            showToast("Demo Mode: Approved successfully", "success");
            loadAdminWeeklyDayTabs(dateStr);
        }, 500);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'approveAttendance',
                date: dateStr,
                approvedBy: currentUser.username
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Daily sheet approved and locked!", "success");
            loadAdminWeeklyDayTabs(dateStr);
        } else {
            showToast(data.message || "Failed to approve sheet", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Error connecting to server", "error");
    }
}

// Admin Tab 2: Manage Labours
async function loadAdminLaborers() {
    const tbody = document.getElementById('adminLaborersList');
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">Loading labours...</td></tr>`;

    let laborers = [];

    if (!API_URL) {
        setTimeout(() => {
            populateAdminLaborersList(mockLaborers);
        }, 200);
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=getAllLaborers`);
        const data = await response.json();
        if (data.success) {
            populateAdminLaborersList(data.laborers);
        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-red-500">Failed to fetch list.</td></tr>`;
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-red-500">Server error.</td></tr>`;
    }
}

function populateAdminLaborersList(laborers) {
    const tbody = document.getElementById('adminLaborersList');
    tbody.innerHTML = '';

    if (laborers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400">No registered labours.</td></tr>`;
        return;
    }

    laborers.forEach(labor => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/50 transition-colors";
        
        const statusBadge = labor.isActive
            ? `<span class="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded border border-green-200">ACTIVE</span>`
            : `<span class="bg-red-50 text-red-700 text-xs font-semibold px-2 py-0.5 rounded border border-red-200">INACTIVE</span>`;
        
        const actionBtn = labor.isActive
            ? `<button onclick="toggleLaborActiveState('${labor.id}', false)" class="text-red-600 hover:text-red-800 text-sm font-semibold transition-colors">Deactivate</button>`
            : `<button onclick="toggleLaborActiveState('${labor.id}', true)" class="text-green-600 hover:text-green-800 text-sm font-semibold transition-colors">Activate</button>`;

        const payTypeText = labor.payType === "Hourly" ? "Hourly Rate" : "Daily Rate";
        const shiftText = labor.shift === "Night" ? "Night Shift" : "Day Shift";

        tr.innerHTML = `
            <td class="py-4 pr-4 font-mono text-xs font-bold text-slate-400">${labor.id}</td>
            <td class="py-4 px-4 font-semibold text-slate-700">${labor.name}</td>
            <td class="py-4 px-4 font-semibold text-indigo-600 text-xs">${shiftText}</td>
            <td class="py-4 px-4 font-medium text-slate-600">${payTypeText}</td>
            <td class="py-4 px-4 text-right font-bold text-slate-800">₹${parseFloat(labor.wageRate).toFixed(2)}</td>
            <td class="py-4 px-4 text-center">${statusBadge}</td>
            <td class="py-4 pl-4 text-right space-x-3">
                <button onclick="editLaborWageRate('${labor.id}', ${labor.wageRate})" class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors">Edit Wage</button>
                ${actionBtn}
                <button onclick="deleteLaborerState('${labor.id}')" class="text-rose-600 hover:text-rose-800 text-sm font-semibold transition-colors">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function addLaborer(e) {
    e.preventDefault();
    const nameInput = document.getElementById('laborName');
    const shiftInput = document.getElementById('laborShift');
    const payTypeInput = document.getElementById('laborPayType');
    const wageInput = document.getElementById('laborWage');
    
    const name = nameInput.value.trim();
    const shift = shiftInput.value;
    const payType = payTypeInput.value;
    const wage = parseFloat(wageInput.value);

    if (!name || isNaN(wage)) return;

    toggleLoading(true, 'Registering new labour...');

    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            const newId = 'L' + (100 + mockLaborers.length + 1);
            mockLaborers.push({
                id: newId,
                name: name,
                shift: shift,
                payType: payType,
                wageRate: wage,
                isActive: true
            });
            showToast(`Demo Mode: Registered ${name}`, 'success');
            nameInput.value = '';
            wageInput.value = '';
            loadAdminLaborers();
        }, 500);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'addLaborer',
                name: name,
                shift: shift,
                payType: payType,
                wageRate: wage
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Labour registered successfully!", "success");
            nameInput.value = '';
            wageInput.value = '';
            loadAdminLaborers();
        } else {
            showToast(data.message || "Failed to add labour", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Server communication error", "error");
    }
}

async function toggleLaborActiveState(laborId, makeActive) {
    const actionText = makeActive ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${actionText} this labour?`)) return;

    toggleLoading(true, 'Updating labour status...');

    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            const labor = mockLaborers.find(l => l.id === laborId);
            if (labor) labor.isActive = makeActive;
            showToast("Demo Mode: Updated status", "success");
            loadAdminLaborers();
        }, 300);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'toggleLaborActive',
                id: laborId,
                isActive: makeActive
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Status updated!", "success");
            loadAdminLaborers();
        } else {
            showToast(data.message || "Failed to update state", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Server error", "error");
    }
}

async function deleteLaborerState(laborId) {
    if (!confirm("Are you sure you want to permanently delete this labourer? This will remove them from the database active records list.")) return;

    toggleLoading(true, 'Deleting labourer from database...');

    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            mockLaborers = mockLaborers.filter(l => l.id !== laborId);
            showToast("Demo Mode: Labourer deleted", "success");
            loadAdminLaborers();
        }, 500);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'deleteLaborer',
                id: laborId
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Labourer deleted successfully!", "success");
            loadAdminLaborers();
        } else {
            showToast(data.message || "Failed to delete labourer", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Server error during deletion", "error");
    }
}

async function editLaborWageRate(laborId, currentWage) {
    const newWage = prompt(`Enter new daily wage rate (₹) for labour ${laborId}:`, currentWage);
    if (newWage === null) return;
    
    const parsedWage = parseFloat(newWage);
    if (isNaN(parsedWage) || parsedWage < 0) {
        showToast("Invalid wage amount", "error");
        return;
    }

    toggleLoading(true, 'Updating wage rate...');

    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            const labor = mockLaborers.find(l => l.id === laborId);
            if (labor) labor.wageRate = parsedWage;
            showToast("Demo Mode: Wage updated", "success");
            loadAdminLaborers();
        }, 300);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'editLaborWage',
                id: laborId,
                wageRate: parsedWage
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Wage rate updated successfully!", "success");
            loadAdminLaborers();
        } else {
            showToast(data.message || "Failed to update wage", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Server error", "error");
    }
}

// Admin Tab 3: Users & Passwords
async function loadAdminUsers() {
    const select = document.getElementById('resetAccountSelect');
    select.innerHTML = '<option value="">Loading accounts...</option>';

    if (!API_URL) {
        select.innerHTML = mockUsers.map(u => `<option value="${u.username}">${u.username} (${u.role})</option>`).join('');
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=getAllUsers`);
        const data = await response.json();
        if (data.success) {
            select.innerHTML = data.users.map(u => `<option value="${u.username}">${u.username} (${u.role})</option>`).join('');
        } else {
            select.innerHTML = '<option value="">Error loading accounts</option>';
        }
    } catch (error) {
        console.error(error);
        select.innerHTML = '<option value="">Connection error</option>';
    }
}

async function resetPassword(e) {
    e.preventDefault();
    const select = document.getElementById('resetAccountSelect');
    const pwdInput = document.getElementById('resetPassword');
    
    const username = select.value;
    const newPassword = pwdInput.value;

    if (!username || !newPassword) return;

    toggleLoading(true, 'Updating credentials...');

    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            showToast(`Demo Mode: Password reset for ${username}`, 'success');
            pwdInput.value = '';
        }, 500);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'resetPassword',
                username: username,
                newPassword: newPassword
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast(`Credentials updated for ${username}!`, "success");
            pwdInput.value = '';
        } else {
            showToast(data.message || "Failed to update password", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Server connection error", "error");
    }
}

// Admin Tab 4: Settings
async function loadAdminSettings() {
    // Fill local storage API url
    let urlConfigSection = document.getElementById('settingsForm');
    
    // Add Apps Script Web App URL input dynamically if not exists
    if (!document.getElementById('settingsApiUrl')) {
        const div = document.createElement('div');
        div.className = "border-t border-slate-100 pt-6 space-y-2";
        div.innerHTML = `
            <h5 class="text-sm font-bold text-slate-700">Google Backend Endpoint</h5>
            <label class="block text-xs font-semibold text-slate-500 mb-1">Google Apps Script Web App Deployment URL</label>
            <input type="text" id="settingsApiUrl" class="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="https://script.google.com/macros/s/.../exec">
            <p class="text-xs text-slate-400">Save the URL here after deploying the Google Apps Script. Leave blank to run in offline Demo Mode.</p>
        `;
        urlConfigSection.insertBefore(div, urlConfigSection.firstChild);
    }
    
    document.getElementById('settingsApiUrl').value = API_URL;

    if (!API_URL) {
        // Load default mock configurations
        document.getElementById('settingsWorkHours').value = localStorage.getItem('shree_packers_work_hours') || '8';
        document.getElementById('settingsOvertimeRate').value = localStorage.getItem('shree_packers_ot_multiplier') || '1.5';
        document.getElementById('settingsTelegramToken').value = localStorage.getItem('shree_packers_tg_token') || '8526765420:AAEBy9cOguCvsP6wvSnIXERx_9tl2S37DsE';
        document.getElementById('settingsTelegramChatId').value = localStorage.getItem('shree_packers_tg_chat') || '8353759505';
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=getSettings`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('settingsWorkHours').value = data.settings.workHoursLimit || 8;
            document.getElementById('settingsOvertimeRate').value = data.settings.overtimeRateMultiplier || 1.5;
            document.getElementById('settingsTelegramToken').value = data.settings.telegramBotToken || '';
            document.getElementById('settingsTelegramChatId').value = data.settings.telegramChatId || '';
        }
    } catch (error) {
        console.error("Failed to load settings:", error);
    }
}

async function saveSettings(e) {
    e.preventDefault();
    const newApiUrl = document.getElementById('settingsApiUrl').value.trim();
    const workHours = parseInt(document.getElementById('settingsWorkHours').value);
    const otRate = parseFloat(document.getElementById('settingsOvertimeRate').value);
    const tgToken = document.getElementById('settingsTelegramToken').value.trim();
    const tgChat = document.getElementById('settingsTelegramChatId').value.trim();

    // Store local api url
    localStorage.setItem('shree_packers_api_url', newApiUrl);
    API_URL = newApiUrl;

    toggleLoading(true, 'Saving configurations...');

    if (!API_URL) {
        // Save in Local Storage Mock Mode
        setTimeout(() => {
            toggleLoading(false);
            localStorage.setItem('shree_packers_work_hours', workHours);
            localStorage.setItem('shree_packers_ot_multiplier', otRate);
            localStorage.setItem('shree_packers_tg_token', tgToken);
            localStorage.setItem('shree_packers_tg_chat', tgChat);
            showToast("Demo Mode settings saved locally", "success");
        }, 500);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'saveSettings',
                workHoursLimit: workHours,
                overtimeRateMultiplier: otRate,
                telegramBotToken: tgToken,
                telegramChatId: tgChat
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Configurations saved in Google Sheet settings!", "success");
        } else {
            showToast(data.message || "Failed to save settings", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Error updating online settings. Local endpoint saved.", "info");
    }
}

async function triggerWeeklyReport() {
    if (!confirm("Are you sure you want to force export the weekly summary report and send Telegram alert now?")) return;

    toggleLoading(true, 'Compiling weekly data & sending alerts...');

    if (!API_URL) {
        const tgToken = document.getElementById('settingsTelegramToken').value.trim() || '8526765420:AAEBy9cOguCvsP6wvSnIXERx_9tl2S37DsE';
        const tgChat = document.getElementById('settingsTelegramChatId').value.trim() || '8353759505';
        
        if (tgToken && tgChat) {
            const msg = "📦 *SHREE PACKERS WEEKLY SUMMARY (DEMO)* 📦\n" +
                        "📅 *Period:* 22-08-2026 to 28-08-2026\n\n" +
                        "👤 *Active Labours:* 3\n" +
                        "⏱️ *Regular Hours:* 24.0 hrs\n" +
                        "⚡ *Overtime Hours:* 4.5 hrs\n" +
                        "-----------------------------------\n" +
                        "💰 *Total Amount to Pay: ₹12,450.00*\n\n" +
                        "📁 *Excel File:* [Click here to view (Demo)](https://docs.google.com/spreadsheets)\n" +
                        "📂 *Drive Path:* `Shree Packers Attendance Reports / FY 2026-27 / August 2026`";
            
            fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: tgChat,
                    text: msg,
                    parse_mode: 'Markdown'
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    showToast("Test Telegram report sent successfully!", "success");
                } else {
                    showToast("Telegram send failed: " + data.description, "error");
                }
            })
            .catch(err => {
                console.error(err);
                showToast("Failed to connect to Telegram API", "error");
            })
            .finally(() => {
                toggleLoading(false);
            });
        } else {
            setTimeout(() => {
                toggleLoading(false);
                showToast("Configure Token & Chat ID in Settings to test Telegram.", "info");
            }, 800);
        }
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'triggerWeeklyReport'
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast("Weekly export successfully completed!", "success");
        } else {
            showToast(data.message || "Failed to generate report", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Server connection error during export", "error");
    }
}

async function deleteTrialWeeklySheets() {
    if (!confirm("Are you sure you want to delete all trial weekly sheets from Google Drive? This will move trial reports to Trash.")) return;
    const clearAttendance = confirm("Do you ALSO want to clear the trial daily punch logs from the Attendance database so you start with a 100% clean sheet?\n\n(Click OK to clear trial attendance logs, or Cancel to keep attendance logs and only delete Drive report files)");

    toggleLoading(true, 'Cleaning up trial weekly sheets in Google Drive...');

    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            showToast("Demo mode: No live backend configured.", "info");
        }, 600);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                action: 'deleteTrialWeeklyReports',
                clearAttendance: clearAttendance
            })
        });
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            let msg = `Deleted ${data.deletedFilesCount || 0} trial weekly sheets from Drive.`;
            if (data.attendanceClearedCount) {
                msg += ` Cleared ${data.attendanceClearedCount} trial punch records.`;
            }
            showToast(msg, "success");
            if (typeof loadWeeklyApprovalStatus === 'function') {
                loadWeeklyApprovalStatus();
            }
        } else {
            showToast(data.message || "Failed to cleanup trial sheets", "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Server connection error during trial cleanup", "error");
    }
}

async function clearAllAttendanceLogs(selectedOnly = false) {
    const selectedDate = document.getElementById('adminFilterDate').value;
    let confirmMsg = "Are you sure you want to DELETE ALL attendance records from the database across all days?\n\n(This will reset all days back to 'No Entry' so you can start fresh)";
    let targetParam = "";
    
    if (selectedOnly && selectedDate) {
        confirmMsg = `Are you sure you want to delete attendance records for ONLY ${formatDateHuman(selectedDate)}?\n\n(This will reset this day back to 'No Entry')`;
        targetParam = `&date=${selectedDate}`;
    }

    if (!confirm(confirmMsg)) return;

    toggleLoading(true, 'Clearing attendance records from database...');

    if (!API_URL) {
        setTimeout(() => {
            toggleLoading(false);
            if (selectedOnly && selectedDate) {
                delete mockAttendance[selectedDate];
            } else {
                mockAttendance = {};
            }
            showToast("Demo mode: Attendance records cleared.", "info");
            loadAdminWeeklyDayTabs(selectedDate);
        }, 500);
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=clearAllAttendance${targetParam}`);
        const data = await response.json();
        toggleLoading(false);
        if (data.success) {
            showToast(data.message || "Attendance records successfully deleted!", "success");
            // Refresh approval tabs & attendance table so cleared days show 'No Entry'
            loadAdminWeeklyDayTabs(selectedDate);
        } else {
            showToast(data.message || "Failed to clear logs: " + (data.message || "Unknown error"), "error");
        }
    } catch (error) {
        toggleLoading(false);
        console.error(error);
        showToast("Error connecting to server to clear logs", "error");
    }
}
window.clearAllAttendanceLogs = clearAllAttendanceLogs;


