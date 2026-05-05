(function () {
    if (window.__smartMediaDiskAuthLoaded) {
        return;
    }
    window.__smartMediaDiskAuthLoaded = true;

    const sessionUrl = '/api/signin/session/';
    const logoutUrl = '/api/signin/logout/';
    const userStorageKey = 'smartMediaDiskUser';

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
    }

    async function refreshAuthState() {
        const storedUser = readStoredUser();
        renderAuthState(storedUser);

        try {
            const response = await fetch(sessionUrl, {
                credentials: 'same-origin'
            });
            const result = await response.json();
            const user = result.data && result.data.authenticated ? result.data.user : null;

            setStoredUser(user);
            renderAuthState(user);
        } catch (error) {
            renderAuthState(storedUser);
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

        refreshAuthState();
    });
}());
