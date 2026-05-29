document.getElementById('modeSelect').addEventListener('change', function () {
    const selectedValue = "items/" + this.value;
    const frame = document.getElementById('contentFrame');
    if (selectedValue) {
        frame.src = selectedValue;
    } else {
        frame.src = ''; // 清空
    }
});