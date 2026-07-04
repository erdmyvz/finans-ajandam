// EXCEL BAZLI TAHMİNİ MAAŞLAR (Nisan 2026 - Ocak 2027)
const EXCEL_SALARIES = {
    '2026-04': 63300, '2026-05': 60900, '2026-06': 65000, '2026-07': 60000,
    '2026-08': 56000, '2026-09': 57000, '2026-10': 57000, '2026-11': 57000,
    '2026-12': 57000, '2027-01': 57000
};

// EXCEL BAZLI DETAYLI SABİT GİDERLER (Toplam 10.000)
const EXCEL_FIXED_EXPENSES = [
    { name: 'BES', amount: 1000 },
    { name: 'Ulaşım - Kocaeli', amount: 1125 },
    { name: 'Ulaşım - İstanbul', amount: 4500 },
    { name: 'Telefon', amount: 600 },
    { name: 'Adobe', amount: 600 },
    { name: 'Youtube', amount: 100 },
    { name: 'iCloud', amount: 400 },
    { name: 'Harçlık', amount: 1675 }
];

const EXCEL_CREDITS = [
    { month: '2026-07', amount: 28895, name: '1. Taksit' }, { month: '2026-08', amount: 28895, name: '2. Taksit' },
    { month: '2026-09', amount: 28895, name: '3. Taksit' }, { month: '2026-10', amount: 28895, name: '4. Taksit' },
    { month: '2026-11', amount: 28895, name: '5. Taksit' }, { month: '2026-12', amount: 28895, name: '6. Taksit' },
    { month: '2027-01', amount: 28895, name: '7. Taksit' }, { month: '2027-02', amount: 28895, name: '8. Taksit' },
    { month: '2027-03', amount: 28895, name: '9. Taksit' }, { month: '2027-04', amount: 28895, name: '10. Taksit' },
    { month: '2027-05', amount: 28895, name: '11. Taksit' }, { month: '2027-06', amount: 28895, name: '12. Taksit' }
];

const EXCEL_INITIAL_STATUS = [
    { name: 'Eren (Altın/Nakit)', balance: 275712, log: 'Excel Başlangıç' },
    { name: 'Nakit (Cepteki)', balance: 93240, log: 'Excel Başlangıç' },
    { name: 'Banka', balance: 10000, log: 'Excel Başlangıç' }
];

// UYGULAMA VERİ TABANI
const db = {
    expenses: JSON.parse(localStorage.getItem('fa_expenses')) || [],
    salaries: JSON.parse(localStorage.getItem('fa_salaries')) || generateDefaultSalaries(),
    payments: JSON.parse(localStorage.getItem('fa_payments')) || [],
    status: JSON.parse(localStorage.getItem('fa_status')) || EXCEL_INITIAL_STATUS,
    investments: JSON.parse(localStorage.getItem('fa_investments')) || [],
    settings: JSON.parse(localStorage.getItem('fa_settings')) || { salaryHidden: false, statusHidden: true }
};

function saveDb() {
    localStorage.setItem('fa_expenses', JSON.stringify(db.expenses));
    localStorage.setItem('fa_salaries', JSON.stringify(db.salaries));
    localStorage.setItem('fa_payments', JSON.stringify(db.payments));
    localStorage.setItem('fa_status', JSON.stringify(db.status));
    localStorage.setItem('fa_investments', JSON.stringify(db.investments));
    localStorage.setItem('fa_settings', JSON.stringify(db.settings));
}

function getLogTime() {
    const now = new Date();
    return `${now.toLocaleDateString('tr-TR')} - ${now.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}`;
}

document.addEventListener('DOMContentLoaded', () => {
    syncAutoPayments();
    populateMonthSelectors();
    renderDashboard();
});

// AYLARI VE EXCEL MAAŞLARINI OLUŞTUR
function generateDefaultSalaries() {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    let defaults = [];
    ['2026', '2027'].forEach(year => {
        months.forEach((m, i) => {
            let id = `${year}-${String(i + 1).padStart(2, '0')}`;
            defaults.push({ id, label: `${m} ${year}`, estimated: EXCEL_SALARIES[id] || null, actual: null });
        });
    });
    return defaults;
}

// OTOMATİK SABİT VE KREDİ YÜKLEMESİ
function syncAutoPayments() {
    db.salaries.forEach(s => {
        const month = s.id;
        const hasFixed = db.payments.some(p => p.month === month && p.type === 'fixed');
        if (!hasFixed) {
            EXCEL_FIXED_EXPENSES.forEach(f => {
                db.payments.push({ id: Date.now() + Math.random(), month, name: f.name, amount: f.amount, type: 'fixed', paid: false });
            });
        }
        
        const creditData = EXCEL_CREDITS.find(c => c.month === month);
        if (creditData) {
            const hasCredit = db.payments.some(p => p.month === month && p.type === 'credit');
            if (!hasCredit) {
                db.payments.push({ id: Date.now() + Math.random(), month, name: creditData.name, amount: creditData.amount, type: 'credit', paid: false });
            }
        }
    });
    saveDb();
}

function populateMonthSelectors() {
    const selects = ['dash-month-select', 'exp-month-select', 'pay-month-select'];
    const defaultMonth = '2026-07'; // Başlangıç ayı Excel'e göre Temmuz 2026
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

// ---- DASHBOARD (ANA EKRAN) ----
function renderDashboard() {
    const selectedMonth = document.getElementById('dash-month-select').value;
    const salaryObj = db.salaries.find(s => s.id === selectedMonth);
    const salary = salaryObj ? (salaryObj.actual || salaryObj.estimated || 0) : 0;
    
    const monthPayments = db.payments.filter(p => p.month === selectedMonth);
    const fixedTotal = monthPayments.filter(p => p.type === 'fixed').reduce((a, b) => a + b.amount, 0);
    const creditTotal = monthPayments.filter(p => p.type === 'credit').reduce((a, b) => a + b.amount, 0);
    const expenseTotal = db.expenses.filter(e => e.month === selectedMonth).reduce((a, b) => a + b.amount, 0);

    const net = salary - fixedTotal - creditTotal - expenseTotal;

    document.getElementById('dash-salary').innerText = salary.toLocaleString('tr-TR') + ' TL';
    document.getElementById('dash-fixed').innerText = '-' + fixedTotal.toLocaleString('tr-TR') + ' TL';
    document.getElementById('dash-credit').innerText = '-' + creditTotal.toLocaleString('tr-TR') + ' TL';
    document.getElementById('dash-expense').innerText = '-' + expenseTotal.toLocaleString('tr-TR') + ' TL';
    
    const netEl = document.getElementById('dash-net');
    netEl.innerText = net.toLocaleString('tr-TR') + ' TL';
    netEl.className = net >= 0 ? 'text-success' : 'text-danger';
}

function toggleDashDetails() {
    const details = document.getElementById('dash-details');
    details.classList.toggle('hidden');
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
    if(screenId === 'screen-status') renderStatus();
    if(screenId === 'screen-investment') renderInvestments();
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
            <div class="item-right text-danger item-amount">-${exp.amount} TL</div>
        </li>`;
    });
    document.getElementById('monthly-total-expense').innerText = total.toLocaleString('tr-TR');
}

// ---- SABİT & KREDİ (Düzenlenebilir) ----
function renderPayments() {
    const month = document.getElementById('pay-month-select').value;
    const monthData = db.payments.filter(p => p.month === month);
    
    // Sabit Gider Listesi
    const fixedList = document.getElementById('fixed-list');
    fixedList.innerHTML = '';
    let fTotal = 0;
    monthData.filter(p => p.type === 'fixed').forEach(item => {
        fTotal += item.amount;
        fixedList.innerHTML += `<li>
            <div class="item-left"><strong>${item.name}</strong><span class="item-log">${item.amount.toLocaleString('tr-TR')} TL</span></div>
            <div class="payment-actions">
                <button class="status-badge ${item.paid ? 'paid' : 'unpaid'}" onclick="togglePayment('${item.id}')">${item.paid ? 'Ödendi' : 'Ödenmedi'}</button>
                <button class="btn-delete" onclick="deletePayment('${item.id}')">X</button>
            </div>
        </li>`;
    });
    document.getElementById('total-fixed-val').innerText = fTotal.toLocaleString('tr-TR');

    // Kredi Listesi
    const creditList = document.getElementById('credit-list');
    creditList.innerHTML = '';
    let cTotal = 0;
    monthData.filter(p => p.type === 'credit').forEach(item => {
        cTotal += item.amount;
        creditList.innerHTML += `<li>
            <div class="item-left"><strong>${item.name}</strong><span class="item-log">${item.amount.toLocaleString('tr-TR')} TL</span></div>
            <div class="payment-actions">
                <button class="status-badge ${item.paid ? 'paid' : 'unpaid'}" onclick="togglePayment('${item.id}')">${item.paid ? 'Ödendi' : 'Ödenmedi'}</button>
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
    
    if(!name || !amount) return;
    db.payments.push({ id: Date.now(), month, name, amount, type: 'fixed', paid: false });
    saveDb();
    document.getElementById('new-fixed-name').value = '';
    document.getElementById('new-fixed-amount').value = '';
    renderPayments();
}

// ---- MAAŞ YÖNETİMİ ----
function renderSalaries() {
    const list = document.getElementById('salary-list');
    list.innerHTML = '';
    const isHidden = db.settings.salaryHidden;

    db.salaries.forEach(s => {
        const activeStatus = s.actual ? '<span class="badge gercek">Gerçek</span>' : '<span class="badge tahmini">Tahmini</span>';
        list.innerHTML += `
            <div class="salary-item">
                <div class="salary-header"><span>${s.label}</span>${activeStatus}</div>
                <div class="salary-inputs">
                    <div class="salary-input-group">
                        <label>Tahmini</label>
                        <input type="number" class="${isHidden ? 'blur-active' : ''}" value="${s.estimated || ''}" onchange="updateSalary('${s.id}', 'estimated', this.value)">
                    </div>
                    <div class="salary-input-group">
                        <label>Gerçek Yatan</label>
                        <input type="number" class="${isHidden ? 'blur-active' : ''}" value="${s.actual || ''}" onchange="updateSalary('${s.id}', 'actual', this.value)">
                    </div>
                </div>
            </div>`;
    });
}

function updateSalary(id, field, value) {
    const index = db.salaries.findIndex(s => s.id === id);
    if(index !== -1) { db.salaries[index][field] = value ? Number(value) : null; saveDb(); renderSalaries(); }
}

// ---- BANKA VE YATIRIM ----
function renderStatus() {
    const list = document.getElementById('account-list'); list.innerHTML = '';
    const isHidden = db.settings.statusHidden;
    document.getElementById('btn-status-toggle').innerText = isHidden ? "👁️ Göster" : "👁️ Gizle";
    let total = 0;
    db.status.forEach((acc, index) => {
        total += acc.balance;
        list.innerHTML += `<li>
            <div class="item-left"><strong>${acc.name}</strong><span class="item-log">${acc.log || ''}</span></div>
            <div class="item-right item-amount blur-status ${isHidden ? 'blur-active' : ''}">
                ${acc.balance.toLocaleString('tr-TR')} TL
                <button style="border:none; background:none; color:red; margin-left:10px; font-weight:bold;" onclick="deleteStatus(${index})">X</button>
            </div>
        </li>`;
    });
    const totalEl = document.getElementById('total-status-balance');
    totalEl.innerText = `${total.toLocaleString('tr-TR')} TL`;
    if(isHidden) totalEl.classList.add('blur-active'); else totalEl.classList.remove('blur-active');
}

function addAccount() {
    const name = document.getElementById('acc-name').value;
    const balance = Number(document.getElementById('acc-balance').value);
    if(!name || isNaN(balance)) return;
    const existIndex = db.status.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
    if(existIndex !== -1) { db.status[existIndex].balance = balance; db.status[existIndex].log = getLogTime(); } 
    else { db.status.push({ name, balance, log: getLogTime() }); }
    saveDb(); document.getElementById('acc-name').value = ''; document.getElementById('acc-balance').value = ''; renderStatus();
}

function deleteStatus(index) { db.status.splice(index, 1); saveDb(); renderStatus(); }

function renderInvestments() {
    const list = document.getElementById('investment-list'); list.innerHTML = '';
    db.investments.forEach((inv, index) => {
        list.innerHTML += `<li>
            <div class="item-left"><strong>${inv.name}</strong><span class="item-log">Miktar: ${inv.amount} | Eklenme: ${inv.log}</span></div>
            <div class="item-right item-amount">${inv.value.toLocaleString('tr-TR')} TL
                <button style="border:none; background:none; color:red; margin-left:10px; font-weight:bold;" onclick="deleteInv(${index})">X</button>
            </div>
        </li>`;
    });
}

function addInvestment() {
    const name = document.getElementById('inv-name').value;
    const amount = Number(document.getElementById('inv-amount').value);
    const value = Number(document.getElementById('inv-value').value);
    if(!name) return;
    db.investments.push({ name, amount, value, log: getLogTime() }); saveDb();
    document.getElementById('inv-name').value = ''; document.getElementById('inv-amount').value = ''; document.getElementById('inv-value').value = ''; renderInvestments();
}

function deleteInv(index) { db.investments.splice(index, 1); saveDb(); renderInvestments(); }

function toggleVisibility(type) {
    if(type === 'salary') { db.settings.salaryHidden = !db.settings.salaryHidden; renderSalaries(); }
    else if (type === 'status') { db.settings.statusHidden = !db.settings.statusHidden; renderStatus(); }
    saveDb();
}