(function () {
    const api = window.SmartMediaDiskFilesApi;
    const lastPreviewStorageKey = 'smartMediaDiskLastPreview';
    const pinnedPreviewStorageKey = 'smartMediaDiskPinnedPreviews';
    const recentPreviewStorageKey = 'smartMediaDiskRecentPreviews';
    const cardFallbackImage = 'https://picsum.photos/1280/720?random=resume-card';
    const backgroundFallbackImage = 'https://picsum.photos/1920/1080?random=resume-background';
    const toolRecords = [
        {
            icon: 'bi-music-note-list',
            title: '音乐节奏测试',
            url: '/page/empty.html?site=bpm'
        },
        {
            icon: 'bi-speedometer2',
            title: '网络速度测试',
            url: '/page/empty.html?site=speedtest'
        },
        {
            icon: 'bi-pc-display',
            title: '计算机博物馆',
            url: '/page/empty.html?site=compumuseum'
        },
        {
            icon: 'bi-person-badge',
            title: '英文名生成',
            url: '/page/empty.html?site=english-name'
        },
        {
            icon: 'bi-pen',
            title: '英文签字生成',
            url: '/page/empty.html?site=english-signature'
        },
        {
            icon: 'bi-magic',
            title: '设定生成',
            url: '/page/empty.html?site=setting-generator'
        }
    ];
    let currentLastRecord = null;
    let pinnedRecords = [];
    let recentRecords = [];
    let randomRecords = [];
    let previewModal = null;
    let previewObjectUrl = '';
    let currentThumbSize = 0;

    function readStoredJson(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch (error) {
            localStorage.removeItem(key);
            return fallback;
        }
    }

    function readLastPreview() {
        return readStoredJson(lastPreviewStorageKey, null);
    }

    function readRecentPreviews() {
        const records = readStoredJson(recentPreviewStorageKey, []);
        return Array.isArray(records) ? records : [];
    }

    function readPinnedPreviews() {
        const records = readStoredJson(pinnedPreviewStorageKey, []);
        return Array.isArray(records) ? records : [];
    }

    function writePinnedPreviews(records) {
        pinnedRecords = records.map(normalizeRecord).filter(Boolean);
        localStorage.setItem(pinnedPreviewStorageKey, JSON.stringify(pinnedRecords));
    }

    function clearLastPreview() {
        localStorage.removeItem(lastPreviewStorageKey);
        currentLastRecord = null;
    }

    function setBackgroundImage(url) {
        document.body.style.backgroundImage = `url("${url}")`;
    }

    function normalizeRecord(record) {
        if (!record || !record.id) {
            return null;
        }

        const item = record.item || {
            id: record.id,
            type: 'file',
            name: record.name,
            path: record.path || '',
            size: record.size || 0,
            mime_type: record.mimeType || ''
        };

        return {
            ...record,
            item,
            name: record.name || item.name || '文件'
        };
    }

    function itemToRecord(item) {
        return normalizeRecord({
            id: item.id,
            item,
            mimeType: item.mime_type || '',
            name: item.name,
            path: item.path || '',
            previewImageUrl: '',
            previewType: '',
            size: item.size || 0,
            previewedAt: new Date().toISOString()
        });
    }

    function writePreviewRecord(record, preview, previewImageUrl) {
        const nextRecord = normalizeRecord({
            ...record,
            previewImageUrl: previewImageUrl || '',
            previewType: preview.type || '',
            previewedAt: new Date().toISOString()
        });
        if (!nextRecord) {
            return;
        }

        try {
            localStorage.setItem(lastPreviewStorageKey, JSON.stringify(nextRecord));
            const storedRecent = readRecentPreviews();
            const nextRecent = [
                nextRecord,
                ...storedRecent.filter((entry) => entry && entry.id !== nextRecord.id)
            ].slice(0, 24);
            localStorage.setItem(recentPreviewStorageKey, JSON.stringify(nextRecent));
            currentLastRecord = nextRecord;
            recentRecords = nextRecent.map(normalizeRecord).filter(Boolean);
            renderLastPreview();
            renderRecentStrip();
            renderPinnedGrid();
        } catch (error) {
            currentLastRecord = nextRecord;
        }
    }

    function pinRecord(record) {
        const normalized = normalizeRecord(record);
        if (!normalized) {
            return;
        }

        try {
            writePinnedPreviews([
                normalized,
                ...pinnedRecords.filter((entry) => entry && entry.id !== normalized.id)
            ]);
            renderPinnedGrid();
        } catch (error) {
            pinnedRecords = [
                normalized,
                ...pinnedRecords.filter((entry) => entry && entry.id !== normalized.id)
            ];
            renderPinnedGrid();
        }
    }

    function unpinRecord(record) {
        const normalized = normalizeRecord(record);
        if (!normalized) {
            return;
        }

        try {
            writePinnedPreviews(pinnedRecords.filter((entry) => entry && entry.id !== normalized.id));
        } catch (error) {
            pinnedRecords = pinnedRecords.filter((entry) => entry && entry.id !== normalized.id);
        }
        renderPinnedGrid();
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

    function iconForRecord(record) {
        const mimeType = String(record.item && record.item.mime_type || record.mimeType || '').toLowerCase();
        const name = String(record.name || '').toLowerCase();
        if (mimeType.startsWith('audio/') || name.endsWith('.mp3')) {
            return 'bi-music-note-beamed';
        }
        if (mimeType.includes('pdf') || name.endsWith('.pdf')) {
            return 'bi-file-earmark-pdf';
        }
        if (mimeType.startsWith('image/') || name.endsWith('.png')) {
            return 'bi-file-earmark-image';
        }
        if (mimeType.includes('spreadsheet') || name.endsWith('.csv') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
            return 'bi-file-earmark-spreadsheet';
        }
        if (mimeType.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
            return 'bi-file-earmark-slides';
        }
        if (mimeType.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
            return 'bi-file-earmark-word';
        }

        return 'bi-file-earmark-text';
    }

    function thumbnailUrl(record) {
        const item = record.item || {};
        const mimeType = String(item.mime_type || record.mimeType || '').toLowerCase();
        const name = String(record.name || '').toLowerCase();
        if (record.previewImageUrl) {
            return record.previewImageUrl;
        }
        if (item.id && (mimeType === 'image/png' || name.endsWith('.png'))) {
            return `/api/files/${item.id}/preview/content/`;
        }

        return '';
    }

    function getVisibleStripCount(container) {
        const width = container.clientWidth;
        const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const styles = getComputedStyle(document.documentElement);
        const thumbWidth = Number.parseFloat(styles.getPropertyValue('--home-thumb-size')) || (6 * rootFontSize);
        const itemWidth = thumbWidth + (0.7 * rootFontSize);
        const gap = 0.75 * rootFontSize;
        if (!width || width < itemWidth) {
            return 0;
        }

        return Math.max(1, Math.floor((width + gap) / (itemWidth + gap)));
    }

    function createRecordTile(record, options) {
        const settings = options || {};
        const wrapper = document.createElement('div');
        const button = document.createElement('button');
        const thumb = document.createElement('span');
        const title = document.createElement('span');
        const imageUrl = thumbnailUrl(record);

        wrapper.className = 'home-strip-item';
        button.className = 'home-strip-button';
        button.type = 'button';
        button.title = record.name;
        thumb.className = 'home-strip-thumb';
        title.className = 'home-strip-title';
        title.textContent = record.name;

        if (imageUrl) {
            const image = document.createElement('img');
            image.alt = record.name;
            image.src = imageUrl;
            image.onerror = () => {
                thumb.textContent = '';
                thumb.appendChild(createIcon(record));
            };
            thumb.appendChild(image);
        } else {
            thumb.appendChild(createIcon(record));
        }

        button.appendChild(thumb);
        button.appendChild(title);
        button.addEventListener('click', () => openPreview(record));
        wrapper.appendChild(button);
        if (settings.removable) {
            const removeButton = document.createElement('button');
            removeButton.className = 'home-tile-remove';
            removeButton.type = 'button';
            removeButton.title = '取消固定';
            removeButton.setAttribute('aria-label', '取消固定');
            removeButton.innerHTML = '<i class="bi bi-trash"></i>';
            removeButton.addEventListener('click', (event) => {
                event.stopPropagation();
                unpinRecord(record);
            });
            wrapper.appendChild(removeButton);
        }

        return wrapper;
    }

    function createStripItem(record) {
        return createRecordTile(record);
    }

    function createIcon(record) {
        const icon = document.createElement('i');
        icon.className = `bi ${iconForRecord(record)} home-strip-icon`;
        return icon;
    }

    function renderStrip(selector, records, emptyText) {
        const container = document.querySelector(selector);
        if (!container) {
            return;
        }

        container.textContent = '';
        updateStripThumbSize();
        const visibleCount = getVisibleStripCount(container);
        const visibleRecords = records.slice(0, visibleCount);
        if (!visibleRecords.length) {
            const empty = document.createElement('div');
            empty.className = 'home-strip-empty';
            empty.textContent = emptyText;
            container.appendChild(empty);
            return;
        }

        visibleRecords.forEach((record) => {
            container.appendChild(createStripItem(record));
        });
    }

    function renderRecentStrip() {
        renderStrip('[data-recent-strip]', recentRecords, '暂无最近打开项目');
    }

    function renderRandomStrip() {
        renderStrip('[data-random-strip]', randomRecords, '暂无可预览文件');
    }

    function renderGrid(selector, records, emptyText, options) {
        const container = document.querySelector(selector);
        if (!container) {
            return;
        }

        container.textContent = '';
        updateStripThumbSize();
        if (!records.length) {
            const empty = document.createElement('div');
            empty.className = 'home-strip-empty';
            empty.textContent = emptyText;
            container.appendChild(empty);
            return;
        }

        records.forEach((record) => {
            container.appendChild(createRecordTile(record, options));
        });
    }

    function renderPinnedGrid() {
        renderGrid('[data-pinned-grid]', pinnedRecords, '暂无固定项目', { removable: true });
    }

    function createToolTile(tool) {
        const wrapper = document.createElement('div');
        const link = document.createElement('a');
        const thumb = document.createElement('span');
        const title = document.createElement('span');

        wrapper.className = 'home-strip-item';
        link.className = 'home-strip-button home-tool-link';
        link.href = tool.url;
        link.title = tool.title;
        thumb.className = 'home-strip-thumb';
        title.className = 'home-strip-title';
        title.textContent = tool.title;
        thumb.innerHTML = `<i class="bi ${tool.icon} home-strip-icon"></i>`;
        link.appendChild(thumb);
        link.appendChild(title);
        wrapper.appendChild(link);
        return wrapper;
    }

    function renderToolsGrid() {
        const container = document.querySelector('[data-tools-grid]');
        if (!container) {
            return;
        }

        container.textContent = '';
        updateStripThumbSize();
        toolRecords.forEach((tool) => {
            container.appendChild(createToolTile(tool));
        });
    }

    function updateStripThumbSize() {
        const media = document.querySelector('.resume-card-media');
        if (!media) {
            return false;
        }

        const height = media.getBoundingClientRect().height;
        if (!height) {
            return false;
        }

        const thumbSize = Math.max(48, Math.floor(height / 2));
        if (thumbSize === currentThumbSize) {
            return false;
        }

        currentThumbSize = thumbSize;
        document.documentElement.style.setProperty('--home-thumb-size', `${thumbSize}px`);
        return true;
    }

    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
    }

    async function applyResumeImage(url) {
        const image = document.querySelector('[data-resume-image]');
        const imageUrl = url || cardFallbackImage;

        if (image) {
            image.onload = () => {
                if (updateStripThumbSize()) {
                    renderRecentStrip();
                    renderRandomStrip();
                    renderPinnedGrid();
                    renderToolsGrid();
                }
            };
            image.onerror = () => {
                image.onerror = null;
                image.src = cardFallbackImage;
            };
            image.src = imageUrl;
        }

        if (!url) {
            setBackgroundImage(backgroundFallbackImage);
            return;
        }

        try {
            const loadedImage = await loadImage(url);
            if (loadedImage.naturalWidth > 800 && loadedImage.naturalHeight > 600) {
                setBackgroundImage(url);
                return;
            }
        } catch (error) {
            if (image) {
                image.src = cardFallbackImage;
            }
        }

        setBackgroundImage(backgroundFallbackImage);
    }

    function renderLastPreview() {
        currentLastRecord = normalizeRecord(readLastPreview());
        const title = document.querySelector('[data-resume-title]');
        const fileName = currentLastRecord && currentLastRecord.name ? currentLastRecord.name : '上一个内容';

        if (title) {
            title.textContent = fileName;
            title.title = fileName;
        }

        applyResumeImage(currentLastRecord && currentLastRecord.previewImageUrl ? currentLastRecord.previewImageUrl : '');
    }

    function resetPreviewObjectUrl() {
        if (!previewObjectUrl) {
            return;
        }

        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = '';
    }

    function clearPreviewContent() {
        document.getElementById('home-preview-text').classList.remove('d-none');
        document.getElementById('home-preview-content').textContent = '加载中...';
        document.getElementById('home-preview-image-wrap').classList.add('d-none');
        document.getElementById('home-preview-image').removeAttribute('src');
        document.getElementById('home-preview-csv-wrap').classList.add('d-none');
        document.getElementById('home-preview-csv-head').textContent = '';
        document.getElementById('home-preview-csv-body').textContent = '';
        const audio = document.getElementById('home-preview-audio');
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        document.getElementById('home-preview-audio-wrap').classList.add('d-none');
        document.getElementById('home-preview-pdf').removeAttribute('src');
        document.getElementById('home-preview-pdf-wrap').classList.add('d-none');
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

        throw new Error(`Request failed with status ${response.status}.`);
    }

    function renderCsv(rows) {
        const head = document.getElementById('home-preview-csv-head');
        const body = document.getElementById('home-preview-csv-body');
        head.textContent = '';
        body.textContent = '';
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

    async function renderPreviewContent(preview) {
        const text = document.getElementById('home-preview-text');
        const content = document.getElementById('home-preview-content');
        const imageWrap = document.getElementById('home-preview-image-wrap');
        const image = document.getElementById('home-preview-image');
        const csvWrap = document.getElementById('home-preview-csv-wrap');
        const audioWrap = document.getElementById('home-preview-audio-wrap');
        const audio = document.getElementById('home-preview-audio');
        const pdfWrap = document.getElementById('home-preview-pdf-wrap');
        const pdf = document.getElementById('home-preview-pdf');

        if (preview.type === 'image') {
            text.classList.add('d-none');
            content.textContent = '';
            image.src = preview.content_url;
            imageWrap.classList.remove('d-none');
            return preview.content_url;
        }

        if (preview.type === 'audio') {
            text.classList.add('d-none');
            content.textContent = '';
            const blob = await fetchPreviewContentBlob(preview.content_url);
            previewObjectUrl = URL.createObjectURL(blob);
            audio.src = previewObjectUrl;
            audioWrap.classList.remove('d-none');
            return '';
        }

        if (preview.type === 'pdf') {
            text.classList.add('d-none');
            content.textContent = '';
            const blob = await fetchPreviewContentBlob(preview.content_url);
            previewObjectUrl = URL.createObjectURL(blob);
            pdf.src = previewObjectUrl;
            pdfWrap.classList.remove('d-none');
            return '';
        }

        if (preview.type === 'csv') {
            text.classList.add('d-none');
            content.textContent = '';
            renderCsv(preview.rows || []);
            csvWrap.classList.remove('d-none');
            return '';
        }

        content.textContent = preview.content || '';
        return '';
    }

    async function openPreview(record) {
        const normalized = normalizeRecord(record);
        if (!normalized || !normalized.item) {
            return;
        }

        const title = document.getElementById('home-preview-title');
        const meta = document.getElementById('home-preview-meta');
        const download = document.getElementById('home-preview-download');
        title.textContent = normalized.name;
        meta.textContent = `${normalized.item.mime_type || normalized.mimeType || '文件'} · ${formatSize(normalized.item.size || normalized.size)}`;
        download.href = api.downloadUrl(normalized.item);
        clearPreviewContent();
        previewModal.show();

        try {
            const data = await api.previewItem(normalized.item);
            const preview = data.preview || {};
            const previewImageUrl = await renderPreviewContent(preview);
            writePreviewRecord(normalized, preview, previewImageUrl || thumbnailUrl(normalized));
            meta.textContent = [
                normalized.item.mime_type || normalized.mimeType || '文件',
                formatSize(normalized.item.size || normalized.size),
                preview.encoding ? `编码：${preview.encoding}` : '',
                preview.truncated ? `仅显示前 ${formatSize(preview.max_bytes)}` : ''
            ].filter(Boolean).join(' · ');
        } catch (error) {
            document.getElementById('home-preview-content').textContent = error.message || '无法预览';
            meta.textContent = '无法预览';
        }
    }

    async function loadRandomFiles() {
        if (!api || !api.random) {
            randomRecords = [];
            renderRandomStrip();
            return;
        }

        try {
            const data = await api.random(16);
            randomRecords = (data.files || []).map(itemToRecord).filter(Boolean);
        } catch (error) {
            randomRecords = [];
        }
        renderRandomStrip();
    }

    function refreshResponsiveStrips() {
        updateStripThumbSize();
        renderRecentStrip();
        renderRandomStrip();
        renderPinnedGrid();
        renderToolsGrid();
    }

    document.addEventListener('DOMContentLoaded', () => {
        previewModal = new bootstrap.Modal(document.getElementById('home-preview-modal'));
        pinnedRecords = readPinnedPreviews().map(normalizeRecord).filter(Boolean);
        recentRecords = readRecentPreviews().map(normalizeRecord).filter(Boolean);

        document.querySelectorAll('[data-resume-clear]').forEach((button) => {
            button.addEventListener('click', () => {
                clearLastPreview();
                renderLastPreview();
            });
        });
        document.querySelectorAll('[data-resume-open]').forEach((button) => {
            button.addEventListener('click', () => openPreview(currentLastRecord));
            button.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();
                openPreview(currentLastRecord);
            });
        });
        document.querySelectorAll('[data-resume-pin]').forEach((button) => {
            button.addEventListener('click', () => pinRecord(currentLastRecord));
        });
        window.addEventListener('resize', refreshResponsiveStrips);

        updateStripThumbSize();
        renderLastPreview();
        renderRecentStrip();
        renderPinnedGrid();
        renderToolsGrid();
        loadRandomFiles();
    });
}());
