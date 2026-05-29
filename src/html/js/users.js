const endpoints = {
    session: '/api/signin/session/',
    check: (node) => `/api/permissions/check/?node=${encodeURIComponent(node)}`,
    users: '/api/users/',
    create: '/api/users/create/',
    detail: (id) => `/api/users/${id}/`,
    password: (id) => `/api/users/${id}/password/`
};
const state = {
    users: [],
    selectedUser: null,
    permissions: {
        read: false,
        create: false,
        update: false,
        delete: false,
        password: false,
        permissionEdit: false
    }
};
const elements = {
    messageArea: document.getElementById('messageArea'),
    userList: document.getElementById('userList'),
    userCount: document.getElementById('userCount'),
    createPermissionBadge: document.getElementById('createPermissionBadge'),
    updatePermissionBadge: document.getElementById('updatePermissionBadge'),
    deletePermissionBadge: document.getElementById('deletePermissionBadge'),
    passwordPermissionBadge: document.getElementById('passwordPermissionBadge'),
    createForm: document.getElementById('createForm'),
    createUsername: document.getElementById('createUsername'),
    createEmail: document.getElementById('createEmail'),
    createPassword: document.getElementById('createPassword'),
    createQuotaValue: document.getElementById('createQuotaValue'),
    createQuotaUnit: document.getElementById('createQuotaUnit'),
    createActive: document.getElementById('createActive'),
    createSubmit: document.getElementById('createSubmit'),
    detailForm: document.getElementById('detailForm'),
    detailTitle: document.getElementById('detailTitle'),
    detailSubtitle: document.getElementById('detailSubtitle'),
    detailUsername: document.getElementById('detailUsername'),
    detailEmail: document.getElementById('detailEmail'),
    detailQuotaValue: document.getElementById('detailQuotaValue'),
    detailQuotaUnit: document.getElementById('detailQuotaUnit'),
    detailQuotaUnlimited: document.getElementById('detailQuotaUnlimited'),
    detailActive: document.getElementById('detailActive'),
    detailSubmit: document.getElementById('detailSubmit'),
    permissionLink: document.getElementById('permissionLink'),
    deleteButton: document.getElementById('deleteButton'),
    rootBadge: document.getElementById('rootBadge'),
    activeBadge: document.getElementById('activeBadge'),
    staffBadge: document.getElementById('staffBadge'),
    superuserBadge: document.getElementById('superuserBadge'),
    dateJoined: document.getElementById('dateJoined'),
    lastLogin: document.getElementById('lastLogin'),
    storageUsed: document.getElementById('storageUsed'),
    storageAvailable: document.getElementById('storageAvailable'),
    passwordForm: document.getElementById('passwordForm'),
    resetPassword: document.getElementById('resetPassword'),
    passwordSubmit: document.getElementById('passwordSubmit')
};

function setMessage(message, stateName = 'secondary') {
    elements.messageArea.className = `alert alert-${stateName}`;
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

function formatQuota(storage) {
    if (!storage || storage.is_unlimited) {
        return '不限容量';
    }

    return formatSize(storage.quota_bytes);
}

function pickQuotaUnit(bytes) {
    const units = [1099511627776, 1073741824, 1048576];
    return units.find((unit) => bytes >= unit && bytes % unit === 0) || 1048576;
}

function trimNumber(value) {
    return String(Number(value.toFixed(2))).replace(/\.0+$/, '');
}

function renderQuotaInputs(storage) {
    if (!storage || storage.is_unlimited) {
        elements.detailQuotaUnlimited.checked = true;
        elements.detailQuotaValue.value = '';
        elements.detailQuotaUnit.value = '1048576';
        return;
    }

    const unit = pickQuotaUnit(Number(storage.quota_bytes));
    elements.detailQuotaUnlimited.checked = false;
    elements.detailQuotaUnit.value = String(unit);
    elements.detailQuotaValue.value = trimNumber(Number(storage.quota_bytes) / unit);
}

function readQuotaBytes(valueElement, unitElement, unlimitedElement = null) {
    if (unlimitedElement && unlimitedElement.checked) {
        return null;
    }

    const rawValue = valueElement.value.trim();
    if (!rawValue) {
        return null;
    }

    const quotaValue = Number(rawValue);
    if (!Number.isFinite(quotaValue) || quotaValue < 0) {
        throw new Error('容量必须是非负数字。');
    }

    return Math.round(quotaValue * Number(unitElement.value));
}

function syncDetailQuotaControls(canEdit) {
    elements.detailQuotaUnlimited.disabled = !canEdit;
    elements.detailQuotaValue.disabled = !canEdit || elements.detailQuotaUnlimited.checked;
    elements.detailQuotaUnit.disabled = !canEdit || elements.detailQuotaUnlimited.checked;
}

function setPermissionBadge(element, allowed) {
    element.className = allowed ? 'badge text-bg-success' : 'badge text-bg-secondary';
    element.textContent = allowed ? '已授权' : '无权限';
}

function setBooleanBadge(element, label, value, enabledClass = 'text-bg-info') {
    element.className = value ? `badge ${enabledClass}` : 'badge text-bg-secondary';
    element.textContent = `${label} ${Boolean(value)}`;
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

async function checkPermission(node) {
    const data = await fetchJson(endpoints.check(node));
    return Boolean(data.allowed);
}

function renderPermissionState() {
    setPermissionBadge(elements.createPermissionBadge, state.permissions.create);
    setPermissionBadge(elements.updatePermissionBadge, state.permissions.update);
    setPermissionBadge(elements.deletePermissionBadge, state.permissions.delete);
    setPermissionBadge(elements.passwordPermissionBadge, state.permissions.password);

    elements.createUsername.disabled = !state.permissions.create;
    elements.createEmail.disabled = !state.permissions.create;
    elements.createPassword.disabled = !state.permissions.create;
    elements.createQuotaValue.disabled = !state.permissions.create;
    elements.createQuotaUnit.disabled = !state.permissions.create;
    elements.createActive.disabled = !state.permissions.create;
    elements.createSubmit.disabled = !state.permissions.create;
}

function renderUsers() {
    elements.userList.replaceChildren();
    elements.userCount.textContent = state.users.length;

    state.users.forEach((user) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'list-group-item list-group-item-action user-list-button';
        button.dataset.userId = user.id;

        const top = document.createElement('div');
        top.className = 'd-flex justify-content-between align-items-center';
        const name = document.createElement('strong');
        name.textContent = user.username;
        top.appendChild(name);

        const badge = document.createElement('span');
        badge.className = user.is_active ? 'badge text-bg-success' : 'badge text-bg-secondary';
        badge.textContent = user.is_active ? '启用' : '停用';
        top.appendChild(badge);
        button.appendChild(top);

        const meta = document.createElement('div');
        meta.className = 'user-meta mt-1';
        meta.textContent = `${user.email || `ID ${user.id}`} · ${formatQuota(user.storage)}`;
        button.appendChild(meta);

        button.addEventListener('click', () => selectUser(user.id));
        elements.userList.appendChild(button);
    });
}

function renderDetail() {
    const user = state.selectedUser;
    const canEdit = Boolean(user && state.permissions.update);
    const canRename = Boolean(canEdit && !user.is_root);
    const canDelete = Boolean(user && state.permissions.delete && !user.is_root);
    const canResetPassword = Boolean(user && state.permissions.password);
    const canOpenPermissions = Boolean(user && state.permissions.permissionEdit);

    if (!user) {
        elements.detailTitle.textContent = '用户资料';
        elements.detailSubtitle.textContent = '未选择用户';
        elements.detailUsername.value = '';
        elements.detailEmail.value = '';
        renderQuotaInputs(null);
        elements.detailActive.checked = false;
        elements.dateJoined.textContent = '-';
        elements.lastLogin.textContent = '-';
        elements.storageUsed.textContent = '-';
        elements.storageAvailable.textContent = '-';
    } else {
        elements.detailTitle.textContent = user.username;
        elements.detailSubtitle.textContent = user.is_root ? 'root 用户不能被删除或更名' : `用户 ID ${user.id}`;
        elements.detailUsername.value = user.username;
        elements.detailEmail.value = user.email || '';
        renderQuotaInputs(user.storage);
        elements.detailActive.checked = user.is_active;
        elements.dateJoined.textContent = formatDate(user.date_joined);
        elements.lastLogin.textContent = formatDate(user.last_login);
        elements.storageUsed.textContent = formatSize(user.storage.used_bytes);
        elements.storageAvailable.textContent = user.storage.is_unlimited
            ? '不限'
            : formatSize(user.storage.available_bytes);
    }

    setBooleanBadge(elements.rootBadge, 'root', user && user.is_root, 'text-bg-warning');
    setBooleanBadge(elements.activeBadge, 'active', user && user.is_active, 'text-bg-success');
    setBooleanBadge(elements.staffBadge, 'staff', user && user.is_staff, 'text-bg-info');
    setBooleanBadge(elements.superuserBadge, 'superuser', user && user.is_superuser, 'text-bg-warning');

    elements.detailUsername.disabled = !canRename;
    elements.detailEmail.disabled = !canEdit;
    syncDetailQuotaControls(canEdit);
    elements.detailActive.disabled = !canEdit || user.is_root;
    elements.detailSubmit.disabled = !canEdit;
    elements.deleteButton.disabled = !canDelete;
    elements.resetPassword.disabled = !canResetPassword;
    elements.passwordSubmit.disabled = !canResetPassword;

    if (canOpenPermissions) {
        elements.permissionLink.href = `/permissions.html?userId=${encodeURIComponent(user.id)}`;
        elements.permissionLink.classList.remove('disabled');
        elements.permissionLink.removeAttribute('aria-disabled');
    } else {
        elements.permissionLink.href = '/permissions.html';
        elements.permissionLink.classList.add('disabled');
        elements.permissionLink.setAttribute('aria-disabled', 'true');
    }

    document.querySelectorAll('[data-user-id]').forEach((button) => {
        button.classList.toggle('active', user && button.dataset.userId === String(user.id));
    });
}

function selectUser(userId) {
    state.selectedUser = state.users.find((user) => String(user.id) === String(userId)) || null;
    setMessage('');
    renderDetail();
}

async function loadUsers(preferredUserId = null) {
    const data = await fetchJson(endpoints.users);
    state.users = data.users;
    renderUsers();

    const selectedStillExists = state.selectedUser
        && state.users.find((user) => user.id === state.selectedUser.id);
    const nextUser = state.users.find((user) => String(user.id) === String(preferredUserId))
        || selectedStillExists
        || state.users[0]
        || null;
    state.selectedUser = nextUser;
    renderDetail();
}

async function loadPermissions() {
    state.permissions.read = await checkPermission('users.read');
    state.permissions.create = await checkPermission('users.create');
    state.permissions.update = await checkPermission('users.update');
    state.permissions.delete = await checkPermission('users.delete');
    state.permissions.password = await checkPermission('users.password.reset');
    state.permissions.permissionEdit = await checkPermission('permissions.table.edit');
    renderPermissionState();
}

async function boot() {
    try {
        const session = await fetchJson(endpoints.session);
        if (!session.authenticated) {
            window.location.assign('/sign.html');
            return;
        }

        await loadPermissions();
        if (!state.permissions.read) {
            setMessage('当前用户没有 users.read。', 'danger');
            return;
        }

        const params = new URLSearchParams(window.location.search);
        await loadUsers(params.get('userId'));
    } catch (error) {
        setMessage(error.message, 'danger');
    }
}

elements.createForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = elements.createUsername.value.trim();
    const password = elements.createPassword.value;
    if (!username || !password) {
        setMessage('请填写用户名和初始密码。', 'warning');
        return;
    }

    elements.createSubmit.disabled = true;
    try {
        const quotaBytes = readQuotaBytes(elements.createQuotaValue, elements.createQuotaUnit);
        const data = await fetchJson(endpoints.create, {
            method: 'POST',
            body: JSON.stringify({
                username,
                email: elements.createEmail.value.trim(),
                password,
                quotaBytes,
                isActive: elements.createActive.checked
            })
        });
        elements.createForm.reset();
        elements.createActive.checked = true;
        setMessage('用户已创建。', 'success');
        await loadUsers(data.user.id);
    } catch (error) {
        setMessage(error.message, 'danger');
    } finally {
        elements.createSubmit.disabled = !state.permissions.create;
    }
});

elements.detailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const user = state.selectedUser;
    if (!user) {
        return;
    }

    elements.detailSubmit.disabled = true;
    try {
        const quotaBytes = readQuotaBytes(
            elements.detailQuotaValue,
            elements.detailQuotaUnit,
            elements.detailQuotaUnlimited
        );
        const data = await fetchJson(endpoints.detail(user.id), {
            method: 'PUT',
            body: JSON.stringify({
                username: elements.detailUsername.value.trim(),
                email: elements.detailEmail.value.trim(),
                quotaBytes,
                isActive: elements.detailActive.checked
            })
        });
        setMessage('用户资料已保存。', 'success');
        await loadUsers(data.user.id);
    } catch (error) {
        setMessage(error.message, 'danger');
    } finally {
        renderDetail();
    }
});

elements.passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const user = state.selectedUser;
    const newPassword = elements.resetPassword.value;
    if (!user || !newPassword) {
        setMessage('请填写新密码。', 'warning');
        return;
    }

    elements.passwordSubmit.disabled = true;
    try {
        await fetchJson(endpoints.password(user.id), {
            method: 'POST',
            body: JSON.stringify({ newPassword })
        });
        elements.passwordForm.reset();
        setMessage('密码已重置。', 'success');
    } catch (error) {
        setMessage(error.message, 'danger');
    } finally {
        renderDetail();
    }
});

elements.deleteButton.addEventListener('click', async () => {
    const user = state.selectedUser;
    if (!user || user.is_root) {
        return;
    }

    const confirmed = window.confirm(`确定删除用户 ${user.username} 吗？`);
    if (!confirmed) {
        return;
    }

    elements.deleteButton.disabled = true;
    try {
        await fetchJson(endpoints.detail(user.id), {
            method: 'DELETE'
        });
        setMessage('用户已删除。', 'success');
        state.selectedUser = null;
        await loadUsers();
    } catch (error) {
        setMessage(error.message, 'danger');
    } finally {
        renderDetail();
    }
});

elements.detailQuotaUnlimited.addEventListener('change', () => {
    syncDetailQuotaControls(Boolean(state.selectedUser && state.permissions.update));
});

document.addEventListener('DOMContentLoaded', boot);
