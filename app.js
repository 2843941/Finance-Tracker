let transactions = [];
let expenseChart = null;
let incomeExpenseChart = null;
let currentUser = null;

// DOM Elements
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const transactionForm = document.getElementById('transactionForm');
const transactionListEl = document.getElementById('transactionList');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const darkModeToggle = document.getElementById('darkModeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const userNameSpan = document.getElementById('userName');

// Check authentication
auth.onAuthStateChanged(async (user) => {
    console.log("Auth state changed. User:", user ? user.email : "No user");
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = user;
    
    // Load user's name
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userNameSpan) {
            userNameSpan.textContent = `👋 ${userDoc.data().name}`;
        } else if (userNameSpan) {
            userNameSpan.textContent = `👋 ${user.email}`;
        }
    } catch (error) {
        console.error("Error loading user:", error);
        if (userNameSpan) userNameSpan.textContent = `👋 ${user.email}`;
    }
    
    // Load transactions
    await loadTransactions();
});

// Load transactions from Firebase
async function loadTransactions() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .get();
        
        transactions = [];
        snapshot.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        
        console.log("Loaded", transactions.length, "transactions");
        updateDisplay();
    } catch (error) {
        console.error("Error loading transactions:", error);
        if (transactionListEl) {
            transactionListEl.innerHTML = '<div class="empty-message">❌ Error loading transactions: ' + error.message + '</div>';
        }
    }
}

// Add transaction to Firebase
async function addTransaction(transaction) {
    if (!currentUser) {
        alert("Not logged in!");
        return false;
    }
    
    try {
        const docRef = await db.collection('transactions').add({
            ...transaction,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
        });
        
        console.log("Transaction added with ID:", docRef.id);
        await loadTransactions();
        return true;
    } catch (error) {
        console.error("Error adding transaction:", error);
        alert("Error adding transaction: " + error.message);
        return false;
    }
}

// Delete transaction
window.deleteTransaction = async function(id) {
    if (confirm("Delete this transaction?")) {
        try {
            await db.collection('transactions').doc(id).delete();
            console.log("Transaction deleted:", id);
            await loadTransactions();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Error: " + error.message);
        }
    }
};

// Calculate totals
function calculateTotals() {
    let income = 0, expenses = 0;
    
    transactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expenses += t.amount;
    });
    
    return { income, expenses, balance: income - expenses };
}

// Update dashboard
function updateDashboard() {
    const { income, expenses, balance } = calculateTotals();
    if (totalBalanceEl) totalBalanceEl.textContent = `R ${balance.toFixed(2)}`;
    if (totalIncomeEl) totalIncomeEl.textContent = `R ${income.toFixed(2)}`;
    if (totalExpensesEl) totalExpensesEl.textContent = `R ${expenses.toFixed(2)}`;
}

// Get filtered transactions
function getFilteredTransactions() {
    let filtered = [...transactions];
    
    const category = categoryFilter ? categoryFilter.value : 'all';
    if (category !== 'all') {
        filtered = filtered.filter(t => t.category === category);
    }
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.category.toLowerCase().includes(searchTerm) ||
            t.amount.toString().includes(searchTerm)
        );
    }
    
    return filtered;
}

// Display transaction list
function displayTransactions() {
    if (!transactionListEl) return;
    
    const filtered = getFilteredTransactions();
    
    if (filtered.length === 0) {
        transactionListEl.innerHTML = '<div class="empty-message">📭 No transactions. Add one above!</div>';
        return;
    }
    
    transactionListEl.innerHTML = filtered.map(t => `
        <div class="transaction-item">
            <div class="transaction-info">
                <span class="transaction-category category-${t.category}">${t.category}</span>
                <span class="transaction-date">📅 ${t.date}</span>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'} R ${t.amount.toFixed(2)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction('${t.id}')">🗑️ Delete</button>
        </div>
    `).join('');
}

// Update expense pie chart
function updateExpenseChart() {
    const expenses = transactions.filter(t => t.type === 'expense');
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    
    if (expenseChart) expenseChart.destroy();
    
    if (categories.length > 0) {
        expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#f9ca24', '#f0932b', '#eb4d4b', '#95afc0']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

// Update income vs expense bar chart
function updateIncomeExpenseChart() {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;
    
    if (incomeExpenseChart) incomeExpenseChart.destroy();
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['💰 Income', '💸 Expenses'],
            datasets: [{
                label: 'Amount (Rands)',
                data: [income, expenses],
                backgroundColor: ['#4CAF50', '#f44336'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Rands (R)' }
                }
            }
        }
    });
}

// Update all charts
function updateCharts() {
    updateExpenseChart();
    updateIncomeExpenseChart();
}

// Update everything
function updateDisplay() {
    updateDashboard();
    displayTransactions();
    updateCharts();
}

// Handle form submission
if (transactionForm) {
    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const type = document.getElementById('type').value;
        const date = document.getElementById('date').value;
        
        if (!amount || !category || !date) {
            alert('Please fill in all fields');
            return;
        }
        
        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }
        
        const success = await addTransaction({
            amount: amount,
            category: category,
            type: type,
            date: date
        });
        
        if (success) {
            document.getElementById('amount').value = '';
            document.getElementById('category').value = '';
            document.getElementById('type').value = 'expense';
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
        }
    });
}

// Filter and search
if (categoryFilter) {
    categoryFilter.addEventListener('change', () => displayTransactions());
}
if (searchInput) {
    searchInput.addEventListener('input', () => displayTransactions());
}

// Dark mode
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        darkModeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('darkMode', isDark);
    });
}

// Load dark mode
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.textContent = '☀️ Light Mode';
}

// Set default date
const dateInput = document.getElementById('date');
if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = 'index.html';
    });
}

console.log("App loaded - ready to add transactions!");