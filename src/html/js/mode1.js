const fontSizeInput = document.getElementById('fontSizeInput');
const fontSizeValue = document.getElementById('fontSizeValue');
const colorPicker = document.getElementById('colorPicker');
const numberDisplay = document.getElementById('numberDisplay');

// 更新字体大小显示和应用
fontSizeInput.addEventListener('input', function() {
    const size = this.value + 'px';
    fontSizeValue.textContent = size;
    numberDisplay.style.fontSize = size;
});

// 更新颜色
colorPicker.addEventListener('input', function() {
    numberDisplay.style.color = this.value;
});