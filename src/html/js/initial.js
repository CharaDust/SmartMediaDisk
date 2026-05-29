// 显示部署时间
document.getElementById('deploy-time').textContent =
    new Date().toLocaleString('zh-CN');

// 模拟状态检测
setTimeout(() => {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `
        <p class="success">✅ 部署成功！</p>
        <p>服务运行正常，可通过公网IP访问？</p>
        <p>但实际上并不行，这只是一个加了1.5秒延迟后显示的文本</p>
    `;
}, 1500);