(function () {
    const jsonHeaders = {
        'Content-Type': 'application/json'
    };

    async function parseResponse(response) {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            if (!response.ok) {
                const error = new Error(`Request failed with status ${response.status}.`);
                error.status = response.status;
                throw error;
            }

            return {};
        }

        const result = await response.json();
        if (!response.ok || result.status === 'error') {
            const error = new Error(result.message || `Request failed with status ${response.status}.`);
            error.status = response.status;
            throw error;
        }

        return result.data || {};
    }

    /**
     * List files and directories under a logical path.
     *
     * @param {string} path Logical directory path.
     * @param {string} search Optional name search keyword.
     * @returns {Promise<object>} Directory listing payload.
     */
    async function list(path, search) {
        const query = new URLSearchParams({ path: path || '/' });
        if (search) {
            query.set('search', search);
        }

        const response = await fetch(`/api/files/?${query.toString()}`, {
            credentials: 'same-origin'
        });
        return parseResponse(response);
    }

    /**
     * Upload a file into a logical path.
     *
     * @param {File} file Browser file object.
     * @param {string} path Target logical directory path.
     * @returns {Promise<object>} Uploaded file payload.
     */
    async function upload(file, path) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path || '/');

        const response = await fetch('/api/files/upload/', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        return parseResponse(response);
    }

    /**
     * Create a directory.
     *
     * @param {string} parentPath Target parent path.
     * @param {string} name Directory name.
     * @returns {Promise<object>} Created directory payload.
     */
    async function createDirectory(parentPath, name) {
        const response = await fetch('/api/files/directories/', {
            method: 'POST',
            headers: jsonHeaders,
            credentials: 'same-origin',
            body: JSON.stringify({
                parent_path: parentPath || '/',
                name
            })
        });
        return parseResponse(response);
    }

    /**
     * Rename a file or directory item.
     *
     * @param {object} item File or directory row object.
     * @param {string} name New item name.
     * @returns {Promise<object>} Updated item payload.
     */
    async function renameItem(item, name) {
        const prefix = item.type === 'directory' ? 'directories/' : '';
        const response = await fetch(`/api/files/${prefix}${item.id}/rename/`, {
            method: 'POST',
            headers: jsonHeaders,
            credentials: 'same-origin',
            body: JSON.stringify({ name })
        });
        return parseResponse(response);
    }

    /**
     * Move a file or directory item.
     *
     * @param {object} item File or directory row object.
     * @param {string} path Target parent path.
     * @returns {Promise<object>} Updated item payload.
     */
    async function moveItem(item, path) {
        const prefix = item.type === 'directory' ? 'directories/' : '';
        const response = await fetch(`/api/files/${prefix}${item.id}/move/`, {
            method: 'POST',
            headers: jsonHeaders,
            credentials: 'same-origin',
            body: JSON.stringify({ path: path || '/' })
        });
        return parseResponse(response);
    }

    /**
     * Delete a file or directory item.
     *
     * @param {object} item File or directory row object.
     * @returns {Promise<object>} Deletion payload.
     */
    async function deleteItem(item) {
        const prefix = item.type === 'directory' ? 'directories/' : '';
        const response = await fetch(`/api/files/${prefix}${item.id}/`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        return parseResponse(response);
    }

    /**
     * Fetch storage usage and quota details for the current user.
     *
     * @returns {Promise<object>} Storage summary payload.
     */
    async function storageSummary() {
        const response = await fetch('/api/files/storage/', {
            credentials: 'same-origin'
        });
        return parseResponse(response);
    }

    /**
     * Fetch random previewable files for the current user.
     *
     * @param {number} limit Maximum number of files to return.
     * @returns {Promise<object>} Random file payload.
     */
    async function random(limit) {
        const query = new URLSearchParams({ limit: String(limit || 8) });
        const response = await fetch(`/api/files/random/?${query.toString()}`, {
            credentials: 'same-origin'
        });
        return parseResponse(response);
    }

    /**
     * Fetch a preview payload for a file row.
     *
     * @param {object} item File row object.
     * @returns {Promise<object>} Preview payload.
     */
    async function previewItem(item) {
        const response = await fetch(`/api/files/${item.id}/preview/`, {
            credentials: 'same-origin'
        });
        return parseResponse(response);
    }

    /**
     * Fetch inline preview content as a Blob.
     *
     * @param {string} url Inline preview content URL.
     * @returns {Promise<Blob>} Preview content blob.
     */
    async function previewContentBlob(url) {
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

    /**
     * Build a download URL for a file row.
     *
     * @param {object} item File row object.
     * @returns {string} Download URL.
     */
    function downloadUrl(item) {
        return `/api/files/${item.id}/download/`;
    }

    window.SmartMediaDiskFilesApi = {
        list,
        random,
        storageSummary,
        upload,
        createDirectory,
        renameItem,
        moveItem,
        deleteItem,
        previewItem,
        previewContentBlob,
        downloadUrl
    };
}());
