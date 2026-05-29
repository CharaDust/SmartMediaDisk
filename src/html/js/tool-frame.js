const toolSites = {
    bpm: {
        title: '音乐节奏测试',
        url: 'http://www.all8.com/tools/bpm.htm'
    },
    speedtest: {
        title: '网络速度测试',
        url: 'https://plugin.speedtest.cn/#/'
    },
    compumuseum: {
        title: '计算机博物馆',
        url: 'https://www.compumuseum.com/index.html'
    },
    'english-name': {
        title: '英文名生成',
        url: 'https://myingwenming.911cha.com/'
    },
    'english-signature': {
        title: '英文签字生成',
        url: 'https://www.uustv.com/yw.php'
    },
    'setting-generator': {
        title: '设定生成',
        url: 'https://shindanmaker.com/1059194'
    }
};

function loadToolSite() {
    const params = new URLSearchParams(window.location.search);
    const site = toolSites[params.get('site') || ''];
    const frame = document.querySelector('[data-tool-frame]');
    const message = document.querySelector('[data-tool-message]');

    if (!site || !frame || !message) {
        if (frame) {
            frame.classList.add('d-none');
        }
        if (message) {
            message.classList.remove('d-none');
        }
        return;
    }

    document.title = `${site.title} - 站长工具`;
    frame.title = site.title;
    frame.src = site.url;
}

document.addEventListener('DOMContentLoaded', loadToolSite);