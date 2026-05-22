(function () {
    const mailApi = window.SmartMediaDiskSendmailApi;
    const filesApi = window.SmartMediaDiskFilesApi;
    const selectedAttachments = new Map();
    let pickerPath = '/';
    let pickerModal = null;

    function getElement(id) {
        return document.getElementById(id);
    }

    function setStatus(message, isError) {
        const status = getElement('mail-compose-status');
        status.textContent = message || '';
        status.className = `small ${isError ? 'text-danger' : 'text-secondary'}`;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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

    function encodeItem(item) {
        return escapeHtml(JSON.stringify(item));
    }

    function renderSelectedAttachments() {
        const body = getElement('mail-attachments-body');
        const rows = Array.from(selectedAttachments.values()).map((file, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(file.name)}</td>
                    <td>${formatSize(file.size)}</td>
                    <td>${new Date(file.updated_at).toLocaleString('zh-CN')}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger" type="button" data-remove-attachment="${file.id}">移除</button>
                    </td>
                </tr>
            `;
        });

        body.innerHTML = rows.join('') || '<tr><td colspan="5" class="text-center text-secondary py-4">还没有文件</td></tr>';
        body.querySelectorAll('[data-remove-attachment]').forEach((button) => {
            button.addEventListener('click', () => {
                selectedAttachments.delete(Number(button.getAttribute('data-remove-attachment')));
                renderSelectedAttachments();
            });
        });
    }

    function renderPickerRows(data) {
        const body = getElement('mail-file-picker-body');
        const rows = [];

        data.directories.forEach((directory) => {
            rows.push(`
                <tr data-open-path="${escapeHtml(directory.path)}" tabindex="0" style="cursor: pointer;">
                    <td></td>
                    <td><i class="bi bi-folder me-2"></i>${escapeHtml(directory.name)}</td>
                    <td>目录</td>
                    <td>-</td>
                </tr>
            `);
        });

        data.files.forEach((file) => {
            rows.push(`
                <tr>
                    <td>
                        <input class="form-check-input" type="checkbox" data-picker-file='${encodeItem(file)}' ${selectedAttachments.has(file.id) ? 'checked' : ''}>
                    </td>
                    <td><i class="bi bi-file-earmark me-2"></i>${escapeHtml(file.name)}</td>
                    <td>${escapeHtml(file.mime_type || '文件')}</td>
                    <td>${formatSize(file.size)}</td>
                </tr>
            `);
        });

        body.innerHTML = rows.join('') || '<tr><td colspan="4" class="text-center text-secondary py-4">空目录</td></tr>';
        body.querySelectorAll('[data-open-path]').forEach((row) => {
            row.addEventListener('dblclick', () => loadPickerPath(row.getAttribute('data-open-path')));
            row.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    loadPickerPath(row.getAttribute('data-open-path'));
                }
            });
        });
        body.querySelectorAll('[data-picker-file]').forEach((input) => {
            input.addEventListener('change', () => {
                const file = JSON.parse(input.getAttribute('data-picker-file'));
                if (input.checked) {
                    selectedAttachments.set(file.id, file);
                    return;
                }

                selectedAttachments.delete(file.id);
            });
        });
    }

    async function loadPickerPath(path) {
        pickerPath = normalizeDisplayPath(path);
        getElement('mail-file-picker-path').textContent = pickerPath;
        getElement('mail-file-picker-status').textContent = '加载中...';

        try {
            const data = await filesApi.list(pickerPath);
            renderPickerRows(data);
            getElement('mail-file-picker-status').textContent = `已加载 ${data.directories.length} 个目录，${data.files.length} 个文件`;
        } catch (error) {
            if (error.status === 401) {
                window.location.assign('/sign.html');
                return;
            }

            renderPickerRows({ directories: [], files: [] });
            getElement('mail-file-picker-status').textContent = error.message;
        }
    }

    async function loadUsers() {
        try {
            const data = await mailApi.users();
            const options = data.users.map((user) => {
                return `<option value="${escapeHtml(user.mail_address)}">${escapeHtml(user.username)}</option>`;
            });
            getElement('mail-user-options').innerHTML = options.join('');
        } catch (error) {
            setStatus(error.message, true);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const payload = {
            to: getElement('mail-to').value,
            cc: getElement('mail-cc').value,
            bcc: getElement('mail-bcc').value,
            subject: getElement('mail-subject').value,
            body: getElement('mail-body').value,
            attachment_ids: Array.from(selectedAttachments.keys())
        };

        try {
            setStatus('正在发送...', false);
            await mailApi.send(payload);
            getElement('mail-compose-form').reset();
            selectedAttachments.clear();
            renderSelectedAttachments();
            setStatus('邮件已发送', false);
        } catch (error) {
            if (error.status === 401) {
                window.location.assign('/sign.html');
                return;
            }

            setStatus(error.message, true);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        pickerModal = new bootstrap.Modal(getElement('mail-file-picker-modal'));
        getElement('mail-compose-form').addEventListener('submit', handleSubmit);
        getElement('mail-pick-files-button').addEventListener('click', async () => {
            pickerModal.show();
            await loadPickerPath(pickerPath);
        });
        getElement('mail-file-picker-up').addEventListener('click', () => loadPickerPath(parentPath(pickerPath)));
        getElement('mail-file-picker-add').addEventListener('click', () => {
            renderSelectedAttachments();
            pickerModal.hide();
        });

        renderSelectedAttachments();
        loadUsers();
    });
}());
