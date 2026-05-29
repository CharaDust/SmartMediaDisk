const endpoints = {
    account: '/api/account/',
    username: '/api/account/username/',
    password: '/api/account/password/',
    navbarTitle: '/api/account/navbar-title/update/'
};
const storageKey = 'smartMediaDiskUser';
const elements = {
    messageArea: document.getElementById('messageArea'),
    accountId: document.getElementById('accountId'),
    accountUsername: document.getElementById('accountUsername'),
    accountEmail: document.getElementById('accountEmail'),
    accountQuota: document.getElementById('accountQuota'),
    accountStorageUsage: document.getElementById('accountStorageUsage'),
    staffBadge: document.getElementById('staffBadge'),
    superuserBadge: document.getElementById('superuserBadge'),
    accountJoined: document.getElementById('accountJoined'),
    accountLastLogin: document.getElementById('accountLastLogin'),
    usernamePermissionBadge: document.getElementById('usernamePermissionBadge'),
    navbarTitlePermissionBadge: document.getElementById('navbarTitlePermissionBadge'),
    passwordPermissionBadge: document.getElementById('passwordPermissionBadge'),
    usernameForm: document.getElementById('usernameForm'),
    newUsername: document.getElementById('newUsername'),
    usernameSubmit: document.getElementById('usernameSubmit'),
    navbarTitleForm: document.getElementById('navbarTitleForm'),
    navbarTitle: document.getElementById('navbarTitle'),
    navbarTitleSubmit: document.getElementById('navbarTitleSubmit'),
    passwordForm: document.getElementById('passwordForm'),
    oldPassword: document.getElementById('oldPassword'),
    newPassword: document.getElementById('newPassword'),
    passwordSubmit: document.getElementById('passwordSubmit')
};

function setMessage(message, state = 'secondary') {
    elements.messageArea.className = `alert alert-${state}`;
    elements.messageArea.textContent = message;
    elements.messageArea.classList.toggle('d-none', !message);
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('zh-CN');
}

function formatSize(size) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = Number(size) || 0;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
    }

    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function renderStorage(storage) {
    if (!storage) {
        elements.accountQuota.textContent = '-';
        elements.accountStorageUsage.textContent = '-';
        return;
    }

    elements.accountQuota.textContent = storage.is_unlimited ? '不限容量' : formatSize(storage.quota_bytes);
    const available = storage.is_unlimited ? '不限' : formatSize(storage.available_bytes);
    elements.accountStorageUsage.textContent = `${formatSize(storage.used_bytes)} / ${available}`;
}

function setPermissionBadge(element, allowed) {
    element.className = allowed ? 'badge text-bg-success' : 'badge text-bg-secondary';
    element.textContent = allowed ? '已授权' : '无权限';
}

function renderNavbarTitle(title) {
    document.querySelectorAll('[data-navbar-title]').forEach((element) => {
        element.textContent = title;
    });
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || '请求失败。');
    }

    return result.data;
}

function leaveForSignIn(message) {
    localStorage.removeItem(storageKey);
    setMessage(message, 'success');
    window.setTimeout(() => {
        window.location.assign('/sign.html');
    }, 700);
}

function renderAccount(account) {
    elements.accountId.textContent = account.id;
    elements.accountUsername.textContent = account.username;
    elements.accountEmail.textContent = account.email || '-';
    renderStorage(account.storage);
    elements.staffBadge.textContent = `staff ${account.is_staff}`;
    elements.staffBadge.className = account.is_staff ? 'badge text-bg-info' : 'badge text-bg-secondary';
    elements.superuserBadge.textContent = `superuser ${account.is_superuser}`;
    elements.superuserBadge.className = account.is_superuser ? 'badge text-bg-warning' : 'badge text-bg-secondary';
    elements.accountJoined.textContent = formatDate(account.date_joined);
    elements.accountLastLogin.textContent = formatDate(account.last_login);
    elements.newUsername.value = account.username;
    elements.navbarTitle.value = (account.settings && account.settings.navbar_title) || 'Media Cube';
    renderNavbarTitle(elements.navbarTitle.value);

    const canUpdateUsername = account.permissions.can_update_username;
    const canUpdatePassword = account.permissions.can_update_password;
    const canUpdateNavbarTitle = account.permissions.can_update_navbar_title;

    setPermissionBadge(elements.usernamePermissionBadge, canUpdateUsername);
    setPermissionBadge(elements.navbarTitlePermissionBadge, canUpdateNavbarTitle);
    setPermissionBadge(elements.passwordPermissionBadge, canUpdatePassword);
    if (account.username === 'root') {
        elements.usernamePermissionBadge.className = 'badge text-bg-warning';
        elements.usernamePermissionBadge.textContent = 'root 锁定';
    }

    elements.newUsername.disabled = !canUpdateUsername;
    elements.usernameSubmit.disabled = !canUpdateUsername;
    elements.navbarTitle.disabled = !canUpdateNavbarTitle;
    elements.navbarTitleSubmit.disabled = !canUpdateNavbarTitle;
    elements.oldPassword.disabled = !canUpdatePassword;
    elements.newPassword.disabled = !canUpdatePassword;
    elements.passwordSubmit.disabled = !canUpdatePassword;
}

async function loadAccount() {
    try {
        const data = await fetchJson(endpoints.account);
        renderAccount(data.account);
    } catch (error) {
        if (error.message === 'Authentication required.') {
            window.location.assign('/sign.html');
            return;
        }

        setMessage(error.message, 'danger');
    }
}

elements.usernameForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = elements.newUsername.value.trim();
    if (!username) {
        setMessage('请填写新用户名。', 'warning');
        return;
    }

    elements.usernameSubmit.disabled = true;
    try {
        await fetchJson(endpoints.username, {
            method: 'POST',
            body: JSON.stringify({ username })
        });
        leaveForSignIn('用户名已修改，请使用新用户名重新登录。');
    } catch (error) {
        setMessage(error.message, 'danger');
        elements.usernameSubmit.disabled = false;
    }
});

elements.navbarTitleForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const navbarTitle = elements.navbarTitle.value.trim();
    if (!navbarTitle) {
        setMessage('请填写导航栏标题。', 'warning');
        return;
    }

    elements.navbarTitleSubmit.disabled = true;
    try {
        const data = await fetchJson(endpoints.navbarTitle, {
            method: 'POST',
            body: JSON.stringify({ navbarTitle })
        });
        elements.navbarTitle.value = data.navbar_title;
        renderNavbarTitle(data.navbar_title);
        setMessage('导航栏标题已更新。', 'success');
    } catch (error) {
        setMessage(error.message, 'danger');
    } finally {
        elements.navbarTitleSubmit.disabled = elements.navbarTitle.disabled;
    }
});

elements.passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const oldPassword = elements.oldPassword.value;
    const newPassword = elements.newPassword.value;
    if (!oldPassword || !newPassword) {
        setMessage('请填写旧密码和新密码。', 'warning');
        return;
    }

    elements.passwordSubmit.disabled = true;
    try {
        await fetchJson(endpoints.password, {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        });
        leaveForSignIn('密码已修改，请使用新密码重新登录。');
    } catch (error) {
        setMessage(error.message, 'danger');
        elements.passwordSubmit.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', loadAccount);
