// DOM Elements
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authMessage = document.getElementById('authMessage');

// ============ ENTER KEY SUPPORT ============

// Login form - press Enter to login
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');

if (loginEmail && loginPassword) {
    loginEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginBtn.click();
        }
    });
    
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginBtn.click();
        }
    });
}

// Signup form - press Enter to signup
const signupName = document.getElementById('signupName');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupConfirmPassword = document.getElementById('signupConfirmPassword');

if (signupName && signupEmail && signupPassword && signupConfirmPassword) {
    signupName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            signupBtn.click();
        }
    });
    
    signupEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            signupBtn.click();
        }
    });
    
    signupPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            signupBtn.click();
        }
    });
    
    signupConfirmPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            signupBtn.click();
        }
    });
}

// ============ TAB SWITCHING ============
if (loginTab && signupTab) {
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        clearMessage();
    });
    
    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        clearMessage();
    });
}

function clearMessage() {
    if (authMessage) {
        authMessage.innerHTML = '';
        authMessage.className = 'message';
    }
}

function showMessage(msg, type) {
    if (authMessage) {
        authMessage.innerHTML = msg;
        authMessage.className = `message ${type}`;
        setTimeout(() => {
            if (authMessage.innerHTML === msg) clearMessage();
        }, 5000);
    }
}

// ============ SIMPLE PASSWORD RESET ============
async function sendPasswordReset() {
    const email = prompt("Enter your email address to reset your password:");
    
    if (!email) {
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    showMessage('Sending reset link...', 'info');
    
    try {
        await auth.sendPasswordResetEmail(email);
        showMessage(`✅ Password reset link sent to ${email}! Check your inbox and spam folder.`, 'success');
    } catch (error) {
        let errorMessage = '';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email format.';
                break;
            default:
                errorMessage = error.message;
        }
        showMessage(`❌ ${errorMessage}`, 'error');
    }
}

// ============ ADD "FORGOT PASSWORD?" LINK ============
// Add link after login button
const loginBtnElement = document.getElementById('loginBtn');
if (loginBtnElement && !document.getElementById('forgotPasswordLink')) {
    const forgotPasswordHtml = `
        <div class="forgot-password" style="text-align: center; margin-top: 15px;">
            <a href="#" id="forgotPasswordLink" style="color: #4CAF50; text-decoration: none;">Forgot Password?</a>
        </div>
    `;
    loginBtnElement.insertAdjacentHTML('afterend', forgotPasswordHtml);
    
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
        e.preventDefault();
        sendPasswordReset();
    });
}

// ============ LOGIN ============
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            let errorMessage = '';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found. Please sign up first.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format.';
                    break;
                default:
                    errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
}

// ============ SIGNUP ============
if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        if (!name || !email || !password || !confirmPassword) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating Account...';
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });
            showMessage('Account created! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            let errorMessage = '';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already registered. Please login.';
            } else {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        } finally {
            signupBtn.disabled = false;
            signupBtn.textContent = 'Sign Up';
        }
    });
}

// Check if already logged in
auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
});