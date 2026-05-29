const API_BASE_URL = '/api/dbtest'; // 根据你的实际 API 路径调整

function updateStatus(message, isSuccess = false, isError = false) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = 'success'; // 默认成功样式
    if (isError) {
        statusDiv.className = 'error';
    } else if (isSuccess) {
        statusDiv.className = 'success';
    } else {
        statusDiv.className = 'loading';
    }
}

async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

async function loadData() {
    updateStatus("正在加载数据...", false, false);
    try {
        const data = await fetchData('/data/');
        const tbody = document.querySelector('#data-table tbody');
        tbody.innerHTML = ''; // 清空现有行

        if (!data.items || data.items.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 4;
            cell.textContent = "暂无数据";
            cell.style.textAlign = "center";
        } else {
            data.items.forEach(item => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = item.id;
                row.insertCell(1).textContent = item.name;
                row.insertCell(2).textContent = item.value;
                row.insertCell(3).textContent = new Date(item.created_at).toLocaleString('zh-CN'); // 格式化日期
            });
        }
        updateStatus("数据加载成功！", true);
    } catch (error) {
        console.error('Error loading data:', error);
        updateStatus("加载数据失败: " + error.message, false, true);
    }
}

async function createItem() {
    updateStatus("正在创建新条目...", false, false);
    try {
        const data = await fetchData('/create/');
        updateStatus(data.message, true); // 显示成功消息
        loadData(); // 重新加载数据以显示新条目
    } catch (error) {
        console.error('Error creating item:', error);
        updateStatus("创建条目失败: " + error.message, false, true);
    }
}

async function deleteAll() {
    if (confirm("确定要删除所有条目吗？此操作不可撤销。")) {
        updateStatus("正在删除所有条目...", false, false);
        try {
            const data = await fetchData('/delete/');
            updateStatus(data.message, true); // 显示成功消息
            loadData(); // 重新加载数据以显示空列表
        } catch (error) {
            console.error('Error deleting items:', error);
            updateStatus("删除条目失败: " + error.message, false, true);
        }
    }
}

// 页面加载完成后自动加载一次数据，并绑定按钮事件
document.addEventListener('DOMContentLoaded', () => {
    // 绑定按钮事件
    const loadDataBtn = document.getElementById('loadDataBtn');
    const createItemBtn = document.getElementById('createItemBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (loadDataBtn) loadDataBtn.addEventListener('click', loadData);
    if (createItemBtn) createItemBtn.addEventListener('click', createItem);
    if (deleteAllBtn) deleteAllBtn.addEventListener('click', deleteAll);

    // 自动加载数据
    loadData();
});