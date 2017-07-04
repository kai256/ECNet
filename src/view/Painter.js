/**
 * Created by aswasn on 2017/2/23.
 */

import * as d3 from 'd3';
import { HeaderDrag, BodyDrag, ArrowDrag, JointDrag, Click } from './Motion';
import { GraphVal, ElementType } from '../assets/constants';

export default class Painter {

    // 在图像中删除元素
    static eraseElement(id) {
        d3.select(`svg *[id='${id}'`).remove();
    }

    // 改变单个元素的颜色
    static setStroke(elementModel, color) {
        d3.selectAll(`svg g[id='ele-${elementModel.getId()}'] *`).attr('stroke', color);
        d3.selectAll(`svg g[id='${elementModel.getId()}'] text`).attr('fill', color);
    }

    static drawElement(elementModel, controller) {
        const me = this;
        const graphModel = controller.graphModel;
        switch (elementModel.data.type) {
            case ElementType.BODY:
                me.drawBody(d3.select('svg').selectAll('.ecm-body')
                    .data(graphModel.getBodyArray()).enter(), graphModel, controller);
                break;
            case ElementType.HEADER:
                me.drawHeader(d3.select('svg').selectAll('.ecm-header')
                    .data(graphModel.getHeaderArray()).enter(), graphModel, controller);
                break;
            case ElementType.ARROW:
                me.drawArrow(d3.select('svg').selectAll('.ecm-arrow')
                    .data(graphModel.getArrowArray()).enter(), graphModel, controller);
                break;
            case ElementType.JOINT:
                me.drawJoint(d3.select('svg').selectAll('.ecm-joint')
                    .data(graphModel.getJointArray()).enter(), graphModel, controller);
                break;
            default:
                break;
        }
    }

    static drawBody(selection, graphModel, controller) {
        const bodyDrag = new BodyDrag();
        const group = selection.append('g')
            .attr('id', d => d.data.id).attr('class', 'ecm-body ecm-element');
        group.append('g').attr('id', d => (`ele-${d.data.id}`)).append('rect')
            .attr('x', d => d.data.x)
            .attr('y', d => d.data.y)
            .attr('width', GraphVal.RECT_WIDTH)
            .attr('height', GraphVal.RECT_HEIGHT)
            .attr('stroke-width', '2')
            .attr('stroke', 'black')
            .attr('fill', 'white')
            .call(d3.drag()
                .on('start', d => bodyDrag.dragStart(d, controller))
                .on('drag', d => bodyDrag.drag(d, controller))
                .on('end', d => bodyDrag.dragEnd(d, graphModel, controller)),
            )
            .on('click', d => Click.showDetail(d, graphModel, controller));

        // 添加文字
        group.append('text')
            .attr('x', d => (
            document.getElementById(`ele-${d.data.id}`).getBBox().x
            + (document.getElementById(`ele-${d.data.id}`).getBBox().width * 0.35)))
            .attr('y', d => (
            document.getElementById(`ele-${d.data.id}`).getBBox().y
            + ((document.getElementById(`ele-${d.data.id}`).getBBox().height * 2) / 3)))
            .attr('fill', 'black')
            .attr('fill-opacity', 0.5)
            .style('user-select', 'none')
            .style('font-size', '10px')
            .text(d => d.data.name);
    }

    static drawHeader(selection, graphModel, controller) {
        const headerDrag = new HeaderDrag();
        const group = selection.append('g').attr('id', d => d.data.id).attr('class', 'ecm-header ecm-element');
        const element = group.append('g').attr('id', d => (`ele-${d.data.id}`));
        element.append('line')
            .attr('x1', d => d.data.x1)
            .attr('y1', d => d.data.y1)
            .attr('x2', d => d.data.x2)
            .attr('y2', d => d.data.y2)
            .attr('stroke-width', 2)
            .attr('stroke', 'black');
        element.append('circle')
            .attr('cx', d => d.data.x2)
            .attr('cy', d => d.data.y2)
            .attr('r', GraphVal.CIRCLE_R)
            .attr('fill', 'white')
            .attr('stroke-width', '2')
            .attr('stroke', 'black');
        group.call(d3.drag()
            .on('start', d => headerDrag.dragStart(d, controller))
            .on('drag', d => headerDrag.drag(d, controller))
            .on('end', d => headerDrag.dragEnd(d, graphModel, controller)),
        ).on('click', d => Click.showDetail(d, graphModel, controller));

        // 添加文字
        group.append('text')
            .attr('x', d => (d.data.x2 + (GraphVal.CIRCLE_R * 1.2)))
            .attr('y', d => (d.data.y2 + (GraphVal.CIRCLE_R * 1.2)))
            .attr('fill', 'black')
            .attr('fill-opacity', 0.5)
            .style('user-select', 'none')
            .style('font-size', '10px')
            .text(d => d.data.name);
    }

    static drawArrow(selection, graphModel, controller) {
        const arrowDrag = new ArrowDrag();
        const group = selection.append('g')
            .attr('id', d => d.data.id)
            .attr('class', 'ecm-arrow ecm-element');
        const element = group.append('g').attr('id', d => (`ele-${d.data.id}`));
        element.append('line')
            .attr('x1', d => d.data.x1)
            .attr('y1', d => d.data.y1)
            .attr('x2', d => d.data.x2)
            .attr('y2', d => d.data.y2)
            .attr('stroke-width', 2)
            .attr('stroke', 'black')
            .attr('marker-end', () => 'url(#arrow)')
            .call(d3.drag()
                .on('start', d => arrowDrag.dragStart(d, controller))
                .on('drag', d => arrowDrag.drag(d, controller))
                .on('end', d => arrowDrag.dragEnd(d, graphModel, controller)),
            )
            .on('click', d => Click.showDetail(d, graphModel, controller));

        // 添加文字
        group.append('text')
            .attr('x', d => (
            document.getElementById(`ele-${d.data.id}`).getBBox().x
            + (document.getElementById(`ele-${d.data.id}`).getBBox().width / 4)))
            .attr('y', d => (
            document.getElementById(`ele-${d.data.id}`).getBBox().y
            + ((document.getElementById(`ele-${d.data.id}`).getBBox().height * 2) / 3)))
            .attr('fill', 'black')
            .attr('fill-opacity', 0.5)
            .style('user-select', 'none')
            .style('font-size', '10px')
            .text(d => d.data.name);
    }

    static drawJoint(selection, graphModel, controller) {
        const jointDrag = new JointDrag();
        const group = selection.append('g').attr('id', d => d.data.id).attr('class', 'ecm-joint ecm-element');
        group.append('g')
            .attr('id', d => (`ele-${d.data.id}`))
            .append('rect').attr('x', d => d.data.x)
            .attr('y', d => d.data.y)
            .attr('width', GraphVal.SQUARE_SIDE)
            .attr('height', GraphVal.SQUARE_SIDE)
            .attr('stroke-width', '2')
            .attr('stroke', 'black')
            .attr('fill', 'white')
            .call(d3.drag()
                .on('start', d => jointDrag.dragStart(d, controller))
                .on('drag', d => jointDrag.drag(d, controller))
                .on('end', d => jointDrag.dragEnd(d, graphModel, controller)),
            )
            .on('click', d => Click.showDetail(d, graphModel, controller));

        // 添加文字
        group.append('text')
            .attr('x', d => (
            document.getElementById(`ele-${d.data.id}`).getBBox().x
            + (document.getElementById(`ele-${d.data.id}`).getBBox().width * 0.15)))
            .attr('y', d => (
            document.getElementById(`ele-${d.data.id}`).getBBox().y
            + ((document.getElementById(`ele-${d.data.id}`).getBBox().height * 2) / 3)))
            .attr('fill', 'black')
            .attr('fill-opacity', 0.5)
            .style('user-select', 'none')
            .style('font-size', '10px')
            .text(d => d.data.name);
    }

    static moveElementByModel(elementModel) {
        switch (elementModel.data.type) {
            case ElementType.BODY:
                Painter._moveBodyByModel(elementModel);
                break;
            case ElementType.HEADER:
                Painter._moveHeaderByModel(elementModel);
                break;
            case ElementType.ARROW:
                Painter._moveArrowByModel(elementModel);
                break;
            case ElementType.JOINT:
                Painter._moveJointByModel(elementModel);
                break;
            default:
                break;
        }
    }

    // 根据Model修改链体位置
    static _moveBodyByModel(elementModel) {
        const id = elementModel.getId();
        d3.select(`svg g[id='ele-${id}'] rect`).attr('x', elementModel.data.x).attr('y', elementModel.data.y);

        // 修改文字位置
        const bBox = document.getElementById(`ele-${id}`).getBBox();
        d3.select(`svg g[id='${id}'] text`)
            .attr('x', bBox.x + (bBox.width * 0.35))
            .attr('y', bBox.y + ((bBox.height * 2) / 3));
    }

    // 根据Model修改链头位置
    static _moveHeaderByModel(elementModel) {
        const id = elementModel.getId();
        const group = d3.select(`svg g[id='ele-${id}']`);
        group.select('circle')
            .attr('cx', elementModel.data.x2)
            .attr('cy', elementModel.data.y2);
        group.select('line')
            .attr('x2', elementModel.data.x2)
            .attr('y2', elementModel.data.y2)
            .attr('x1', elementModel.data.x1)
            .attr('y1', elementModel.data.y1);

        // 修改文字位置
        d3.select(`svg g[id='${id}'] text`)
            .attr('x', elementModel.data.x2 + (GraphVal.CIRCLE_R * 1.2))
            .attr('y', elementModel.data.y2 + (GraphVal.CIRCLE_R * 1.2));
    }

    // 根据Model修改箭头位置
    static _moveArrowByModel(elementModel) {
        const id = elementModel.getId();
        d3.select(`svg g[id='ele-${id}']`)
            .select('line')
            .attr('x2', elementModel.data.x2)
            .attr('y2', elementModel.data.y2)
            .attr('x1', elementModel.data.x1)
            .attr('y1', elementModel.data.y1);

        // 修改文字位置
        const bBox = document.getElementById(`ele-${id}`).getBBox();
        d3.select(`svg g[id='${id}'] text`)
            .attr('x', bBox.x + (bBox.width / 4))
            .attr('y', bBox.y + ((bBox.height * 2) / 3));
    }

    // 根据Model修改连接点位置
    static _moveJointByModel(elementModel) {
        const id = elementModel.getId();
        d3.select(`svg g[id='ele-${id}'] rect`)
            .attr('x', elementModel.data.x)
            .attr('y', elementModel.data.y);

        // 修改文字位置
        const bBox = document.getElementById(`ele-${id}`).getBBox();
        d3.select(`svg g[id='${id}'] text`)
            .attr('x', bBox.x + (bBox.width * 0.15))
            .attr('y', bBox.y + ((bBox.height * 2) / 3));
    }

    // 根据坐标修改链体位置
    static moveBodyByCoordinate(id, x, y) {
        d3.select(`svg g[id='ele-${id}'] rect`).attr('x', x).attr('y', y);

        // 修改文字位置
        const bBox = document.getElementById(`ele-${id}`).getBBox();
        d3.select(`svg g[id='${id}'] text`)
            .attr('x', bBox.x + (bBox.width * 0.35))
            .attr('y', bBox.y + ((bBox.height * 2) / 3));
    }

    // 根据坐标修改链头位置
    static moveHeaderByCoordinate(id, x1, y1, x2, y2) {
        const group = d3.select(`svg g[id='ele-${id}']`);
        group.select('circle')
            .attr('cx', x2)
            .attr('cy', y2);
        group.select('line')
            .attr('x2', x2)
            .attr('y2', y2)
            .attr('x1', x1)
            .attr('y1', y1);

        // 修改文字位置
        d3.select(`svg g[id='${id}'] text`)
            .attr('x', x2 + (GraphVal.CIRCLE_R * 1.2))
            .attr('y', y2 + (GraphVal.CIRCLE_R * 1.2));
    }

    // 根据坐标修改箭头位置
    static moveArrowByCoordinate(id, x1, y1, x2, y2) {
        d3.select(`svg g[id='ele-${id}']`)
            .select('line')
            .attr('x2', x2)
            .attr('y2', y2)
            .attr('x1', x1)
            .attr('y1', y1);

        // 修改文字位置
        const bBox = document.getElementById(`ele-${id}`).getBBox();
        d3.select(`svg g[id='${id}'] text`)
            .attr('x', bBox.x + (bBox.width / 4))
            .attr('y', bBox.y + ((bBox.height * 2) / 3));
    }

    // 根据坐标修改连接点位置
    static moveJointByCoordinate(id, x, y) {
        d3.select(`svg g[id='ele-${id}'] rect`).attr('x', x).attr('y', y);

        // 修改文字位置
        const bBox = document.getElementById(`ele-${id}`).getBBox();
        d3.select(`svg g[id='${id}'] text`)
            .attr('x', bBox.x + (bBox.width * 0.15))
            .attr('y', bBox.y + ((bBox.height * 2) / 3));
    }

    // ---------------------------------多选相关---------------------------------
    // 绘制多选框
    static drawMultiSelectArea(x, y) {
        d3.select('svg').append('rect')
            .attr('id', 'multi-select-area')
            .attr('class', 'multi-select-area')
            .attr('stroke-width', GraphVal.MULTI_SELECT_AREA_STROKE_WIDTH)
            .attr('stroke', GraphVal.MULTI_SELECT_AREA_COLOR)
            .attr('fill', GraphVal.MULTI_SELECT_AREA_COLOR)
            .attr('fill-opacity', GraphVal.MULTI_SELECT_AREA_OPACITY)
            .attr('x', x)
            .attr('y', y)
            .attr('width', 0)
            .attr('height', 0);
    }

    // 拖动时扩张选框边界
    static expandMultiSelectArea(x, y) {
        const area = d3.select('#multi-select-area');
        const oldX = area.attr('x');
        const oldY = area.attr('y');
        const width = x - oldX;
        const height = y - oldY;
        if (width < 0 || height < 0) {
            return;
        }
        area.attr('width', x - oldX);
        area.attr('height', y - oldY);
    }

    // 给MultiSelectModel中的元素渲染指定的颜色
    static markMultiSelectedElements(model, color) {
        const me = this;
        model.getBodyArray().forEach((ele) => {
            me.setStroke(ele, color);
        });
        model.getHeaderArray().forEach((ele) => {
            me.setStroke(ele, color);
        });
        model.getArrowArray().forEach((ele) => {
            me.setStroke(ele, color);
        });
        model.getJointArray().forEach((ele) => {
            me.setStroke(ele, color);
        });
    }
    // -----------------------------end of 多选相关------------------------------

    static refreshText(id, text) {
        d3.select(`svg g[id='${id}'] text`).text(text);
    }
}
