// EXCEL BAZLI VERİLER
const EXCEL_SALARIES = {
    '2026-04': 63300, '2026-05': 60900, '2026-06': 65000, '2026-07': 60000,
    '2026-08': 56000, '2026-09': 57000, '2026-10': 57000, '2026-11': 57000,
    '2026-12': 57000, '2027-01': 57000
};

const EXCEL_FIXED_EXPENSES = [
    { name: 'BES', amount: 1000, day: 4 }, { name: 'Ulaşım Toplam', amount: 5625, day: 4 },
    { name: 'Telefon', amount: 600, day: 4 }, { name: 'Adobe', amount: 600, day: 11 },
    { name: 'Youtube', amount: 100, day: 17 }, { name: 'iCloud', amount: 400, day: 27 },
    { name: 'Harçlık', amount: 1675, day: 4 }
];

const EXCEL_CREDITS = [
    { month: '2026-07', amount: 28895, name: '1. Taksit', day: 22 }, { month: '2026-08', amount: 28895, name: '2. Taksit', day: 22 },
    { month: '2026-09', amount: 28895, name: '3. Taksit', day: 22 }, { month: '2026-10', amount: 28895, name: '4. Taksit', day: 22 },
    { month: '2026-11', amount: 28895, name: '5. Taksit', day: 22 }, { month: '2026-12', amount: 28895, name: '6. Taksit', day: 22 },
    { month: '2027-01', amount: 28895, name: '7. Taksit', day: 22 }, { month: '2027-02', amount: 28895, name: '8. Taksit', day: 22 },
    { month: '2027-03', amount: 28895, name: '9. Taksit', day: 22 }, { month: '2027-04', amount: 28895, name: '10. Taksit', day: 22 },
    { month: '2027-05', amount: 28895, name: '11. Taksit', day: 22 }, { month: '2027-06', amount: 28895, name: '12. Taksit', day: 22 }
];

// VERİTABANI
const db = {
    expenses: JSON.parse(localStorage.getItem('fa_expenses')) || [],
    salaries: JSON.parse(localStorage.getItem('fa_salaries')) || generateDefaultSalaries(),
    payments: JSON.parse(localStorage.getItem('fa_payments')) || [],
    settings: JSON.parse(localStorage.getItem('fa_settings')) || { salaryHidden: false }
};

function saveDb() {
    localStorage.setItem('fa_expenses', JSON.stringify(db.expenses));
    localStorage.setItem('fa_salaries', JSON.stringify(db.salaries));
    localStorage.setItem('fa_payments', JSON.stringify(db.payments));
    localStorage.setItem('fa_settings', JSON.stringify(db.settings));
}

function getLogTime() {
    const now = new Date();
    return `${now.toLocaleDateString('tr-TR')} - ${now.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}`;
}

function startLiveClock() {
    setInterval(() => {
        const now = new Date();
        const options = { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        document.getElementById('live-clock').innerText = now.toLocaleString('tr-TR', options).toUpperCase();
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    startLiveClock();
    syncAutoPayments();
    populateMonthSelectors();
    renderDashboard();
});

function generateDefaultSalaries() {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    let defaults = [];
    ['2026', '2027'].forEach(year => {
        months.forEach((m, i) => {
            let id = `${year}-${String(i + 1).padStart(2, '0')}`;
            defaults.push({ id, label: `${m} ${year}`, estimated: EXCEL_SALARIES[id] || null, actual: null, extra: null });
        });
    });
    return defaults;
}

function syncAutoPayments() {
    db.salaries.forEach(s => {
        if (s.extra === undefined) s.extra = null;
        const month = s.id;
        
        const hasFixed = db.payments.some(p => p.month === month && p.type === 'fixed');
        if (!hasFixed) {
            EXCEL_FIXED_EXPENSES.forEach(f => {
                db.payments.push({ id: Date.now() + Math.random(), month, name: f.name, amount: f.amount, day: f.day, type: 'fixed', paid: false });
            });
        }
        
        const creditData = EXCEL_CREDITS.find(c => c.month === month);
        if (creditData) {
            const hasCredit = db.payments.some(p => p.month === month && p.type === 'credit');
            if (!hasCredit) {
                db.payments.push({ id: Date.now() + Math.random(), month, name: creditData.name, amount: creditData.amount, day: creditData.day, type: 'credit', paid: false });
            }
        }
    });
    saveDb();
}

function populateMonthSelectors() {
    const selects = ['dash-month-select', 'exp-month-select', 'pay-month-select', 'cal-month-select'];
    const defaultMonth = '2026-07'; 
    selects.forEach(selId => {
        const el = document.getElementById(selId);
        if(!el) return;
        el.innerHTML = '';
        db.salaries.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.text = s.label;
            if(s.id === defaultMonth) opt.selected = true;
            el.appendChild(opt);
        });
    });
}

// ---- DASHBOARD ----
function renderDashboard() {
    const selectedMonth = document.getElementById('dash-month-select').value;
    const salaryObj = db.salaries.find(s => s.id === selectedMonth);
    
    const baseSalary = salaryObj ? (salaryObj.actual || salaryObj.estimated || 0) : 0;
    const extraIncome = salaryObj ? (salaryObj.extra || 0) : 0;
    const totalIncome = baseSalary + extraIncome;
    
    const monthPayments = db.payments.filter(p => p.month === selectedMonth);
    const fixedTotal = monthPayments.filter(p => p.type === 'fixed').reduce((a, b) => a + b.amount, 0);
    const creditTotal = monthPayments.filter(p => p.type === 'credit').reduce((a, b) => a + b.amount, 0);
    const expenseTotal = db.expenses.filter(e => e.month === selectedMonth).reduce((a, b) => a + b.amount, 0);

    const net = totalIncome - fixedTotal - creditTotal - expenseTotal;

    document.getElementById('dash-salary').innerText = totalIncome.toLocaleString('tr-TR') + ' TL';
    document.getElementById('dash-fixed').innerText = '-' + fixedTotal.toLocaleString('tr-TR') + ' TL';
    document.getElementById('dash-credit').innerText = '-' + creditTotal.toLocaleString('tr-TR') + ' TL';
    document.getElementById('dash-expense').innerText = '-' + expenseTotal.toLocaleString('tr-TR') + ' TL';
    
    const netEl = document.getElementById('dash-net');
    netEl.innerText = net.toLocaleString('tr-TR') + ' TL';
    netEl.className = net >= 0 ? 'neon-text-green' : 'neon-text-red';
}

function toggleDashDetails() {
    document.getElementById('dash-details').classList.toggle('hidden');
}

// ---- NAVİGASYON ----
function openScreen(screenId, title) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById('back-btn').classList.remove('hidden');
    document.getElementById('page-title').innerText = title;
    
    if(screenId === 'screen-expense') renderExpenses();
    if(screenId === 'screen-payments') renderPayments();
    if(screenId === 'screen-salary') renderSalaries();
    if(screenId === 'screen-calendar') renderCalendar();
}

function goHome() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-home').classList.remove('hidden');
    document.getElementById('back-btn').classList.add('hidden');
    document.getElementById('page-title').innerText = "Finans Ajandam";
    renderDashboard();
}

// ---- HARCAMA ----
function addExpense() {
    const month = document.getElementById('exp-month-select').value;
    const amount = Number(document.getElementById('exp-amount').value);
    const category = document.getElementById('exp-category').value;
    const desc = document.getElementById('exp-desc').value;

    if(!amount) return;
    db.expenses.push({ id: Date.now(), month, amount, category, desc, log: getLogTime() });
    saveDb();
    document.getElementById('exp-amount').value = ''; document.getElementById('exp-desc').value = '';
    renderExpenses();
}

function renderExpenses() {
    const month = document.getElementById('exp-month-select').value;
    const list = document.getElementById('expense-list');
    list.innerHTML = '';
    let total = 0;
    db.expenses.filter(e => e.month === month).reverse().forEach(exp => {
        total += exp.amount;
        list.innerHTML += `<li>
            <div class="item-left"><strong>${exp.category} ${exp.desc ? '- ' + exp.desc : ''}</strong><span class="item-log">${exp.log}</span></div>
            <div class="item-right neon-text-red item-amount">-${exp.amount} TL</div>
        </li>`;
    });
    document.getElementById('monthly-total-expense').innerText = total.toLocaleString('tr-TR');
}

// ---- SABİT & KREDİ (DÜZENLEME DESTEKLİ) ----
function renderPayments() {
    const month = document.getElementById('pay-month-select').value;
    const monthData = db.payments.filter(p => p.month === month);
    
    // Sabit Listesi
    const fixedList = document.getElementById('fixed-list'); fixedList.innerHTML = ''; let fTotal = 0;
    monthData.filter(p => p.type === 'fixed').forEach(item => {
        fTotal += item.amount;
        fixedList.innerHTML += `<li>
            <div class="item-left"><strong>${item.name}</strong><span class="item-log">Gün: ${item.day || '-'} | ${item.amount.toLocaleString('tr-TR')} TL</span></div>
            <div class="payment-actions">
                <button class="status-badge ${item.paid ? 'paid' : 'unpaid'}" onclick="togglePayment('${item.id}')">${item.paid ? 'ÖDENDİ' : 'ÖDENMEDİ'}</button>
                <button class="action-icon btn-edit" onclick="openEditModal('${item.id}')">✏️</button>
                <button class="action-icon btn-delete" onclick="deletePayment('${item.id}')">X</button>
            </div>
        </li>`;
    });
    document.getElementById('total-fixed-val').innerText = fTotal.toLocaleString('tr-TR');

    // Kredi Listesi
    const creditList = document.getElementById('credit-list'); creditList.innerHTML = ''; let cTotal = 0;
    monthData.filter(p => p.type === 'credit').forEach(item => {
        cTotal += item.amount;
        creditList.innerHTML += `<li>
            <div class="item-left"><strong>${item.name}</strong><span class="item-log">Gün: ${item.day || '-'} | ${item.amount.toLocaleString('tr-TR')} TL</span></div>
            <div class="payment-actions">
                <button class="status-badge ${item.paid ? 'paid' : 'unpaid'}" onclick="togglePayment('${item.id}')">${item.paid ? 'ÖDENDİ' : 'ÖDENMEDİ'}</button>
                <button class="action-icon btn-edit" onclick="openEditModal('${item.id}')">✏️</button>
                <button class="action-icon btn-delete" onclick="deletePayment('${item.id}')">X</button>
            </div>
        </li>`;
    });
    document.getElementById('total-credit-val').innerText = cTotal.toLocaleString('tr-TR');
}

function togglePayment(id) {
    const item = db.payments.find(p => p.id == id);
    if(item) { item.paid = !item.paid; saveDb(); renderPayments(); }
}

function deletePayment(id) {
    db.payments = db.payments.filter(p => p.id != id);
    saveDb(); renderPayments();
}

function addFixedPayment() {
    const month = document.getElementById('pay-month-select').value;
    const name = document.getElementById('new-fixed-name').value;
    const amount = Number(document.getElementById('new-fixed-amount').value);
    const day = Number(document.getElementById('new-fixed-day').value) || 1;
    
    if(!name || !amount) return;
    db.payments.push({ id: Date.now().toString(), month, name, amount, day, type: 'fixed', paid: false });
    saveDb();
    document.getElementById('new-fixed-name').value = ''; document.getElementById('new-fixed-amount').value = ''; document.getElementById('new-fixed-day').value = '';
    renderPayments();
}

// -- MODAL İŞLEMLERİ --
function openEditModal(id) {
    const item = db.payments.find(p => p.id == id);
    if(!item) return;
    
    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-amount').value = item.amount;
    document.getElementById('edit-day').value = item.day || '';
    
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const item = db.payments.find(p => p.id == id);
    if(item) {
        item.name = document.getElementById('edit-name').value;
        item.amount = Number(document.getElementById('edit-amount').value);
        item.day = Number(document.getElementById('edit-day').value) || 1;
        saveDb();
        renderPayments();
        closeEditModal();
    }
}

// ---- MAAŞ & EK GELİR ----
function renderSalaries() {
    const list = document.getElementById('salary-list'); list.innerHTML = '';
    const isHidden = db.settings.salaryHidden;

    db.salaries.forEach(s => {
        const activeStatus = s.actual ? '<span class="badge gercek">GERÇEK</span>' : '<span class="badge tahmini">TAHMİNİ</span>';
        list.innerHTML += `
            <div class="salary-item">
                <div class="salary-header"><span>${s.label}</span>${activeStatus}</div>
                <div class="salary-inputs">
                    <div class="salary-input-group">
                        <label>Tahmini Maaş</label>
                        <input type="number" class="${isHidden ? 'blur-active' : ''}" value="${s.estimated || ''}" onchange="updateSalary('${s.id}', 'estimated', this.value)">
                    </div>
                    <div class="salary-input-group">
                        <label>Gerçek Yatan</label>
                        <input type="number" class="${isHidden ? 'blur-active' : ''}" value="${s.actual || ''}" onchange="updateSalary('${s.id}', 'actual', this.value)">
                    </div>
                    <div class="salary-input-group">
                        <label class="neon-text-green">Ek Gelir (+)</label>
                        <input type="number" class="${isHidden ? 'blur-active' : ''}" value="${s.extra || ''}" onchange="updateSalary('${s.id}', 'extra', this.value)">
                    </div>
                </div>
            </div>`;
    });
}

function updateSalary(id, field, value) {
    const index = db.salaries.findIndex(s => s.id === id);
    if(index !== -1) { db.salaries[index][field] = value ? Number(value) : null; saveDb(); renderSalaries(); }
}

function toggleVisibility(type) {
    if(type === 'salary') { db.settings.salaryHidden = !db.settings.salaryHidden; saveDb(); renderSalaries(); }
}

// ---- GÖRSEL TAKVİM VE ZAMAN ÇİZELGESİ ----
function renderCalendar() {
    const monthStr = document.getElementById('cal-month-select').value;
    const [year, month] = monthStr.split('-');
    
    // Gelen/Giden Verilerini Toparla
    const salaryObj = db.salaries.find(s => s.id === monthStr);
    const totalIncome = salaryObj ? ((salaryObj.actual || salaryObj.estimated || 0) + (salaryObj.extra || 0)) : 0;
    const incomeDay = totalIncome > 0 ? 4 : -1; // Maaş 4'ünde varsayılıyor
    const monthPayments = db.payments.filter(p => p.month === monthStr);

    // 1. Görsel Grid Takvimi Çiz
    const calContainer = document.getElementById('visual-calendar');
    const daysInMonth = new Date(year, month, 0).getDate();
    let startDay = new Date(year, month - 1, 1).getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Pazartesi = 0

    let calHtml = `
        <div class="cal-header">Pzt</div><div class="cal-header">Sal</div><div class="cal-header">Çar</div>
        <div class="cal-header">Per</div><div class="cal-header">Cum</div><div class="cal-header">Cmt</div><div class="cal-header">Paz</div>
    `;

    for(let i=0; i<startDay; i++) { calHtml += `<div class="cal-day empty"></div>`; }

    for(let i=1; i<=daysInMonth; i++) {
        let classes = ['cal-day'];
        let hasIncome = (i === incomeDay);
        let hasExpense = monthPayments.some(p => p.day === i);

        if(hasIncome && hasExpense) classes.push('mixed');
        else if(hasIncome) classes.push('income');
        else if(hasExpense) classes.push('expense');

        calHtml += `<div class="${classes.join(' ')}">${i}</div>`;
    }
    calContainer.innerHTML = calHtml;

    // 2. Timeline (Zaman Çizelgesi) Çiz
    const timeContainer = document.getElementById('timeline-container');
    timeContainer.innerHTML = '';
    let events = [];

    if (totalIncome > 0) {
        events.push({ day: 4, name: 'Maaş & Ek Gelir', amount: totalIncome, type: 'income', paid: true });
    }

    monthPayments.forEach(p => {
        events.push({ day: p.day || 1, name: p.name, amount: p.amount, type: 'expense', paid: p.paid });
    });

    events.sort((a, b) => a.day - b.day);

    if(events.length === 0) {
        timeContainer.innerHTML = `<p class="text-white">Bu ay için planlanmış işlem yok.</p>`;
        return;
    }

    events.forEach(ev => {
        let dotClass = 'timeline-dot';
        let textClass = '';
        let amountPrefix = '';

        if (ev.type === 'income') {
            dotClass += ' green';
            textClass = 'neon-text-green';
            amountPrefix = '+';
        } else {
            if (ev.paid) { dotClass += ' green'; textClass = 'text-white'; } 
            else { dotClass += ' red'; textClass = 'neon-text-red'; }
            amountPrefix = '-';
        }

        timeContainer.innerHTML += `
            <div class="timeline-item">
                <div class="${dotClass}"></div>
                <span class="time-date">Ayın ${ev.day}'ü</span>
                <div class="time-content">
                    <span style="color:#fff;">${ev.name}</span>
                    <span class="${textClass}">${amountPrefix}${ev.amount.toLocaleString('tr-TR')} TL</span>
                </div>
            </div>
        `;
    });
}