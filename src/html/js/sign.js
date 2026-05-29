const passwordSignForm = document.getElementById('passwordSignForm');
const passwordSignSubmit = document.getElementById('passwordSignSubmit');
const passwordSignMessage = document.getElementById('passwordSignMessage');

function setMessage(message, state = 'muted') {
    passwordSignMessage.className = `form-text mt-3 text-${state}`;
    passwordSignMessage.textContent = message;
}

passwordSignForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!passwordSignForm.checkValidity()) {
        passwordSignForm.classList.add('was-validated');
        setMessage('请填写用户名和密码。', 'danger');
        return;
    }

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    passwordSignSubmit.disabled = true;
    setMessage('正在登录...', 'muted');

    try {
        const response = await fetch('/api/signin/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, rememberMe })
        });

        const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
        if (!contentType.includes('application/json')) {
            const text = (await response.text()).slice(0, 200);
            setMessage('服务返回异常 (HTTP ' + response.status + ')，请查看服务端日志。', 'danger');
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || '登录失败，请稍后重试。');
        }

        localStorage.setItem('smartMediaDiskUser', JSON.stringify(result.data.user));
        setMessage('登录成功，正在进入首页...', 'success');
        window.setTimeout(() => {
            window.location.assign('/index.html');
        }, 500);
    } catch (error) {
        setMessage(error.message, 'danger');
    } finally {
        passwordSignSubmit.disabled = false;
    }
});