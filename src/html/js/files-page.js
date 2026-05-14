(function () {
    const api = window.SmartMediaDiskFilesApi;
    let currentPath = '/';
    let previewModal = null;
    let previewObjectUrl = '';

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
        body.querySelectorAll('[data-open-path]').forEach((row) => {
            row.addEventListener('dblclick', handleDirectoryRowDoubleClick);
            row.addEventListener('keydown', handleDirectoryRowKeydown);
        });
        body.querySelectorAll('[data-preview-item]').forEach((row) => {
            row.addEventListener('dblclick', handlePreviewRowDoubleClick);
            row.addEventListener('keydown', handlePreviewRowKeydown);
        });
    }

    function renderRow(item) {
        const icon = item.type === 'directory' ? 'bi-folder' : 'bi-file-earmark';
        const size = item.type === 'directory' ? '-' : formatSize(item.size);
        const meta = item.type === 'directory' ? '目录' : (item.mime_type || '文件');
        const canPreview = supportsPreview(item);
        const ownerName = item.type === 'directory'
            ? ((item.created_by && item.created_by.username) || '-')
            : item.owner.username;
        const primary = item.type === 'file'
            ? `${canPreview ? `<button class="btn btn-sm btn-outline-secondary" data-action="preview" data-item='${encodeItem(item)}'>预览</button>` : ''}<a class="btn btn-sm btn-outline-secondary" href="${api.downloadUrl(item)}">下载</a>`
            : '';
        let rowAttributes = item.type === 'directory'
            ? ` data-open-path="${escapeHtml(item.path)}" tabindex="0" title="双击打开目录" style="cursor: pointer;"`
            : '';
        if (canPreview) {
            rowAttributes = ` data-preview-item='${encodeItem(item)}' tabindex="0" title="双击预览文件" style="cursor: pointer;"`;
        }

        return `
            <tr${rowAttributes}>
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

    function getPreviewType(item) {
        if (item.type !== 'file') {
            return '';
        }

        const mimeType = String(item.mime_type || '').toLowerCase();
        const name = String(item.name || '').toLowerCase();
        const textExtensions = ['.css', '.csv', '.html', '.js', '.json', '.log', '.md', '.py', '.txt', '.xml', '.yaml', '.yml'];
        if (mimeType === 'text/csv' || mimeType === 'application/csv' || name.endsWith('.csv')) {
            return 'csv';
        }

        if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3' || name.endsWith('.mp3')) {
            return 'audio';
        }

        if (
            mimeType === 'application/pdf'
            || mimeType === 'application/msword'
            || mimeType === 'application/vnd.ms-excel'
            || mimeType === 'application/vnd.ms-powerpoint'
            || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            || ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf'].some((extension) => name.endsWith(extension))
        ) {
            return 'pdf';
        }

        if (mimeType === 'image/png' || name.endsWith('.png')) {
            return 'image';
        }

        if (
            mimeType.startsWith('text/')
            || ['application/json', 'application/xml', 'application/javascript'].includes(mimeType)
            || textExtensions.some((extension) => name.endsWith(extension))
        ) {
            return 'text';
        }

        return '';
    }

    function supportsPreview(item) {
        return Boolean(getPreviewType(item));
    }

    function handleDirectoryRowDoubleClick(event) {
        if (event.target.closest('button, a, input, select, textarea')) {
            return;
        }

        loadPath(event.currentTarget.getAttribute('data-open-path'));
    }

    function handleDirectoryRowKeydown(event) {
        if (event.key !== 'Enter') {
            return;
        }

        loadPath(event.currentTarget.getAttribute('data-open-path'));
    }

    function handlePreviewRowDoubleClick(event) {
        if (event.target.closest('button, a, input, select, textarea')) {
            return;
        }

        handlePreview(JSON.parse(event.currentTarget.getAttribute('data-preview-item')));
    }

    function handlePreviewRowKeydown(event) {
        if (event.key !== 'Enter') {
            return;
        }

        handlePreview(JSON.parse(event.currentTarget.getAttribute('data-preview-item')));
    }

    function readItem(button) {
        return JSON.parse(button.getAttribute('data-item'));
    }

    async function handleRowAction(button) {
        const action = button.getAttribute('data-action');
        const item = readItem(button);

        if (action === 'preview') {
            await handlePreview(item);
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

    async function handlePreview(item) {
        const title = getElement('file-preview-title');
        const meta = getElement('file-preview-meta');
        const text = getElement('file-preview-text');
        const content = getElement('file-preview-content');
        const imageWrap = getElement('file-preview-image-wrap');
        const image = getElement('file-preview-image');
        const csvWrap = getElement('file-preview-csv-wrap');
        const csvHead = getElement('file-preview-csv-head');
        const csvBody = getElement('file-preview-csv-body');
        const audioWrap = getElement('file-preview-audio-wrap');
        const audio = getElement('file-preview-audio');
        const pdfWrap = getElement('file-preview-pdf-wrap');
        const pdf = getElement('file-preview-pdf');
        const download = getElement('file-preview-download');

        title.textContent = item.name;
        meta.textContent = `${item.mime_type || 'text/plain'} · ${formatSize(item.size)}`;
        text.classList.remove('d-none');
        content.textContent = '加载中...';
        imageWrap.classList.add('d-none');
        image.removeAttribute('src');
        csvWrap.classList.add('d-none');
        clearCsvPreview(csvHead, csvBody);
        resetAudioPreview(audio, audioWrap);
        resetFramePreview(pdf, pdfWrap);
        download.href = api.downloadUrl(item);
        previewModal.show();

        try {
            const data = await api.previewItem(item);
            const preview = data.preview || {};
            await renderPreviewContent(preview, {
                content,
                audio,
                audioWrap,
                csvBody,
                csvHead,
                csvWrap,
                image,
                imageWrap,
                pdf,
                pdfWrap,
                text
            });
            meta.textContent = [
                item.mime_type || previewMimeType(preview),
                formatSize(item.size),
                preview.encoding ? `编码：${preview.encoding}` : '',
                preview.type === 'csv' ? `分隔符：${formatDelimiter(preview.delimiter)}` : '',
                preview.truncated_rows ? `仅显示前 ${preview.max_rows} 行` : '',
                preview.truncated ? `仅显示前 ${formatSize(preview.max_bytes)}` : ''
            ].filter(Boolean).join(' · ');
            setStatus(`正在预览 ${item.name}`, false);
        } catch (error) {
            if (error.status === 401) {
                window.location.assign('/sign.html');
                return;
            }

            text.classList.remove('d-none');
            imageWrap.classList.add('d-none');
            csvWrap.classList.add('d-none');
            clearCsvPreview(csvHead, csvBody);
            resetAudioPreview(audio, audioWrap);
            resetFramePreview(pdf, pdfWrap);
            content.textContent = error.message;
            meta.textContent = '无法预览';
            setStatus(error.message, true);
        }
    }

    async function renderPreviewContent(preview, elements) {
        if (preview.type === 'image') {
            elements.text.classList.add('d-none');
            elements.content.textContent = '';
            resetAudioPreview(elements.audio, elements.audioWrap);
            resetFramePreview(elements.pdf, elements.pdfWrap);
            elements.csvWrap.classList.add('d-none');
            clearCsvPreview(elements.csvHead, elements.csvBody);
            elements.image.src = preview.content_url;
            elements.imageWrap.classList.remove('d-none');
            return;
        }

        if (preview.type === 'audio') {
            elements.text.classList.add('d-none');
            elements.content.textContent = '';
            elements.imageWrap.classList.add('d-none');
            elements.image.removeAttribute('src');
            elements.csvWrap.classList.add('d-none');
            clearCsvPreview(elements.csvHead, elements.csvBody);
            resetFramePreview(elements.pdf, elements.pdfWrap);
            elements.audio.src = preview.content_url;
            elements.audioWrap.classList.remove('d-none');
            return;
        }

        if (preview.type === 'pdf') {
            elements.text.classList.add('d-none');
            elements.content.textContent = '';
            elements.imageWrap.classList.add('d-none');
            elements.image.removeAttribute('src');
            elements.csvWrap.classList.add('d-none');
            clearCsvPreview(elements.csvHead, elements.csvBody);
            resetAudioPreview(elements.audio, elements.audioWrap);
            const blob = await fetchPreviewContentBlob(preview.content_url);
            resetPreviewObjectUrl();
            previewObjectUrl = URL.createObjectURL(blob);
            elements.pdf.src = previewObjectUrl;
            elements.pdfWrap.classList.remove('d-none');
            return;
        }

        if (preview.type === 'csv') {
            elements.text.classList.add('d-none');
            elements.content.textContent = '';
            elements.imageWrap.classList.add('d-none');
            elements.image.removeAttribute('src');
            resetAudioPreview(elements.audio, elements.audioWrap);
            resetFramePreview(elements.pdf, elements.pdfWrap);
            renderCsvPreview(preview.rows || [], elements.csvHead, elements.csvBody);
            elements.csvWrap.classList.remove('d-none');
            return;
        }

        elements.imageWrap.classList.add('d-none');
        elements.image.removeAttribute('src');
        elements.csvWrap.classList.add('d-none');
        clearCsvPreview(elements.csvHead, elements.csvBody);
        resetAudioPreview(elements.audio, elements.audioWrap);
        resetFramePreview(elements.pdf, elements.pdfWrap);
        elements.text.classList.remove('d-none');
        elements.content.textContent = preview.content || '';
    }

    function renderCsvPreview(rows, head, body) {
        clearCsvPreview(head, body);
        if (!rows.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.className = 'text-center text-secondary py-4';
            cell.textContent = '空表格';
            row.appendChild(cell);
            body.appendChild(row);
            return;
        }

        const headerRow = document.createElement('tr');
        rows[0].forEach((value) => {
            const cell = document.createElement('th');
            cell.scope = 'col';
            cell.textContent = value;
            headerRow.appendChild(cell);
        });
        head.appendChild(headerRow);

        rows.slice(1).forEach((row) => {
            const tableRow = document.createElement('tr');
            row.forEach((value) => {
                const cell = document.createElement('td');
                cell.textContent = value;
                tableRow.appendChild(cell);
            });
            body.appendChild(tableRow);
        });
    }

    function clearCsvPreview(head, body) {
        head.textContent = '';
        body.textContent = '';
    }

    function previewMimeType(preview) {
        if (preview.type === 'image') {
            return 'image/png';
        }

        if (preview.type === 'csv') {
            return 'text/csv';
        }

        if (preview.type === 'audio') {
            return 'audio/mpeg';
        }

        if (preview.type === 'pdf') {
            return 'application/pdf';
        }

        return 'text/plain';
    }

    function formatDelimiter(delimiter) {
        if (delimiter === '\t') {
            return 'Tab';
        }

        return delimiter || '自动';
    }

    function resetAudioPreview(audio, audioWrap) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        audioWrap.classList.add('d-none');
    }

    function resetFramePreview(frame, frameWrap) {
        frame.removeAttribute('src');
        frameWrap.classList.add('d-none');
        resetPreviewObjectUrl();
    }

    async function fetchPreviewContentBlob(url) {
        if (api.previewContentBlob) {
            return api.previewContentBlob(url);
        }

        const response = await fetch(url, {
            credentials: 'same-origin'
        });
        if (response.ok) {
            return response.blob();
        }

        const contentType = response.headers.get('content-type') || '';
        let message = `Request failed with status ${response.status}.`;
        if (contentType.includes('application/json')) {
            const result = await response.json();
            message = result.message || message;
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    function resetPreviewObjectUrl() {
        if (!previewObjectUrl) {
            return;
        }

        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = '';
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
        previewModal = new bootstrap.Modal(getElement('file-preview-modal'));
        getElement('upload-form').addEventListener('submit', handleUpload);
        getElement('directory-form').addEventListener('submit', handleCreateDirectory);
        getElement('files-up-button').addEventListener('click', () => loadPath(parentPath(currentPath)));
        loadPath('/');
    });
}());
