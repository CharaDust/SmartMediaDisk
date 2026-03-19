/**
 * sox 设计页 - 配置与 SVG 文件：保存/加载 JSON、重置、导出 SVG
 * 依赖：sox-js-update.js 已加载（提供 window.soxRefs、window.soxUpdate）
 */
(function () {
    'use strict';

    const R = window.soxRefs;
    const U = window.soxUpdate;
    if (!R || !U) return;

    const {
        item_name, sox_length, sox_model_panty, sox_model_tabi, color_single,
        bkg_strip_switch, color_strip, color_strip_width,
        deco_toe_switch, deco_toe_color, deco_toe_height,
        deco_strip_top_switch, deco_strip_top_1_enable, deco_strip_top_2_enable, deco_strip_top_3_enable, deco_strip_top_4_enable,
        deco_strip_top_1_color, deco_strip_top_2_color, deco_strip_top_3_color, deco_strip_top_4_color,
        deco_strip_top_1_offset, deco_strip_top_2_offset, deco_strip_top_3_offset, deco_strip_top_4_offset,
        deco_strip_top_1_width, deco_strip_top_2_width, deco_strip_top_3_width, deco_strip_top_4_width,
        deco_step_switch, deco_step_select, deco_step_color, deco_step_scale, deco_step_offset_y,
        disval_deco_step_scale, disval_deco_step_offset_y,
        text_lr_switch, text_lrF_switch, text_lrF_color, text_lrF_offset, text_lrB_switch, text_lrB_color,
        disval_text_lrF_offset,
        text_toe_switch, text_toeF_switch, text_toeF_color, text_toeF_textL, text_toeF_textR,
        text_toeF_scale, text_toeF_offset, text_toeline_switch, text_toeline_color,
        disval_text_toeF_scale, disval_text_toeF_offset,
        text_elite_switch, text_eliteB_switch, text_eliteI_switch, text_eliteO_switch,
        text_eliteB_textL, text_eliteB_textR, text_eliteB_color, text_eliteB_offset,
        text_eliteI_textL, text_eliteI_textR, text_eliteI_color, text_eliteI_offset,
        text_eliteO_textL, text_eliteO_textR, text_eliteO_color, text_eliteO_offset,
        disval_text_eliteB_offset, disval_text_eliteI_offset, disval_text_eliteO_offset,
        saveBtn, loadBtn, resetBtn, fileInput
    } = R;

    // 保存配置到 JSON 文件
    saveBtn.addEventListener('click', function () {
        const config = {
            conf_item_name: item_name.value,
            conf_sox_length: sox_length.value,
            conf_sox_model_panty: sox_model_panty.checked,
            conf_sox_model_tabi: sox_model_tabi.checked,
            conf_color_single: color_single.value,
            conf_bkg_strip_switch: bkg_strip_switch.checked,
            conf_color_strip: color_strip.value,
            conf_color_strip_width: color_strip_width.value,
            conf_deco_toe_switch: deco_toe_switch.checked,
            conf_deco_toe_color: deco_toe_color.value,
            conf_deco_toe_height: deco_toe_height.value,
            conf_deco_strip_top_switch: deco_strip_top_switch.checked,
            conf_deco_strip_top_1_enable: deco_strip_top_1_enable.checked,
            conf_deco_strip_top_2_enable: deco_strip_top_2_enable.checked,
            conf_deco_strip_top_3_enable: deco_strip_top_3_enable.checked,
            conf_deco_strip_top_4_enable: deco_strip_top_4_enable.checked,
            conf_deco_strip_top_1_color: deco_strip_top_1_color.value,
            conf_deco_strip_top_2_color: deco_strip_top_2_color.value,
            conf_deco_strip_top_3_color: deco_strip_top_3_color.value,
            conf_deco_strip_top_4_color: deco_strip_top_4_color.value,
            conf_deco_strip_top_1_offset: deco_strip_top_1_offset.value,
            conf_deco_strip_top_2_offset: deco_strip_top_2_offset.value,
            conf_deco_strip_top_3_offset: deco_strip_top_3_offset.value,
            conf_deco_strip_top_4_offset: deco_strip_top_4_offset.value,
            conf_deco_strip_top_1_width: deco_strip_top_1_width.value,
            conf_deco_strip_top_2_width: deco_strip_top_2_width.value,
            conf_deco_strip_top_3_width: deco_strip_top_3_width.value,
            conf_deco_strip_top_4_width: deco_strip_top_4_width.value,
            conf_deco_step_switch: deco_step_switch.checked,
            conf_deco_step_select: deco_step_select.value,
            conf_deco_step_color: deco_step_color.value,
            conf_deco_step_scale: deco_step_scale.value,
            conf_deco_step_offset_y: deco_step_offset_y.value,
            conf_text_lr_switch: text_lr_switch.checked,
            conf_text_lrF_switch: text_lrF_switch.checked,
            conf_text_lrF_color: text_lrF_color.value,
            conf_text_lrF_offset: text_lrF_offset.value,
            conf_text_lrB_switch: text_lrB_switch.checked,
            conf_text_lrB_color: text_lrB_color.value,
            conf_text_toe_switch: text_toe_switch.checked,
            conf_text_toeF_switch: text_toeF_switch.checked,
            conf_text_toeF_color: text_toeF_color.value,
            conf_text_toeF_textL: text_toeF_textL.value,
            conf_text_toeF_textR: text_toeF_textR.value,
            conf_text_toeF_scale: text_toeF_scale.value,
            conf_text_toeF_offset: text_toeF_offset.value,
            conf_text_toeline_switch: text_toeline_switch.checked,
            conf_text_toeline_color: text_toeline_color.value,
            conf_text_elite_switch: text_elite_switch.checked,
            conf_text_eliteB_switch: text_eliteB_switch.checked,
            conf_text_eliteB_textL: text_eliteB_textL.value,
            conf_text_eliteB_textR: text_eliteB_textR.value,
            conf_text_eliteB_color: text_eliteB_color.value,
            conf_text_eliteB_offset: text_eliteB_offset.value,
            conf_text_eliteI_switch: text_eliteI_switch.checked,
            conf_text_eliteI_textL: text_eliteI_textL.value,
            conf_text_eliteI_textR: text_eliteI_textR.value,
            conf_text_eliteI_color: text_eliteI_color.value,
            conf_text_eliteI_offset: text_eliteI_offset.value,
            conf_text_eliteO_switch: text_eliteO_switch.checked,
            conf_text_eliteO_textL: text_eliteO_textL.value,
            conf_text_eliteO_textR: text_eliteO_textR.value,
            conf_text_eliteO_color: text_eliteO_color.value,
            conf_text_eliteO_offset: text_eliteO_offset.value
        };
        const dataStr = JSON.stringify(config, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        if (item_name.value === '') item_name.value = 'sox';
        const exportFileDefaultName = item_name.value + '.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });

    // 从文件加载配置
    loadBtn.addEventListener('click', function () {
        fileInput.click();
    });

    fileInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const config = JSON.parse(e.target.result);
                item_name.value = config.conf_item_name;
                if (config.conf_sox_length) {
                    sox_length.value = config.conf_sox_length;
                    U.update_sox_length();
                }
                sox_model_panty.checked = config.conf_sox_model_panty;
                U.update_sox_model_panty();
                sox_model_tabi.checked = config.conf_sox_model_tabi;
                U.update_sox_model_tabi();
                if (config.conf_color_single) {
                    color_single.value = config.conf_color_single;
                    U.update_color_single();
                }
                if (config.conf_bkg_strip_switch !== undefined) bkg_strip_switch.checked = config.conf_bkg_strip_switch;
                if (config.conf_color_strip !== undefined) color_strip.value = config.conf_color_strip;
                if (config.conf_color_strip_width !== undefined) color_strip_width.value = config.conf_color_strip_width;
                U.update_bkg_strip();
                if (config.conf_deco_toe_switch !== undefined) deco_toe_switch.checked = config.conf_deco_toe_switch;
                if (config.conf_deco_toe_color !== undefined) deco_toe_color.value = config.conf_deco_toe_color;
                if (config.conf_deco_toe_height !== undefined) deco_toe_height.value = config.conf_deco_toe_height;
                U.update_toe();
                if (config.conf_deco_strip_top_switch !== undefined) deco_strip_top_switch.checked = config.conf_deco_strip_top_switch;
                if (config.conf_deco_strip_top_1_enable !== undefined) deco_strip_top_1_enable.checked = config.conf_deco_strip_top_1_enable;
                if (config.conf_deco_strip_top_2_enable !== undefined) deco_strip_top_2_enable.checked = config.conf_deco_strip_top_2_enable;
                if (config.conf_deco_strip_top_3_enable !== undefined) deco_strip_top_3_enable.checked = config.conf_deco_strip_top_3_enable;
                if (config.conf_deco_strip_top_4_enable !== undefined) deco_strip_top_4_enable.checked = config.conf_deco_strip_top_4_enable;
                if (config.conf_deco_strip_top_1_color !== undefined) deco_strip_top_1_color.value = config.conf_deco_strip_top_1_color;
                if (config.conf_deco_strip_top_2_color !== undefined) deco_strip_top_2_color.value = config.conf_deco_strip_top_2_color;
                if (config.conf_deco_strip_top_3_color !== undefined) deco_strip_top_3_color.value = config.conf_deco_strip_top_3_color;
                if (config.conf_deco_strip_top_4_color !== undefined) deco_strip_top_4_color.value = config.conf_deco_strip_top_4_color;
                if (config.conf_deco_strip_top_1_offset !== undefined) deco_strip_top_1_offset.value = config.conf_deco_strip_top_1_offset;
                if (config.conf_deco_strip_top_2_offset !== undefined) deco_strip_top_2_offset.value = config.conf_deco_strip_top_2_offset;
                if (config.conf_deco_strip_top_3_offset !== undefined) deco_strip_top_3_offset.value = config.conf_deco_strip_top_3_offset;
                if (config.conf_deco_strip_top_4_offset !== undefined) deco_strip_top_4_offset.value = config.conf_deco_strip_top_4_offset;
                if (config.conf_deco_strip_top_1_width !== undefined) deco_strip_top_1_width.value = config.conf_deco_strip_top_1_width;
                if (config.conf_deco_strip_top_2_width !== undefined) deco_strip_top_2_width.value = config.conf_deco_strip_top_2_width;
                if (config.conf_deco_strip_top_3_width !== undefined) deco_strip_top_3_width.value = config.conf_deco_strip_top_3_width;
                if (config.conf_deco_strip_top_4_width !== undefined) deco_strip_top_4_width.value = config.conf_deco_strip_top_4_width;
                U.update_strip_offset_range();
                U.update_strip_top_visibility();
                U.update_strip_top_color();
                U.update_strip_top_width_and_offset();
                if (config.conf_deco_step_switch !== undefined) deco_step_switch.checked = config.conf_deco_step_switch;
                if (config.conf_deco_step_select !== undefined) deco_step_select.value = config.conf_deco_step_select;
                if (config.conf_deco_step_color !== undefined) deco_step_color.value = config.conf_deco_step_color;
                if (config.conf_deco_step_scale !== undefined) {
                    deco_step_scale.value = config.conf_deco_step_scale;
                    if (disval_deco_step_scale) disval_deco_step_scale.textContent = Number(deco_step_scale.value).toFixed(1);
                }
                if (config.conf_deco_step_offset_y !== undefined) {
                    deco_step_offset_y.value = config.conf_deco_step_offset_y;
                    if (disval_deco_step_offset_y) disval_deco_step_offset_y.textContent = Number(deco_step_offset_y.value).toFixed(1);
                }
                U.update_deco_step();
                if (config.conf_text_lr_switch !== undefined) text_lr_switch.checked = config.conf_text_lr_switch;
                if (config.conf_text_lrF_switch !== undefined) text_lrF_switch.checked = config.conf_text_lrF_switch;
                if (config.conf_text_lrF_color !== undefined) text_lrF_color.value = config.conf_text_lrF_color;
                if (config.conf_text_lrF_offset !== undefined) text_lrF_offset.value = config.conf_text_lrF_offset;
                if (config.conf_text_lrB_switch !== undefined) text_lrB_switch.checked = config.conf_text_lrB_switch;
                if (config.conf_text_lrB_color !== undefined) text_lrB_color.value = config.conf_text_lrB_color;
                U.update_text_lr();
                if (config.conf_text_toe_switch !== undefined) text_toe_switch.checked = config.conf_text_toe_switch;
                if (config.conf_text_toeF_switch !== undefined) text_toeF_switch.checked = config.conf_text_toeF_switch;
                if (config.conf_text_toeF_color !== undefined) text_toeF_color.value = config.conf_text_toeF_color;
                if (config.conf_text_toeF_textL !== undefined) text_toeF_textL.value = config.conf_text_toeF_textL;
                if (config.conf_text_toeF_textR !== undefined) text_toeF_textR.value = config.conf_text_toeF_textR;
                if (config.conf_text_toeF_scale !== undefined) {
                    text_toeF_scale.value = config.conf_text_toeF_scale;
                    if (disval_text_toeF_scale) disval_text_toeF_scale.textContent = Number(text_toeF_scale.value).toFixed(1);
                }
                if (config.conf_text_toeF_offset !== undefined) {
                    text_toeF_offset.value = config.conf_text_toeF_offset;
                    if (disval_text_toeF_offset) disval_text_toeF_offset.textContent = Number(text_toeF_offset.value).toFixed(1);
                }
                if (config.conf_text_toeline_switch !== undefined) text_toeline_switch.checked = config.conf_text_toeline_switch;
                if (config.conf_text_toeline_color !== undefined) text_toeline_color.value = config.conf_text_toeline_color;
                U.update_text_toe();
                if (config.conf_text_elite_switch !== undefined) text_elite_switch.checked = config.conf_text_elite_switch;
                if (config.conf_text_eliteB_switch !== undefined) text_eliteB_switch.checked = config.conf_text_eliteB_switch;
                if (config.conf_text_eliteB_textL !== undefined) text_eliteB_textL.value = config.conf_text_eliteB_textL;
                if (config.conf_text_eliteB_textR !== undefined) text_eliteB_textR.value = config.conf_text_eliteB_textR;
                if (config.conf_text_eliteB_color !== undefined) text_eliteB_color.value = config.conf_text_eliteB_color;
                if (config.conf_text_eliteB_offset !== undefined) {
                    text_eliteB_offset.value = config.conf_text_eliteB_offset;
                    if (disval_text_eliteB_offset) disval_text_eliteB_offset.textContent = Number(text_eliteB_offset.value).toFixed(1);
                }
                if (config.conf_text_eliteI_switch !== undefined) text_eliteI_switch.checked = config.conf_text_eliteI_switch;
                if (config.conf_text_eliteI_textL !== undefined) text_eliteI_textL.value = config.conf_text_eliteI_textL;
                if (config.conf_text_eliteI_textR !== undefined) text_eliteI_textR.value = config.conf_text_eliteI_textR;
                if (config.conf_text_eliteI_color !== undefined) text_eliteI_color.value = config.conf_text_eliteI_color;
                if (config.conf_text_eliteI_offset !== undefined) {
                    text_eliteI_offset.value = config.conf_text_eliteI_offset;
                    if (disval_text_eliteI_offset) disval_text_eliteI_offset.textContent = Number(text_eliteI_offset.value).toFixed(1);
                }
                if (config.conf_text_eliteO_switch !== undefined) text_eliteO_switch.checked = config.conf_text_eliteO_switch;
                if (config.conf_text_eliteO_textL !== undefined) text_eliteO_textL.value = config.conf_text_eliteO_textL;
                if (config.conf_text_eliteO_textR !== undefined) text_eliteO_textR.value = config.conf_text_eliteO_textR;
                if (config.conf_text_eliteO_color !== undefined) text_eliteO_color.value = config.conf_text_eliteO_color;
                if (config.conf_text_eliteO_offset !== undefined) {
                    text_eliteO_offset.value = config.conf_text_eliteO_offset;
                    if (disval_text_eliteO_offset) disval_text_eliteO_offset.textContent = Number(text_eliteO_offset.value).toFixed(1);
                }
                if (text_eliteB_switch.checked) { text_eliteI_switch.checked = false; text_eliteO_switch.checked = false; }
                else if (text_eliteI_switch.checked || text_eliteO_switch.checked) text_eliteB_switch.checked = false;
                U.update_elite_offset_range();
                U.update_text_elite();
            } catch (error) {
                console.error('读取配置文件失败:', error);
                alert('配置文件格式错误！');
            }
        };
        reader.readAsText(file);
    });

    // 重置
    resetBtn.addEventListener('click', function () {
        item_name.value = '';
        U.update_item_name();
        sox_length.value = 60;
        U.update_sox_length();
        sox_model_panty.checked = false;
        U.update_sox_model_panty();
        sox_model_tabi.checked = false;
        U.update_sox_model_tabi();
        color_single.value = '#ffffff';
        U.update_color_single();
        bkg_strip_switch.checked = false;
        color_strip.value = '#000000';
        color_strip_width.value = '5';
        U.update_bkg_strip();
        deco_toe_switch.checked = false;
        deco_toe_color.value = '#000000';
        deco_toe_height.value = '2';
        U.update_toe();
        deco_strip_top_switch.checked = false;
        deco_strip_top_1_enable.checked = true;
        deco_strip_top_2_enable.checked = true;
        deco_strip_top_3_enable.checked = true;
        deco_strip_top_4_enable.checked = false;
        deco_strip_top_1_color.value = '#000000';
        deco_strip_top_2_color.value = '#000000';
        deco_strip_top_3_color.value = '#000000';
        deco_strip_top_4_color.value = '#000000';
        deco_strip_top_1_offset.value = '4';
        deco_strip_top_2_offset.value = '6';
        deco_strip_top_3_offset.value = '8';
        deco_strip_top_4_offset.value = '10';
        deco_strip_top_1_width.value = '1';
        deco_strip_top_2_width.value = '1';
        deco_strip_top_3_width.value = '1';
        deco_strip_top_4_width.value = '1';
        U.update_strip_top_visibility();
        U.update_strip_top_color();
        U.update_strip_top_width_and_offset();
        deco_step_switch.checked = false;
        deco_step_select.value = 'step_paw.svg';
        deco_step_color.value = '#ffc0cb';
        deco_step_scale.value = '0.6';
        deco_step_offset_y.value = '7';
        if (disval_deco_step_scale) disval_deco_step_scale.textContent = '0.6';
        if (disval_deco_step_offset_y) disval_deco_step_offset_y.textContent = '7';
        U.update_deco_step();
        text_lr_switch.checked = false;
        text_lrF_switch.checked = false;
        text_lrF_color.value = '#000000';
        text_lrF_offset.value = '6';
        text_lrB_switch.checked = false;
        text_lrB_color.value = '#000000';
        if (disval_text_lrF_offset) disval_text_lrF_offset.textContent = '6';
        U.update_text_lr();
        text_toe_switch.checked = false;
        text_toeF_switch.checked = false;
        text_toeF_color.value = '#000000';
        text_toeF_textL.value = 'TEXT-L';
        text_toeF_textR.value = 'TEXT-R';
        text_toeF_scale.value = '1';
        text_toeF_offset.value = '6';
        text_toeline_switch.checked = false;
        text_toeline_color.value = '#000000';
        if (disval_text_toeF_scale) disval_text_toeF_scale.textContent = '1';
        if (disval_text_toeF_offset) disval_text_toeF_offset.textContent = '6';
        U.update_text_toe();
        text_elite_switch.checked = false;
        text_eliteB_switch.checked = false;
        text_eliteI_switch.checked = false;
        text_eliteO_switch.checked = false;
        text_eliteB_textL.value = 'TEXT-L';
        text_eliteB_textR.value = 'TEXT-R';
        text_eliteB_color.value = '#000000';
        text_eliteB_offset.value = '0';
        text_eliteI_textL.value = 'TEXT-IL';
        text_eliteI_textR.value = 'TEXT-IR';
        text_eliteI_color.value = '#000000';
        text_eliteI_offset.value = '0';
        text_eliteO_textL.value = 'TEXT-OL';
        text_eliteO_textR.value = 'TEXT-OR';
        text_eliteO_color.value = '#000000';
        text_eliteO_offset.value = '0';
        if (disval_text_eliteB_offset) disval_text_eliteB_offset.textContent = '0';
        if (disval_text_eliteI_offset) disval_text_eliteI_offset.textContent = '0';
        if (disval_text_eliteO_offset) disval_text_eliteO_offset.textContent = '0';
        U.update_elite_offset_range();
        U.update_text_elite();
    });

    // 保存 SVG 到文件
    const saveSvgBtn = document.getElementById('saveSvgBtn');
    if (saveSvgBtn) {
        saveSvgBtn.addEventListener('click', function () {
            const svgData = new XMLSerializer().serializeToString(document.getElementById('svgDisplay'));
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            if (item_name.value === '') item_name.value = 'sox';
            link.download = item_name.value + '.svg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }
})();
