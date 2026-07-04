// Şablon Veriler (İlk açılışta tablonun boş kalmaması için ekran görüntülerindeki verileri yüklüyoruz)
const defaultIncome = 63300;

const defaultFixedExpenses = [
    { id: 'f1', name: 'BES', detail: "Ayın 4'ünde", amount: 1000, paid: false },
    { id: 'f2', name: 'Ulaşım (Kocaeli)', detail: '45 x 25 sefer', amount: 1125, paid: false },
    { id: 'f3', name: 'Ulaşım (İstanbul)', detail: '180 x 25 sefer', amount: 4500, paid: false },
    { id: 'f4', name: 'Telefon Üyeliği', detail: "Ayın 4'ünde", amount: 600, paid: false },
    { id: 'f5', name: 'Adobe Üyeliği', detail: "Ayın 11'inde", amount: 600, paid: false },
    { id: 'f6', name: 'Youtube Premium', detail: 'Ayın 17-18\'inde', amount: 100, paid: false },
    { id: 'f7', name: 'iCloud Saklama', detail: "Ayın 27'sinde", amount: 400, paid: false },
    { id: 'f8', name: 'Harçlık / Diğer', detail: 'Serbest Limit', amount: 1675, paid: false }
];

const defaultLoans = [
    { id: 'l1', name: '1. Taksit', date: '22.07.2026', amount: 28895, paid: true }, // Örnek olarak ilkini ödendi başlatalım
    { id: 'l2', name: '2. Taksit', date: '22.08.2026', amount: 28895, paid: false },
    { id: 'l3', name: '3. Taksit', date: '22.09.2026', amount: 28895, paid: false },
    { id: 'l4', name: '4. Taksit', date: '22.10.2026', amount: 28895, paid: false },
    { id: 'l5', name: '5. Taksit', date: '22.11.2026', amount: 28895, paid: false },
    { id: 'l6', name: '6. Taksit', date: '22.12.2026', amount: 28895, paid: false },
    { id: 'l7', name: '7. Taksit', date: '22.01.2027', amount: 28895, paid: false },
    { id: 'l8', name: '8. Taksit', date: '22.02.2027', amount: 28895, paid: false },
    { id: 'l9', name: '9. Taksit', date: '22.03.2027', amount: 28895, paid: false },
    { id: 'l10', name: '10. Taksit', date: '22.04.2027', amount: 28895, paid: false },
    { id: 'l11', name: '11. Taksit', date: '22.05.2027', amount: 28895, paid: false },
    { id: 'l12', name: '12. Taksit', date: '22.06.2027', amount: 28895, paid: false }
];

// Başlangıç Kurulumları
if (!localStorage.getItem('inc_income')) localStorage.setItem('inc_income', defaultIncome);
if (!localStorage.getItem('inc_fixed')) localStorage.setItem('inc_fixed', JSON.stringify(defaultFixedExpenses));
if (!localStorage.getItem('inc_loans')) localStorage.setItem('inc_loans', JSON.stringify(defaultLoans));
if (!localStorage.getItem('inc_daily_spent')) localStorage.setItem('inc_daily_spent', JSON.stringify([]));

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('monthly-income').value = localStorage.getItem('inc_income');
    renderFixedExpenses();
    renderLoans();
    renderDailyExpenses();
    calculateDashboard();
});

// Gelir Güncelleme (İstediğin an değiştirebilirsin)
function updateIncome(val) {
    localStorage.setItem('inc_income', Number(val));
    calculateDashboard();
}

// Tab Değiştirici Motor
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
}

// Günlük Harcama Ekleme
function submitExpense() {
    const amountInput = document.getElementById('exp-amount');
    const categoryInput = document.getElementById('exp-category');
    const amount = Number(amountInput.value);
    
    if (!amount || amount <= 0) return;

    const dailySpent = JSON.parse(localStorage.getItem('inc_daily_spent'));
    dailySpent.push({
        amount,
        category: categoryInput.value,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    });

    localStorage.setItem('inc_daily_spent', JSON.stringify(dailySpent));
    amountInput.value = '';
    
    renderDailyExpenses();
    calculateDashboard();
}

// Sabit Giderleri Ekrana Çizme
function renderFixedExpenses() {
    const fixed = JSON.parse(localStorage.getItem('inc_fixed'));
    const tbody = document.getElementById('fixed-tbody');
    tbody.innerHTML = '';

    fixed.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.detail}</td>
            <td>${item.amount} TL</td>
            <td>
                <span class="status-badge ${item.paid ? 'paid' : 'unpaid'}" onclick="toggleStatus('fixed', '${item.id}')">
                    ${item.paid ? 'Ödendi' : 'Ödenmedi'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Kredileri Ekrana Çizme
function renderLoans() {
    const loans = JSON.parse(localStorage.getItem('inc_loans'));
    const tbody = document.getElementById('loans-tbody');
    tbody.innerHTML = '';

    loans.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td><small>${item.date}</small></td>
            <td>${item.amount.toLocaleString('tr-TR')} TL</td>
            <td>
                <span class="status-badge ${item.paid ? 'paid' : 'unpaid'}" onclick="toggleStatus('loans', '${item.id}')">
                    ${item.paid ? 'Ödendi' : 'Ödenmedi'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Günlük Harcama Geçmişini Listeleme
function renderDailyExpenses() {
    const dailySpent = JSON.parse(localStorage.getItem('inc_daily_spent'));
    const list = document.getElementById('daily-log-list');
    list.innerHTML = '';

    let total = 0;
    [...dailySpent].reverse().forEach(item => {
        total += item.amount;
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.category} <small>(${item.date})</small></span> <span class="price">-${item.amount} TL</span>`;
        list.appendChild(li);
    });

    document.getElementById('total-daily-spent').innerText = total;
}

// Ödendi / Ödenmedi Durumunu Tersine Çeviren Fonksiyon
function toggleStatus(type, id) {
    const key = type === 'fixed' ? 'inc_fixed' : 'inc_loans';
    const data = JSON.parse(localStorage.getItem(key));
    const item = data.find(x => x.id === id);
    if (item) {
        item.paid = !item.paid;
        localStorage.setItem(key, JSON.stringify(data));
        if (type === 'fixed') renderFixedExpenses(); else renderLoans();
        calculateDashboard();
    }
}

// Ana Hesaplama Algoritması (Dashboard)
function calculateDashboard() {
    const income = Number(localStorage.getItem('inc_income'));
    const fixed = JSON.parse(localStorage.getItem('inc_fixed'));
    const loans = JSON.parse(localStorage.getItem('inc_loans'));
    const dailySpent = JSON.parse(localStorage.getItem('inc_daily_spent'));

    // Bu ay henüz ödenmemiş olan sabit giderlerin toplamı
    const totalUnpaidFixed = fixed.reduce((sum, item) => sum + (item.paid ? 0 : item.amount), 0);
    
    // Bu ay vadesi gelip ödenmemiş olan kredi taksitleri (Mevcut ayın taksiti kontrolü)
    // Basitlik adına, bu ay ödenmesi gereken ama "unpaid" olan aktif kredileri düşüyoruz
    const activeUnpaidLoan = loans.reduce((sum, item) => {
        // Eğer taksit tarihi içinde bulunduğumuz aya aitse ve ödenmediyse bütçeden düşer
        const currentMonthStr = "." + String(new Date().getMonth() + 1).padStart(2, '0') + ".";
        if (item.date.includes(currentMonthStr) && !item.paid) {
            return sum + item.amount;
        }
        return sum;
    }, 0);

    // Bu ay yapılan anlık harcamaların toplamı
    const totalDailySpent = dailySpent.reduce((sum, item) => sum + item.amount, 0);

    // Kalan Gün Hesaplama
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysLeft = lastDay.getDate() - today.getDate() + 1;

    // MATEMATİKSEL LİMİT FORMÜLÜ:
    // (Toplam Gelir - Ödenmemiş Sabitler - Ödenmemiş Aktif Kredi - Bu Ay Yapılan Harcamalar) / Kalan Gün
    const remainingPool = income - totalUnpaidFixed - activeUnpaidLoan - totalDailySpent;
    const dailyLimit = remainingPool > 0 ? Math.round(remainingPool / daysLeft) : 0;

    // Verileri Ekrana Yazdır
    document.getElementById('calc-daily-limit').innerText = `${dailyLimit.toLocaleString('tr-TR')} TL`;
    document.getElementById('calc-days-left').innerText = daysLeft;
}