const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const directionSelect = document.getElementById('directionSelect');
const triangle = document.getElementById('triangle');

let rotationAngle = 0;
let animationId = null;
let isRotating = true;

// 更新三角形大小
function updateTriangleSize(size) {
    // 调整边框宽度和高度来改变三角形大小
    triangle.style.borderLeftWidth = (size / 2) + 'px';
    triangle.style.borderRightWidth = (size / 2) + 'px';
    triangle.style.borderBottomWidth = size + 'px';
    sizeValue.textContent = size + 'px';
}

// 更新旋转速度
function updateRotationSpeed(speed) {
    speedValue.textContent = speed.toFixed(1) + 'x';
    const direction = directionSelect.value === 'clockwise' ? '' : '-';
    triangle.style.animation = `rotate ${1 / speed}s linear infinite`;
    triangle.style.setProperty('--rotation-direction', direction);
}

// 更新旋转方向
function updateDirection(direction) {
    const speed = parseFloat(speedSlider.value);
    const directionClass = direction === 'clockwise' ? '' : 'counter-clockwise';
    // 移除旧类
    triangle.classList.remove('counter-clockwise');
    // 添加新类
    if (direction === 'counterClockwise') {
        triangle.classList.add('counter-clockwise');
    }
    // 重新设置动画以应用新的方向
    triangle.style.animation = `rotate ${1 / speed}s linear infinite`;
}

// 初始化
updateTriangleSize(parseInt(sizeSlider.value));
updateRotationSpeed(parseFloat(speedSlider.value));

// 监听大小滑块
sizeSlider.addEventListener('input', function() {
    updateTriangleSize(parseInt(this.value));
});

// 监听速度滑块
speedSlider.addEventListener('input', function() {
    updateRotationSpeed(parseFloat(this.value));
});

// 监听方向选择
directionSelect.addEventListener('change', function() {
    updateDirection(this.value);
});

// 添加 CSS 动画规则
const styleSheet = document.createElement('style');
styleSheet.innerHTML = `
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .counter-clockwise {
        animation-direction: reverse;
    }
`;
document.head.appendChild(styleSheet);

// 使用 requestAnimationFrame 实现更精确的控制
function animateTriangle() {
    if (!isRotating) return;

    const speed = parseFloat(speedSlider.value);
    const direction = directionSelect.value === 'clockwise' ? 1 : -1;
    rotationAngle += 0.1 * speed * direction; // 每帧增加角度
    triangle.style.transform = `rotate(${rotationAngle}deg)`;

    animationId = requestAnimationFrame(animateTriangle);
}

// 启动动画
animateTriangle();

// 为速度和方向更改时重新启动动画
speedSlider.addEventListener('input', () => {
    if (animationId) cancelAnimationFrame(animationId);
    animateTriangle();
});
directionSelect.addEventListener('change', () => {
    if (animationId) cancelAnimationFrame(animationId);
    animateTriangle();
});