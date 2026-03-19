/**
 * sox 设计页 - DOM 引用、常量与视图更新逻辑
 * 依赖：页面 DOM 已就绪；与 sox-js-listen.js、sox-js-file.js 同目录引入，本文件需最先加载
 */
(function () {
    'use strict';

    // ========== 获取 DOM 元素 ==========
    const item_name = document.getElementById('item_name'); // 配置名
    const sox_length = document.getElementById('sox_length'); // sox长度
    const disval_sox_length = document.getElementById('disval_sox_length'); // DISsox长度
    const svgval_sox_length = document.getElementsByClassName('maskB'); // SVGsox长度
    const sox_model_panty = document.getElementById('sox_model_panty'); // panty
    const svgval_sox_model_panty = document.getElementsByClassName('maskP'); // SVGpanty
    const sox_model_tabi = document.getElementById('sox_model_tabi'); // tabi
    const svgval_sox_model_tabi = document.getElementsByClassName('maskT'); // SVGtabi
    const color_single = document.getElementById('color_single'); // 纯色底色
    const svgval_color_single = document.getElementById('bkgSingleColor'); // SVG纯色底色

    // 底纹条纹（实时生成，class="sox bkg stripC"）
    const bkg_strip_switch = document.getElementById('bkg_strip_switch');
    const color_strip = document.getElementById('color_strip');
    const color_strip_width = document.getElementById('color_strip_width');
    const disval_color_strip_width = document.getElementById('disval_color_strip_width');
    const bkgStripContainer = document.getElementById('bkgStripContainer');
    const SVG_VIEW_HEIGHT = 150; // 与底色 rect 一致

    // 尖色块
    const deco_toe_switch = document.getElementById('deco_toe_switch');
    const deco_toe_color = document.getElementById('deco_toe_color');
    const deco_toe_height = document.getElementById('deco_toe_height');
    const disval_deco_toe_height = document.getElementById('disval_deco_toe_height');
    const svgval_toe = document.getElementById('toe'); // SVG 尖色块 rect

    // 顶部条纹
    const svgval_strip_top_1 = document.getElementById('stripT1');
    const svgval_strip_top_2 = document.getElementById('stripT2');
    const svgval_strip_top_3 = document.getElementById('stripT3');
    const svgval_strip_top_4 = document.getElementById('stripT4');
    const deco_strip_top_switch = document.getElementById('deco_strip_top_switch');
    const deco_strip_top_1_enable = document.getElementById('deco_strip_top_1_enable');
    const deco_strip_top_2_enable = document.getElementById('deco_strip_top_2_enable');
    const deco_strip_top_3_enable = document.getElementById('deco_strip_top_3_enable');
    const deco_strip_top_4_enable = document.getElementById('deco_strip_top_4_enable');
    const deco_strip_top_1_color = document.getElementById('deco_strip_top_1_color');
    const deco_strip_top_2_color = document.getElementById('deco_strip_top_2_color');
    const deco_strip_top_3_color = document.getElementById('deco_strip_top_3_color');
    const deco_strip_top_4_color = document.getElementById('deco_strip_top_4_color');
    const deco_strip_top_1_offset = document.getElementById('deco_strip_top_1_offset');
    const deco_strip_top_2_offset = document.getElementById('deco_strip_top_2_offset');
    const deco_strip_top_3_offset = document.getElementById('deco_strip_top_3_offset');
    const deco_strip_top_4_offset = document.getElementById('deco_strip_top_4_offset');
    const deco_strip_top_1_width = document.getElementById('deco_strip_top_1_width');
    const deco_strip_top_2_width = document.getElementById('deco_strip_top_2_width');
    const deco_strip_top_3_width = document.getElementById('deco_strip_top_3_width');
    const deco_strip_top_4_width = document.getElementById('deco_strip_top_4_width');
    const deco_strip_top_autocolor = document.getElementById('deco_strip_top_autocolor');
    const deco_strip_top_autopos = document.getElementById('deco_strip_top_autopos');
    const deco_strip_top_autoheight = document.getElementById('deco_strip_top_autoheight');
    let strip_top_offset_rel_2, strip_top_offset_rel_3, strip_top_offset_rel_4;

    // 脚印
    const deco_step_switch = document.getElementById('deco_step_switch');
    const deco_step_select = document.getElementById('deco_step_select');
    const deco_step_color = document.getElementById('deco_step_color');
    const deco_step_scale = document.getElementById('deco_step_scale');
    const deco_step_offset_y = document.getElementById('deco_step_offset_y');
    const disval_deco_step_scale = document.getElementById('disval_deco_step_scale');
    const disval_deco_step_offset_y = document.getElementById('disval_deco_step_offset_y');
    const stepContainer = document.getElementById('stepContainer');
    const SVG_VIEW_WIDTH = 100;

    // 自由图形
    const deco_custom_switch = document.getElementById('deco_custom_switch');
    const deco_custom_add_btn = document.getElementById('deco_custom_add_btn');
    const deco_custom_clear_btn = document.getElementById('deco_custom_clear_btn');
    const deco_custom_update_btn = document.getElementById('deco_custom_update_btn');
    const deco_custom_tbody = document.getElementById('deco_custom_tbody');

    // 自由文本
    const text_custom_switch = document.getElementById('text_custom_switch');
    const text_custom_add_btn = document.getElementById('text_custom_add_btn');
    const text_custom_clear_btn = document.getElementById('text_custom_clear_btn');
    const text_custom_update_btn = document.getElementById('text_custom_update_btn');
    const text_custom_tbody = document.getElementById('text_custom_tbody');

    // 文字 - 左右标
    const text_lr_switch = document.getElementById('text_lr_switch');
    const text_lrF_switch = document.getElementById('text_lrF_switch');
    const text_lrF_color = document.getElementById('text_lrF_color');
    const text_lrF_offset = document.getElementById('text_lrF_offset');
    const disval_text_lrF_offset = document.getElementById('disval_text_lrF_offset');
    const text_lrB_switch = document.getElementById('text_lrB_switch');
    const text_lrB_color = document.getElementById('text_lrB_color');
    const svgval_text_lrF = document.getElementsByClassName('text-lrF');
    const svgval_text_lrB = document.getElementsByClassName('text-lrlB');

    // 文字 - 前尖
    const text_toe_switch = document.getElementById('text_toe_switch');
    const text_toeF_switch = document.getElementById('text_toeF_switch');
    const text_toeF_color = document.getElementById('text_toeF_color');
    const text_toeF_textL = document.getElementById('text_toeF_textL');
    const text_toeF_textR = document.getElementById('text_toeF_textR');
    const text_toeF_scale = document.getElementById('text_toeF_scale');
    const text_toeF_offset = document.getElementById('text_toeF_offset');
    const disval_text_toeF_scale = document.getElementById('disval_text_toeF_scale');
    const disval_text_toeF_offset = document.getElementById('disval_text_toeF_offset');
    const text_toeline_switch = document.getElementById('text_toeline_switch');
    const text_toeline_color = document.getElementById('text_toeline_color');
    const svgval_text_toeF = document.getElementsByClassName('text-toeF');
    const svgval_text_toeline = document.getElementById('text_toeline');

    // 文字 - 纵向文本
    const text_elite_switch = document.getElementById('text_elite_switch');
    const text_eliteB_switch = document.getElementById('text_eliteB_switch');
    const text_eliteB_textL = document.getElementById('text_eliteB_textL');
    const text_eliteB_textR = document.getElementById('text_eliteB_textR');
    const text_eliteB_color = document.getElementById('text_eliteB_color');
    const text_eliteB_offset = document.getElementById('text_eliteB_offset');
    const disval_text_eliteB_offset = document.getElementById('disval_text_eliteB_offset');
    const text_eliteI_switch = document.getElementById('text_eliteI_switch');
    const text_eliteI_textL = document.getElementById('text_eliteI_textL');
    const text_eliteI_textR = document.getElementById('text_eliteI_textR');
    const text_eliteI_color = document.getElementById('text_eliteI_color');
    const text_eliteI_offset = document.getElementById('text_eliteI_offset');
    const disval_text_eliteI_offset = document.getElementById('disval_text_eliteI_offset');
    const text_eliteO_switch = document.getElementById('text_eliteO_switch');
    const text_eliteO_textL = document.getElementById('text_eliteO_textL');
    const text_eliteO_textR = document.getElementById('text_eliteO_textR');
    const text_eliteO_color = document.getElementById('text_eliteO_color');
    const text_eliteO_offset = document.getElementById('text_eliteO_offset');
    const disval_text_eliteO_offset = document.getElementById('disval_text_eliteO_offset');
    const svgval_text_eliteB = document.getElementsByClassName('text-eliteB');
    const svgval_text_eliteI = document.getElementsByClassName('text-eliteI');
    const svgval_text_eliteO = document.getElementsByClassName('text-eliteO');
    const ELITE_BASE_Y = { B: [15.5, 5.5], I: [39, 9], O: [19, 49] };
    const ELITE_BASE_X = -20;
    const ELITE_OFFSET_MIN = -20;
    const ELITE_OFFSET_MAX = 20;
    const ELITE_BASE_FONTSIZE = 4;

    // 文件按钮（供 listen/file 使用，挂到 window 以便同目录其它脚本访问）
    window.soxRefs = {
        item_name, sox_length, disval_sox_length, svgval_sox_length,
        sox_model_panty, svgval_sox_model_panty, sox_model_tabi, svgval_sox_model_tabi,
        color_single, svgval_color_single,
        bkg_strip_switch, color_strip, color_strip_width, disval_color_strip_width, bkgStripContainer,
        deco_toe_switch, deco_toe_color, deco_toe_height, disval_deco_toe_height, svgval_toe,
        svgval_strip_top_1, svgval_strip_top_2, svgval_strip_top_3, svgval_strip_top_4,
        deco_strip_top_switch, deco_strip_top_1_enable, deco_strip_top_2_enable, deco_strip_top_3_enable, deco_strip_top_4_enable,
        deco_strip_top_1_color, deco_strip_top_2_color, deco_strip_top_3_color, deco_strip_top_4_color,
        deco_strip_top_1_offset, deco_strip_top_2_offset, deco_strip_top_3_offset, deco_strip_top_4_offset,
        deco_strip_top_1_width, deco_strip_top_2_width, deco_strip_top_3_width, deco_strip_top_4_width,
        deco_strip_top_autocolor, deco_strip_top_autopos, deco_strip_top_autoheight,
        deco_step_switch, deco_step_select, deco_step_color, deco_step_scale, deco_step_offset_y,
        disval_deco_step_scale, disval_deco_step_offset_y, stepContainer,
        deco_custom_switch, deco_custom_add_btn, deco_custom_clear_btn, deco_custom_update_btn, deco_custom_tbody,
        text_custom_switch, text_custom_add_btn, text_custom_clear_btn, text_custom_update_btn, text_custom_tbody,
        text_lr_switch, text_lrF_switch, text_lrF_color, text_lrF_offset, disval_text_lrF_offset,
        text_lrB_switch, text_lrB_color, svgval_text_lrF, svgval_text_lrB,
        text_toe_switch, text_toeF_switch, text_toeF_color, text_toeF_textL, text_toeF_textR,
        text_toeF_scale, text_toeF_offset, disval_text_toeF_scale, disval_text_toeF_offset,
        text_toeline_switch, text_toeline_color, svgval_text_toeF, svgval_text_toeline,
        text_elite_switch, text_eliteB_switch, text_eliteB_textL, text_eliteB_textR, text_eliteB_color, text_eliteB_offset, disval_text_eliteB_offset,
        text_eliteI_switch, text_eliteI_textL, text_eliteI_textR, text_eliteI_color, text_eliteI_offset, disval_text_eliteI_offset,
        text_eliteO_switch, text_eliteO_textL, text_eliteO_textR, text_eliteO_color, text_eliteO_offset, disval_text_eliteO_offset,
        svgval_text_eliteB, svgval_text_eliteI, svgval_text_eliteO,
        saveBtn: document.getElementById('saveBtn'),
        loadBtn: document.getElementById('loadBtn'),
        resetBtn: document.getElementById('resetBtn'),
        fileInput: document.getElementById('fileInput'),
        controlForm: document.getElementById('controlForm')
    };

    // ========== 更新函数 ==========
    function update_item_name() { }

    function update_sox_length() {
        update_strip_offset_range();
        const tmpval_sox_length = sox_length.value - 4;
        disval_sox_length.textContent = sox_length.value + "cm";
        if (svgval_sox_length) {
            for (let i = 0; i < svgval_sox_length.length; i++) {
                svgval_sox_length[i].setAttribute('height', tmpval_sox_length);
            }
            for (let i = 0; i < svgval_sox_model_panty.length; i++) {
                svgval_sox_model_panty[i].setAttribute('y', tmpval_sox_length + 4);
            }
            update_strip_top_width_and_offset();
            update_bkg_strip();
        }
    }

    function update_sox_model_panty() {
        const tmpval_sox_model_panty = sox_model_panty.checked;
        for (let i = 0; i < svgval_sox_model_panty.length; i++) {
            if (tmpval_sox_model_panty) {
                svgval_sox_model_panty[i].setAttribute('visibility', "visible");
                sox_length.setAttribute('min', 45);
                if (sox_length.value <= 45) {
                    sox_length.value = 45;
                    update_sox_length();
                } else {
                    update_strip_offset_range();
                }
            } else {
                svgval_sox_model_panty[i].setAttribute('visibility', "hidden");
                sox_length.setAttribute('min', 25);
                update_strip_offset_range();
            }
        }
    }

    function update_sox_model_tabi() {
        const tmpval_sox_model_tabi = sox_model_tabi.checked;
        for (let i = 0; i < svgval_sox_model_tabi.length; i++) {
            if (tmpval_sox_model_tabi) { svgval_sox_model_tabi[i].setAttribute('visibility', "visible"); }
            else { svgval_sox_model_tabi[i].setAttribute('visibility', "hidden"); }
        }
    }

    function update_color_single() {
        const tmpval_color_single = color_single.value;
        if (svgval_color_single) {
            svgval_color_single.setAttribute('fill', tmpval_color_single);
        }
    }

    function update_bkg_strip() {
        if (!bkgStripContainer) return;
        while (bkgStripContainer.firstChild) bkgStripContainer.removeChild(bkgStripContainer.firstChild);
        const w = parseFloat(color_strip_width && color_strip_width.value) || 5;
        if (disval_color_strip_width) disval_color_strip_width.textContent = Number(w).toFixed(1);
        if (!bkg_strip_switch || !bkg_strip_switch.checked) return;
        const fillColor = color_strip && color_strip.value ? color_strip.value : '#000000';
        for (let y = 0; y + w <= sox_length.value; y += w * 2) {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', 0);
            rect.setAttribute('y', y);
            rect.setAttribute('width', 100);
            rect.setAttribute('height', w);
            rect.setAttribute('fill', fillColor);
            rect.setAttribute('mask', 'url(#stok)');
            rect.setAttribute('class', 'sox bkg stripC');
            bkgStripContainer.appendChild(rect);
        }
    }

    function update_toe() {
        if (!svgval_toe) return;
        svgval_toe.setAttribute('visibility', deco_toe_switch && deco_toe_switch.checked ? 'visible' : 'hidden');
        svgval_toe.setAttribute('fill', deco_toe_color ? deco_toe_color.value : '#ffffff');
        const h = parseFloat(deco_toe_height && deco_toe_height.value) || 0;
        svgval_toe.setAttribute('height', h);
        if (disval_deco_toe_height) disval_deco_toe_height.textContent = Number(h).toFixed(1) + 'cm';
    }

    function update_text_lr() {
        const masterOn = text_lr_switch && text_lr_switch.checked;
        const offsetVal = parseFloat(text_lrF_offset && text_lrF_offset.value) || 6;
        if (disval_text_lrF_offset) disval_text_lrF_offset.textContent = Number(offsetVal).toFixed(1);
        for (let i = 0; i < svgval_text_lrF.length; i++) {
            const el = svgval_text_lrF[i];
            el.setAttribute('visibility', (masterOn && text_lrF_switch && text_lrF_switch.checked) ? 'visible' : 'hidden');
            el.setAttribute('fill', text_lrF_color ? text_lrF_color.value : '#000000');
            el.setAttribute('y', offsetVal);
        }
        for (let i = 0; i < svgval_text_lrB.length; i++) {
            const el = svgval_text_lrB[i];
            el.setAttribute('visibility', (masterOn && text_lrB_switch && text_lrB_switch.checked) ? 'visible' : 'hidden');
            el.setAttribute('fill', text_lrB_color ? text_lrB_color.value : '#000000');
        }
    }

    function update_text_toe() {
        const masterOn = text_toe_switch && text_toe_switch.checked;
        const scaleVal = parseFloat(text_toeF_scale && text_toeF_scale.value) || 1;
        const offsetVal = parseFloat(text_toeF_offset && text_toeF_offset.value) || 6;
        if (disval_text_toeF_scale) disval_text_toeF_scale.textContent = Number(scaleVal).toFixed(1);
        if (disval_text_toeF_offset) disval_text_toeF_offset.textContent = Number(offsetVal).toFixed(1);
        const baseFontSize = 2;
        const fontSize = baseFontSize * scaleVal;
        const textL = (text_toeF_textL && text_toeF_textL.value) || 'TEXT-L';
        const textR = (text_toeF_textR && text_toeF_textR.value) || 'TEXT-R';
        for (let i = 0; i < svgval_text_toeF.length; i++) {
            const el = svgval_text_toeF[i];
            el.setAttribute('visibility', (masterOn && text_toeF_switch && text_toeF_switch.checked) ? 'visible' : 'hidden');
            el.setAttribute('fill', text_toeF_color ? text_toeF_color.value : '#000000');
            el.setAttribute('font-size', fontSize);
            el.setAttribute('y', offsetVal);
            el.textContent = i === 0 ? textL : textR;
        }
        if (svgval_text_toeline) {
            svgval_text_toeline.setAttribute('visibility', (masterOn && text_toeline_switch && text_toeline_switch.checked) ? 'visible' : 'hidden');
            svgval_text_toeline.setAttribute('fill', text_toeline_color ? text_toeline_color.value : '#000000');
        }
    }

    function update_elite_offset_range() {
        const inputs = [text_eliteB_offset, text_eliteI_offset, text_eliteO_offset];
        inputs.forEach(function (input) {
            if (!input) return;
            input.setAttribute('min', ELITE_OFFSET_MIN);
            input.setAttribute('max', ELITE_OFFSET_MAX);
            const val = parseFloat(input.value) || 0;
            const clamped = Math.max(ELITE_OFFSET_MIN, Math.min(ELITE_OFFSET_MAX, val));
            if (clamped !== val) input.value = clamped;
        });
    }

    function update_text_elite() {
        const masterOn = text_elite_switch && text_elite_switch.checked;
        function applyGroup(svgEls, baseYs, switchEl, textL, textR, colorEl, offsetEl, disvalOffset) {
            if (!svgEls || !svgEls.length) return;
            let offsetVal = parseFloat(offsetEl && offsetEl.value) || 0;
            offsetVal = Math.max(ELITE_OFFSET_MIN, Math.min(ELITE_OFFSET_MAX, offsetVal));
            if (disvalOffset) disvalOffset.textContent = Number(offsetVal).toFixed(1);
            const show = masterOn && switchEl && switchEl.checked;
            const fill = colorEl ? colorEl.value : '#000000';
            const strL = (textL && textL.value) || '';
            const strR = (textR && textR.value) || '';
            const xVal = ELITE_BASE_X + offsetVal;
            for (let i = 0; i < svgEls.length; i++) {
                const el = svgEls[i];
                el.setAttribute('visibility', show ? 'visible' : 'hidden');
                el.setAttribute('fill', fill);
                el.setAttribute('font-size', ELITE_BASE_FONTSIZE);
                el.setAttribute('x', xVal);
                el.setAttribute('y', baseYs[i] || 0);
                el.textContent = i === 0 ? strL : strR;
            }
        }
        applyGroup(svgval_text_eliteB, ELITE_BASE_Y.B, text_eliteB_switch, text_eliteB_textL, text_eliteB_textR, text_eliteB_color, text_eliteB_offset, disval_text_eliteB_offset);
        applyGroup(svgval_text_eliteI, ELITE_BASE_Y.I, text_eliteI_switch, text_eliteI_textL, text_eliteI_textR, text_eliteI_color, text_eliteI_offset, disval_text_eliteI_offset);
        applyGroup(svgval_text_eliteO, ELITE_BASE_Y.O, text_eliteO_switch, text_eliteO_textL, text_eliteO_textR, text_eliteO_color, text_eliteO_offset, disval_text_eliteO_offset);
    }

    function update_strip_top_visibility() {
        const masterOn = deco_strip_top_switch && deco_strip_top_switch.checked;
        const pairs = [
            [deco_strip_top_1_enable, svgval_strip_top_1],
            [deco_strip_top_2_enable, svgval_strip_top_2],
            [deco_strip_top_3_enable, svgval_strip_top_3],
            [deco_strip_top_4_enable, svgval_strip_top_4]
        ];
        pairs.forEach(function (p) {
            const checkbox = p[0], rect = p[1];
            if (rect) rect.setAttribute('visibility', (masterOn && checkbox.checked) ? 'visible' : 'hidden');
        });
    }

    function apply_strip_top_autopos() {
        const on = deco_strip_top_autopos && deco_strip_top_autopos.checked;
        deco_strip_top_2_offset.disabled = on;
        deco_strip_top_3_offset.disabled = on;
        deco_strip_top_4_offset.disabled = on;
        if (on) {
            const o1 = parseFloat(deco_strip_top_1_offset.value) || 0;
            if (strip_top_offset_rel_2 === undefined) {
                strip_top_offset_rel_2 = (parseFloat(deco_strip_top_2_offset.value) || 0) - o1;
                strip_top_offset_rel_3 = (parseFloat(deco_strip_top_3_offset.value) || 0) - o1;
                strip_top_offset_rel_4 = (parseFloat(deco_strip_top_4_offset.value) || 0) - o1;
            }
            deco_strip_top_2_offset.value = o1 + strip_top_offset_rel_2;
            deco_strip_top_3_offset.value = o1 + strip_top_offset_rel_3;
            deco_strip_top_4_offset.value = o1 + strip_top_offset_rel_4;
        } else {
            strip_top_offset_rel_2 = strip_top_offset_rel_3 = strip_top_offset_rel_4 = undefined;
        }
    }

    function apply_strip_top_autocolor() {
        const on = deco_strip_top_autocolor && deco_strip_top_autocolor.checked;
        deco_strip_top_2_color.disabled = on;
        deco_strip_top_3_color.disabled = on;
        deco_strip_top_4_color.disabled = on;
        if (on) {
            deco_strip_top_2_color.value = deco_strip_top_1_color.value;
            deco_strip_top_3_color.value = deco_strip_top_1_color.value;
            deco_strip_top_4_color.value = deco_strip_top_1_color.value;
        }
    }

    function apply_strip_top_autoheight() {
        const on = deco_strip_top_autoheight && deco_strip_top_autoheight.checked;
        deco_strip_top_2_width.disabled = on;
        deco_strip_top_3_width.disabled = on;
        deco_strip_top_4_width.disabled = on;
        if (on) {
            deco_strip_top_2_width.value = deco_strip_top_1_width.value;
            deco_strip_top_3_width.value = deco_strip_top_1_width.value;
            deco_strip_top_4_width.value = deco_strip_top_1_width.value;
        }
    }

    function update_strip_top_color() {
        const pairs = [
            [deco_strip_top_1_color, svgval_strip_top_1],
            [deco_strip_top_2_color, svgval_strip_top_2],
            [deco_strip_top_3_color, svgval_strip_top_3],
            [deco_strip_top_4_color, svgval_strip_top_4]
        ];
        pairs.forEach(function (p) {
            const colorInput = p[0], rect = p[1];
            if (colorInput && rect) rect.setAttribute('fill', colorInput.value);
        });
    }

    function update_strip_top_width_and_offset() {
        const soxLen = parseFloat(sox_length.value) || 60;
        const pairs = [
            [deco_strip_top_1_offset, deco_strip_top_1_width, svgval_strip_top_1],
            [deco_strip_top_2_offset, deco_strip_top_2_width, svgval_strip_top_2],
            [deco_strip_top_3_offset, deco_strip_top_3_width, svgval_strip_top_3],
            [deco_strip_top_4_offset, deco_strip_top_4_width, svgval_strip_top_4]
        ];
        pairs.forEach(function (p) {
            const offsetInput = p[0], widthInput = p[1], rect = p[2];
            if (!rect) return;
            const offset = parseFloat(offsetInput.value) || 0;
            const width = parseFloat(widthInput.value) || 0;
            rect.setAttribute('y', soxLen - (offset + width));
            rect.setAttribute('height', width);
        });
    }

    const STEP_PAW_SIZE = 6;
    const STEP_PAW_CENTER = STEP_PAW_SIZE / 2;
    const STEP_CENTER_X1 = 4;
    const STEP_CENTER_X2 = 14;

    function update_deco_step() {
        if (!stepContainer) return;
        while (stepContainer.firstChild) stepContainer.removeChild(stepContainer.firstChild);
        if (!deco_step_switch || !deco_step_switch.checked) return;
        const scale = parseFloat(deco_step_scale && deco_step_scale.value) || 0.6;
        const offsetY = parseFloat(deco_step_offset_y && deco_step_offset_y.value) || 7;
        const color = deco_step_color && deco_step_color.value ? deco_step_color.value : '#ffc0cb';
        const fileName = 'sox/' + (deco_step_select && deco_step_select.value ? deco_step_select.value : 'step_paw.svg');
        function setFill(el, fillColor) {
            if (el.nodeType === 1) {
                if (el.tagName === 'path' || el.tagName === 'circle' || el.tagName === 'rect' || el.tagName === 'polygon') el.setAttribute('fill', fillColor);
                for (let j = 0; j < el.childNodes.length; j++) setFill(el.childNodes[j], fillColor);
            }
        }
        function makeWrapper(centerX) {
            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', 'translate(' + centerX + ',' + offsetY + ') scale(' + scale + ') translate(' + (-STEP_PAW_CENTER) + ',' + (-STEP_PAW_CENTER) + ')');
            return g;
        }
        fetch(fileName)
            .then(function (r) { return r.text(); })
            .then(function (svgText) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(svgText, 'image/svg+xml');
                const root = doc.documentElement;
                if (!root || root.tagName !== 'svg') return;
                [STEP_CENTER_X1, STEP_CENTER_X2].forEach(function (centerX) {
                    const wrapper = makeWrapper(centerX);
                    for (let i = 0; i < root.childNodes.length; i++) {
                        const node = root.childNodes[i];
                        wrapper.appendChild(document.importNode(node, true));
                    }
                    setFill(wrapper, color);
                    stepContainer.appendChild(wrapper);
                });
            })
            .catch(function (err) { console.error('脚印 SVG 加载失败:', fileName, err); });
    }

    function update_strip_offset_range() {
        const maxOffset = parseFloat(sox_length.value) || 60;
        const offsetInputs = [deco_strip_top_1_offset, deco_strip_top_2_offset, deco_strip_top_3_offset, deco_strip_top_4_offset];
        offsetInputs.forEach(function (input) {
            if (!input) return;
            input.setAttribute('max', maxOffset);
            const minVal = parseFloat(input.getAttribute('min')) || 0;
            const val = parseFloat(input.value) || 0;
            const clamped = Math.max(minVal, Math.min(maxOffset, val));
            if (clamped !== val) input.value = clamped;
        });
    }

    // 暴露更新函数供 listen/file 使用
    window.soxUpdate = {
        update_item_name, update_sox_length, update_sox_model_panty, update_sox_model_tabi,
        update_color_single, update_bkg_strip, update_toe, update_text_lr, update_text_toe,
        update_elite_offset_range, update_text_elite,
        update_strip_top_visibility, apply_strip_top_autopos, apply_strip_top_autocolor, apply_strip_top_autoheight,
        update_strip_top_color, update_strip_top_width_and_offset, update_deco_step, update_strip_offset_range
    };

    // ========== 初始化 ==========
    update_sox_length();
    update_sox_model_panty();
    update_sox_model_tabi();
    update_color_single();
    update_strip_top_visibility();
    update_strip_top_color();
    update_strip_top_width_and_offset();
    apply_strip_top_autocolor();
    apply_strip_top_autopos();
    apply_strip_top_autoheight();
    update_toe();
    update_bkg_strip();
    update_deco_step();
    update_text_lr();
    update_text_toe();
    update_elite_offset_range();
    update_text_elite();
})();
