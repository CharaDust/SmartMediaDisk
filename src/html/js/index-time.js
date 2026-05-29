function updateTime() {
    const now = new Date();
    const optionshhmm = { hour: '2-digit', minute: '2-digit' };
    const formattedTime = now.toLocaleDateString('zh-CN', optionshhmm).replace(/\//g, '-');
    document.getElementById('current-time').textContent = formattedTime;
}
document.addEventListener('DOMContentLoaded', () => {
    // 设置初始时间
    updateTime();
    // 每秒更新一次时间
    setInterval(updateTime, 1000);
});