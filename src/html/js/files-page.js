(function () {
    const api = window.SmartMediaDiskFilesApi;
    let currentPath = '/';

    function getElement(id) {
        return document.getElementById(id);
    }

    function setStatus(message, isError) {
        const status = getElement('files-status');
        status.textContent = message || '';
        status.className = `small ${isError ? 'text-danger' : 'text-secondary'}`;
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

    function normalizeDisplayPath(path) {
        if (!path || path === '/') {
            return '/';
        }

        return `/${String(path).split('/').filter(Boolean).join('/')}`;
    }

    function parentPath(path) {
        const parts = normalizeDisplayPath(path).split('/').filter(Boolean);
        parts.pop();
        return parts.length ? `/${parts.join('/')}` : '/';
    }

    function renderBreadcrumb(path) {
        const breadcrumb = getElement('files-breadcrumb');
        const parts = normalizeDisplayPath(path).split('/').filter(Boolean);
        const nodes = [
            '<li class="breadcrumb-item"><button class="btn btn-link p-0" data-path="/">根目录</button></li>'
        ];
        let built = '';

        parts.forEach((part, index) => {
            built += `/${part}`;
            const isLast = index === parts.length - 1;
            if (isLast) {
                nodes.push(`<li class="breadcrumb-item active" aria-current="page">${escapeHtml(part)}</li>`);
                return;
            }

            nodes.push(
                `<li class="breadcrumb-item"><button class="btn btn-link p-0" data-path="${escapeHtml(built)}">${escapeHtml(part)}</button></li>`
            );
        });

        breadcrumb.innerHTML = nodes.join('');
        breadcrumb.querySelectorAll('[data-path]').forEach((button) => {
            button.addEventListener('click', () => loadPath(button.getAttribute('data-path')));
        });
    }

    function renderRows(data) {
        const body = getElement('files-table-body');
        const rows = [];

        data.directories.forEach((directory) => {
            rows.push(renderRow(directory));
        });

        data.files.forEach((file) => {
            rows.push(renderRow(file));
        });

        body.innerHTML = rows.join('') || '<tr><td colspan="6" class="text-center text-secondary py-4">空目录</td></tr>';
        body.querySelectorAll('[data-action]').forEach((button) => {
            button.addEventListener('click', () => handleRowAction(button));
        });
    }

    function renderRow(item) {
        const icon = item.type === 'directory' ? 'bi-folder' : 'bi-file-earmark';
        const size = item.type === 'directory' ? '-' : formatSize(item.size);
        const meta = item.type === 'directory' ? '目录' : (item.mime_type || '文件');
        const ownerName = item.type === 'directory'
            ? ((item.created_by && item.created_by.username) || '-')
            : item.owner.username;
        const primary = item.type === 'file'
            ? `<a class="btn btn-sm btn-outline-secondary" href="${api.downloadUrl(item)}">下载</a>`
            : `<button class="btn btn-sm btn-outline-secondary" data-action="open" data-item='${encodeItem(item)}'>打开</button>`;

        return `
            <tr>
                <td>
                    <span class="d-inline-flex align-items-center gap-2">
                        <i class="bi ${icon}"></i>
                        <span>${escapeHtml(item.name)}</span>
                    </span>
                </td>
                <td>${escapeHtml(meta)}</td>
                <td>${size}</td>
                <td>${escapeHtml(ownerName)}</td>
                <td>${new Date(item.updated_at).toLocaleString('zh-CN')}</td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm" role="group">
                        ${primary}
                        <button class="btn btn-outline-secondary" data-action="rename" data-item='${encodeItem(item)}'>重命名</button>
                        <button class="btn btn-outline-secondary" data-action="move" data-item='${encodeItem(item)}'>移动</button>
                        <button class="btn btn-outline-danger" data-action="delete" data-item='${encodeItem(item)}'>删除</button>
                    </div>
                </td>
            </tr>
        `;
    }

    function encodeItem(item) {
        return escapeHtml(JSON.stringify(item));
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function readItem(button) {
        return JSON.parse(button.getAttribute('data-item'));
    }

    async function handleRowAction(button) {
        const action = button.getAttribute('data-action');
        const item = readItem(button);

        if (action === 'open') {
            await loadPath(item.path);
            return;
        }

        if (action === 'rename') {
            const name = window.prompt('新名称', item.name);
            if (!name || name === item.name) {
                return;
            }

            await runMutation(() => api.renameItem(item, name), '已重命名');
            return;
        }

        if (action === 'move') {
            const path = window.prompt('目标目录', parentPath(item.path));
            if (path === null) {
                return;
            }

            await runMutation(() => api.moveItem(item, path), '已移动');
            return;
        }

        if (action === 'delete') {
            const confirmed = window.confirm(`删除“${item.name}”？`);
            if (!confirmed) {
                return;
            }

            await runMutation(() => api.deleteItem(item), '已删除');
        }
    }

    async function runMutation(operation, successMessage) {
        try {
            setStatus('处理中...', false);
            await operation();
            setStatus(successMessage, false);
            await loadPath(currentPath);
        } catch (error) {
            setStatus(error.message, true);
        }
    }

    async function loadPath(path) {
        currentPath = normalizeDisplayPath(path);
        getElement('files-current-path').textContent = currentPath;
        renderBreadcrumb(currentPath);
        setStatus('加载中...', false);

        try {
            const data = await api.list(currentPath);
            renderRows(data);
            setStatus(`已加载 ${data.directories.length} 个目录，${data.files.length} 个文件`, false);
        } catch (error) {
            if (error.status === 401) {
                window.location.assign('/sign.html');
                return;
            }

            renderRows({ directories: [], files: [] });
            setStatus(error.message, true);
        }
    }

    async function handleUpload(event) {
        event.preventDefault();
        const fileInput = getElement('file-upload-input');
        const file = fileInput.files[0];
        if (!file) {
            setStatus('请选择文件', true);
            return;
        }

        await runMutation(() => api.upload(file, currentPath), '上传完成');
        fileInput.value = '';
    }

    async function handleCreateDirectory(event) {
        event.preventDefault();
        const input = getElement('directory-name-input');
        const name = input.value.trim();
        if (!name) {
            setStatus('请输入目录名', true);
            return;
        }

        await runMutation(() => api.createDirectory(currentPath, name), '目录已创建');
        input.value = '';
    }

    document.addEventListener('DOMContentLoaded', () => {
        getElement('upload-form').addEventListener('submit', handleUpload);
        getElement('directory-form').addEventListener('submit', handleCreateDirectory);
        getElement('files-up-button').addEventListener('click', () => loadPath(parentPath(currentPath)));
        loadPath('/');
    });
}());
