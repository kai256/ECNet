/**
 * Created by aswasn on 2016/12/18.
 */

// 引入共同需要的模块
import * as d3 from 'd3';
import 'd3-drag';
import '../assets/common';
import GraphModel from '../model/GraphModel';
import { GraphVal, ElementType, URL } from '../assets/constants';
import { CreateDrag } from '../view/Motion';
import Layout from '../view/Layout';
import Painter from '../view/Painter';
import Copy from '../assets/copy';
import Table from '../view/Table';
import HeaderModel from '../model/HeaderModel';
import ArrowModel from '../model/ArrowModel';
import JointModel from '../model/JointModel';
import BodyModel from '../model/BodyModel';
import ServerInterface from './ServerInterface';
import {
    OriginalValue, GraphInfoOperation,
    GraphPosOperation, ElementAddOperation, ElementRemoveOperation,
} from '../model/Operation';

/**
 * IndexController和NewController的基类。存放一些共同的逻辑。
 *
 * 成员变量:
 * this.graphModel GraphModel   存有当前文件信息，具体见model/GraphModel.js
 * this.undoStack   Array<Operation>    记录撤销记录
 * this.clipboard   剪贴板，用来存储一个被复制的elementModel
 * this.multiSelectModel 用来记录当前多选值的对象
 */
export default class BaseController {
    constructor() {
        this.svg = null;
        this.graphModel = null;
        this.undoStack = null;
        this.clipboard = null;
        this.multiSelectModel = null;
        this._init();
        this.handleFileSave();
        this.handleUndo();
        this.bindCreateButtons();
        this.bindLayoutButton();
        this.setDetailPanel();
        this.setRightMenu();
        this.setMultiSelect();
        this.initPrint();
    }

    setGraphModel(graphModel) {
        this.graphModel = graphModel;
        this.table.setGraphModel(graphModel);
    }

    _init() {
        // 初始化画布
        const svg = d3.select('.graph-wrapper').append('svg').attr('width', 2000)
            .attr('height', 2000)
            .attr('id', 'svg-canvas');
        this.svg = svg;
        this.graphModel = new GraphModel(0, '', '', '', '', Array.of(), Array.of(), Array.of(), Array.of());
        this.undoStack = Array.of();
        this.table = new Table(this, this.graphModel);

        // 定义箭头
        svg.append('defs').append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5');
    }

    // 绑定文件保存事件
    handleFileSave() {
        const me = this;
        $('.graph-tools-wrapper #save-btn').on('click', () => {
            const title = `${me.graphModel.getTitle() || '未命名'}.ecm`;
            const uri = `data:text/plain;charset=utf-8,${encodeURIComponent(me.graphModel.modelToEcmFile())}`;
            const link = document.createElement('a');
            link.download = title;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            const id = me.graphModel.data.id;
            if (id) {
                ServerInterface.updateECMModel(me.graphModel);
            } else {
                ServerInterface.saveECM2Server(me.graphModel);
            }
        });
    }

    handleUndo() {
        const me = this;
        const $revokeBtn = $('#revoke-btn');
        $revokeBtn.addClass('disabled');
        $revokeBtn.on('click', () => {
            me.clearMultiSelect();
            me.undoStack.pop().recover();
            if (me.undoStack.length === 0) {
                $revokeBtn.addClass('disabled');
            }
        });
    }

    logOperation(operation) {
        const me = this;
        me.undoStack.push(operation);
        if (me.undoStack.length > 0) {
            $('.graph-tools-wrapper #revoke-btn').removeClass('disabled');
        }
    }

    // 设置具体信息面板
    setDetailPanel() {
        const me = this;
        const ecm = this.graphModel;
        // 绑定数据
        if (ecm) {
            $('#ecm-title').val(ecm.getTitle());
            $('#ecm-desc').val(ecm.getDesc());
            $('#ecm-caseNumber').val(ecm.getCaseNumber());
            $('#ecm-caseReason').val(ecm.getCaseReason());

            const $ecmSaveBtn = $('#ecm-save-btn');
            const $ecmResetBtn = $('#ecm-reset-btn');

            $ecmSaveBtn.off('click');
            $ecmResetBtn.off('click');

            $ecmSaveBtn.click(() => {
                // 记录undo
                const array = Array.of();
                array.push(new OriginalValue('title', ecm.getTitle()));
                array.push(new OriginalValue('desc', ecm.getDesc()));
                array.push(new OriginalValue('caseNumber', ecm.getCaseNumber()));
                array.push(new OriginalValue('caseReason', ecm.getCaseReason()));
                me.logOperation(new GraphInfoOperation(me, ecm, array));

                ecm.setTitle($('#ecm-title').val());
                ecm.setDesc($('#ecm-desc').val());
                ecm.setCaseNumber($('#ecm-caseNumber').val());
                ecm.setCaseReason($('#ecm-caseReason').val());
            });
            $ecmResetBtn.click(() => {
                me.clearMultiSelect();
                $('#ecm-title').val(ecm.getTitle());
                $('#ecm-desc').val(ecm.getDesc());
                $('#ecm-caseNumber').val(ecm.getCaseNumber());
                $('#ecm-caseReason').val(ecm.getCaseReason());
            });
        }
    }

    bindLayoutButton() {
        const me = this;
        d3.select('#layout-btn').on('click', (() => {
            me.clearMultiSelect();
            me.logOperation(new GraphPosOperation(me, Copy.deepCopyGraphModel(me.graphModel)));
            me.graphModel = Layout.neighbourLayout2(me.graphModel);
            me.redraw();
        }));
    }

    bindCreateButtons() {
        const me = this;
        const createDrag = new CreateDrag();
        d3.select('#add-header-btn').call(d3.drag()
            .on('start', () => createDrag.dragStart('add-header-btn', ElementType.HEADER))
            .on('drag', () => createDrag.drag())
            .on('end', () => createDrag.dragEnd(me.graphModel, me)));
        d3.select('#add-body-btn').call(d3.drag()
            .on('start', () => createDrag.dragStart('add-body-btn', ElementType.BODY))
            .on('drag', () => createDrag.drag())
            .on('end', () => createDrag.dragEnd(me.graphModel, me)));
        d3.select('#add-joint-btn').call(d3.drag()
            .on('start', () => createDrag.dragStart('add-joint-btn', ElementType.JOINT))
            .on('drag', () => createDrag.drag())
            .on('end', () => createDrag.dragEnd(me.graphModel, me)));
        d3.select('#add-arrow-btn').call(d3.drag()
            .on('start', () => createDrag.dragStart('add-arrow-btn', ElementType.ARROW))
            .on('drag', () => createDrag.drag())
            .on('end', () => createDrag.dragEnd(me.graphModel, me)));

        d3.select('#body-add-btn').on('click', (() => {
            const body = new BodyModel(100, 100,
                me.graphModel.fetchNextId(), '', '', '', '', '', '');// 默认在100，100位置
            me.graphModel.insertElement(body);
            me.initEvidenceList();
            Painter.drawBody(d3.select('svg').selectAll('.ecm-body').data(me.graphModel.getBodyArray()).enter(),
                me.graphModel, me);
        }));

        d3.select('#joint-add-btn').on('click', (() => {
            const joint = new JointModel(200, 100,
                me.graphModel.fetchNextId(), '', '');// 默认在200，100位置
            me.graphModel.insertElement(joint);
            Painter.drawJoint(d3.select('svg').selectAll('.ecm-joint').data(me.graphModel.getJointArray()).enter(),
                me.graphModel, me);
            me.initFactList();
        }));

        // 导出表格
        d3.select('#export-btn').on('click', (() => {
            me.table.exportTableToExcel();
        }));

        $('#collapseEvidenceList').on('show.bs.collapse', () => {
            me.initEvidenceList();
        });

        $('#collapseFactList').on('show.bs.collapse', () => {
            me.initFactList();
        });

        d3.select('#combine-btn').on('click', () => {
            $.ajax({
                type: 'POST',
                url: URL.COMBINE_WORD,
                data: me.graphModel.modelToXMLStyleObject() || {},
                dataType: 'text',
                success(data) {
                    const title = 'cyl.txt';
                    const uri = data;
                    const link = document.createElement('a');
                    link.download = title;
                    link.href = uri;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                },
                error(XMLHttpRequest, textStatus, errorThrown) {
                    alert(XMLHttpRequest.status);
                    alert(XMLHttpRequest.readyState);
                    alert(textStatus);
                    alert(errorThrown);
                    alert('网络繁忙，请稍后再试');
                },
            });
        });
    }

    initEvidenceList() {
        this.table.initEvidenceList();
    }

    initFactList() {
        this.table.initFactList();
    }

    // 重绘画布
    redraw() {
        const me = this;

        me.svg.selectAll('g').remove();

        // 画链体
        Painter.drawBody(me.svg.selectAll('.ecm-body').data(me.graphModel.getBodyArray()).enter(), me.graphModel, me);

        // 画连接点
        Painter.drawJoint(me.svg.selectAll('.ecm-joint').data(me.graphModel.getJointArray()).enter(), me.graphModel, me);

        // 画箭头
        Painter.drawArrow(me.svg.selectAll('.ecm-arrow').data(me.graphModel.getArrowArray()).enter(), me.graphModel, me);

        // 画链头
        Painter.drawHeader(me.svg.selectAll('.ecm-header').data(me.graphModel.getHeaderArray()).enter(), me.graphModel, me);

        me.redrawInfoPanels();
    }

    // 重新填充右侧链图信息面板，并隐藏所有图元面板
    redrawInfoPanels() {
        const me = this;
        // 右侧信息面板
        me.setDetailPanel();
        const panelIds = ['head-panel', 'body-panel', 'arrow-panel', 'joint-panel'];
        for (let i = 0; i < panelIds.length; i++) {
            $(`#${panelIds[i]}`).hide();
        }
    }

    initPrint() {
        $('.graph-tools-wrapper #print-btn').on('click', () => {
            const content = window.document.body.innerHTML;
            const startstr = '<!--startprint-->';
            const endstr = '<!--endprint-->';
            let con = content.substr(content.indexOf(startstr) + 17);
            con = con.substring(0, con.indexOf(endstr));
            const newWindow = window.open();
            newWindow.document.write(con);
            newWindow.print();
        });
    }

    // 设置右键菜单 而且 判断了多选是否应该消失
    setRightMenu() {
        const me = this;
        d3.select('svg').on('mousedown', function () {
            const svgX = d3.mouse(document.getElementById('svg-canvas'))[0];
            const svgY = d3.mouse(document.getElementById('svg-canvas'))[1];
            const elementModel = me.graphModel.getElementByPosition(svgX, svgY);
            if (d3.event.which === 3) {
                me.clearMultiSelect();
                let data = null;
                if (elementModel) {
                    // 点击到了某个元素
                    data = [
                        [
                            { text: elementModel.data.name },
                            { text: `id:${elementModel.data.id}` },
                        ],
                        [
                            {
                                text: '复制图元',
                                func() {
                                    me.clipboard =
                                        Copy.copyElementWithNewId(elementModel, me.graphModel);
                                },
                            },
                            {
                                text: '删除图元',
                                func() {
                                    me.logOperation(
                                        new ElementRemoveOperation(me, elementModel));
                                    me.graphModel.deleteElement(elementModel);
                                    Painter.eraseElement(elementModel.getId());
                                },
                            },
                        ],
                    ];
                } else {
                    data = [
                        [{
                            text: '新增图元',
                            data: [[{
                                text: '链体',
                                func: () => {
                                    const model = new BodyModel(svgX, svgY,
                                        me.graphModel.fetchNextId(), '新链体', '', '', '', '', '');
                                    me.graphModel.insertElement(model);
                                    Painter.drawBody(d3.select('svg')
                                            .selectAll('.ecm-body')
                                            .data(me.graphModel.getBodyArray()).enter(),
                                        me.graphModel, me);
                                    me.logOperation(
                                        new ElementAddOperation(me.graphModel, model));
                                },
                            }, {
                                text: '链头',
                                func: () => {
                                    const model = new HeaderModel(
                                        svgX, svgY + GraphVal.DEFAULT_HEIGHT, svgX, svgY,
                                        me.graphModel.fetchNextId(), '新链头', '', '');
                                    me.graphModel.insertElement(model);
                                    Painter.drawHeader(d3.select('svg')
                                            .selectAll('.ecm-header')
                                            .data(me.graphModel.getHeaderArray()).enter(),
                                        me.graphModel, me);
                                    me.logOperation(
                                        new ElementAddOperation(me.graphModel, model));
                                },
                            }, {
                                text: '箭头',
                                func: () => {
                                    const model = new ArrowModel(
                                        svgX, svgY + GraphVal.DEFAULT_HEIGHT, svgX, svgY,
                                        me.graphModel.fetchNextId(), '新箭头', '');
                                    me.graphModel.insertElement(model);
                                    Painter.drawArrow(d3.select('svg')
                                            .selectAll('.ecm-arrow')
                                            .data(me.graphModel.getArrowArray()).enter(),
                                        me.graphModel, me);
                                    me.logOperation(new ElementAddOperation(me.graphModel, model));
                                },
                            }, {
                                text: '连接点',
                                func: () => {
                                    const model = new JointModel(svgX, svgY,
                                        me.graphModel.fetchNextId(), '新连接点', '');
                                    me.graphModel.insertElement(model);
                                    Painter.drawJoint(d3.select('svg')
                                            .selectAll('.ecm-joint')
                                            .data(me.graphModel.getJointArray()).enter(),
                                        me.graphModel, me);
                                    me.logOperation(new ElementAddOperation(me.graphModel, model));
                                },
                            }]],
                        }, {
                            text: '粘贴图元',
                            func() {
                                if (me.clipboard) {
                                    const model = me.clipboard;
                                    Copy.refreshPositionOfPasteElement(model, svgX, svgY);
                                    me.graphModel.insertElement(model);
                                    Painter.drawElement(model, me);
                                    me.logOperation(new ElementAddOperation(me.graphModel, model));
                                    me.clipboard = Copy.copyElementWithNewId(model, me.graphModel);
                                }
                            },
                        }],
                    ];
                }
                $.smartMenu.remove();
                $(this).smartMenu(data);
                return false;
            }
            $.smartMenu.remove();
            if (!elementModel) {
                me.clearMultiSelect();
            }

            return true;
        });
    }

    clearMultiSelect() {
        if (this.multiSelectModel) {
            Painter.markMultiSelectedElements(this.multiSelectModel, GraphVal.NORMAL_COLOR);
        }
        this.multiSelectModel = null;
    }

    setMultiSelect() {
        const me = this;
        const multiSelectStart = () => {
            const pos = d3.mouse(document.getElementById('svg-canvas'));
            Painter.drawMultiSelectArea(pos[0], pos[1]);
        };

        const multiSelect = () => {
            const pos = d3.mouse(document.getElementById('svg-canvas'));
            Painter.expandMultiSelectArea(pos[0], pos[1]);
        };

        const multiSelectEnd = () => {
            const area = d3.select('#multi-select-area');
            const lowX = area.attr('x');
            const lowY = area.attr('y');
            const pos = d3.mouse(document.getElementById('svg-canvas'));
            const highX = pos[0];
            const highY = pos[1];
            if ((highX - lowX) > 5 && (highY - lowY) > 5) {   // 防止过于敏感触发多选
                if (me.multiSelectModel) {
                    Painter.markMultiSelectedElements(me.multiSelectModel, GraphVal.NORMAL_COLOR);
                }
                me.multiSelectModel = null;
                me.multiSelectModel = me.graphModel.getElementsByArea(lowX, lowY, highX, highY);
                Painter.markMultiSelectedElements(
                    me.multiSelectModel, GraphVal.MULTI_SELECT_AREA_COLOR);
            }
            Painter.eraseElement('multi-select-area');
        };

        d3.select('svg').call(d3.drag()
            .on('start', () => multiSelectStart())
            .on('drag', () => multiSelect())
            .on('end', () => multiSelectEnd()));
    }

}
