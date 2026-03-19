/**
 * sox 设计页 - 事件监听（表单与控件 → 调用 soxUpdate 更新视图）
 * 依赖：sox-js-update.js 已加载（提供 window.soxRefs、window.soxUpdate）
 */
(function () {
    'use strict';

    const R = window.soxRefs;
    const U = window.soxUpdate;
    if (!R || !U) return;

    const {
        sox_length, sox_model_panty, sox_model_tabi, color_single,
        bkg_strip_switch, color_strip, color_strip_width,
        deco_toe_switch, deco_toe_color, deco_toe_height,
        text_lr_switch, text_lrF_switch, text_lrF_color, text_lrF_offset, text_lrB_switch, text_lrB_color,
        text_toe_switch, text_toeF_switch, text_toeF_color, text_toeF_textL, text_toeF_textR,
        text_toeF_scale, text_toeF_offset, text_toeline_switch, text_toeline_color,
        text_elite_switch, text_eliteB_switch, text_eliteI_switch, text_eliteO_switch,
        text_eliteB_textL, text_eliteB_textR, text_eliteB_color, text_eliteB_offset,
        text_eliteI_textL, text_eliteI_textR, text_eliteI_color, text_eliteI_offset,
        text_eliteO_textL, text_eliteO_textR, text_eliteO_color, text_eliteO_offset,
        deco_strip_top_switch, deco_strip_top_1_enable, deco_strip_top_2_enable, deco_strip_top_3_enable, deco_strip_top_4_enable,
        deco_strip_top_1_color, deco_strip_top_2_color, deco_strip_top_3_color, deco_strip_top_4_color,
        deco_strip_top_autocolor, deco_strip_top_1_offset, deco_strip_top_1_width,
        deco_strip_top_2_offset, deco_strip_top_2_width, deco_strip_top_3_offset, deco_strip_top_3_width,
        deco_strip_top_4_offset, deco_strip_top_4_width, deco_strip_top_autopos, deco_strip_top_autoheight,
        deco_step_offset_y, deco_step_switch, deco_step_select, deco_step_color, deco_step_scale,
        disval_deco_step_offset_y, disval_deco_step_scale,
        deco_custom_add_btn, deco_custom_clear_btn, deco_custom_update_btn, deco_custom_tbody,
        text_custom_add_btn, text_custom_clear_btn, text_custom_update_btn, text_custom_tbody
    } = R;

    // 监听 sox 长度 / 版式 / 纯色
    sox_length.addEventListener('input', function () { U.update_sox_length(); });
    sox_model_panty.addEventListener('input', function () { U.update_sox_model_panty(); });
    sox_model_tabi.addEventListener('input', function () { U.update_sox_model_tabi(); });
    color_single.addEventListener('input', function () { U.update_color_single(); });

    // 底纹条纹
    bkg_strip_switch.addEventListener('change', U.update_bkg_strip);
    color_strip.addEventListener('input', U.update_bkg_strip);
    color_strip_width.addEventListener('input', U.update_bkg_strip);

    // 尖色块
    deco_toe_switch.addEventListener('change', U.update_toe);
    deco_toe_color.addEventListener('input', U.update_toe);
    deco_toe_height.addEventListener('input', U.update_toe);

    // 文字左右标
    text_lr_switch.addEventListener('change', U.update_text_lr);
    text_lrF_switch.addEventListener('change', U.update_text_lr);
    text_lrF_color.addEventListener('input', U.update_text_lr);
    text_lrF_offset.addEventListener('input', U.update_text_lr);
    text_lrB_switch.addEventListener('change', U.update_text_lr);
    text_lrB_color.addEventListener('input', U.update_text_lr);

    // 文字前尖
    text_toe_switch.addEventListener('change', U.update_text_toe);
    text_toeF_switch.addEventListener('change', U.update_text_toe);
    text_toeF_color.addEventListener('input', U.update_text_toe);
    text_toeF_textL.addEventListener('input', U.update_text_toe);
    text_toeF_textR.addEventListener('input', U.update_text_toe);
    text_toeF_scale.addEventListener('input', U.update_text_toe);
    text_toeF_offset.addEventListener('input', U.update_text_toe);
    text_toeline_switch.addEventListener('change', U.update_text_toe);
    text_toeline_color.addEventListener('input', U.update_text_toe);

    // 文字纵向文本（后/内/外竖写互斥）
    text_elite_switch.addEventListener('change', U.update_text_elite);
    text_eliteB_switch.addEventListener('change', function () {
        if (text_eliteB_switch.checked) { text_eliteI_switch.checked = false; text_eliteO_switch.checked = false; }
        U.update_text_elite();
    });
    text_eliteI_switch.addEventListener('change', function () {
        if (text_eliteI_switch.checked) text_eliteB_switch.checked = false;
        U.update_text_elite();
    });
    text_eliteO_switch.addEventListener('change', function () {
        if (text_eliteO_switch.checked) text_eliteB_switch.checked = false;
        U.update_text_elite();
    });
    text_eliteB_textL.addEventListener('input', U.update_text_elite);
    text_eliteB_textR.addEventListener('input', U.update_text_elite);
    text_eliteB_color.addEventListener('input', U.update_text_elite);
    text_eliteB_offset.addEventListener('input', U.update_text_elite);
    text_eliteI_textL.addEventListener('input', U.update_text_elite);
    text_eliteI_textR.addEventListener('input', U.update_text_elite);
    text_eliteI_color.addEventListener('input', U.update_text_elite);
    text_eliteI_offset.addEventListener('input', U.update_text_elite);
    text_eliteO_textL.addEventListener('input', U.update_text_elite);
    text_eliteO_textR.addEventListener('input', U.update_text_elite);
    text_eliteO_color.addEventListener('input', U.update_text_elite);
    text_eliteO_offset.addEventListener('input', U.update_text_elite);

    // 顶部条纹：总开关与各条纹显隐
    deco_strip_top_switch.addEventListener('change', U.update_strip_top_visibility);
    deco_strip_top_1_enable.addEventListener('change', U.update_strip_top_visibility);
    deco_strip_top_2_enable.addEventListener('change', U.update_strip_top_visibility);
    deco_strip_top_3_enable.addEventListener('change', U.update_strip_top_visibility);
    deco_strip_top_4_enable.addEventListener('change', U.update_strip_top_visibility);

    // 顶部条纹颜色
    deco_strip_top_1_color.addEventListener('input', function () {
        U.apply_strip_top_autocolor();
        U.update_strip_top_color();
    });
    deco_strip_top_2_color.addEventListener('input', U.update_strip_top_color);
    deco_strip_top_3_color.addEventListener('input', U.update_strip_top_color);
    deco_strip_top_4_color.addEventListener('input', U.update_strip_top_color);
    deco_strip_top_autocolor.addEventListener('change', function () {
        U.apply_strip_top_autocolor();
        U.update_strip_top_color();
    });

    // 顶部条纹宽度与偏移
    deco_strip_top_1_offset.addEventListener('input', function () {
        U.apply_strip_top_autopos();
        U.update_strip_offset_range();
        U.update_strip_top_width_and_offset();
    });
    deco_strip_top_1_width.addEventListener('input', function () {
        U.apply_strip_top_autoheight();
        U.update_strip_top_width_and_offset();
    });
    deco_strip_top_2_offset.addEventListener('input', U.update_strip_top_width_and_offset);
    deco_strip_top_2_width.addEventListener('input', U.update_strip_top_width_and_offset);
    deco_strip_top_3_offset.addEventListener('input', U.update_strip_top_width_and_offset);
    deco_strip_top_3_width.addEventListener('input', U.update_strip_top_width_and_offset);
    deco_strip_top_4_offset.addEventListener('input', U.update_strip_top_width_and_offset);
    deco_strip_top_4_width.addEventListener('input', U.update_strip_top_width_and_offset);
    deco_strip_top_autopos.addEventListener('change', function () {
        U.apply_strip_top_autopos();
        U.update_strip_offset_range();
        U.update_strip_top_width_and_offset();
    });
    deco_strip_top_autoheight.addEventListener('change', function () {
        U.apply_strip_top_autoheight();
        U.update_strip_top_width_and_offset();
    });

    // 脚印
    deco_step_offset_y.addEventListener('input', function () {
        if (disval_deco_step_offset_y) disval_deco_step_offset_y.textContent = Number(deco_step_offset_y.value).toFixed(1);
        U.update_deco_step();
    });
    deco_step_switch.addEventListener('change', U.update_deco_step);
    deco_step_select.addEventListener('change', U.update_deco_step);
    deco_step_color.addEventListener('input', U.update_deco_step);
    deco_step_scale.addEventListener('input', function () {
        if (disval_deco_step_scale) disval_deco_step_scale.textContent = Number(deco_step_scale.value).toFixed(1);
        U.update_deco_step();
    });

    // 自由图形：动态表格
    function refreshDecoCustomRowNumbers() {
        const rows = deco_custom_tbody ? deco_custom_tbody.querySelectorAll('tr') : [];
        rows.forEach((tr, i) => {
            const idxCell = tr.querySelector('.deco_custom_index');
            if (idxCell) idxCell.textContent = i + 1;
            const btnUp = tr.querySelector('.deco_custom_btn_up');
            const btnDown = tr.querySelector('.deco_custom_btn_down');
            if (btnUp) btnUp.style.display = i === 0 ? 'none' : '';
            if (btnDown) btnDown.style.display = i === rows.length - 1 ? 'none' : '';
        });
    }
    function addDecoCustomRow() {
        if (!deco_custom_tbody) return;
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td class="deco_custom_index"></td>' +
            '<td><input type="text" class="form-control form-control-sm deco_custom_svg_input" placeholder="如 &lt;circle r=\'5\' cx=\'10\' cy=\'10\'/&gt;"></td>' +
            '<td><div class="btn-group btn-group-sm"><button type="button" class="btn btn-outline-danger deco_custom_btn_del">删除</button>' +
            '<button type="button" class="btn btn-outline-secondary deco_custom_btn_up">上移</button>' +
            '<button type="button" class="btn btn-outline-secondary deco_custom_btn_down">下移</button></div></td>';
        deco_custom_tbody.appendChild(tr);
        refreshDecoCustomRowNumbers();
    }
    if (deco_custom_add_btn) {
        deco_custom_add_btn.addEventListener('click', addDecoCustomRow);
    }
    if (deco_custom_clear_btn) {
        deco_custom_clear_btn.addEventListener('click', function () {
            if (deco_custom_tbody) deco_custom_tbody.innerHTML = '';
        });
    }
    if (deco_custom_update_btn) {
        deco_custom_update_btn.addEventListener('click', function () {
            // 更新图形：可在此处根据表格内容刷新 SVG 显示
        });
    }
    if (deco_custom_tbody) {
        deco_custom_tbody.addEventListener('click', function (e) {
            const tr = e.target.closest('tr');
            if (!tr || tr.parentElement !== deco_custom_tbody) return;
            const rows = Array.from(deco_custom_tbody.querySelectorAll('tr'));
            const i = rows.indexOf(tr);
            if (e.target.classList.contains('deco_custom_btn_del')) {
                tr.remove();
                refreshDecoCustomRowNumbers();
            } else if (e.target.classList.contains('deco_custom_btn_up') && i > 0) {
                deco_custom_tbody.insertBefore(tr, rows[i - 1]);
                refreshDecoCustomRowNumbers();
            } else if (e.target.classList.contains('deco_custom_btn_down') && i < rows.length - 1) {
                const next = rows[i + 1];
                deco_custom_tbody.insertBefore(next, tr);
                refreshDecoCustomRowNumbers();
            }
        });
    }

    // 自由文本：动态表格（与自由图形同逻辑）
    const WEB_FONTS = [
        'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana',
        'Segoe UI', 'Tahoma', 'Trebuchet MS', 'Comic Sans MS', 'Impact',
        'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', 'SimHei', 'KaiTi', 'FangSong'
    ];
    function getTextCustomFontOptions() {
        return WEB_FONTS.map(function (f) {
            var q = f.indexOf(' ') >= 0 ? '"' + f + '"' : f;
            return '<option value="' + q + '">' + f + '</option>';
        }).join('');
    }
    function refreshTextCustomRowNumbers() {
        const rows = text_custom_tbody ? text_custom_tbody.querySelectorAll('tr') : [];
        rows.forEach(function (tr, i) {
            const idxCell = tr.querySelector('.text_custom_index');
            if (idxCell) idxCell.textContent = i + 1;
            const btnUp = tr.querySelector('.text_custom_btn_up');
            const btnDown = tr.querySelector('.text_custom_btn_down');
            if (btnUp) btnUp.style.display = i === 0 ? 'none' : '';
            if (btnDown) btnDown.style.display = i === rows.length - 1 ? 'none' : '';
        });
    }
    function addTextCustomRow() {
        if (!text_custom_tbody) return;
        const tr = document.createElement('tr');
        const fontOpts = getTextCustomFontOptions();
        tr.innerHTML =
            '<td class="text_custom_index"></td>' +
            '<td class="align-middle"><input type="checkbox" class="form-check-input text_custom_show" checked></td>' +
            '<td><input type="text" class="form-control form-control-sm text_custom_content" placeholder="文本内容"></td>' +
            '<td><select class="form-select form-select-sm text_custom_font">' + fontOpts + '</select></td>' +
            '<td><input type="color" class="form-control form-control-color form-control-sm text_custom_color" value="#000000" title="颜色"></td>' +
            '<td><input type="number" class="form-control form-control-sm text_custom_x" placeholder="x" value="0" step="any"></td>' +
            '<td><input type="number" class="form-control form-control-sm text_custom_y" placeholder="y" value="0" step="any"></td>' +
            '<td><input type="number" class="form-control form-control-sm text_custom_scale" placeholder="1" value="1" step="0.1" min="0.1"></td>' +
            '<td><input type="range" class="form-range text_custom_rotate" min="-180" max="180" value="0" title="旋转">' +
            '<span class="text_custom_rotate_val ms-1">0</span></td>' +
            '<td><div class="btn-group btn-group-sm"><button type="button" class="btn btn-outline-danger text_custom_btn_del">删除</button>' +
            '<button type="button" class="btn btn-outline-secondary text_custom_btn_up">上移</button>' +
            '<button type="button" class="btn btn-outline-secondary text_custom_btn_down">下移</button></div></td>';
        text_custom_tbody.appendChild(tr);
        refreshTextCustomRowNumbers();
    }
    if (text_custom_add_btn) {
        text_custom_add_btn.addEventListener('click', addTextCustomRow);
    }
    if (text_custom_clear_btn) {
        text_custom_clear_btn.addEventListener('click', function () {
            if (text_custom_tbody) text_custom_tbody.innerHTML = '';
        });
    }
    if (text_custom_update_btn) {
        text_custom_update_btn.addEventListener('click', function () {
            // 更新文本：可在此处根据表格内容刷新 SVG 显示
        });
    }
    if (text_custom_tbody) {
        text_custom_tbody.addEventListener('click', function (e) {
            const tr = e.target.closest('tr');
            if (!tr || tr.parentElement !== text_custom_tbody) return;
            const rows = Array.from(text_custom_tbody.querySelectorAll('tr'));
            const i = rows.indexOf(tr);
            if (e.target.classList.contains('text_custom_btn_del')) {
                tr.remove();
                refreshTextCustomRowNumbers();
            } else if (e.target.classList.contains('text_custom_btn_up') && i > 0) {
                text_custom_tbody.insertBefore(tr, rows[i - 1]);
                refreshTextCustomRowNumbers();
            } else if (e.target.classList.contains('text_custom_btn_down') && i < rows.length - 1) {
                const next = rows[i + 1];
                text_custom_tbody.insertBefore(next, tr);
                refreshTextCustomRowNumbers();
            }
        });
        text_custom_tbody.addEventListener('input', function (e) {
            if (e.target.classList.contains('text_custom_rotate')) {
                const td = e.target.closest('td');
                const valSpan = td ? td.querySelector('.text_custom_rotate_val') : null;
                if (valSpan) valSpan.textContent = e.target.value;
            }
        });
    }
})();
