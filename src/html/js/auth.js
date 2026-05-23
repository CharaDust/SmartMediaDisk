(function () {
    if (window.__smartMediaDiskAuthLoaded) {
        return;
    }
    window.__smartMediaDiskAuthLoaded = true;

    const sessionUrl = '/api/signin/session/';
    const logoutUrl = '/api/signin/logout/';
    const userStorageKey = 'smartMediaDiskUser';
    const permissionCheckUrl = '/api/permissions/check/';
    const navbarTitleUrl = '/api/account/navbar-title/';

    function readStoredUser() {
        try {
            return JSON.parse(localStorage.getItem(userStorageKey) || 'null');
        } catch (error) {
            localStorage.removeItem(userStorageKey);
            return null;
        }
    }

    function setStoredUser(user) {
        if (user) {
            localStorage.setItem(userStorageKey, JSON.stringify(user));
            return;
        }

        localStorage.removeItem(userStorageKey);
    }

    function renderAuthState(user) {
        document.querySelectorAll('[data-auth-username]').forEach((element) => {
            element.textContent = user ? user.username : '';
            element.classList.toggle('d-none', !user);
        });

        document.querySelectorAll('[data-auth-guest]').forEach((element) => {
            element.classList.toggle('d-none', Boolean(user));
        });

        document.querySelectorAll('[data-auth-user]').forEach((element) => {
            element.classList.toggle('d-none', !user);
        });

        const homeUsername = document.getElementById('username');
        if (homeUsername) {
            homeUsername.textContent = user ? user.username : '访客';
        }

        document.querySelectorAll('[data-permission-required]').forEach((element) => {
            element.classList.add('d-none');
        });

        document.querySelectorAll('[data-permission-any-required]').forEach((element) => {
            element.classList.add('d-none');
        });
    }

    function parsePermissionList(value) {
        return (value || '')
            .split(',')
            .map((node) => node.trim())
            .filter(Boolean);
    }

    function renderNavbarTitle(title) {
        const value = (title || 'Media Cube').trim() || 'Media Cube';
        document.querySelectorAll('[data-navbar-title]').forEach((element) => {
            element.textContent = value;
        });
    }

    async function refreshNavbarTitle() {
        try {
            const response = await fetch(navbarTitleUrl, {
                credentials: 'same-origin'
            });
            const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
            if (!contentType.includes('application/json')) {
                renderNavbarTitle('Media Cube');
                return;
            }
            const result = await response.json();
            const title = result.data && result.data.navbar_title;
            renderNavbarTitle(title);
        } catch (error) {
            renderNavbarTitle('Media Cube');
        }
    }

    async function renderPermissionLinks(user) {
        if (!user) {
            return;
        }

        const permissionElements = Array.from(document.querySelectorAll('[data-permission-required]'));
        const anyPermissionElements = Array.from(document.querySelectorAll('[data-permission-any-required]'));
        const allPermissionElements = permissionElements.concat(anyPermissionElements);
        const isRootUser = (user.username || '').toLowerCase() === 'root' || user.is_superuser;
        if (isRootUser) {
            allPermissionElements.forEach((element) => {
                element.classList.remove('d-none');
            });
            return;
        }

        const exactNodes = permissionElements.map((element) => {
            return element.getAttribute('data-permission-required');
        });
        const anyNodes = anyPermissionElements.flatMap((element) => {
            return parsePermissionList(element.getAttribute('data-permission-any-required'));
        });
        const permissionNodes = Array.from(new Set(exactNodes.concat(anyNodes).filter(Boolean)));
        const allowedByNode = new Map();

        await Promise.all(permissionNodes.map(async (node) => {
            try {
                const response = await fetch(`${permissionCheckUrl}?node=${encodeURIComponent(node)}`, {
                    credentials: 'same-origin'
                });
                const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
                if (!contentType.includes('application/json')) {
                    allowedByNode.set(node, false);
                    return;
                }
                const result = await response.json();
                const allowed = response.ok && result.data && result.data.allowed;
                allowedByNode.set(node, Boolean(allowed));
            } catch (error) {
                allowedByNode.set(node, false);
            }
        }));

        permissionElements.forEach((element) => {
            const node = element.getAttribute('data-permission-required');
            element.classList.toggle('d-none', !allowedByNode.get(node));
        });

        anyPermissionElements.forEach((element) => {
            const nodes = parsePermissionList(element.getAttribute('data-permission-any-required'));
            const allowed = nodes.some((node) => allowedByNode.get(node));
            element.classList.toggle('d-none', !allowed);
        });
    }

    async function refreshAuthState() {
        const storedUser = readStoredUser();
        renderAuthState(storedUser);

        try {
            const response = await fetch(sessionUrl, {
                credentials: 'same-origin'
            });
            const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
            if (!contentType.includes('application/json')) {
                renderAuthState(storedUser);
                await renderPermissionLinks(storedUser);
                return;
            }
            const result = await response.json();
            const user = result.data && result.data.authenticated ? result.data.user : null;

            setStoredUser(user);
            renderAuthState(user);
            await renderPermissionLinks(user);
        } catch (error) {
            renderAuthState(storedUser);
            await renderPermissionLinks(storedUser);
        }
    }

    async function signOut() {
        await fetch(logoutUrl, {
            method: 'POST',
            credentials: 'same-origin'
        });
        setStoredUser(null);
        renderAuthState(null);
        window.location.assign('/sign.html');
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-auth-logout]').forEach((button) => {
            button.addEventListener('click', async () => {
                button.disabled = true;
                try {
                    await signOut();
                } finally {
                    button.disabled = false;
                }
            });
        });

        refreshNavbarTitle();
        refreshAuthState();
    });
}());
