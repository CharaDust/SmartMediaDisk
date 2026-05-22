(function () {
    const jsonHeaders = {
        'Content-Type': 'application/json'
    };

    async function parseResponse(response) {
        const result = await response.json();
        if (!response.ok || result.status === 'error') {
            const error = new Error(result.message || `Request failed with status ${response.status}.`);
            error.status = response.status;
            throw error;
        }

        return result.data || {};
    }

    /**
     * List active local mail users.
     *
     * @returns {Promise<object>} User list payload.
     */
    async function users() {
        const response = await fetch('/api/sendmail/users/', {
            credentials: 'same-origin'
        });
        return parseResponse(response);
    }

    /**
     * Send an internal mail message.
     *
     * @param {object} payload Message payload.
     * @returns {Promise<object>} Created message payload.
     */
    async function send(payload) {
        const response = await fetch('/api/sendmail/send/', {
            method: 'POST',
            headers: jsonHeaders,
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        return parseResponse(response);
    }

    /**
     * List received internal mail messages.
     *
     * @returns {Promise<object>} Inbox payload.
     */
    async function inbox() {
        const response = await fetch('/api/sendmail/inbox/', {
            credentials: 'same-origin'
        });
        return parseResponse(response);
    }

    /**
     * Read one internal mail message.
     *
     * @param {number} messageId Message identifier.
     * @returns {Promise<object>} Message detail payload.
     */
    async function message(messageId) {
        const response = await fetch(`/api/sendmail/messages/${messageId}/`, {
            credentials: 'same-origin'
        });
        return parseResponse(response);
    }

    /**
     * Save a received attachment into the current user's disk.
     *
     * @param {number} attachmentId Attachment identifier.
     * @param {string} path Target disk path.
     * @param {string} name Optional file name override.
     * @returns {Promise<object>} Created file payload.
     */
    async function saveAttachment(attachmentId, path, name) {
        const response = await fetch(`/api/sendmail/attachments/${attachmentId}/save/`, {
            method: 'POST',
            headers: jsonHeaders,
            credentials: 'same-origin',
            body: JSON.stringify({
                path: path || '/',
                name: name || ''
            })
        });
        return parseResponse(response);
    }

    window.SmartMediaDiskSendmailApi = {
        users,
        send,
        inbox,
        message,
        saveAttachment
    };
}());
