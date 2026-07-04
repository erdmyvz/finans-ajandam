// UYGULAMA VERİ TABANI (LocalStorage)
const db = {
    expenses: JSON.parse(localStorage.getItem('fa_expenses')) || [],
    salaries: JSON.parse(localStorage.getItem('fa_salaries')) || generateDefaultSalaries(),
    status: JSON.parse(localStorage.getItem('fa_status')) || [],
    investments: JSON.parse(localStorage.getItem('fa_investments')) || [],
    settings: JSON.parse(localStorage.getItem('fa_settings')) || { salaryHidden: false, statusHidden: true }
};

function saveDb() {
    localStorage.setItem('fa_expenses', JSON.stringify(db.expenses));
    localStorage.setItem('fa_salaries', JSON.stringify(db.salaries));
    localStorage.setItem('fa_status', JSON.stringify(db.status));
    localStorage.setItem('fa_investments', JSON.stringify(db.investments));
    localStorage.setItem('fa_settings', JSON.stringify(db.settings));
}

// 2026-2027 Aylarını Otomatik Oluştur
function generateDefaultSalaries() {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    let defaultSalaries = [];
    ['2026', '2027'].forEach(year => {
        months.forEach((m, index) => {
            let monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
            defaultSalaries.push({ id: monthKey, label: `${m} ${year}`, estimated: null, actual: null });
        });
    });
    return defaultSalaries;
}

// ---- NAVİGASYON (MENÜLER ARASI GEÇİŞ) ----
function openScreen(screenId, title) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById('back-btn').classList.remove('hidden');
    document.getElementById('page-title').innerText = title;

    if(screenId === 'screen-expense') initExpenseScreen();
    if(screenId === 'screen-salary') renderSalaries();
    if(screenId === 'screen-status') renderStatus();
    if(screenId === 'screen-investment') renderInvestments();
}

function goHome() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-home').classList.remove('hidden');
    document.getElementById('back-btn').classList.add('hidden');
    document.getElementById('page-title').innerText = "Finans Ajandam";
}

// ---- MENÜ 1: HARCAMA EKLE ----
function initExpenseScreen() {
    const select = document.getElementById('exp-month-select');
    select.innerHTML = '';
    // Ay listesini select box'a doldur (Bugünün ayı seçili olsun)
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    
    db.salaries.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.text = s.label;
        if(s.id === currentMonthKey) option.selected = true;
        select.appendChild(option);
    });

    select.onchange = renderExpenses;
    renderExpenses();
}

function addExpense() {
    const month = document.getElementById('exp-month-select').value;
    const amount = Number(document.getElementById('exp-amount').value);
    const category = document.getElementById('exp-category').value;
    const desc = document.getElementById('exp-desc').value;

    if(!amount || amount <= 0) return alert("Lütfen tutar giriniz.");

    db.expenses.push({ 
        id: Date.now(), 
        month, 
        amount, 
        category, 
        desc, 
        date: new Date().toLocaleDateString('tr-TR') 
    });
    
    saveDb();
    
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-desc').value = '';
    renderExpenses();
}

function renderExpenses() {
    const selectedMonth = document.getElementById('exp-month-select').value;
    const list = document.getElementById('expense-list');
    list.innerHTML = '';
    
    let total = 0;
    const filtered = db.expenses.filter(e => e.month === selectedMonth).reverse();
    
    filtered.forEach(exp => {
        total += exp.amount;
        list.innerHTML += `
            <li>
                <div class="item-left">
                    <strong>${exp.category}</strong>
                    <small>${exp.desc ? exp.desc + ' | ' : ''}${exp.date}</small>
                </div>
                <div class="item-right item-amount text-danger">-${exp.amount} TL</div>
            </li>
        `;
    });
    document.getElementById('monthly-total-expense').innerText = total.toLocaleString('tr-TR');
}

// ---- MENÜ 2: MAAŞ YÖNETİMİ ----
function renderSalaries() {
    const list = document.getElementById('salary-list');
    list.innerHTML = '';
    const isHidden = db.settings.salaryHidden;

    db.salaries.forEach(s => {
        // Gerçek maaş girilmişse durumu Gerçek, girilmemişse Tahmini kabul et.
        const activeStatus = s.actual ? '<span class="badge gercek">Gerçek</span>' : '<span class="badge tahmini">Tahmini</span>';
        
        list.innerHTML += `
            <li class="salary-item">
                <div class="salary-header">
                    <span>${s.label}</span>
                    ${activeStatus}
                </div>
                <div class="salary-inputs">
                    <div>
                        <small>Tahmini (TL)</small>
                        <input type="number" class="salary-input ${isHidden ? 'blur-active' : ''}" 
                               value="${s.estimated || ''}" 
                               onchange="updateSalary('${s.id}', 'estimated', this.value)">
                    </div>
                    <div>
                        <small>Gerçek Yatan (TL)</small>
                        <input type="number" class="salary-input ${isHidden ? 'blur-active' : ''}" 
                               value="${s.actual || ''}" 
                               onchange="updateSalary('${s.id}', 'actual', this.value)">
                    </div>
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

// ---- MENÜ 3: GENEL DURUM ----
function renderStatus() {
    const list = document.getElementById('account-list');
    list.innerHTML = '';
    const isHidden = db.settings.statusHidden;
    
    // Rakamları Göster/Gizle butonu metnini ayarla
    document.getElementById('btn-status-toggle').innerText = isHidden ? "👁️ Rakamları Göster" : "👁️ Rakamları Gizle";

    let total = 0;
    db.status.forEach((acc, index) => {
        total += acc.balance;
        list.innerHTML += `
            <li>
                <div class="item-left"><strong>${acc.name}</strong></div>
                <div class="item-right item-amount blur-status ${isHidden ? 'blur-active' : ''}">
                    ${acc.balance.toLocaleString('tr-TR')} TL
                    <button style="border:none; background:none; color:red; margin-left:10px;" onclick="deleteStatus(${index})">X</button>
                </div>
            </li>
        `;
    });
    
    const totalEl = document.getElementById('total-status-balance');
    totalEl.innerText = `${total.toLocaleString('tr-TR')} TL`;
    if(isHidden) totalEl.classList.add('blur-active'); else totalEl.classList.remove('blur-active');
}

function addAccount() {
    const name = document.getElementById('acc-name').value;
    const balance = Number(document.getElementById('acc-balance').value);
    
    if(!name || isNaN(balance)) return;

    // Aynı isimde varsa güncelle, yoksa ekle
    const existIndex = db.status.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
    if(existIndex !== -1) db.status[existIndex].balance = balance;
    else db.status.push({ name, balance });

    saveDb();
    document.getElementById('acc-name').value = '';
    document.getElementById('acc-balance').value = '';
    renderStatus();
}

function deleteStatus(index) {
    db.status.splice(index, 1);
    saveDb();
    renderStatus();
}

// ---- MENÜ 4: YATIRIM & BİRİKİM ----
function renderInvestments() {
    const list = document.getElementById('investment-list');
    list.innerHTML = '';
    
    db.investments.forEach((inv, index) => {
        list.innerHTML += `
            <li>
                <div class="item-left">
                    <strong>${inv.name}</strong>
                    <small>Miktar: ${inv.amount}</small>
                </div>
                <div class="item-right item-amount">
                    ${inv.value.toLocaleString('tr-TR')} TL
                    <button style="border:none; background:none; color:red; margin-left:10px;" onclick="deleteInv(${index})">X</button>
                </div>
            </li>
        `;
    });
}

function addInvestment() {
    const name = document.getElementById('inv-name').value;
    const amount = Number(document.getElementById('inv-amount').value);
    const value = Number(document.getElementById('inv-value').value);

    if(!name) return;

    db.investments.push({ name, amount, value });
    saveDb();
    
    document.getElementById('inv-name').value = '';
    document.getElementById('inv-amount').value = '';
    document.getElementById('inv-value').value = '';
    renderInvestments();
}

function deleteInv(index) {
    db.investments.splice(index, 1);
    saveDb();
    renderInvestments();
}

// ---- ORTAK GİZLİLİK (BLUR) YÖNETİMİ ----
function toggleVisibility(type) {
    if(type === 'salary') {
        db.settings.salaryHidden = !db.settings.salaryHidden;
        saveDb();
        renderSalaries();
    } else if (type === 'status') {
        db.settings.statusHidden = !db.settings.statusHidden;
        saveDb();
        renderStatus();
    }
}