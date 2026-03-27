// Data storage
let transactions = [];

// Chart instances
let expenseChart = null;
let incomeExpenseChart = null;

// DOM Elements
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const transactionForm = document.getElementById('transactionForm');
const transactionListEl = document.getElementById('transactionList');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const darkModeToggle = document.getElementById('darkModeToggle');

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('transactions');
    if (saved) {
        transactions = JSON.parse(saved);
    }
    renderAll();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Calculate totals
function calculateTotals() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
}

// Update dashboard
function updateDashboard() {
    const { income, expenses, balance } = calculateTotals();
    totalBalanceEl.textContent = `R ${balance.toFixed(2)}`;
    totalIncomeEl.textContent = `R ${income.toFixed(2)}`;
    totalExpensesEl.textContent = `R ${expenses.toFixed(2)}`;
}

// Add transaction
function addTransaction(transaction) {
    transactions.push(transaction);
    saveData();
    renderAll();
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    renderAll();
}

// Get filtered transactions
function getFilteredTransactions() {
    let filtered = [...transactions];
    
    // Filter by category
    const category = categoryFilter.value;
    if (category !== 'all') {
        filtered = filtered.filter(t => t.category === category);
    }
    
    // Filter by search
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.category.toLowerCase().includes(searchTerm) ||
            t.amount.toString().includes(searchTerm)
        );
    }
    
    return filtered;
}

// Render transaction list
function renderTransactionList() {
    const filtered = getFilteredTransactions();
    
    if (filtered.length === 0) {
        transactionListEl.innerHTML = '<div class="empty-message">📭 No transactions found</div>';
        return;
    }
    
    transactionListEl.innerHTML = filtered.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <span class="transaction-category category-${transaction.category}">
                    ${transaction.category}
                </span>
                <span class="transaction-date">${transaction.date}</span>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'} R ${transaction.amount.toFixed(2)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button>
        </div>
    `).join('');
}

// Update expense pie chart
function updateExpenseChart() {
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const categoryTotals = {};
    expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
                    '#f9ca24', '#f0932b', '#eb4d4b', '#95afc0'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update income vs expense bar chart
function updateIncomeExpenseChart() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount (Rands)',
                data: [income, expenses],
                backgroundColor: ['#2196F3', '#f44336']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Rands (R)'
                    }
                }
            }
        }
    });
}

// Update charts
function updateCharts() {
    updateExpenseChart();
    updateIncomeExpenseChart();
}

// Render everything
function renderAll() {
    updateDashboard();
    renderTransactionList();
    updateCharts();
}

// Handle form submission
transactionForm.addEventListener('submit', (e) => {
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
        alert('Please enter a valid amount');
        return;
    }
    
    const transaction = {
        id: Date.now(),
        amount: amount,
        category: category,
        type: type,
        date: date
    };
    
    addTransaction(transaction);
    
    // Reset form
    transactionForm.reset();
    document.getElementById('type').value = 'expense';
    // Set default date again
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
});

// Filter event listeners
categoryFilter.addEventListener('change', () => {
    renderTransactionList();
});

searchInput.addEventListener('input', () => {
    renderTransactionList();
});

// Dark mode toggle
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    darkModeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('darkMode', isDark);
});

// Load dark mode preference
function loadDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️ Light Mode';
    }
}

// Set default date to today
function setDefaultDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

// Initialize
function init() {
    loadData();
    loadDarkMode();
    setDefaultDate();
    renderAll();
}

// Make deleteTransaction available globally
window.deleteTransaction = deleteTransaction;

// Start the app
init();