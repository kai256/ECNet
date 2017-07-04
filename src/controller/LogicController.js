/**
 * Created by aswasn on 2017/3/8.
 */

import LogicGraphModel from '../model/LogicGraphModel';
import {LogicValidate} from '../assets/constants';
import {showDetail} from '../view/LogicMotion';
import LogicPainter from '../view/LogicPainter';
import LogicValidator from '../view/LogicValidator';
import {AddOperation, RemoveAndEditOperation} from '../model/LogicOperation';
import LogicCopy from '../assets/logic-copy';
import ServerInterface from './ServerInterface';

// 引入共同需要的模块
require('../assets/common');

// import css
require('../css/logic.css');


require('d3-hierarchy');


class LogicController {
    constructor() {
        this.graphModel = new LogicGraphModel();
        this.backupModel = null;    // 用于重置功能
        this.root = null;
        this.selectedId = null;
        this.undoStack = Array.of();
        this.isStraight = true;
        if (isPageNew) {
            this.graphModel.initAsNewModel();
            this.redraw();
        } else {
            this.bindFileChooseEvent();
        }
        this.bindEvents();
    }

    redraw() {
        LogicPainter.hideInfoPanel();
        LogicPainter.showLogicInfoPanel(this.graphModel);
        LogicPainter.drawTree(this);
        LogicPainter.drawTable(this.graphModel);
    }

    bindEvents() {
        this.bindSvgClickEvent();   // svg点击事件，点击text显示panel并将text放大，点击空白隐藏panel
        this.bindPanelEvents(); // 右侧三个按钮事件
        this.bindTitleEvents();
        this.bindTableButtonEvents();   // 表格三个按钮事件绑定
        this.bindDelButtonEvents(); // node-del-modal上的两个按钮
        this.bindAddButtonEvent();  // node-add-modal上的一个按钮
        this.bindEditButtonEvent();  // node-edit-modal上的一个按钮
        this.bindFileSaveEvent();   // 保存文件事件
        this.bindFileResetEvent();  // 重置事件
        this.bindUndoEvent();   // 撤销事件
        this.bindLineButtonEvent();   // 更换连线类型按钮
        LogicController.bindPrintButtonEvent();    // 打印按钮
    }

    static bindPrintButtonEvent() {
        $('#print-btn').on('click', () => {
            window.print();
        });
    }

    bindLineButtonEvent() {
        const me = this;
        $('#line-btn').on('click', function () {
            if (me.isStraight) {
                $(this).text('显示直线图');
                me.isStraight = false;
                me.redraw();
            } else {
                $(this).text('显示曲线图');
                me.isStraight = true;
                me.redraw();
            }
        });
    }

    bindFileResetEvent() {
        const me = this;
        $('#reset-btn').on('click', () => {
            me.graphModel = LogicCopy.copyGraphModel(me.backupModel);
            me.redraw();
        });
    }

    bindUndoEvent() {
        const me = this;
        $('#revoke-btn').on('click', function () {
            me.undoStack.pop().recover();
            if (me.undoStack.length === 0) {
                $(this).addClass('disabled');
            }
        });
    }

    logOperation(operation) {
        const me = this;
        me.undoStack.push(operation);
        if (me.undoStack.length > 0) {
            $('#revoke-btn').removeClass('disabled');
        }
    }

    bindSvgClickEvent() {
        const me = this;
        const $svg = $('svg');
        $svg.off('click');
        $svg.on('click', (ev) => {
            const $target = $(ev.target);
            if ($target.is('rect')) {
                const node = me.graphModel.findNodeById($target.attr('id'));
                if (node) {
                    showDetail(node,me);
                }
            } else {
                LogicPainter.renderSelectedNode(me.selectedId, false);
                me.selectedId = null;
                LogicPainter.hideInfoPanel();
            }
        });
    }

    bindTitleEvents() {
        const me = this;
        $('#graph-title-input').on('blur', function () {
            if (!$(this).val()) {
                $(this).val(me.graphModel.title);
            } else {
                me.graphModel.title = $(this).val();
            }
        });
    }

    bindTableButtonEvents() {
        const me = this;
        $('.node-table-wrapper table').on('click', (ev) => {
            const $target = $(ev.target);

            if ($target.is('.add-btn')) { // 增加按钮
                LogicPainter.prepareAddModal(me.graphModel, $target.data('id'));
            } else if ($target.is('.del-btn')) { // 删除按钮
                LogicPainter.prepareDelModal(me.graphModel, $target.data('id'));
            } else if ($target.is('.edit-btn')) { // 编辑按钮
                LogicPainter.prepareEditModal(me.graphModel, $target.data('id'));
            }
        });
    }

    // panel上的三个按钮+info panel
    bindPanelEvents() {
        const me = this;
        // 删除按钮
        $('#panel-del-btn').on('click', () => {
            LogicPainter.prepareDelModal(me.graphModel, $('#panel-id-input').val());
        });

        // 新增子节点按钮
        $('#panel-add-btn').on('click', () => {
            LogicPainter.prepareAddModal(me.graphModel, $('#panel-id-input').val());
        });

        // 保存信息按钮
        $('#panel-save-btn').on('click', () => {
            const $alert = $('.node-info-wrapper .node-panel .alert');
            $alert.empty();
            $alert.hide();

            const id = $('#panel-id-input').val();
            const topic = $('#panel-topic-input').val();
            const detail = $('#panel-detail-input').val();
            const type = $('#panel-type-select').val();
            const leadTo = $('#panel-leadTo-select').val();

            // 发起验证
            const checkCode = LogicValidator.validatePanelSave(me.graphModel);

            if (checkCode === LogicValidate.OK) {
                me.logOperation(new RemoveAndEditOperation(me.graphModel, me));
                me.graphModel.modifyNode(id, topic, type, detail, leadTo);
                me.redraw();
                return;
            }
            const hint = LogicValidator.generateHint(checkCode);
            if (hint) {
                $alert.append(hint);
                $alert.show();
            }
        });

        $('#collapseLogic').on('show.bs.collapse', () => {
            LogicPainter.showLogicInfoPanel(me.graphModel);
        });

        $('#info-save-btn').on('click', () => {
            const $alert = $('.node-info-wrapper .info-panel .alert');
            $alert.empty();
            $alert.hide();
            const title = $('#title-input').val();
            const caseReason = $('#caseReason-input').val();
            const caseNumber = $('#caseNumber-input').val();
            if (!title) {
                $alert.append('标题不能为空');
                $alert.show();
            } else if (!caseNumber) {
                $alert.append('案号不能为空');
                $alert.show();
            } else {
                me.logOperation(new RemoveAndEditOperation(me.graphModel, me));
                me.graphModel.setTitle(title);
                me.graphModel.setCaseReason(caseReason);
                me.graphModel.setCaseNumber(caseNumber);
            }
        });
    }

    // modal上的新增节点按钮
    bindAddButtonEvent() {
        const me = this;
        $('#node-add-btn').on('click', () => {
            const $alert = $('#node-add-modal .alert');
            $alert.empty();
            $alert.hide();

            const topic = $('#node-add-topic-input').val();
            const detail = $('#node-add-detail-input').val();
            const type = $('#node-add-type-select').val();
            const leadTo = $('#node-add-leadTo-select').val();
            // 发起验证
            const checkCode = LogicValidator.validateAddModal();

            if (checkCode === LogicValidate.OK) {
                const id = me.graphModel.insertNode(topic, type, detail, leadTo);
                me.logOperation(new AddOperation(id, me));
                $('#node-add-modal').modal('hide');
                me.redraw();
                return;
            }
            const hint = LogicValidator.generateHint(checkCode);
            if (hint) {
                $alert.append(hint);
                $alert.show();
            }
        });
    }

    bindEditButtonEvent() {
        const me = this;
        $('#node-edit-btn').on('click', () => {
            const $alert = $('#node-edit-modal .alert');
            $alert.empty();
            $alert.hide();

            const id = $('#node-edit-id-input').val();
            const topic = $('#node-edit-topic-input').val();
            const detail = $('#node-edit-detail-input').val();
            const type = $('#node-edit-type-select').val();
            const leadTo = $('#node-edit-leadTo-select').val();

            // 发起验证
            const checkCode = LogicValidator.validateEditModal(me.graphModel);

            if (checkCode === LogicValidate.OK) {
                me.logOperation(new RemoveAndEditOperation(me.graphModel, me));
                me.graphModel.modifyNode(id, topic, type, detail, leadTo);
                $('#node-edit-modal').modal('hide');
                me.redraw();
                return;
            }
            const hint = LogicValidator.generateHint(checkCode);
            if (hint) {
                $alert.append(hint);
                $alert.show();
            }
        });
    }

    // modal上的两个删除按钮
    bindDelButtonEvents() {
        const me = this;
        $('#node-del-modal #node-del-btn').on('click', () => {
            me.logOperation(new RemoveAndEditOperation(me.graphModel, me));
            me.graphModel.removeNode($('#node-del-modal table .del-id-td').text());
            $('#node-del-modal').modal('hide');
            me.redraw();
        });

        $('#node-del-modal #node-delWithChildren-btn').on('click', () => {
            me.logOperation(new RemoveAndEditOperation(me.graphModel, me));
            me.graphModel.removeNodeAndChildren($('#node-del-modal table .del-id-td').text());
            $('#node-del-modal').modal('hide');
            me.redraw();
        });
    }

    bindFileSaveEvent() {
        const me = this;
        $('.file-operation-btns #save-btn').on('click', () => {
            const content = me.graphModel.obj2csvStr();
            const title = `${me.graphModel.title}.csv`;
            const uri = `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`;
            const link = document.createElement('a');
            link.download = title;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            const id = me.graphModel.id;
            if (id) {
                ServerInterface.updateLogicModel(me.graphModel);
            } else {
                ServerInterface.saveLogic2Server(me.graphModel);
            }

        });
    }

    // 绑定文件选择事件
    bindFileChooseEvent() {
        const me = this;
        // 初始化FileReader
        this.reader = new FileReader();
        // 为reader设置回调，将文件转为GraphModel并备份
        this.reader.onload = function () {
            $('.file-operation-btns').show();
            // 设置GraphModel的data属性
            me.graphModel.setDataObj(LogicGraphModel.csvStr2Obj(this.result));
            me.backupModel = LogicCopy.copyGraphModel(me.graphModel);
            $('#reset-btn').removeClass('disabled');
            console.log(me.graphModel);
            me.redraw();
            this.undoStack = Array.of();
            $('#revoke-btn').addClass('disabled');
        };
        // 绑定事件，选择文件后调用回调
        $('#file-choose-btn').on('change', function () {
            if (this.files && this.files[0]) {
                // 设置GraphModel的title属性
                me.graphModel.setTitle(this.files[0].name.split('.csv')[0]);
                // 读文件内容
                me.reader.readAsText(this.files[0]);
            }
        });
    }

    static newInstance() {
        return new LogicController();
    }

}

// run
$(document).ready(() => {
    const id = parseInt(window.location.search.substr(1), 10);
    let controller=LogicController.newInstance();
    if (id) {
        ServerInterface.getLogicModel(id, (data) => {
            if (data.length === 0) {
                return;
            }
            $('.file-operation-btns').show();
            controller.graphModel.setDataObj(data);
            controller.graphModel.id = id;
            controller.backupModel = LogicCopy.copyGraphModel(controller.graphModel);
            $('#reset-btn').removeClass("disabled");
            console.log(controller.graphModel);
            controller.redraw();
            controller.undoStack = Array.of();
            $('#revoke-btn').addClass("disabled");
        });
    }
});
