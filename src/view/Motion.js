/**
 * Created by aswasn on 2016/12/21.
 */

import * as d3 from 'd3';
import {ElementType, GraphVal} from '../assets/constants';
import HeaderModel from '../model/HeaderModel';
import ArrowModel from '../model/ArrowModel';
import JointModel from '../model/JointModel';
import BodyModel from '../model/BodyModel';
import Painter from './Painter';
import {
    OriginalValue,
    GraphInfoOperation,
    GraphPosOperation,
    ElementAddOperation,
    ElementRemoveOperation,
    BodyPosChangeOperation,
    HeaderPosChangeOperation,
    ArrowPosChangeOperation,
    JointPosChangeOperation,
    ElementsChangeOperation,
} from '../model/Operation';
import Copy from '../assets/copy';

class Drag {

    dragStart(elementModel, controller) {
        this.x_start = d3.event.x;
        this.y_start = d3.event.y;
        Painter.setStroke(elementModel, GraphVal.HIGHLIGHT_COLOR);
        Click.showDetail(elementModel, controller.graphModel, controller);
    }

    drag() {
        this.x_current = d3.event.x;
        this.y_current = d3.event.y;
        this.x_change = this.x_current - this.x_start;
        this.y_change = this.y_current - this.y_start;
    }

    dragEnd(elementModel, multiSelectModel) {
        this.x_current = d3.event.x;
        this.y_current = d3.event.y;
        this.x_change = this.x_current - this.x_start;
        this.y_change = this.y_current - this.y_start;

        if (!!multiSelectModel
            && multiSelectModel.isSelected(elementModel, elementModel.data.type)) {
            Painter.setStroke(elementModel, GraphVal.MULTI_SELECT_AREA_COLOR);
        } else {
            Painter.setStroke(elementModel, GraphVal.NORMAL_COLOR);
        }
    }

}

class MultiDrag {

    static drag(multi, dx, dy) {
        multi.getBodyArray().forEach((ele) => {
            Painter.moveBodyByCoordinate(ele.getId(), ele.data.x + dx, ele.data.y + dy);
            // 带着链头末端一起动
            if (ele.getHeaderArray()) {
                ele.getHeaderArray().forEach((header) => {
                    if (!multi.isSelected(header, header.data.type)) {
                        Painter.moveHeaderByCoordinate(header.getId(),
                            header.data.x1 + dx, header.data.y1 + dy,
                            header.data.x2, header.data.y2);
                    }
                });
            }
        });

        multi.getHeaderArray().forEach((ele) => {
            if (!!ele.getBody() && !multi.isSelected(ele.getBody(), ElementType.BODY)) {
                Painter.moveHeaderByCoordinate(ele.getId(),
                    ele.data.x1, ele.data.y1, ele.data.x2 + dx, ele.data.y2 + dy);
            } else {
                Painter.moveHeaderByCoordinate(ele.getId(),
                    ele.data.x1 + dx, ele.data.y1 + dy, ele.data.x2 + dx, ele.data.y2 + dy);
            }
            // 带着箭头末端一起动
            if (ele.getArrowArray()) {
                ele.getArrowArray().forEach((son) => {
                    if (!multi.isSelected(son, son.data.type)) {
                        Painter.moveArrowByCoordinate(son.getId(),
                            ele.data.x2 + dx, ele.data.y2 + dy, son.data.x2, son.data.y2);
                    }
                });
            }
        });

        multi.getArrowArray().forEach((ele) => {
            if (!!ele.getHeader() && !multi.isSelected(ele.getHeader(), ElementType.HEADER)) {
                Painter.moveArrowByCoordinate(ele.getId(),
                    ele.data.x1, ele.data.y1, ele.data.x2 + dx, ele.data.y2 + dy);
            } else {
                Painter.moveArrowByCoordinate(ele.getId(),
                    ele.data.x1 + dx, ele.data.y1 + dy, ele.data.x2 + dx, ele.data.y2 + dy);
            }
        });

        multi.getJointArray().forEach((ele) => {
            Painter.moveJointByCoordinate(ele.getId(), ele.data.x + dx, ele.data.y + dy);
            // 带着箭头前端一起动
            if (ele.getArrowArray()) {
                ele.getArrowArray().forEach((arrow) => {
                    if (!multi.isSelected(arrow, arrow.data.type)) {
                        Painter.moveArrowByCoordinate(arrow.getId(),
                            arrow.data.x1, arrow.data.y1, arrow.data.x2 + dx, arrow.data.y2 + dy);
                    }
                });
            }
        });
    }

    static dragEnd(controller, dx, dy) {
        // 对全图做一个撤销记录
        controller.logOperation(
            new GraphPosOperation(controller,
                Copy.deepCopyGraphModel(controller.graphModel)));
        const multi = controller.multiSelectModel;
        multi.getBodyArray().forEach((ele) => {
            ele._setX(ele._getX() + dx);
            ele._setY(ele._getY() + dy);
            // 带着链头末端一起动
            if (ele.getHeaderArray()) {
                ele.getHeaderArray().forEach((header) => {
                    if (!multi.isSelected(header, header.data.type)) {
                        header._setX1(header._getX1() + dx);
                        header._setY1(header._getY1() + dy);
                    }
                });
            }
        });

        multi.getHeaderArray().forEach((ele) => {
            if (!!ele.getBody() && !multi.isSelected(ele.getBody(), ElementType.BODY)) {
                ele._setX2(ele._getX2() + dx);
                ele._setY2(ele._getY2() + dy);
            } else {
                ele._setX1(ele._getX1() + dx);
                ele._setY1(ele._getY1() + dy);
                ele._setX2(ele._getX2() + dx);
                ele._setY2(ele._getY2() + dy);
            }

            // 带着箭头末端一起动
            if (ele.getArrowArray()) {
                ele.getArrowArray().forEach((son) => {
                    if (!multi.isSelected(son, son.data.type)) {
                        son._setX1(son._getX1() + dx);
                        son._setY1(son._getY1() + dy);
                    }
                });
            }
        });

        multi.getArrowArray().forEach((ele) => {
            if (!!ele.getHeader() && !multi.isSelected(ele.getHeader(), ElementType.HEADER)) {
                ele._setX2(ele._getX2() + dx);
                ele._setY2(ele._getY2() + dy);
            } else {
                ele._setX1(ele._getX1() + dx);
                ele._setY1(ele._getY1() + dy);
                ele._setX2(ele._getX2() + dx);
                ele._setY2(ele._getY2() + dy);
            }
        });

        multi.getJointArray().forEach((ele) => {
            ele._setX(ele._getX() + dx);
            ele._setY(ele._getY() + dy);
            // 带着箭头前端一起动
            if (ele.getArrowArray()) {
                ele.getArrowArray().forEach((arrow) => {
                    if (!multi.isSelected(arrow, arrow.data.type)) {
                        arrow._setX2(arrow._getX2() + dx);
                        arrow._setY2(arrow._getY2() + dy);
                    }
                });
            }
        });

        multi.getArrowArray().forEach((ele) => {
            ele.bindConnectedItems(controller.graphModel);
        });

        multi.getHeaderArray().forEach((ele) => {
            ele.bindConnectedItems(controller.graphModel);
        });

        multi.getBodyArray().forEach((ele) => {
            ele.bindConnectedItems(controller.graphModel);
        });

        multi.getJointArray().forEach((ele) => {
            ele.bindConnectedItems(controller.graphModel);
        });
    }
}

class HeaderDrag extends Drag {

    dragStart(headerModel, controller) {
        super.dragStart(headerModel, controller);

        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(headerModel, headerModel.data.type)) {
            // 属于多选，交给多选类处理
        } else {
            // 属于单选，首先清空多选类
            controller.clearMultiSelect();
            // 干自己的事情
            const r22head =
                ((d3.event.x - headerModel.data.x2) ** 2)
                + ((d3.event.y - headerModel.data.y2) ** 2);

            const r22tail = ((d3.event.x - headerModel.data.x1) ** 2)
                + ((d3.event.y - headerModel.data.y1) ** 2);

            // 0-大圆拖动   1-线条末端拖动    2-链头整体拖动
            if (r22head < GraphVal.CIRCLE_R * GraphVal.CIRCLE_R) {
                this.dragKind = 0;
            } else if (r22tail < GraphVal.CIRCLE_DELTA * GraphVal.CIRCLE_DELTA) {
                this.dragKind = 1;
            } else {
                this.dragKind = 2;
            }
        }
    }

    drag(headerModel, controller) {
        super.drag();

        this.modifyBorder(headerModel);

        // 移动链头上的箭头的箭尾坐标
        const moveSons = (xChange, yChange) => {
            if (headerModel.getArrowArray()) {
                headerModel.getArrowArray().forEach((son) => {
                    Painter.moveArrowByCoordinate(son.getId(),
                        headerModel.data.x2 + xChange,
                        headerModel.data.y2 + yChange,
                        son.data.x2, son.data.y2);
                });
            }
        };

        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(headerModel, headerModel.data.type)) {
            // 属于多选，交给多选类处理
            MultiDrag.drag(controller.multiSelectModel, this.x_change, this.y_change);
        } else {
            // 单选
            switch (this.dragKind) {
                case 0:
                    // 移动圆和线头
                    Painter.moveHeaderByCoordinate(headerModel.getId(),
                        headerModel.data.x1, headerModel.data.y1, this.x_current, this.y_current);
                    moveSons(this.x_change, this.y_change);
                    break;
                case 1:
                    // 移动线尾
                    Painter.moveHeaderByCoordinate(headerModel.getId(),
                        this.x_current, this.y_current, headerModel.data.x2, headerModel.data.y2);
                    break;
                case 2:
                    // 整体移动
                    Painter.moveHeaderByCoordinate(headerModel.getId(),
                        headerModel.data.x1 + this.x_change, headerModel.data.y1 + this.y_change,
                        headerModel.data.x2 + this.x_change, headerModel.data.y2 + this.y_change);

                    moveSons(this.x_change, this.y_change);
                    break;
                default:
                    break;
            }
        }
    }

    dragEnd(headerModel, graphModel, controller) {
        super.dragEnd(headerModel, controller.multiSelectModel);

        this.modifyBorder(headerModel);
        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(headerModel, headerModel.data.type)) {
            // 属于多选，交给多选类处理
            MultiDrag.dragEnd(controller, this.x_change, this.y_change);
        } else {
            // 单选

            const operationArr = Array.of();

            // 修改被连接箭头的箭尾坐标
            const changeArrowTail = (xCurrent, yCurrent) => {
                if (headerModel.getArrowArray()) {
                    headerModel.getArrowArray().forEach((arrow) => {
                        operationArr.push(new ArrowPosChangeOperation(graphModel, arrow,
                            arrow.data.x1, arrow.data.y1, arrow.data.x2, arrow.data.y2));
                        arrow._setX1(xCurrent);
                        arrow._setY1(yCurrent);
                    });
                }
            };
            operationArr.push(new HeaderPosChangeOperation(graphModel, headerModel,
                headerModel.data.x1, headerModel.data.y1,
                headerModel.data.x2, headerModel.data.y2));

            switch (this.dragKind) {
                case 0:
                    headerModel._setX2(this.x_current);
                    headerModel._setY2(this.y_current);
                    // 修改被连接箭头的坐标
                    changeArrowTail(this.x_current, this.y_current);
                    break;
                case 1:
                    headerModel._setX1(this.x_current);
                    headerModel._setY1(this.y_current);
                    break;
                case 2:
                    headerModel._setX1(headerModel._getX1() + this.x_change);
                    headerModel._setY1(headerModel._getY1() + this.y_change);
                    headerModel._setX2(headerModel._getX2() + this.x_change);
                    headerModel._setY2(headerModel._getY2() + this.y_change);
                    // 修改被连接箭头的坐标
                    changeArrowTail(this.x_current, this.y_current);
                    break;
                default:
                    break;
            }
            headerModel.bindConnectedItems(graphModel);
            headerModel.adjustCoordinate();

            Painter.moveElementByModel(headerModel);
            // 带着箭头末端一起动
            if (headerModel.getArrowArray()) {
                headerModel.getArrowArray().forEach((arrow) => {
                    Painter.moveElementByModel(arrow);
                });
            }

            // 记录拖动
            controller.logOperation(new ElementsChangeOperation(operationArr));
        }
    }

    modifyBorder(headerModel) {
        switch (this.dragKind) {
            case 0:
                this.x_current = this.x_current > GraphVal.CIRCLE_R ?
                    this.x_current : GraphVal.CIRCLE_R;
                this.y_current = this.y_current > GraphVal.CIRCLE_R ?
                    this.y_current : GraphVal.CIRCLE_R;
                this.x_change = this.x_current - this.x_start;
                this.y_change = this.y_current - this.y_start;
                break;
            case 1:
                this.x_current = this.x_current > 0 ? this.x_current : 0;
                this.y_current = this.y_current > 0 ? this.y_current : 0;
                this.x_change = this.x_current - this.x_start;
                this.y_change = this.y_current - this.y_start;
                break;
            case 2:
                this.x_change = headerModel.data.x1 + this.x_change > 0 ?
                    this.x_change : -headerModel.data.x1;
                this.y_change = headerModel.data.y1 + this.y_change > 0 ?
                    this.y_change : -headerModel.data.y1;
                this.x_change = headerModel.data.x2 +
                this.x_change > GraphVal.CIRCLE_R ?
                    this.x_change : (GraphVal.CIRCLE_R - headerModel.data.x2);
                this.y_change = headerModel.data.y2 +
                this.y_change > GraphVal.CIRCLE_R ?
                    this.y_change : (GraphVal.CIRCLE_R - headerModel.data.y2);
                this.x_current = this.x_start + this.x_change;
                this.y_current = this.y_start + this.y_change;
                break;
            default:
                break;
        }
    }
}

class ArrowDrag extends Drag {

    dragStart(arrowModel, controller) {
        super.dragStart(arrowModel, controller);

        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(arrowModel, arrowModel.data.type)) {
            // 属于多选，交给多选类处理
        } else {
            // 属于单选，首先清空多选类
            controller.clearMultiSelect();
            // 干自己的事情
            const r22head = ((d3.event.x - arrowModel.data.x2) ** 2)
                + ((d3.event.y - arrowModel.data.y2) ** 2);

            const r22tail = ((d3.event.x - arrowModel.data.x1) ** 2)
                + ((d3.event.y - arrowModel.data.y1) ** 2);

            // 0-箭头拖动   1-箭尾拖动    2-箭头整体拖动
            if (r22head < GraphVal.CIRCLE_DELTA * GraphVal.CIRCLE_DELTA) {
                this.dragKind = 0;
            } else if (r22tail < GraphVal.CIRCLE_DELTA * GraphVal.CIRCLE_DELTA) {
                this.dragKind = 1;
            } else {
                this.dragKind = 2;
            }
        }
    }

    drag(arrowModel, controller) {
        super.drag();

        this.modifyBorder(arrowModel);

        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(arrowModel, arrowModel.data.type)) {
            // 属于多选，交给多选类处理
            MultiDrag.drag(controller.multiSelectModel, this.x_change, this.y_change);
        } else {
            // 单选
            switch (this.dragKind) {
                case 0:
                    Painter.moveArrowByCoordinate(arrowModel.getId(),
                        arrowModel.data.x1, arrowModel.data.y1, this.x_current, this.y_current);
                    break;
                case 1:
                    Painter.moveArrowByCoordinate(arrowModel.getId(),
                        this.x_current, this.y_current, arrowModel.data.x2, arrowModel.data.y2);
                    break;
                case 2:
                    Painter.moveArrowByCoordinate(arrowModel.getId(),
                        arrowModel.data.x1 + this.x_change, arrowModel.data.y1 + this.y_change,
                        arrowModel.data.x2 + this.x_change, arrowModel.data.y2 + this.y_change);
                    break;
                default:
                    break;
            }
        }
    }

    dragEnd(arrowModel, graphModel, controller) {
        super.dragEnd(arrowModel, controller.multiSelectModel);

        this.modifyBorder(arrowModel);

        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(arrowModel, arrowModel.data.type)) {
            // 属于多选，交给多选类处理
            MultiDrag.dragEnd(controller, this.x_change, this.y_change);
        } else {
            // 单选

            controller.logOperation(new ArrowPosChangeOperation(graphModel, arrowModel,
                arrowModel.data.x1, arrowModel.data.y1, arrowModel.data.x2, arrowModel.data.y2));
            switch (this.dragKind) {
                case 0:
                    arrowModel._setX2(this.x_current);
                    arrowModel._setY2(this.y_current);
                    break;
                case 1:
                    arrowModel._setX1(this.x_current);
                    arrowModel._setY1(this.y_current);
                    break;
                case 2:
                    arrowModel._setX1(arrowModel._getX1() + this.x_change);
                    arrowModel._setY1(arrowModel._getY1() + this.y_change);
                    arrowModel._setX2(arrowModel._getX2() + this.x_change);
                    arrowModel._setY2(arrowModel._getY2() + this.y_change);
                    break;
                default:
                    break;
            }
            arrowModel.bindConnectedItems(graphModel);
            arrowModel.adjustCoordinate();
            Painter.moveElementByModel(arrowModel);
        }
    }

    modifyBorder(arrowModel) {
        switch (this.dragKind) {
            case 0:
                this.x_current = this.x_current > 0 ? this.x_current : 0;
                this.y_current = this.y_current > 0 ? this.y_current : 0;
                this.x_change = this.x_current - this.x_start;
                this.y_change = this.y_current - this.y_start;
                break;
            case 1:
                this.x_current = this.x_current > 0 ? this.x_current : 0;
                this.y_current = this.y_current > 0 ? this.y_current : 0;
                this.x_change = this.x_current - this.x_start;
                this.y_change = this.y_current - this.y_start;
                break;
            case 2:
                this.x_change = arrowModel.data.x1 + this.x_change > 0 ?
                    this.x_change : -arrowModel.data.x1;
                this.y_change = arrowModel.data.y1 + this.y_change > 0 ?
                    this.y_change : -arrowModel.data.y1;
                this.x_change = arrowModel.data.x2 + this.x_change > 0 ?
                    this.x_change : -arrowModel.data.x2;
                this.y_change = arrowModel.data.y2 + this.y_change > 0 ?
                    this.y_change : -arrowModel.data.y2;
                this.x_current = this.x_start + this.x_change;
                this.y_current = this.y_start + this.y_change;
                break;
            default:
                break;
        }
    }
}

class BodyDrag extends Drag {

    dragStart(elementModel, controller) {
        super.dragStart(elementModel, controller);

        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(elementModel, elementModel.data.type)) {
            // 属于多选，交给多选类处理
        } else {
            // 属于单选，首先清空多选类
            controller.clearMultiSelect();
            // 干自己的事情
        }
    }

    drag(rectModel, controller) {
        super.drag();

        this.modifyBorder(rectModel);
        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(rectModel, rectModel.data.type)) {
            // 属于多选，交给多选类处理
            MultiDrag.drag(controller.multiSelectModel, this.x_change, this.y_change);
        } else {
            // 单选
            Painter.moveBodyByCoordinate(rectModel.getId(),
                rectModel.data.x + this.x_change, rectModel.data.y + this.y_change);
            // 带着链头直线末端一起动
            if (rectModel.getHeaderArray()) {
                rectModel.getHeaderArray().forEach((header) => {
                    Painter.moveHeaderByCoordinate(header.getId(),
                        header.data.x1 + this.x_change, header.data.y1 + this.y_change,
                        header.data.x2, header.data.y2);
                });
            }
        }
    }

    dragEnd(rectModel, graphModel, controller) {
        super.dragEnd(rectModel, controller.multiSelectModel);
        this.modifyBorder(rectModel);

        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(rectModel, rectModel.data.type)) {
            // 属于多选，交给多选类处理
            MultiDrag.dragEnd(controller, this.x_change, this.y_change);
        } else {
            // 单选

            const operationArr = Array.of();
            operationArr.push(new BodyPosChangeOperation(
                graphModel, rectModel, rectModel.data.x, rectModel.data.y));

            rectModel._setX(rectModel._getX() + this.x_change);
            rectModel._setY(rectModel._getY() + this.y_change);
            // 修改链头直线末端坐标
            if (rectModel.getHeaderArray()) {
                rectModel.getHeaderArray().forEach((header) => {
                    operationArr.push(new HeaderPosChangeOperation(graphModel, header,
                        header.data.x1, header.data.y1, header.data.x2, header.data.y2));
                    header._setX1(header._getX1() + this.x_change);
                    header._setY1(header._getY1() + this.y_change);
                });
            }
            rectModel.bindConnectedItems(graphModel);
            controller.logOperation(new ElementsChangeOperation(operationArr));
        }
    }

    modifyBorder(rectModel) {
        this.x_change = rectModel.data.x + this.x_change >
        GraphVal.STROKE_WIDTH ? this.x_change : (GraphVal.STROKE_WIDTH - rectModel.data.x);
        this.y_change = rectModel.data.y + this.y_change >
        GraphVal.STROKE_WIDTH ? this.y_change : (GraphVal.STROKE_WIDTH - rectModel.data.y);
    }
}

class JointDrag extends Drag {

    dragStart(elementModel, controller) {
        super.dragStart(elementModel, controller);

        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(elementModel, elementModel.data.type)) {
            // 属于多选，交给多选类处理
        } else {
            // 属于单选，首先清空多选类
            controller.clearMultiSelect();
            // 干自己的事情
        }
    }

    drag(rectModel, controller) {
        super.drag();
        this.modifyBorder(rectModel);

        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(rectModel, rectModel.data.type)) {
            // 属于多选，交给多选类处理
            MultiDrag.drag(controller.multiSelectModel, this.x_change, this.y_change);
        } else {
            // 单选
            Painter.moveJointByCoordinate(rectModel.getId(),
                rectModel.data.x + this.x_change, rectModel.data.y + this.y_change);
            // 带着箭头一起动
            if (rectModel.getArrowArray()) {
                rectModel.getArrowArray().forEach((arrow) => {
                    Painter.moveArrowByCoordinate(arrow.getId(),
                        arrow.data.x1, arrow.data.y1,
                        arrow.data.x2 + this.x_change, arrow.data.y2 + this.y_change);
                });
            }
        }
    }

    dragEnd(rectModel, graphModel, controller) {
        super.dragEnd(rectModel, controller.multiSelectModel);
        this.modifyBorder(rectModel);
        if (!!controller.multiSelectModel
            && controller.multiSelectModel.isSelected(rectModel, rectModel.data.type)) {
            // 属于多选，交给多选类处理
            MultiDrag.dragEnd(controller, this.x_change, this.y_change);
        } else {
            // 单选
            const operationArr = Array.of();
            operationArr.push(new JointPosChangeOperation(
                graphModel, rectModel, rectModel.data.x, rectModel.data.y));

            rectModel._setX(rectModel._getX() + this.x_change);
            rectModel._setY(rectModel._getY() + this.y_change);

            // 修改箭头坐标
            if (rectModel.getArrowArray()) {
                rectModel.getArrowArray().forEach((arrow) => {
                    operationArr.push(new ArrowPosChangeOperation(graphModel, arrow,
                        arrow.data.x1, arrow.data.y1, arrow.data.x2, arrow.data.y2));
                    arrow._setX2(arrow._getX2() + this.x_change);
                    arrow._setY2(arrow._getY2() + this.y_change);
                });
            }
            rectModel.bindConnectedItems(graphModel);
            controller.logOperation(new ElementsChangeOperation(operationArr));
        }
    }

    modifyBorder(rectModel) {
        this.x_change = rectModel.data.x + this.x_change >
        GraphVal.STROKE_WIDTH ? this.x_change : (GraphVal.STROKE_WIDTH - rectModel.data.x);
        this.y_change = rectModel.data.y + this.y_change >
        GraphVal.STROKE_WIDTH ? this.y_change : (GraphVal.STROKE_WIDTH - rectModel.data.y);
    }
}

class Click {
    static showDetail(elementModel, graphModel, controller) {
        const hiddenFlag = [true, true, true, true];
        const panelIds = ['head-panel', 'body-panel', 'arrow-panel', 'joint-panel'];

        const $headSaveBtn = $('#head-save-btn');
        const $headResetBtn = $('#head-reset-btn');
        const $headDelBtn = $('#head-del-btn');

        const $bodySaveBtn = $('#body-save-btn');
        const $bodyResetBtn = $('#body-reset-btn');
        const $bodyDelBtn = $('#body-del-btn');

        const $arrowSaveBtn = $('#arrow-save-btn');
        const $arrowResetBtn = $('#arrow-reset-btn');
        const $arrowDelBtn = $('#arrow-del-btn');

        const $jointSaveBtn = $('#joint-save-btn');
        const $jointResetBtn = $('#joint-reset-btn');
        const $jointDelBtn = $('#joint-del-btn');

        switch (elementModel.data.type) {
            case ElementType.HEADER:
                hiddenFlag[0] = false;
                // 解绑事件
                $headSaveBtn.off('click');
                $headResetBtn.off('click');
                $headDelBtn.off('click');
                // 绑定信息
                $('#head-name').val(elementModel.getName());
                $('#head-content').val(elementModel.getContent());
                $('#head-keySentence').val(elementModel.getKeySentence());
                $headSaveBtn.click(() => {
                    controller.clearMultiSelect();
                    // 处理撤销
                    const logArr = Array.of();
                    logArr.push(new OriginalValue('name', elementModel.getName()));
                    logArr.push(new OriginalValue('content', elementModel.getContent()));
                    logArr.push(new OriginalValue('keySentence', elementModel.getKeySentence()));
                    controller.logOperation(
                        new GraphInfoOperation(controller, elementModel, logArr));

                    elementModel.setName($('#head-name').val());
                    elementModel.setContent($('#head-content').val());
                    elementModel.setKeySentence($('#head-keySentence').val());
                });
                $headResetBtn.click(() => {
                    controller.clearMultiSelect();
                    $('#head-name').val(elementModel.getName());
                    $('#head-content').val(elementModel.getContent());
                    $('#head-keySentence').val(elementModel.getKeySentence());
                });
                $headDelBtn.click(() => {
                    controller.clearMultiSelect();
                    // 隐藏信息面板
                    $(`#${panelIds[0]}`).hide();

                    // 处理撤销
                    controller.logOperation(new ElementRemoveOperation(
                        controller, Copy.simpleCopyElement(elementModel)));

                    // 从数据中删除
                    graphModel.deleteElement(elementModel);

                    // 从图像中删除
                    Painter.eraseElement(elementModel.getId());
                });
                break;
            case ElementType.BODY:
                hiddenFlag[1] = false;
                // 解绑事件
                $bodySaveBtn.off('click');
                $bodyResetBtn.off('click');
                $bodyDelBtn.off('click');

                // 绑定信息
                $('#body-name').val(elementModel.getName());
                $('#body-evidenceType').val(elementModel.getEvidenceType());
                $('#body-committer').val(elementModel.getCommitter());

                $('#body-evidenceReason').val(elementModel.getEvidenceReason());
                $('#body-evidenceConclusion').val(elementModel.getEvidenceConclusion());
                $('#body-content').val(elementModel.getContent());

                $bodySaveBtn.click(() => {
                    controller.clearMultiSelect();
                    // 处理撤销
                    const logArr = Array.of();
                    logArr.push(new OriginalValue('name', elementModel.getName()));
                    logArr.push(new OriginalValue('content', elementModel.getContent()));
                    logArr.push(new OriginalValue('evidenceType', elementModel.getEvidenceType()));
                    logArr.push(new OriginalValue('evidenceReason', elementModel.getEvidenceReason()));
                    logArr.push(new OriginalValue('evidenceConclusion', elementModel.getEvidenceConclusion()));
                    logArr.push(new OriginalValue('committer', elementModel.getCommitter()));
                    controller.logOperation(
                        new GraphInfoOperation(controller, elementModel, logArr));

                    elementModel.setName($('#body-name').val());
                    elementModel.setEvidenceType($('#body-evidenceType').val());
                    elementModel.setCommitter($('#body-committer').val());
                    elementModel.setEvidenceReason($('#body-evidenceReason').val());
                    elementModel.setEvidenceConclusion($('#body-evidenceConclusion').val());
                    elementModel.setContent($('#body-content').val());
                });
                $bodyResetBtn.click(() => {
                    controller.clearMultiSelect();
                    $('#body-name').val(elementModel.getName());
                    $('#body-evidenceType').val(elementModel.getEvidenceType());
                    $('#body-committer').val(elementModel.getCommitter());

                    $('#body-evidenceReason').val(elementModel.getEvidenceReason());
                    $('#body-evidenceConclusion').val(elementModel.getEvidenceConclusion());
                    $('#body-content').val(elementModel.getContent());
                });

                $bodyDelBtn.click(() => {
                    controller.clearMultiSelect();
                    // 隐藏信息面板
                    $(`#${panelIds[1]}`).hide();

                    // 处理撤销
                    controller.logOperation(new ElementRemoveOperation(
                        controller, Copy.simpleCopyElement(elementModel)));

                    // 从数据中删除
                    graphModel.deleteElement(elementModel);
                    // 从图像中删除
                    Painter.eraseElement(elementModel.getId());
                });

                break;
            case ElementType.ARROW:
                hiddenFlag[2] = false;
                // 解绑事件
                $arrowSaveBtn.off('click');
                $arrowResetBtn.off('click');
                $arrowDelBtn.off('click');
                // 绑定信息
                $('#arrow-name').val(elementModel.getName());
                $('#arrow-content').val(elementModel.getContent());

                $arrowSaveBtn.click(() => {
                    controller.clearMultiSelect();
                    // 处理撤销
                    const logArr = Array.of();
                    logArr.push(new OriginalValue('name', elementModel.getName()));
                    logArr.push(new OriginalValue('content', elementModel.getContent()));
                    controller.logOperation(
                        new GraphInfoOperation(controller, elementModel, logArr));

                    elementModel.setName($('#arrow-name').val());
                    elementModel.setContent($('#arrow-content').val());
                });
                $arrowResetBtn.click(() => {
                    controller.clearMultiSelect();
                    $('#arrow-name').val(elementModel.getName());
                    $('#arrow-content').val(elementModel.getContent());
                });

                $arrowDelBtn.click(() => {
                    controller.clearMultiSelect();
                    // 隐藏信息面板
                    $(`#${panelIds[2]}`).hide();

                    // 处理撤销
                    controller.logOperation(new ElementRemoveOperation(
                        controller, Copy.simpleCopyElement(elementModel)));
                    // 从数据中删除
                    graphModel.deleteElement(elementModel);
                    // 从图像中删除
                    Painter.eraseElement(elementModel.getId());
                });

                break;
            case ElementType.JOINT:
                hiddenFlag[3] = false;
                // 解绑事件
                $jointSaveBtn.off('click');
                $jointResetBtn.off('click');
                $jointDelBtn.off('click');

                // 绑定信息

                $('#joint-name').val(elementModel.getName());
                $('#joint-content').val(elementModel.getContent());

                $jointSaveBtn.click(() => {
                    controller.clearMultiSelect();
                    // 处理撤销
                    const logArr = Array.of();
                    logArr.push(new OriginalValue('name', elementModel.getName()));
                    logArr.push(new OriginalValue('content', elementModel.getContent()));
                    controller.logOperation(
                        new GraphInfoOperation(controller, elementModel, logArr));

                    elementModel.setName($('#joint-name').val());
                    elementModel.setContent($('#joint-content').val());
                });
                $jointResetBtn.click(() => {
                    controller.clearMultiSelect();
                    $('#joint-name').val(elementModel.getName());
                    $('#joint-content').val(elementModel.getContent());
                });

                $jointDelBtn.click(() => {
                    controller.clearMultiSelect();
                    // 隐藏信息面板
                    $(`#${panelIds[3]}`).hide();

                    // 处理撤销
                    controller.logOperation(new ElementRemoveOperation(
                        controller, Copy.simpleCopyElement(elementModel)));
                    // 从数据中删除
                    graphModel.deleteElement(elementModel);
                    // 从图像中删除
                    Painter.eraseElement(elementModel.getId());
                });
                break;
            default:
                break;
        }

        for (let i = 0; i < panelIds.length; i++) {
            const id = `#${panelIds[i]}`;
            const flag = hiddenFlag[i];
            if (flag) {
                $(id).hide();
            } else {
                $(id).show();
            }
        }
    }
}

class CreateDrag {
    dragStart(id, type) {
        const $dragBox = $('#dragBox');
        $dragBox.css({left: d3.event.x, top: d3.event.y});
        $dragBox.append($(`#${id}`).clone());
        this.type = type;
    }

    drag() {
        $('#dragBox').css({left: d3.event.x, top: d3.event.y});
    }

    dragEnd(graphModel, controller) {
        $('#dragBox').empty();

        const width = $('#svg-canvas').width();
        const height = $('#svg-canvas').height();

        const dragX = d3.mouse(document.getElementById('svg-canvas'))[0];
        const dragY = d3.mouse(document.getElementById('svg-canvas'))[1];

        if (dragX >= 0 && dragY >= 0 && dragX <= (width) && dragY <= (height)) {
            let elementModel = null;
            switch (this.type) {
                case ElementType.HEADER:
                    elementModel = new HeaderModel(
                        dragX, dragY + GraphVal.DEFAULT_HEIGHT, dragX, dragY,
                        graphModel.fetchNextId(), '', '', '');
                    graphModel.insertElement(elementModel);
                    Painter.drawHeader(d3.select('svg').selectAll('.ecm-header')
                            .data(graphModel.getHeaderArray()).enter(),
                        graphModel, controller);
                    break;
                case ElementType.ARROW:
                    elementModel = new ArrowModel(
                        dragX, dragY + GraphVal.DEFAULT_HEIGHT,
                        dragX, dragY, graphModel.fetchNextId(), '', '');
                    graphModel.insertElement(elementModel);
                    Painter.drawArrow(d3.select('svg').selectAll('.ecm-arrow')
                            .data(graphModel.getArrowArray()).enter(),
                        graphModel, controller);
                    break;
                case ElementType.BODY:
                    elementModel = new BodyModel(
                        dragX - (GraphVal.RECT_WIDTH / 2),
                        dragY - (GraphVal.RECT_HEIGHT / 2),
                        graphModel.fetchNextId(), '', '', '', '', '', '');
                    graphModel.insertElement(elementModel);
                    Painter.drawBody(d3.select('svg').selectAll('.ecm-body')
                        .data(graphModel.getBodyArray()).enter(), graphModel, controller);
                    break;
                case ElementType.JOINT:
                    elementModel = new JointModel(
                        dragX - (GraphVal.SQUARE_SIDE / 2),
                        dragY - (GraphVal.SQUARE_SIDE / 2), graphModel.fetchNextId(), '', '');
                    graphModel.insertElement(elementModel);
                    Painter.drawJoint(d3.select('svg').selectAll('.ecm-joint')
                        .data(graphModel.getJointArray()).enter(), graphModel, controller);
                    break;
                default:
                    break;
            }
            controller.logOperation(new ElementAddOperation(graphModel, elementModel));
        }
    }

}

export {HeaderDrag, ArrowDrag, JointDrag, BodyDrag, CreateDrag, Click};
