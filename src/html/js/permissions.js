const endpoints = {
    session: '/api/signin/session/',
    check: '/api/permissions/check/?node=permissions.table.edit',
    nodes: '/api/permissions/nodes/',
    users: '/api/permissions/users/',
    userPermissions: (id) => `/api/permissions/users/${id}/`
};
const state = {
    users: [],
    nodes: [],
    selectedUser: null,
    directPermissions: [],
    lockedPermissions: [],
    dirty: false
};
const elements = {
    userSelect: document.getElementById('userSelect'),
    userList: document.getElementById('userList'),
    userCount: document.getElementById('userCount'),
    nodeInput: document.getElementById('nodeInput'),
    knownNodes: document.getElementById('knownNodes'),
    addTrueButton: document.getElementById('addTrueButton'),
    addFalseButton: document.getElementById('addFalseButton'),
    saveButton: document.getElementById('saveButton'),
    permissionList: document.getElementById('permissionList'),
    messageArea: document.getElementById('messageArea'),
    editorTitle: document.getElementById('editorTitle'),
    editorSubtitle: document.getElementById('editorSubtitle'),
    trueCount: document.getElementById('trueCount'),
    falseCount: document.getElementById('falseCount'),
    lockedCount: document.getElementById('lockedCount')
};

function setMessage(message, stateName = 'secondary') {
    elements.messageArea.className = `alert alert-${stateName} m-3`;
    elements.messageArea.textContent = message;
    elements.messageArea.classList.toggle('d-none', !message);
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

async function assertCanEdit() {
    const session = await fetchJson(endpoints.session);
    if (!session.authenticated) {
        window.location.assign('/sign.html');
        return false;
    }

    const result = await fetchJson(endpoints.check);
    if (!result.allowed) {
        setMessage('当前用户没有 permissions.table.edit。', 'danger');
        return false;
    }

    return true;
}

function findNodeDefinition(node) {
    return state.nodes.find((item) => item.node === node);
}

function setControlsEnabled(enabled) {
    elements.userSelect.disabled = !enabled;
    elements.nodeInput.disabled = !enabled;
    elements.addTrueButton.disabled = !enabled;
    elements.addFalseButton.disabled = !enabled;
    elements.saveButton.disabled = !enabled || !state.selectedUser;
}

function markDirty() {
    state.dirty = true;
    elements.saveButton.classList.add('btn-warning');
    elements.saveButton.classList.remove('btn-primary');
}

function markClean() {
    state.dirty = false;
    elements.saveButton.classList.add('btn-primary');
    elements.saveButton.classList.remove('btn-warning');
}

function renderNodeOptions() {
    elements.knownNodes.replaceChildren();
    state.nodes.forEach((node) => {
        const option = document.createElement('option');
        option.value = node.node;
        option.label = node.label;
        elements.knownNodes.appendChild(option);
    });
}

function renderUsers() {
    elements.userSelect.replaceChildren();
    elements.userList.replaceChildren();
    elements.userCount.textContent = state.users.length;

    state.users.forEach((user) => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.username;
        elements.userSelect.appendChild(option);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        button.dataset.userId = user.id;

        const name = document.createElement('span');
        name.textContent = user.username;
        button.appendChild(name);

        const count = document.createElement('span');
        count.className = 'badge text-bg-light';
        count.textContent = user.is_root ? '*' : user.direct_permission_count;
        button.appendChild(count);

        button.addEventListener('click', () => {
            elements.userSelect.value = String(user.id);
            loadUser(user.id);
        });
        elements.userList.appendChild(button);
    });
}

function renderCounts() {
    const trueCount = state.directPermissions.filter((permission) => permission.value).length;
    const falseCount = state.directPermissions.filter((permission) => !permission.value).length;

    elements.trueCount.textContent = `true ${trueCount}`;
    elements.falseCount.textContent = `false ${falseCount}`;
    elements.lockedCount.textContent = `locked ${state.lockedPermissions.length}`;
}

function createStateToggle(permission, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'btn-group permission-state';
    wrapper.role = 'group';

    ['true', 'false'].forEach((stateName) => {
        const input = document.createElement('input');
        input.type = 'radio';
        input.className = 'btn-check';
        input.name = `permission-state-${index}`;
        input.id = `permission-state-${index}-${stateName}`;
        input.checked = permission.value === (stateName === 'true');

        const label = document.createElement('label');
        label.className = stateName === 'true' ? 'btn btn-outline-success btn-sm' : 'btn btn-outline-danger btn-sm';
        label.htmlFor = input.id;
        label.textContent = stateName;

        input.addEventListener('change', () => {
            permission.value = stateName === 'true';
            markDirty();
            renderCounts();
        });

        wrapper.appendChild(input);
        wrapper.appendChild(label);
    });

    return wrapper;
}

function createPermissionRow(permission, index, locked = false) {
    const definition = findNodeDefinition(permission.node);
    const row = document.createElement('div');
    row.className = `permission-row p-3 ${locked ? 'locked-row' : ''}`;

    const grid = document.createElement('div');
    grid.className = 'row g-3 align-items-center';
    row.appendChild(grid);

    const nodeCol = document.createElement('div');
    nodeCol.className = 'col-12 col-lg-5';
    const nodeInput = document.createElement('input');
    nodeInput.className = 'form-control permission-node-input';
    nodeInput.value = permission.node;
    nodeInput.disabled = locked;
    nodeInput.addEventListener('input', () => {
        permission.node = nodeInput.value.trim();
        markDirty();
    });
    nodeCol.appendChild(nodeInput);

    const description = document.createElement('div');
    description.className = 'node-description mt-1';
    description.textContent = definition ? definition.description : '自定义权限节点';
    nodeCol.appendChild(description);
    grid.appendChild(nodeCol);

    const categoryCol = document.createElement('div');
    categoryCol.className = 'col-6 col-lg-2';
    const category = document.createElement('span');
    category.className = 'badge text-bg-light permission-badge';
    category.textContent = locked ? '系统' : (definition ? definition.category : '自定义');
    categoryCol.appendChild(category);
    grid.appendChild(categoryCol);

    const valueCol = document.createElement('div');
    valueCol.className = 'col-6 col-lg-3';
    if (locked) {
        const badge = document.createElement('span');
        badge.className = 'badge text-bg-warning';
        badge.textContent = 'locked true';
        valueCol.appendChild(badge);
    } else {
        valueCol.appendChild(createStateToggle(permission, index));
    }
    grid.appendChild(valueCol);

    const actionCol = document.createElement('div');
    actionCol.className = 'col-12 col-lg-2 d-grid';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-outline-danger btn-sm';
    deleteButton.textContent = '删除';
    deleteButton.disabled = locked;
    deleteButton.addEventListener('click', () => {
        state.directPermissions.splice(index, 1);
        markDirty();
        renderPermissions();
    });
    actionCol.appendChild(deleteButton);
    grid.appendChild(actionCol);

    return row;
}

function renderPermissions() {
    elements.permissionList.replaceChildren();

    if (!state.selectedUser) {
        elements.editorTitle.textContent = '权限';
        elements.editorSubtitle.textContent = '未选择用户';
        renderCounts();
        return;
    }

    elements.editorTitle.textContent = state.selectedUser.username;
    elements.editorSubtitle.textContent = state.selectedUser.is_root ? 'root 拥有系统锁定的 * 权限' : '用户直接权限';

    state.lockedPermissions.forEach((permission, index) => {
        elements.permissionList.appendChild(createPermissionRow(permission, `locked-${index}`, true));
    });

    state.directPermissions.forEach((permission, index) => {
        elements.permissionList.appendChild(createPermissionRow(permission, index));
    });

    if (!state.lockedPermissions.length && !state.directPermissions.length) {
        const empty = document.createElement('div');
        empty.className = 'text-center text-muted py-5';
        empty.textContent = '没有直接权限。';
        elements.permissionList.appendChild(empty);
    }

    document.querySelectorAll('[data-user-id]').forEach((button) => {
        button.classList.toggle('active', button.dataset.userId === String(state.selectedUser.id));
    });
    renderCounts();
}

async function loadUser(userId) {
    setMessage('');
    const data = await fetchJson(endpoints.userPermissions(userId));
    state.selectedUser = data.user;
    state.directPermissions = data.direct_permissions.map((permission) => ({ ...permission }));
    state.lockedPermissions = data.locked_permissions || [];
    elements.userSelect.value = String(userId);
    markClean();
    renderPermissions();
    elements.saveButton.disabled = false;
}

function addPermission(value) {
    const node = elements.nodeInput.value.trim();
    if (!node || node === '*') {
        setMessage('请输入可编辑权限节点。', 'warning');
        return;
    }

    const existing = state.directPermissions.find((permission) => permission.node === node);
    if (existing) {
        existing.value = value;
    } else {
        state.directPermissions.push({
            node,
            value,
            source: 'user'
        });
    }

    elements.nodeInput.value = '';
    setMessage('');
    markDirty();
    renderPermissions();
}

async function savePermissions() {
    if (!state.selectedUser) {
        return;
    }

    elements.saveButton.disabled = true;
    setMessage('正在保存...', 'secondary');

    try {
        const permissions = state.directPermissions.map((permission) => ({
            node: permission.node.trim(),
            value: Boolean(permission.value)
        }));
        const data = await fetchJson(endpoints.userPermissions(state.selectedUser.id), {
            method: 'PUT',
            body: JSON.stringify({ permissions })
        });

        state.selectedUser = data.user;
        state.directPermissions = data.direct_permissions.map((permission) => ({ ...permission }));
        state.lockedPermissions = data.locked_permissions || [];
        markClean();
        setMessage('已保存。', 'success');
        await loadUsers();
        renderPermissions();
    } catch (error) {
        setMessage(error.message, 'danger');
    } finally {
        elements.saveButton.disabled = false;
    }
}

async function loadUsers() {
    const data = await fetchJson(endpoints.users);
    state.users = data.users;
    renderUsers();
}

async function boot() {
    setControlsEnabled(false);

    try {
        const canEdit = await assertCanEdit();
        if (!canEdit) {
            return;
        }

        const nodeData = await fetchJson(endpoints.nodes);
        state.nodes = nodeData.nodes;
        renderNodeOptions();
        await loadUsers();
        setControlsEnabled(true);

        if (state.users.length) {
            const params = new URLSearchParams(window.location.search);
            const requestedUserId = params.get('userId');
            const requestedUser = state.users.find((user) => String(user.id) === requestedUserId);
            await loadUser((requestedUser || state.users[0]).id);
        }
    } catch (error) {
        setMessage(error.message, 'danger');
    }
}

elements.userSelect.addEventListener('change', () => {
    loadUser(elements.userSelect.value);
});
elements.addTrueButton.addEventListener('click', () => addPermission(true));
elements.addFalseButton.addEventListener('click', () => addPermission(false));
elements.saveButton.addEventListener('click', savePermissions);
document.addEventListener('DOMContentLoaded', boot);
