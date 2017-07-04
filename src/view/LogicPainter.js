/**
 * Created by aswasn on 2017/3/17.
 */
import * as d3 from 'd3';
import 'd3-hierarchy';
import 'd3-drag';
import $ from '../assets/jquery-vendor';
import {NodeDrag} from './LogicMotion';
import { LogicNodeType } from '../assets/constants';

export default class LogicPainter {

    static drawTree(controller) {
        const isStraight = controller.isStraight;
        const data = controller.graphModel.data;
        const tree = d3.tree();
        const stratify = d3.stratify().id(d => d.id).parentId(d => d.leadTo);
        const root = stratify(data);

        const svg = d3.select('svg');
        svg.select("g[id='graph']").remove();
        const group = svg.append('g').attr('transform', 'translate(150,0)').attr('id', 'graph');
        const svgWidth = svg.attr('width');
        const svgHeight = svg.attr('height');

        // 根据层数计算宽度，根据叶子节点数计算高度
        const leaves = root.leaves();
        let graphHeight = leaves.length * 65;
        let graphWidth = 0;
        leaves.forEach((leaf) => {
            if (leaf.depth > graphWidth) {
                graphWidth = leaf.depth;
            }
        });
        graphWidth *= 160;
        graphWidth = graphWidth > (svgWidth - 50) ? (svgWidth - 50) : graphWidth;
        graphHeight = graphHeight > (svgHeight - 50) ? (svgHeight - 50) : graphHeight;
        tree.size([graphHeight, graphWidth]);
        controller.root = tree(root);
        // 开始绘图

        const drag = new NodeDrag();

        const node = group.selectAll('.node')
            .data(root.descendants())
            .enter().append('g')
            .attr('id', d => (`g-${d.id}`))
            .attr('class', (d) => {
                let result = 'node ';
                switch (d.data.type) {
                    case LogicNodeType.EVIDENCE:
                        result += 'evidence';
                        break;
                    case LogicNodeType.FACT:
                        result += 'fact';
                        break;
                    case LogicNodeType.LAW:
                        result += 'law';
                        break;
                    case LogicNodeType.CONCLUSION:
                        result += 'conclusion';
                        break;
                    case LogicNodeType.FINAL_CONCLUSION:
                        result += 'final-conclusion';
                        break;
                    default:
                        break;
                }
                return result;
            })
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .call(d3.drag()
                .on('start', d => drag.dragStart(controller, d))
                .on('drag', d => drag.drag(controller, d))
                .on('end', d => drag.dragEnd(controller, d)));

        node.append('text')
            .attr('id', d => (`text-${d.id}`))
            .style('user-select', 'none')
            .style('font-size', '14px')
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.topic);

        node.append('rect')
            .attr('id', d => d.id)
            .attr('x', (d) => {
                const width = document.getElementById(`text-${d.id}`).getBBox().width;
                return d.children ? 0 - width - 5 : -5;
            })
            .attr('y', (d) => {
                const height = document.getElementById(`text-${d.id}`).getBBox().height;
                return 0 - height - 2;
            })
            .attr('width', (d) => {
                const width = document.getElementById(`text-${d.id}`).getBBox().width;
                return width + 10;
            })
            .attr('height', (d) => {
                const height = document.getElementById(`text-${d.id}`).getBBox().height;
                return height + 8;
            })
            .attr('stroke-width', 2)
            .attr('fill', 'rgba(255,255,255,0)');

        group.selectAll('.link')
            .data(root.descendants().slice(1))
            .enter().append('path')
            .attr('id', d => (`path-${d.id}`))
            .attr('class', 'link')
            .attr('stroke', 'rgba(0,0,0,0.5)')
            .attr('stroke-width', '2')
            .attr('fill', 'rgba(255,255,255,0)')
            .attr('d', (d) => {
                let { x: nodeX, y: nodeY, width: nodeWidth, height: nodeHeight }
                    = document.getElementById(d.id).getBBox();
                let {
                    x: parentNodeX, y: parentNodeY,
                    width: parentNodeWidth, height: parentNodeHeight
                }
                    = document.getElementById(d.parent.id).getBBox();
                let x;
                let y;
                let parentX;
                let parentY;

                nodeY = d.y;
                nodeX = d.x;
                parentNodeX = d.parent.x;
                parentNodeY = d.parent.y;

                if (d.children && d.children.length > 0) {
                    x = (nodeY - nodeWidth) + 5;
                } else {
                    x = nodeY - 5;
                }
                y = (nodeX - (nodeHeight / 2)) + 5;
                parentX = parentNodeY + 5;
                parentY = (parentNodeX - (parentNodeHeight / 2)) + 4;

                if (isStraight) {
                    return `M${x},${y}L ${parentX},${parentY}`;
                }
                return `M${x},${y}C${(x + parentX) / 2},${y} ${(x + parentX) / 2},${parentY} ${parentX},${parentY}`;
            });
    }

    static drawTable(graphModel) {
        $('#graph-title-input').val(graphModel.title);
        $('.node-table-wrapper tbody').empty();
        let html = '';
        for (const node of graphModel.data) {
            const parentTopic = node.leadTo ? graphModel.findNodeById(node.leadTo).topic : '';
            html += `${'<tr>' +
                '<td>'}${node.id}</td>` +
                `<td>${node.topic}</td>` +
                `<td>${node.type}</td>` +
                `<td>${node.detail}</td>` +
                `<td>${node.leadTo} ${parentTopic}</td>` +
                '<td>' +
                `<button data-id='${node.id}' class='btn btn-success btn-xs add-btn' title='添加子节点' data-toggle='modal' data-target='#node-add-modal'>添加</button>` +
                `<button data-id='${node.id}' class='btn btn-danger btn-xs del-btn' title='删除节点' data-toggle='modal' data-target='#node-del-modal'>删除</button>` +
                `<button data-id='${node.id}' class='btn btn-warning btn-xs edit-btn' title='编辑节点' data-toggle='modal' data-target='#node-edit-modal'>编辑</button>` +
                '</td>' +
                '</tr>';
        }
        $('.node-table-wrapper tbody').append(html);
    }

    // 根据focus的node不同，leadTo的select内容也有所不同
    static fillLeadToSelect(graphModel, idNow, type, $select) {
        const data = graphModel.data;
        let leadTo = '';
        $select.empty();
        let html = '';
        if (type === LogicNodeType.FINAL_CONCLUSION) {
            html += "<option value=''></option>>";
        } else {
            for (const node of data) {
                const id = parseInt(node.id, 10);
                if (id === parseInt(idNow, 10)) {
                    leadTo = node.leadTo;
                } else if (!graphModel.isChildren(idNow, id)) {
                    html += `<option value='${id}'>${id} ${node.topic}</option>`;
                }
            }
        }
        $select.append(html);
        $select.val(leadTo);
    }

    // 第二个参数没有时，所有的节点都加入select中，否则将leadTo锁定为第二个参数代表的节点
    static fillAddModalLeadToSelect(graphModel, parentId) {
        const $select = $('#node-add-modal #node-add-leadTo-select');
        if (parentId) {
            const node = graphModel.findNodeById(parentId);
            if (node) {
                $select.append(`<option value='${parentId}'>${parentId} ${node.topic}</option>`);
            }
        } else {
            let html = '';
            graphModel.data.forEach((node) => {
                const id = parseInt(node.id, 10);
                html += `<option value='${id}'>${id} ${node.topic}</option>`;
            });
            $select.append(html);
        }
    }

    // 隐藏信息panel
    static hideInfoPanel() {
        const $infoPanel = $('.node-info-wrapper .node-panel');
        $infoPanel.removeClass('panel-primary panel-info panel-danger panel-success panel-warning');
        $infoPanel.hide();
    }

    // 隐藏逻辑图panel
    static hideLogicInfoPanel() {
        const $infoPanel = $('#collapseLogic');
        $infoPanel.collapse('hide');
    }

    // 显示信息panel
    static showInfoPanel(graphModel, node) {
        $('.node-info-wrapper .node-panel .alert').hide();
        const $infoPanel = $('.node-info-wrapper .node-panel');
        const $panelIdInput = $('.node-info-wrapper #panel-id-input');
        const $panelTopicInput = $('.node-info-wrapper #panel-topic-input');
        const $panelTypeSelect = $('.node-info-wrapper #panel-type-select');
        const $panelLeadToSelect = $('.node-info-wrapper #panel-leadTo-select');
        const $panelDetailInput = $('.node-info-wrapper #panel-detail-input');

        // 清掉各种状态
        $infoPanel.removeClass('panel-primary panel-info panel-danger panel-success panel-warning');
        $panelTypeSelect.removeAttr('disabled');
        $panelLeadToSelect.removeAttr('disabled');

        // 填入信息
        $panelIdInput.val(node.id);
        $panelTopicInput.val(node.topic);
        $panelDetailInput.val(node.detail);
        $panelTypeSelect.val(node.type);
        LogicPainter.fillLeadToSelect(graphModel, node.id, node.type, $('.node-info-wrapper #panel-leadTo-select'));

        // 设置外框样式以及最终结论相关禁用
        switch (node.type) {
            case LogicNodeType.EVIDENCE:
                $infoPanel.addClass('panel-success');
                break;
            case LogicNodeType.FACT:
                $infoPanel.addClass('panel-warning');
                break;
            case LogicNodeType.LAW:
                $infoPanel.addClass('panel-danger');
                break;
            case LogicNodeType.CONCLUSION:
                $infoPanel.addClass('panel-info');
                break;
            case LogicNodeType.FINAL_CONCLUSION: {
                $infoPanel.addClass('panel-primary');
                $panelTypeSelect.attr('disabled', 'disabled');
                $panelLeadToSelect.attr('disabled', 'disabled');
            }
                break;
            default:
                break;
        }

        $infoPanel.show();
    }

    // 显示逻辑图panel
    static showLogicInfoPanel(graphModel) {
        $('.node-info-wrapper .info-panel .alert').hide();
        const $titleInput = $('#title-input');
        const $caseReasonInput = $('#caseReason-input');
        const $caseNumberInput = $('#caseNumber-input');


        // 填入信息
        $titleInput.val(graphModel.title);
        $caseReasonInput.val(graphModel.caseReason);
        $caseNumberInput.val(graphModel.caseNumber);
    }

    // 为选中的节点设置特殊样式，第二个参数代表是否选中
    static renderSelectedNode(id, selected) {
        if (selected) {
            $(`#g-${id}`).addClass('selected');
        } else {
            $(`#g-${id}`).removeClass('selected');
        }
    }

    // 为删除节点modal填写信息
    static prepareDelModal(graphModel, id) {
        const node = graphModel.findNodeById(id);
        const parentTopic = node.leadTo ? graphModel.findNodeById(node.leadTo).topic : '';
        $('#node-del-modal .del-id-td').text(node.id);
        $('#node-del-modal .del-topic-td').text(node.topic);
        $('#node-del-modal .del-type-td').text(node.type);
        $('#node-del-modal .del-detail-td').text(node.detail);
        $('#node-del-modal .del-leadTo-td').text(`${node.leadTo} ${parentTopic}`);
    }

    // 为添加节点modal准备空白input和合适的select
    static prepareAddModal(graphModel, parentId) {
        $('#node-add-modal .alert').hide();
        $('#node-add-modal #node-add-topic-input').val('');
        $('#node-add-modal #node-add-detail-input').val('');
        $('#node-add-modal #node-add-type-select').val('证据');
        $('#node-add-modal #node-add-leadTo-select').empty();
        if (parentId) {
            LogicPainter.fillAddModalLeadToSelect(graphModel, parentId);
        } else {
            LogicPainter.fillAddModalLeadToSelect(graphModel);
        }
    }

    // 为编辑节点modal填写input和合适的select
    static prepareEditModal(graphModel, id) {
        $('#node-edit-modal .alert').hide();
        const node = graphModel.findNodeById(id);
        $('#node-edit-modal #node-edit-type-select').removeAttr('disabled');
        $('#node-edit-modal #node-edit-leadTo-select').removeAttr('disabled');
        if (node) {
            $('#node-edit-modal #node-edit-id-input').val(node.id);
            $('#node-edit-modal #node-edit-topic-input').val(node.topic);
            $('#node-edit-modal #node-edit-detail-input').val(node.detail);
            $('#node-edit-modal #node-edit-type-select').val(node.type);
            LogicPainter.fillLeadToSelect(graphModel, id, node.type, $('#node-edit-modal #node-edit-leadTo-select'));
            $('#node-edit-modal #node-edit-leadTo-select').val(node.leadTo);
            if (node.type === LogicNodeType.FINAL_CONCLUSION) {
                $('#node-edit-modal #node-edit-type-select').attr('disabled', 'disabled');
                $('#node-edit-modal #node-edit-leadTo-select').attr('disabled', 'disabled');
            }
        }
    }

    static moveNode(controller, node, xChange, yChange, oriPath, oriChildPaths) {
        const group = d3.select(`#g-${node.id}`);
        // 移动节点自己
        group.attr('transform', `translate(${node.y + xChange},${node.x + yChange})`);
        // 移动path
        const path = d3.select(`#path-${node.id}`);
        node.parent && path.attr('d', (function () {
            if (controller.isStraight) {
                return `M${oriPath.x + xChange},${oriPath.y + yChange
                        }L` + ` ${oriPath.parentX},${oriPath.parentY}`;
            }
            return `M${oriPath.x + xChange},${oriPath.y + yChange
                }C${(oriPath.x + xChange + oriPath.parentX) / 2},${oriPath.y + yChange
                } ${(oriPath.x + xChange + oriPath.parentX) / 2},${oriPath.parentY
                } ${oriPath.parentX},${oriPath.parentY}`;
        }()));
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                const path = d3.select(`#path-${node.children[i].id}`);
                path && path.attr('d', (function () {
                    if (controller.isStraight) {
                        return `M${oriChildPaths[i].x},${oriChildPaths[i].y
                                }L` + ` ${oriChildPaths[i].parentX + xChange},${oriChildPaths[i].parentY + yChange}`;
                    }
                    return `M${oriChildPaths[i].x},${oriChildPaths[i].y
                        }C${(oriChildPaths[i].x + xChange + oriChildPaths[i].parentX) / 2},${oriChildPaths[i].y
                        } ${(oriChildPaths[i].x + xChange + oriChildPaths[i].parentX) / 2},${oriChildPaths[i].parentY + yChange
                        } ${oriChildPaths[i].parentX + xChange},${oriChildPaths[i].parentY + yChange}`;
                }()));
            }
        }
    }

}
