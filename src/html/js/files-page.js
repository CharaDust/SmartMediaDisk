(function () {
    const api = window.SmartMediaDiskFilesApi;
    const mailApi = window.SmartMediaDiskSendmailApi;
    let currentPath = '/';
    let currentSearch = '';
    let searchTimer = null;
    let previewModal = null;
    let previewModalVisible = false;
    let previewObjectUrl = '';
    const audioPreviewState = {
        animationFrame: 0,
        audio: null,
        canvas: null,
        duration: 0,
        fileName: '',
        sampleRate: 0,
        samples: null,
        status: null
    };
    const lastPreviewStorageKey = 'smartMediaDiskLastPreview';
    const recentPreviewStorageKey = 'smartMediaDiskRecentPreviews';

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

    function formatTime(seconds) {
        const totalSeconds = Math.max(Math.floor(Number(seconds) || 0), 0);
        const minutes = Math.floor(totalSeconds / 60);
        const remainder = totalSeconds % 60;
        return `${minutes}:${String(remainder).padStart(2, '0')}`;
    }

    function formatQuota(storage) {
        if (!storage || storage.is_unlimited) {
            return '不限容量';
        }

        return formatSize(storage.quota_bytes);
    }

    function storagePercent(storage) {
        if (!storage || storage.is_unlimited || !storage.quota_bytes) {
            return 0;
        }

        return Math.min(Math.round((Number(storage.used_bytes) / Number(storage.quota_bytes)) * 100), 100);
    }

    function setGlobalStorageVisible(visible) {
        getElement('storage-global-logical-wrap').classList.toggle('d-none', !visible);
        getElement('storage-global-physical-wrap').classList.toggle('d-none', !visible);
    }

    function renderStorageSummary(data) {
        const storage = data.storage || {};
        const percent = storagePercent(storage);
        const progress = getElement('storage-progress');

        getElement('storage-quota').textContent = formatQuota(storage);
        getElement('storage-used').textContent = formatSize(storage.used_bytes);
        getElement('storage-available').textContent = storage.is_unlimited
            ? '不限'
            : formatSize(storage.available_bytes);

        progress.style.width = `${percent}%`;
        progress.textContent = storage.is_unlimited ? '不限容量' : `${percent}%`;
        progress.parentElement.setAttribute('aria-valuenow', String(percent));
        progress.className = `progress-bar ${percent >= 90 ? 'bg-danger' : percent >= 70 ? 'bg-warning text-dark' : ''}`;

        if (data.global_storage) {
            const globalStorage = data.global_storage;
            getElement('storage-global-logical').textContent = formatSize(globalStorage.logical_bytes);
            getElement('storage-global-physical').textContent = `${formatSize(globalStorage.physical_bytes)} · 节省 ${formatSize(globalStorage.deduplicated_saved_bytes)}`;
            setGlobalStorageVisible(true);
        } else {
            setGlobalStorageVisible(false);
        }
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

        const emptyMessage = currentSearch ? '没有匹配的文件或目录' : '空目录';
        body.innerHTML = rows.join('') || `<tr><td colspan="6" class="text-center text-secondary py-4">${emptyMessage}</td></tr>`;
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
            ? `${canPreview ? `<button class="btn btn-sm btn-outline-secondary" data-action="preview" data-item='${encodeItem(item)}'>预览</button>` : ''}<a class="btn btn-sm btn-outline-secondary" href="${api.downloadUrl(item)}">下载</a><button class="btn btn-sm btn-outline-secondary" data-action="share" data-item='${encodeItem(item)}'>分享</button>`
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

    function writeLastPreview(item, preview, previewImageUrl) {
        const record = {
            id: item.id,
            item,
            mimeType: item.mime_type || '',
            name: item.name,
            path: item.path || '',
            previewType: preview.type || '',
            previewImageUrl: previewImageUrl || '',
            size: item.size || 0,
            previewedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(lastPreviewStorageKey, JSON.stringify(record));
            const recent = JSON.parse(localStorage.getItem(recentPreviewStorageKey) || '[]');
            const nextRecent = [
                record,
                ...recent.filter((entry) => entry && entry.id !== record.id)
            ].slice(0, 24);
            localStorage.setItem(recentPreviewStorageKey, JSON.stringify(nextRecent));
        } catch (error) {
            // Ignore storage failures so previewing files still works in private browsing modes.
        }
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

        if (action === 'share') {
            await handleQuickShare(item);
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

    async function handleQuickShare(item) {
        const recipient = window.prompt('收件人本地邮箱（多个用分号分隔）', '');
        if (!recipient) {
            return;
        }

        try {
            setStatus('正在发送分享邮件...', false);
            await mailApi.send({
                to: recipient,
                subject: `分享文件：${item.name}`,
                body: `我通过 Media Cube 向你分享了文件“${item.name}”。`,
                attachment_ids: [item.id]
            });
            setStatus(`已分享 ${item.name}`, false);
        } catch (error) {
            if (error.status === 401) {
                window.location.assign('/sign.html');
                return;
            }

            setStatus(error.message, true);
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
        const audioWaveform = getElement('file-preview-audio-waveform');
        const audioStatus = getElement('file-preview-audio-status');
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
        resetAudioPreview(audio, audioWrap, audioWaveform, audioStatus);
        resetFramePreview(pdf, pdfWrap);
        download.href = api.downloadUrl(item);
        previewModal.show();

        try {
            const data = await api.previewItem(item);
            const preview = data.preview || {};
            const previewImageUrl = await renderPreviewContent(preview, {
                content,
                audio,
                audioWrap,
                audioStatus,
                audioWaveform,
                csvBody,
                csvHead,
                csvWrap,
                fileName: item.name,
                image,
                imageWrap,
                pdf,
                pdfWrap,
                text
            });
            writeLastPreview(
                item,
                preview,
                previewImageUrl || (preview.type === 'image' ? preview.content_url : '')
            );
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
            resetAudioPreview(audio, audioWrap, audioWaveform, audioStatus);
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
            resetAudioPreview(elements.audio, elements.audioWrap, elements.audioWaveform, elements.audioStatus);
            resetFramePreview(elements.pdf, elements.pdfWrap);
            elements.csvWrap.classList.add('d-none');
            clearCsvPreview(elements.csvHead, elements.csvBody);
            elements.image.src = preview.content_url;
            elements.imageWrap.classList.remove('d-none');
            return preview.content_url;
        }

        if (preview.type === 'audio') {
            elements.text.classList.add('d-none');
            elements.content.textContent = '';
            elements.imageWrap.classList.add('d-none');
            elements.image.removeAttribute('src');
            elements.csvWrap.classList.add('d-none');
            clearCsvPreview(elements.csvHead, elements.csvBody);
            resetFramePreview(elements.pdf, elements.pdfWrap);
            elements.audioWrap.classList.remove('d-none');
            return renderAudioPreview(
                preview.content_url,
                elements.audio,
                elements.audioWaveform,
                elements.audioStatus,
                elements.fileName
            );
        }

        if (preview.type === 'pdf') {
            elements.text.classList.add('d-none');
            elements.content.textContent = '';
            elements.imageWrap.classList.add('d-none');
            elements.image.removeAttribute('src');
            elements.csvWrap.classList.add('d-none');
            clearCsvPreview(elements.csvHead, elements.csvBody);
            resetAudioPreview(elements.audio, elements.audioWrap, elements.audioWaveform, elements.audioStatus);
            const blob = await fetchPreviewContentBlob(preview.content_url);
            resetPreviewObjectUrl();
            previewObjectUrl = URL.createObjectURL(blob);
            elements.pdf.src = previewObjectUrl;
            elements.pdfWrap.classList.remove('d-none');
            return '';
        }

        if (preview.type === 'csv') {
            elements.text.classList.add('d-none');
            elements.content.textContent = '';
            elements.imageWrap.classList.add('d-none');
            elements.image.removeAttribute('src');
            resetAudioPreview(elements.audio, elements.audioWrap, elements.audioWaveform, elements.audioStatus);
            resetFramePreview(elements.pdf, elements.pdfWrap);
            renderCsvPreview(preview.rows || [], elements.csvHead, elements.csvBody);
            elements.csvWrap.classList.remove('d-none');
            return '';
        }

        elements.imageWrap.classList.add('d-none');
        elements.image.removeAttribute('src');
        elements.csvWrap.classList.add('d-none');
        clearCsvPreview(elements.csvHead, elements.csvBody);
        resetAudioPreview(elements.audio, elements.audioWrap, elements.audioWaveform, elements.audioStatus);
        resetFramePreview(elements.pdf, elements.pdfWrap);
        elements.text.classList.remove('d-none');
        elements.content.textContent = preview.content || '';
        return '';
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

    async function renderAudioPreview(url, audio, waveform, status, fileName) {
        const blob = await fetchPreviewContentBlob(url);
        resetPreviewObjectUrl();
        previewObjectUrl = URL.createObjectURL(blob);
        audio.src = previewObjectUrl;
        audioPreviewState.audio = audio;
        audioPreviewState.canvas = waveform;
        audioPreviewState.fileName = fileName || '音频';
        audioPreviewState.status = status;
        syncFloatingPlayer();
        const albumArtUrl = await extractAlbumArtDataUrl(blob);

        try {
            await decodeAudioWaveform(blob, waveform);
        } catch (error) {
            clearAudioWaveformState();
            clearWaveform(waveform);
            status.textContent = '无法生成波形图';
        }

        return albumArtUrl;
    }

    function syncSafeInteger(view, offset) {
        return (
            (view.getUint8(offset) << 21)
            | (view.getUint8(offset + 1) << 14)
            | (view.getUint8(offset + 2) << 7)
            | view.getUint8(offset + 3)
        );
    }

    function frameSize(view, offset, majorVersion) {
        if (majorVersion === 4) {
            return syncSafeInteger(view, offset);
        }

        return view.getUint32(offset);
    }

    function latin1(bytes, start, end) {
        let value = '';
        for (let index = start; index < end; index += 1) {
            value += String.fromCharCode(bytes[index]);
        }

        return value;
    }

    function findTerminator(bytes, start, end, encoding) {
        if (encoding === 1 || encoding === 2) {
            for (let index = start; index + 1 < end; index += 2) {
                if (bytes[index] === 0 && bytes[index + 1] === 0) {
                    return {
                        end: index,
                        next: index + 2
                    };
                }
            }
        }

        for (let index = start; index < end; index += 1) {
            if (bytes[index] === 0) {
                return {
                    end: index,
                    next: index + 1
                };
            }
        }

        return {
            end,
            next: end
        };
    }

    function bytesToDataUrl(bytes, mimeType) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(new Blob([bytes], { type: mimeType || 'image/jpeg' }));
        });
    }

    async function apicFrameToDataUrl(frameBytes) {
        const encoding = frameBytes[0];
        const mimeEnd = findTerminator(frameBytes, 1, frameBytes.length, 0);
        const mimeType = latin1(frameBytes, 1, mimeEnd.end) || 'image/jpeg';
        const pictureTypeIndex = mimeEnd.next;
        const descriptionStart = pictureTypeIndex + 1;
        const descriptionEnd = findTerminator(frameBytes, descriptionStart, frameBytes.length, encoding);
        const imageBytes = frameBytes.slice(descriptionEnd.next);
        if (!imageBytes.length || imageBytes.length > 1024 * 1024) {
            return '';
        }

        return bytesToDataUrl(imageBytes, mimeType);
    }

    async function extractAlbumArtDataUrl(blob) {
        try {
            const buffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            const view = new DataView(buffer);
            if (bytes.length < 20 || latin1(bytes, 0, 3) !== 'ID3') {
                return '';
            }

            const majorVersion = bytes[3];
            if (majorVersion < 3 || majorVersion > 4) {
                return '';
            }

            const tagEnd = Math.min(10 + syncSafeInteger(view, 6), bytes.length);
            let offset = 10;
            while (offset + 10 <= tagEnd) {
                const id = latin1(bytes, offset, offset + 4);
                const size = frameSize(view, offset + 4, majorVersion);
                const dataStart = offset + 10;
                const dataEnd = dataStart + size;
                if (!id.trim() || size <= 0 || dataEnd > tagEnd) {
                    break;
                }

                if (id === 'APIC') {
                    return apicFrameToDataUrl(bytes.slice(dataStart, dataEnd));
                }

                offset = dataEnd;
            }
        } catch (error) {
            return '';
        }

        return '';
    }

    async function decodeAudioWaveform(blob, canvas) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            throw new Error('Web Audio API is not available.');
        }

        const audioContext = new AudioContext();
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioPreviewState.duration = audioBuffer.duration;
            audioPreviewState.sampleRate = audioBuffer.sampleRate;
            audioPreviewState.samples = audioBuffer.getChannelData(0);
            drawWaveformWindow(canvas, 0);
        } finally {
            if (audioContext.close) {
                audioContext.close();
            }
        }
    }

    function drawWaveformWindow(canvas, currentTime) {
        if (!audioPreviewState.samples || !audioPreviewState.sampleRate) {
            return;
        }

        const duration = audioPreviewState.duration || 0;
        const windowStart = Math.max(Number(currentTime) - 1, 0);
        const windowEnd = Math.min(Number(currentTime) + 1, duration);
        const startSample = Math.floor(windowStart * audioPreviewState.sampleRate);
        const endSample = Math.max(Math.ceil(windowEnd * audioPreviewState.sampleRate), startSample + 1);
        if (audioPreviewState.status) {
            audioPreviewState.status.textContent = `${formatTime(windowStart)} - ${formatTime(windowEnd)}`;
        }

        drawWaveformSamples(audioPreviewState.samples, canvas, startSample, endSample, Number(currentTime));
    }

    function drawWaveformSamples(samples, canvas, startSample, endSample, currentTime) {
        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        const width = Math.max(Math.floor(rect.width * ratio), 1);
        const height = Math.max(Math.floor(rect.height * ratio), 1);
        const context = canvas.getContext('2d');
        const sampleCount = Math.max(endSample - startSample, 1);
        const step = Math.max(Math.ceil(sampleCount / width), 1);
        const middle = height / 2;
        const currentSample = currentTime * audioPreviewState.sampleRate;
        const progressX = Math.min(
            Math.max(((currentSample - startSample) / sampleCount) * width, 0),
            width
        );

        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.fillStyle = '#f8fafc';
        context.fillRect(0, 0, width, height);
        context.fillStyle = '#dbeafe';
        context.fillRect(0, 0, progressX, height);
        context.strokeStyle = '#0f766e';
        context.lineWidth = Math.max(1, ratio);
        context.beginPath();

        for (let x = 0; x < width; x += 1) {
            let min = 1;
            let max = -1;
            const start = startSample + x * step;
            const end = Math.min(start + step, endSample);
            for (let index = start; index < end; index += 1) {
                const value = samples[index] || 0;
                min = Math.min(min, value);
                max = Math.max(max, value);
            }

            context.moveTo(x, middle + min * middle);
            context.lineTo(x, middle + max * middle);
        }

        context.stroke();
        context.strokeStyle = '#dc2626';
        context.lineWidth = Math.max(2, ratio * 2);
        context.beginPath();
        context.moveTo(progressX, 0);
        context.lineTo(progressX, height);
        context.stroke();
    }

    function clearWaveform(canvas) {
        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width || canvas.clientWidth, canvas.height || canvas.clientHeight);
    }

    function clearAudioWaveformState() {
        audioPreviewState.duration = 0;
        audioPreviewState.sampleRate = 0;
        audioPreviewState.samples = null;
        stopAudioWaveformLoop();
    }

    function isAudioPlaying() {
        const audio = audioPreviewState.audio;
        return Boolean(audio && audio.currentSrc && !audio.paused && !audio.ended);
    }

    function startAudioWaveformLoop() {
        if (audioPreviewState.animationFrame) {
            return;
        }

        const tick = () => {
            if (audioPreviewState.audio && audioPreviewState.canvas) {
                drawWaveformWindow(audioPreviewState.canvas, audioPreviewState.audio.currentTime);
                updateFloatingPlayerText();
            }

            if (isAudioPlaying()) {
                audioPreviewState.animationFrame = window.requestAnimationFrame(tick);
            } else {
                audioPreviewState.animationFrame = 0;
                syncFloatingPlayer();
            }
        };
        audioPreviewState.animationFrame = window.requestAnimationFrame(tick);
    }

    function stopAudioWaveformLoop() {
        if (!audioPreviewState.animationFrame) {
            return;
        }

        window.cancelAnimationFrame(audioPreviewState.animationFrame);
        audioPreviewState.animationFrame = 0;
    }

    function updateAudioPlaybackUi() {
        if (audioPreviewState.audio && audioPreviewState.canvas) {
            drawWaveformWindow(audioPreviewState.canvas, audioPreviewState.audio.currentTime);
        }

        if (isAudioPlaying()) {
            startAudioWaveformLoop();
        } else {
            stopAudioWaveformLoop();
        }

        syncFloatingPlayer();
    }

    function updateFloatingPlayerText() {
        const title = getElement('media-floating-title');
        const time = getElement('media-floating-time');
        if (!title || !time) {
            return;
        }

        title.textContent = audioPreviewState.fileName || '音频';
        time.textContent = formatTime(audioPreviewState.audio ? audioPreviewState.audio.currentTime : 0);
    }

    function syncFloatingPlayer() {
        const player = getElement('media-floating-player');
        if (!player) {
            return;
        }

        updateFloatingPlayerText();
        player.classList.toggle('d-none', !isAudioPlaying() || previewModalVisible);
    }

    function resetAudioPreview(audio, audioWrap, waveform, status) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        audioPreviewState.audio = null;
        audioPreviewState.canvas = null;
        audioPreviewState.fileName = '';
        audioPreviewState.status = null;
        clearAudioWaveformState();
        resetPreviewObjectUrl();
        clearWaveform(waveform);
        if (status) {
            status.textContent = '';
        }
        audioWrap.classList.add('d-none');
        syncFloatingPlayer();
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
            const [data, storageData] = await Promise.all([
                api.list(currentPath, currentSearch),
                api.storageSummary()
            ]);
            renderStorageSummary(storageData);
            renderRows(data);
            const prefix = currentSearch ? `搜索“${currentSearch}”：` : '已加载 ';
            setStatus(`${prefix}${data.directories.length} 个目录，${data.files.length} 个文件`, false);
        } catch (error) {
            if (error.status === 401) {
                window.location.assign('/sign.html');
                return;
            }

            renderRows({ directories: [], files: [] });
            setStatus(error.message, true);
        }
    }

    async function handleUpload() {
        const fileInput = getElement('file-upload-input');
        const file = fileInput.files[0];
        if (!file) {
            return;
        }

        await runMutation(() => api.upload(file, currentPath), '上传完成');
        fileInput.value = '';
    }

    async function handleCreateDirectory() {
        const name = (window.prompt('新目录名', '') || '').trim();
        if (!name) {
            return;
        }

        await runMutation(() => api.createDirectory(currentPath, name), '目录已创建');
    }

    function handleSearchInput(event) {
        currentSearch = event.target.value.trim();
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => loadPath(currentPath), 250);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const previewModalElement = getElement('file-preview-modal');
        const audio = getElement('file-preview-audio');
        previewModal = new bootstrap.Modal(previewModalElement);

        previewModalElement.addEventListener('shown.bs.modal', () => {
            previewModalVisible = true;
            syncFloatingPlayer();
        });
        previewModalElement.addEventListener('hidden.bs.modal', () => {
            previewModalVisible = false;
            syncFloatingPlayer();
        });
        audio.addEventListener('play', updateAudioPlaybackUi);
        audio.addEventListener('pause', updateAudioPlaybackUi);
        audio.addEventListener('ended', updateAudioPlaybackUi);
        audio.addEventListener('seeked', updateAudioPlaybackUi);
        audio.addEventListener('timeupdate', updateAudioPlaybackUi);
        getElement('media-floating-button').addEventListener('click', () => {
            previewModal.show();
        });

        getElement('file-upload-button').addEventListener('click', () => getElement('file-upload-input').click());
        getElement('file-upload-input').addEventListener('change', handleUpload);
        getElement('directory-create-button').addEventListener('click', handleCreateDirectory);
        getElement('files-search-input').addEventListener('input', handleSearchInput);
        getElement('files-up-button').addEventListener('click', () => loadPath(parentPath(currentPath)));
        loadPath('/');
    });
}());
