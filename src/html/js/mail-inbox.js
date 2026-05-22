(function () {
    const api = window.SmartMediaDiskSendmailApi;
    let detailModal = null;
    let currentMessage = null;

    function getElement(id) {
        return document.getElementById(id);
    }

    function setStatus(message, isError) {
        const status = getElement('mail-inbox-status');
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

    function encodeMessage(message) {
        return escapeHtml(JSON.stringify(message));
    }

    function recipientText(recipients) {
        return (recipients || []).map((user) => user.mail_address).join('; ');
    }

    function renderRows(messages) {
        const body = getElement('mail-inbox-body');
        const rows = messages.map((message) => {
            const unreadClass = message.is_read ? '' : 'fw-semibold';
            const attachmentLabel = message.attachments.length ? `${message.attachments.length} 个附件` : '-';
            return `
                <tr class="${unreadClass}" data-open-message='${encodeMessage(message)}' tabindex="0" style="cursor: pointer;">
                    <td>${message.is_read ? '' : '<span class="badge text-bg-primary">新</span>'}</td>
                    <td>${escapeHtml(message.sender.mail_address)}</td>
                    <td>${escapeHtml(message.subject)}</td>
                    <td>${escapeHtml(attachmentLabel)}</td>
                    <td>${new Date(message.created_at).toLocaleString('zh-CN')}</td>
                </tr>
            `;
        });

        body.innerHTML = rows.join('') || '<tr><td colspan="5" class="text-center text-secondary py-4">收件箱为空</td></tr>';
        body.querySelectorAll('[data-open-message]').forEach((row) => {
            row.addEventListener('click', () => openMessage(JSON.parse(row.getAttribute('data-open-message'))));
            row.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    openMessage(JSON.parse(row.getAttribute('data-open-message')));
                }
            });
        });
    }

    function renderDetail(message) {
        currentMessage = message;
        getElement('mail-detail-subject').textContent = message.subject;
        getElement('mail-detail-meta').textContent = `发件人：${message.sender.mail_address} · ${new Date(message.created_at).toLocaleString('zh-CN')}`;
        getElement('mail-detail-to').textContent = recipientText(message.recipients.to) || '-';
        getElement('mail-detail-cc').textContent = recipientText(message.recipients.cc) || '-';
        getElement('mail-detail-bcc').textContent = recipientText(message.recipients.bcc) || '-';
        getElement('mail-detail-body').textContent = message.body || '';

        const attachmentRows = message.attachments.map((attachment) => {
            return `
                <tr>
                    <td>${escapeHtml(attachment.name)}</td>
                    <td>${formatSize(attachment.size)}</td>
                    <td>${escapeHtml(attachment.mime_type || '文件')}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary" type="button" data-save-attachment="${attachment.id}">保存到网盘</button>
                    </td>
                </tr>
            `;
        });
        getElement('mail-detail-attachments').innerHTML = attachmentRows.join('')
            || '<tr><td colspan="4" class="text-center text-secondary py-3">无附件</td></tr>';
        getElement('mail-detail-attachments').querySelectorAll('[data-save-attachment]').forEach((button) => {
            button.addEventListener('click', () => saveAttachment(Number(button.getAttribute('data-save-attachment'))));
        });
    }

    async function openMessage(message) {
        detailModal.show();
        renderDetail({
            ...message,
            body: '加载中...'
        });

        try {
            const data = await api.message(message.id);
            renderDetail(data.message);
            await loadInbox();
        } catch (error) {
            if (error.status === 401) {
                window.location.assign('/sign.html');
                return;
            }

            getElement('mail-detail-body').textContent = error.message;
        }
    }

    async function saveAttachment(attachmentId) {
        const path = window.prompt('保存到哪个网盘目录？', '/');
        if (path === null) {
            return;
        }

        const attachment = (currentMessage.attachments || []).find((item) => item.id === attachmentId);
        const name = window.prompt('保存为文件名', attachment ? attachment.name : '');
        if (name === null) {
            return;
        }

        try {
            setStatus('正在保存附件...', false);
            await api.saveAttachment(attachmentId, path, name);
            setStatus('附件已保存到网盘', false);
        } catch (error) {
            if (error.status === 401) {
                window.location.assign('/sign.html');
                return;
            }

            setStatus(error.message, true);
        }
    }

    async function loadInbox() {
        try {
            setStatus('加载中...', false);
            const data = await api.inbox();
            renderRows(data.messages);
            setStatus(`已加载 ${data.messages.length} 封邮件`, false);
        } catch (error) {
            if (error.status === 401) {
                window.location.assign('/sign.html');
                return;
            }

            renderRows([]);
            setStatus(error.message, true);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        detailModal = new bootstrap.Modal(getElement('mail-detail-modal'));
        getElement('mail-refresh-button').addEventListener('click', loadInbox);
        loadInbox();
    });
}());
