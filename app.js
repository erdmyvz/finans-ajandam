// EXCEL ŞABLONLARI
const EXCEL_FIXED_EXPENSES = [
    { name: 'BES', amount: 1000 },
    { name: 'Ulaşım Toplam', amount: 5625 },
    { name: 'Üyelikler Toplam', amount: 1700 },
    { name: 'Harçlık', amount: 1675 }
];

const EXCEL_CREDITS = [
    { month: '2026-07', amount: 28895, name: '1. Taksit (Tem 26)' },
    { month: '2026-08', amount: 28895, name: '2. Taksit (Ağu 26)' },
    { month: '2026-09', amount: 28895, name: '3. Taksit (Eyl 26)' },
    { month: '2026-10', amount: 28895, name: '4. Taksit (Eki 26)' },
    { month: '2026-11', amount: 28895, name: '5. Taksit (Kas 26)' },
    { month: '2026-12', amount: 28895, name: '6. Taksit (Ara 26)' },
    { month: '2027-01', amount: 28895, name: '7. Taksit (Oca 27)' },
    { month: '2027-02', amount: 28895, name: '8. Taksit (Şub 27)' },
    { month: '2027-03', amount: 28895, name: '9. Taksit (Mar 27)' },
    { month: '2027-04', amount: 28895, name: '10. Taksit (Nis 27)' },
    { month: '2027-05', amount: 28895, name: '11. Taksit (May 27)' },
    { month: '2027-06', amount: 28895, name: '12. Taksit (Haz 27)' }
];

// UYGULAMA VERİ TABANI
const db = {
    expenses: JSON.parse(localStorage.getItem('fa_expenses')) || [],
    salaries: JSON.parse(localStorage.getItem('fa_salaries')) || generateDefaultSalaries(),
    payments: JSON.parse(localStorage.getItem('fa_payments')) || [],
    status: JSON.parse(localStorage.getItem('fa_status')) || [],
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

// LOG (Zaman Damgası) OLUŞTURUCU
function getLogTime() {
    const now = new Date();
    return `${now.toLocaleDateString('tr-TR')} - ${now.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}`;
}

// BAŞLANGIÇ ÇALIŞTIRICISI
document.addEventListener('DOMContentLoaded', () => {
    syncAutoPayments();
    populateMonthSelectors();
    renderDashboard();
});

// AYLARI OLUŞTUR
function generateDefaultSalaries() {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    let defaults = [];
    ['2026', '2027'].forEach(year => {
        months.forEach((m, i) => {
            defaults.push({ id: `${year}-${String(i + 1).padStart(2, '0')}`, label: `${m} ${year}`, estimated: null, actual: null });
        });
    });
    return defaults;
}

// HER AY İÇİN SABİT GİDERLERİ VE KREDİLERİ OTOMATİK OLUŞTUR (Eğer yoksa)
function syncAutoPayments() {
    db.salaries.forEach(s => {
        const month = s.id;
        
        // Sabit Gider Kontrolü
        const hasFixed = db.payments.some(p => p.month === month && p.type === 'fixed');
        if (!hasFixed) {
            EXCEL_FIXED_EXPENSES.forEach(f => {
                db.payments.push({ id: Date.now() + Math.random(), month, name: f.name, amount: f.amount, type: 'fixed', paid: false });
            });
        }
        
        // Kredi Kontrolü
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

// SELECT KUTULARINI DOLDUR
function populateMonthSelectors() {
    const selects = ['dash-month-select', 'exp-month-select', 'pay-month-select'];
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    // Eğer anlık ay listede yoksa Temmuz 2026'yı varsayılan seç
    const defaultMonth = db.salaries.some(s => s.id === currentMonthStr) ? currentMonthStr : '2026-07';

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

// ---- ANA EKRAN: GENEL DURUM HESAPLAMASI ----
function renderDashboard() {
    const selectedMonth = document.getElementById('dash-month-select').value;
    const salaryObj = db.salaries.find(s => s.id === selectedMonth);
    
    // Gelir
    const salary = salaryObj ? (salaryObj.actual || salaryObj.estimated || 0) : 0;
    
    // Sabit & Kredi Giderleri
    const monthPayments = db.payments.filter(p => p.month === selectedMonth);
    const fixedTotal = monthPayments.filter(p => p.type === 'fixed').reduce((a, b) => a + b.amount, 0);
    const creditTotal = monthPayments.filter(p => p.type === 'credit').reduce((a, b) => a + b.amount, 0);
    
    // Günlük Harcamalar
    const monthExpenses = db.expenses.filter(e => e.month === selectedMonth);
    const expenseTotal = monthExpenses.reduce((a, b) => a + b.amount, 0);

    // Kalan Net Formülü = Maaş - Sabit - Kredi - Harcama
    const net = salary - fixedTotal - creditTotal - expenseTotal;

    // Ekrana Yazdır
    document.getElementById('dash-salary').innerText = salary.toLocaleString('tr-TR') + ' TL';
    document.getElementById('dash-fixed').innerText = '-' + fixedTotal.toLocaleString('tr-TR') + ' TL';
    document.getElementById('dash-credit').innerText = '-' + creditTotal.toLocaleString('tr-TR') + ' TL';
    document.getElementById('dash-expense').innerText = '-' + expenseTotal.toLocaleString('tr-TR') + ' TL';
    
    const netEl = document.getElementById('dash-net');
    netEl.innerText = net.toLocaleString('tr-TR') + ' TL';
    netEl.className = net >= 0 ? 'text-success' : 'text-danger';
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

// ---- HARCAMA (Loglu) ----
function addExpense() {
    const month = document.getElementById('exp-month-select').value;
    const amount = Number(document.getElementById('exp-amount').value);
    const category = document.getElementById('exp-category').value;
    const desc = document.getElementById('exp-desc').value;

    if(!amount || amount <= 0) return;

    db.expenses.push({ id: Date.now(), month, amount, category, desc, log: getLogTime() });
    saveDb();
    
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-desc').value = '';
    renderExpenses();
}

function renderExpenses() {
    const month = document.getElementById('exp-month-select').value;
    const list = document.getElementById('expense-list');
    list.innerHTML = '';
    
    let total = 0;
    const filtered = db.expenses.filter(e => e.month === month).reverse();
    
    filtered.forEach(exp => {
        total += exp.amount;
        list.innerHTML += `
            <li>
                <div class="item-left">
                    <strong>${exp.category} ${exp.desc ? '- ' + exp.desc : ''}</strong>
                    <span class="item-log">${exp.log}</span>
                </div>
                <div class="item-right text-danger item-amount">-${exp.amount} TL</div>
            </li>
        `;
    });
    document.getElementById('monthly-total-expense').innerText = total.toLocaleString('tr-TR');
}

// ---- SABİT VE KREDİ ÖDEMELERİ ----
function renderPayments() {
    const month = document.getElementById('pay-month-select').value;
    const monthData = db.payments.filter(p => p.month === month);
    
    // Sabit Giderler
    const fixedData = monthData.filter(p => p.type === 'fixed');
    const fixedList = document.getElementById('fixed-list');
    fixedList.innerHTML = '';
    let fTotal = 0;
    fixedData.forEach(item => {
        fTotal += item.amount;
        fixedList.innerHTML += `
            <li>
                <div class="item-left"><strong>${item.name}</strong><span class="item-log">${item.amount.toLocaleString('tr-TR')} TL</span></div>
                <button class="status-badge ${item.paid ? 'paid' : 'unpaid'}" onclick="togglePayment('${item.id}')">${item.paid ? 'Ödendi' : 'Ödenmedi'}</button>
            </li>`;
    });
    document.getElementById('total-fixed-val').innerText = fTotal.toLocaleString('tr-TR');

    // Krediler
    const creditData = monthData.filter(p => p.type === 'credit');
    const creditList = document.getElementById('credit-list');
    creditList.innerHTML = '';
    let cTotal = 0;
    
    if(creditData.length === 0) {
        creditList.innerHTML = `<li><div class="item-left"><span class="item-log">Bu ay kredi ödemesi yok.</span></div></li>`;
    } else {
        creditData.forEach(item => {
            cTotal += item.amount;
            creditList.innerHTML += `
                <li>
                    <div class="item-left"><strong>${item.name}</strong><span class="item-log">${item.amount.toLocaleString('tr-TR')} TL</span></div>
                    <button class="status-badge ${item.paid ? 'paid' : 'unpaid'}" onclick="togglePayment('${item.id}')">${item.paid ? 'Ödendi' : 'Ödenmedi'}</button>
                </li>`;
        });
    }
    document.getElementById('total-credit-val').innerText = cTotal.toLocaleString('tr-TR');
}

function togglePayment(id) {
    const item = db.payments.find(p => p.id == id);
    if(item) {
        item.paid = !item.paid;
        saveDb();
        renderPayments();
    }
}

// ---- MAAŞ ----
function renderSalaries() {
    const list = document.getElementById('salary-list');
    list.innerHTML = '';
    const isHidden = db.settings.salaryHidden;

    db.salaries.forEach(s => {
        const activeStatus = s.actual ? '<span class="badge gercek">Gerçek</span>' : '<span class="badge tahmini">Tahmini</span>';
        list.innerHTML += `
            <li class="salary-item">
                <div class="salary-header"><span>${s.label}</span>${activeStatus}</div>
                <div class="salary-inputs">
                    <div><small>Tahmini (TL)</small><input type="number" class="salary-input ${isHidden ? 'blur-active' : ''}" value="${s.estimated || ''}" onchange="updateSalary('${s.id}', 'estimated', this.value)"></div>
                    <div><small>Gerçek (TL)</small><input type="number" class="salary-input ${isHidden ? 'blur-active' : ''}" value="${s.actual || ''}" onchange="updateSalary('${s.id}', 'actual', this.value)"></div>
                </div>
            </li>
        `;
    });
}

function updateSalary(id, field, value) {
    const index = db.salaries.findIndex(s => s.id === id);
    if(index !== -1) {
        db.salaries[index][field] = value ? Number(value) : null;
        saveDb();
        renderSalaries();
    }
}

// ---- GENEL DURUM (Loglu) ----
function renderStatus() {
    const list = document.getElementById('account-list');
    list.innerHTML = '';
    const isHidden = db.settings.statusHidden;
    document.getElementById('btn-status-toggle').innerText = isHidden ? "👁️ Göster" : "👁️ Gizle";

    let total = 0;
    db.status.forEach((acc, index) => {
        total += acc.balance;
        list.innerHTML += `
            <li>
                <div class="item-left">
                    <strong>${acc.name}</strong>
                    <span class="item-log">${acc.log || ''}</span>
                </div>
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
    if(existIndex !== -1) {
        db.status[existIndex].balance = balance;
        db.status[existIndex].log = getLogTime();
    } else {
        db.status.push({ name, balance, log: getLogTime() });
    }
    saveDb();
    document.getElementById('acc-name').value = '';
    document.getElementById('acc-balance').value = '';
    renderStatus();
}

function deleteStatus(index) { db.status.splice(index, 1); saveDb(); renderStatus(); }

// ---- YATIRIM (Loglu) ----
function renderInvestments() {
    const list = document.getElementById('investment-list');
    list.innerHTML = '';
    
    db.investments.forEach((inv, index) => {
        list.innerHTML += `
            <li>
                <div class="item-left">
                    <strong>${inv.name}</strong>
                    <span class="item-log">Miktar: ${inv.amount} | Eklenme: ${inv.log}</span>
                </div>
                <div class="item-right item-amount">
                    ${inv.value.toLocaleString('tr-TR')} TL
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

    db.investments.push({ name, amount, value, log: getLogTime() });
    saveDb();
    
    document.getElementById('inv-name').value = '';
    document.getElementById('inv-amount').value = '';
    document.getElementById('inv-value').value = '';
    renderInvestments();
}

function deleteInv(index) { db.investments.splice(index, 1); saveDb(); renderInvestments(); }

// ---- GİZLİLİK ----
function toggleVisibility(type) {
    if(type === 'salary') { db.settings.salaryHidden = !db.settings.salaryHidden; renderSalaries(); }
    else if (type === 'status') { db.settings.statusHidden = !db.settings.statusHidden; renderStatus(); }
    saveDb();
}