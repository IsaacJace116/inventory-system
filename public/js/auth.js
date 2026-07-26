const API_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');

if (authToken) {
    window.location.href = '/dashboard';
}

document.querySelectorAll('.toggle-form').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const formName = e.target.dataset.form;
        showForm(formName);
    });
});

function showForm(formName) {
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(formName + 'Form').classList.add('active');
    clearErrors();
}

function clearErrors() {
    document.querySelectorAll('[id$="Error"]').forEach(el => {
        el.style.display = 'none';
    });
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userName', data.name);
            window.location.href = '/dashboard';
        } else {
            showError('loginError', data.error);
        }
    } catch (error) {
        showError('loginError', 'Connection error. Please try again.');
    }
});

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showError('registerError', 'Passwords do not match');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('registerSuccess').textContent = 'Account created successfully! Redirecting...';
            document.getElementById('registerSuccess').style.display = 'block';
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userName', name);
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else {
            showError('registerError', data.error);
        }
    } catch (error) {
        showError('registerError', 'Connection error. Please try again.');
    }
});

// Forgot Password
document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;

    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('forgotPasswordSuccess').textContent = 'Reset token created. You can now reset your password.';
            document.getElementById('forgotPasswordSuccess').style.display = 'block';
            document.getElementById('resetToken').value = data.resetToken;
            setTimeout(() => {
                showForm('reset-password');
            }, 2000);
        } else {
            showError('forgotPasswordError', data.error);
        }
    } catch (error) {
        showError('forgotPasswordError', 'Connection error. Please try again.');
    }
});

// Reset Password
document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = document.getElementById('resetToken').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        showError('resetPasswordError', 'Passwords do not match');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('resetPasswordSuccess').textContent = 'Password reset successfully! Redirecting...';
            document.getElementById('resetPasswordSuccess').style.display = 'block';
            setTimeout(() => {
                showForm('login');
                document.getElementById('login-form').reset();
            }, 2000);
        } else {
            showError('resetPasswordError', data.error);
        }
    } catch (error) {
        showError('resetPasswordError', 'Connection error. Please try again.');
    }
});

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => {
        el.style.display = 'none';
    }, 5000);
}
