/**
 * Created by zgw on 2017/2/19.
 */
import { ElementType, GraphVal, Neighbour } from '../assets/constants';

// 优先队列，效率待提升
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    compare(queueElement1, queueElement2) {
        if (queueElement1.priority > queueElement2.priority) {
            return true;
        } else if (queueElement1.priority < queueElement2.priority) {
            return false;
        }
        if (queueElement1.element.getType() === queueElement2.element.getType()) {
            return queueElement1.element.getId() < queueElement2.element.getId(); // id小的优先画
        }
        return queueElement1 === ElementType.BODY;
    }

    enqueue(element, priority) {
        if (element.getType() !== ElementType.JOINT && element.getType() !== ElementType.BODY) {
            console.log('进入优先队列的元素有误');
        }

        const queueElement = { element, priority };
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (this.compare(queueElement, this.items[i])) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }
        if (!added) {
            this.items.push(queueElement);
        }
    }

    dequeue() {
        const ele = this.items.shift();
        return ele ? ele.element : null;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

}

export default class Layout {
    static neighbourLayout(graphModel) {
        // 设置全部元素没有访问
        graphModel.getHeaderArray().forEach((ele) => {
            ele._setVisited(false);
        });
        graphModel.getBodyArray().forEach((ele) => {
            ele._setVisited(false);
        });
        graphModel.getJointArray().forEach((ele) => {
            ele._setVisited(false);
        });
        graphModel.getArrowArray().forEach((ele) => {
            ele._setVisited(false);
        });

        // 得到最大出度的连接点/链头
        const findMaxDegreeElement = () => {
            let element = null;
            let max = -1;
            if (graphModel.getHeaderArray()) {
                graphModel.getHeaderArray().forEach((ele) => {
                    if (max < ele._getDegrees() && !ele._getVisited()) {
                        element = ele;
                        max = ele._getDegrees();
                    }
                });
            }

            if (graphModel.getJointArray()) {
                graphModel.getJointArray().forEach((ele) => {
                    if (max < ele._getDegrees() && !ele._getVisited()) {
                        element = ele;
                        max = ele._getDegrees();
                    }
                });
            }
            return { element, max };
        };

        // 判断是否所有连接点/链头都访问过
        const visitedAll = () => {
            if (graphModel.getHeaderArray()) {
                for (const ele of graphModel.getHeaderArray()) {
                    if (!ele._getVisited()) {
                        return false;
                    }
                }
            }

            if (graphModel.getJointArray()) {
                for (const ele of graphModel.getJointArray()) {
                    if (!ele._getVisited()) {
                        return false;
                    }
                }
            }
            return true;
        };

        // 遍历所有连通分量,一个连通分量一层,层按y坐标展开
        let layerStartX = Neighbour.LAYER_START_X; // 记录每一层的开始x坐标
        let layerStartY = Neighbour.LAYER_START_Y; // 记录每一层的开始y坐标
        while (!visitedAll()) {
            const queue = new PriorityQueue();
            const ret = findMaxDegreeElement();
            const element = ret.element;
            const max = ret.max;
            queue.enqueue(element, max);

            // 最后做整体平移
            element._setX(layerStartX);
            element._setY(layerStartY);
            // 顺时针为正方向
            element._setStartAngle(Neighbour.START_ANGLE);

            // 每次寻找周围拥有最大度的链头/连接点
            while (!queue.isEmpty()) {
                const ele = queue.dequeue();
                const fatherStartAngle = ele._getStartAngle();
                ele._setVisited(true);

                layerStartY = Math.max(
                    layerStartY, ele.getType() === ElementType.JOINT ? ele._getY() : ele._getY2());

                const arrows = ele.getArrowArray();
                if (arrows) {
                    for (let i = 0; i < arrows.length; i++) {
                        const arrow = arrows[i];

                        const angle = (i * ele._getAlpha()) + fatherStartAngle;

                        if (!arrow._getVisited()) {
                            if (ele.getType() === ElementType.HEADER) {
                                arrow._setX1(ele._getX2());
                                arrow._setY1(ele._getY2());
                                arrow._setX2(
                                    (Math.cos(angle * Neighbour.K_RADIAN) * Neighbour.HEADER2JOINT)
                                    + ele._getX2());
                                arrow._setY2(
                                    (Math.sin(angle * Neighbour.K_RADIAN) * Neighbour.HEADER2JOINT)
                                    + ele._getY2());
                                if (!!arrow.getJoint() && !arrow.getJoint()._getVisited()) {
                                    arrow.getJoint()._setStartAngle(angle - 180);
                                    arrow.getJoint()._setX(
                                        (Math.cos(angle * Neighbour.K_RADIAN)
                                        * Neighbour.HEADER2JOINT) + ele._getX2());
                                    arrow.getJoint()._setY(
                                        (Math.sin(angle * Neighbour.K_RADIAN)
                                        * Neighbour.HEADER2JOINT) + ele._getY2());

                                    queue.enqueue(arrow.getJoint(), arrow.getJoint()._getDegrees());
                                }
                            } else if (ele.getType() === ElementType.JOINT) {
                                arrow._setX2(ele._getX());
                                arrow._setY2(ele._getY());
                                arrow._setX1(
                                    (Math.cos(angle * Neighbour.K_RADIAN)
                                    * Neighbour.HEADER2JOINT) + ele._getX());
                                arrow._setY1(
                                    (Math.sin(angle * Neighbour.K_RADIAN)
                                    * Neighbour.HEADER2JOINT) + ele._getY());
                                if (!!arrow.getHeader() && !arrow.getHeader()._getVisited()) {
                                    arrow.getHeader()._setStartAngle(angle - 180);
                                    arrow.getHeader()._setX2(
                                        (Math.cos(angle * Neighbour.K_RADIAN)
                                        * Neighbour.HEADER2JOINT) + ele._getX());
                                    arrow.getHeader()._setY2(
                                        (Math.sin(angle * Neighbour.K_RADIAN)
                                        * Neighbour.HEADER2JOINT) + ele._getY());
                                    // 链头的尾部坐标到以链头尾中心向外探索时再设置
                                    queue.enqueue(
                                        arrow.getHeader(), arrow.getHeader()._getDegrees());
                                }
                            }
                            arrow._setVisited(true);
                        }
                    }
                }

                if (ele.getType() === ElementType.HEADER) {
                    // body在链头的初始角度+180°方向画
                    if (!!ele.getBody() && !ele.getBody()._getVisited()) {
                        ele.getBody()._setX(
                            (Math.cos((ele._getStartAngle() + 180)
                                * Neighbour.K_RADIAN) * Neighbour.HEADER2BODY) + ele._getX2());
                        ele.getBody()._setY((Math.sin((ele._getStartAngle() + 180)
                                * Neighbour.K_RADIAN) * Neighbour.HEADER2BODY) + ele._getY2());
                        ele.getBody()._setVisited(true);
                    }

                    if (ele.getBody()) {
                        ele._setX1(ele.getBody()._getX());
                        ele._setY1(ele.getBody()._getY());
                    } else {
                        ele._setX1((Math.cos((ele._getStartAngle() + 180)
                                * Neighbour.K_RADIAN) * Neighbour.HEADER2BODY) + ele._getX2());
                        ele._setY1((Math.sin((ele._getStartAngle() + 180)
                                * Neighbour.K_RADIAN) * Neighbour.HEADER2BODY) + ele._getY2());
                    }
                }
            }

            layerStartY += Neighbour.LAYER_DELTA_Y;
        }

        // 补上游离态的链体/箭头,游离态横向展开
        graphModel.getBodyArray().forEach((body) => {
            if (!body._getVisited()) {
                body._setX(layerStartX);
                body._setY(layerStartY);
                layerStartX += (GraphVal.RECT_WIDTH + Neighbour.LAYER_DELTA_X);
                body._setVisited(true);
            }
        });

        // 箭头摆在下一层
        layerStartX = Neighbour.LAYER_START_X;
        layerStartY += (GraphVal.RECT_HEIGHT + Neighbour.LAYER_DELTA_Y);

        graphModel.getArrowArray().forEach((arrow) => {
            if (!arrow._getVisited()) {
                arrow._setX1(layerStartX);
                arrow._setY1(layerStartY);
                layerStartX += (Neighbour.HEADER2JOINT + Neighbour.LAYER_DELTA_X);
                arrow._setVisited(true);
            }
        });

        // 坐标整体平移
        // 先得到最小的

        Layout.adjustCoordinate(graphModel);

        return graphModel;
    }

    static neighbourLayout2(graphModel) {
        // 设置全部元素没有访问
        const elementArray = graphModel.getElementArray();
        elementArray.forEach((ele) => {
            ele._setVisited(0);
            ele._setStartAngle(0);
            ele._setAdjusted(false);
        });

        // 得到最大出度的连接点/链头
        const findMaxDegreeElement = () => {
            let element = null;
            let max = -1;
            if (graphModel.getBodyArray()) {
                graphModel.getBodyArray().forEach((ele) => {
                    if (max < ele._getDegrees() && ele._getVisited() !== -1) {
                        element = ele;
                        max = ele._getDegrees();
                    }
                });
            }

            if (graphModel.getJointArray()) {
                graphModel.getJointArray().forEach((ele) => {
                    if (max < ele._getDegrees() && ele._getVisited() !== -1) {
                        element = ele;
                        max = ele._getDegrees();
                    }
                });
            }
            return { element, max };
        };

        // 判断是否所有连接点/链头都访问过
        const visitedAll = () => {
            if (graphModel.getBodyArray()) {
                for (const ele of graphModel.getBodyArray()) {
                    if (ele._getVisited() !== -1) {
                        return false;
                    }
                }
            }

            if (graphModel.getJointArray()) {
                for (const ele of graphModel.getJointArray()) {
                    if (ele._getVisited() !== -1) {
                        return false;
                    }
                }
            }
            return true;
        };

        // 遍历所有连通分量,一个连通分量一层,层按y坐标展开
        let layerStartX = Neighbour.LAYER_START_X; // 记录每一层的开始x坐标
        let layerStartY = Neighbour.LAYER_START_Y; // 记录每一层的开始y坐标
        while (!visitedAll()) {
            const queue = new PriorityQueue();
            const ret = findMaxDegreeElement();
            const element = ret.element;
            const max = ret.max;
            queue.enqueue(element, max);

            // 最后做整体平移
            element._setX(layerStartX);
            element._setY(layerStartY);
            // 顺时针为正方向
            element._setStartAngle(Neighbour.START_ANGLE);


            // 每次寻找周围拥有最大度的链体/连接点
            while (!queue.isEmpty()) {
                const ele = queue.dequeue();
                const clockPara = ele._getClockPara();
                const fatherStartAngle = ele._getStartAngle();
                const neighbours = ele._getNeighbours();

                const delta = !!neighbours && neighbours.length > 1 ?
                    180 / (neighbours.length - 1) : 180;

                ele._setVisited(-1);

                layerStartY = Math.max(layerStartY, ele._getY());


                for (let i = 0; i < neighbours.length; i++) {
                    const neighbour = neighbours[i];
                    if (neighbour._getVisited() !== -1) {
                        // 多次出现取几何中心
                        const angle = fatherStartAngle + (clockPara * delta * i);
                        neighbour._setStartAngle(
                            ((angle - 180) +
                            (neighbour._getVisited() * neighbour._getStartAngle()))
                            / (neighbour._getVisited() + 1),
                        );
                        neighbour._setX(
                            (ele._getX() +
                            (Math.cos(angle * Neighbour.K_RADIAN) * Neighbour.BODY2JOINT)
                            + (neighbour._getX() * neighbour._getVisited()))
                            / (neighbour._getVisited() + 1),
                        );

                        neighbour._setY(
                            (ele._getY() +
                            (Math.sin(angle * Neighbour.K_RADIAN) * Neighbour.BODY2JOINT)
                            + (neighbour._getY() * neighbour._getVisited()))
                            / (neighbour._getVisited() + 1),
                        );
                        neighbour._setVisited(neighbour._getVisited() + 1);

                        queue.enqueue(neighbour, neighbour._getDegrees());
                    }
                }
            }

            // 依旧冲突的坐标使用碰撞检测区分位置
            Layout.adjustCollision(graphModel);

            layerStartY += Neighbour.LAYER_DELTA_Y;
        }


        // 设置链头坐标，先设置有链体的，这里会重合
        graphModel.getBodyArray().forEach((body) => {
            const joints = body.getNeighbourJoint();
            // 对于有连接点的，在连接点和链头的中垂线上画图
            if (joints) {
                joints.forEach((joint) => {
                    const headers = body.getHeaderArray2Joint(joint);
                    const delta = 180 / (headers.length + 1);
                    let alpha = 0;
                    const distance = Math.sqrt(
                            ((body._getX() - joint._getX()) * (body._getX() - joint._getX()))
                            + ((body._getY() - joint._getY()) * (body._getY() - joint._getY()))) / 2;
                    if (body._getX() !== joint._getX()) {
                        const k = (body._getY() - joint._getY()) / (body._getX() - joint._getX());
                        alpha = 90 - ((Math.atan(k) * 180) / Math.PI);
                    } else {
                        alpha = 0;
                    }


                    for (let i = 0; i < headers.length; i++) {
                        const header = headers[i];
                        if (header._getVisited() !== -1) {
                            header._setX1(body._getX());
                            header._setY1(body._getY());

                            header._setX2(((body._getX() + joint._getX()) / 2)
                                + ((distance / Math.tan(delta * (i + 1) * Neighbour.K_RADIAN))
                                * Math.cos(alpha * Neighbour.K_RADIAN)));
                            header._setY2(((body._getY() + joint._getY()) / 2)
                                + ((distance / Math.tan(delta * (i + 1) * Neighbour.K_RADIAN))
                                * Math.sin(alpha * Neighbour.K_RADIAN)));

                            header._setVisited(-1);
                        }
                    }
                });
            }
            const headers = body.getHeaderArray();

            const delta = 180 / (headers.length + 1);

            for (let i = 0; i < headers.length; i++) {
                const header = headers[i];
                if (header._getVisited() !== -1) {
                    header._setX1(body._getX());
                    header._setY1(body._getY());
                    header._setX2(body._getX() +
                        (Math.cos((body._getStartAngle() + (delta * (i + 1)))
                            * Neighbour.K_RADIAN) * Neighbour.HEADER2BODY));
                    header._setY2(body._getY() +
                        (Math.sin((body._getStartAngle() + (delta * (i + 1)))
                            * Neighbour.K_RADIAN) * Neighbour.HEADER2BODY));
                    header._setVisited(-1);
                }
            }
        });


        // 没有链体但是有连接点的链头，顺着连接点分布。游离态的链头,游离态横向展开
        graphModel.getHeaderArray().forEach((header) => {
            if (header._getVisited() !== -1) {
                header._setVisited(-1);
                const joints = header._getNeighbourJoint();
                if (!joints && joints.length > 0) {
                    const joint = joints[0];
                    header._setX1(joint._getX() +
                        (Math.cos((joint._getStartAngle() - 180) * Neighbour.K_RADIAN)
                        * (Neighbour.HEADER2JOINT + Neighbour.HEADER2BODY)));
                    header._setY1(joint._getY() +
                        (Math.sin((joint._getStartAngle() - 180) * Neighbour.K_RADIAN)
                        * (Neighbour.HEADER2JOINT + Neighbour.HEADER2BODY)));
                    header._setX2(joint._getX() + (Math.cos((joint._getStartAngle() - 180)
                            * Neighbour.K_RADIAN) * Neighbour.HEADER2JOINT));
                    header._setY2(joint._getY() + (Math.sin((joint._getStartAngle() - 180)
                            * Neighbour.K_RADIAN) * Neighbour.HEADER2JOINT));
                } else {
                    header._setX1(layerStartX);
                    header._setY1(layerStartY);
                    header._setX2(layerStartX + Neighbour.HEADER2BODY);
                    header._setY2(layerStartY);
                    layerStartX += ((2 * Neighbour.HEADER2BODY) + Neighbour.LAYER_DELTA_X);
                }
            }
        });

        // 游离态箭头摆在下一层
        layerStartX = Neighbour.LAYER_START_X;
        layerStartY += (GraphVal.RECT_HEIGHT + Neighbour.LAYER_DELTA_Y);

        // 设置箭头坐标
        graphModel.getArrowArray().forEach((arrow) => {
            if (arrow._getVisited() !== -1) {
                arrow._setVisited(-1);
                if (!!arrow.getHeader() && !!arrow.getJoint()) {
                    arrow._setX1(arrow.getHeader()._getX2());
                    arrow._setY1(arrow.getHeader()._getY2());
                    arrow._setX2(arrow.getJoint()._getX());
                    arrow._setY2(arrow.getJoint()._getY());
                } else if (!!arrow.getHeader() && !arrow.getJoint()) {
                    arrow._setX1(arrow.getHeader()._getX2());
                    arrow._setY1(arrow.getHeader()._getY2());
                    arrow._setX2(arrow.getHeader()._getX2() + Neighbour.HEADER2JOINT);
                    arrow._setY2(arrow.getHeader()._getY2());
                } else if (!arrow.getHeader() && !!arrow.getJoint()) {
                    arrow._setX1(arrow.getJoint()._getX() +
                        (Math.cos(arrow.getJoint()._getStartAngle()
                            * Neighbour.K_RADIAN) * Neighbour.HEADER2JOINT));
                    arrow._setY1(arrow.getJoint()._getY() +
                        (Math.sin(arrow.getJoint()._getStartAngle()
                            * Neighbour.K_RADIAN) * Neighbour.HEADER2JOINT));
                    arrow._setX2(arrow.getJoint()._getX());
                    arrow._setY2(arrow.getJoint()._getY());
                } else {
                    arrow._setX1(layerStartX);
                    arrow._setY1(layerStartY);
                    arrow._setX2(layerStartX + Neighbour.HEADER2JOINT);
                    arrow._setY2(layerStartY);
                    layerStartX += ((2 * Neighbour.HEADER2JOINT) + Neighbour.LAYER_DELTA_X);
                }
            }
        });

        // 坐标整体平移
        // 先得到最小的

        Layout.adjustCoordinate(graphModel);

        Layout.adjustCollision(graphModel);

        Layout.adjustHeaderAndArrow(graphModel);

        return graphModel;
    }

    // 调整链体和连接点，避免碰撞
    static adjustCollision(graphModel) {
        const bodyArray = graphModel.getBodyArray();
        const jointArray = graphModel.getJointArray();
        const headerArray = graphModel.getHeaderArray();
        const map = {};
        const base = 10001;

        bodyArray.forEach((body) => {
            if (body._getVisited() === -1) {
                body._setX(Math.round(body._getX()));
                body._setY(Math.round(body._getY()));
                while (map[(body._getX() * base) + body._getY()]) {
                    body._setX(body._getX() + Neighbour.BODY2BODY);
                    body._setY(body._getY() + Neighbour.BODY2BODY);
                }
                map[(body._getX() * base) + body._getY()] = body.getId();
            }
        });
        jointArray.forEach((joint) => {
            if (joint._getVisited() === -1) {
                joint._setX(Math.round(joint._getX()));
                joint._setY(Math.round(joint._getY()));
                while (map[(joint._getX() * base) + joint._getY()]) {
                    joint._setX(joint._getX() + Neighbour.JOINT2JOINT);
                    joint._setY(joint._getY() + Neighbour.JOINT2JOINT);
                }
                map[(joint._getX() * base) + joint._getY()] = joint.getId();
            }
        });
        headerArray.forEach((header) => {
            if (header._getVisited() === -1) {
                header._setX2(Math.round(header._getX2()));
                header._setY2(Math.round(header._getY2()));
                while (map[(header._getX2() * base) + header._getY2()]) {
                    header._setX2(header._getX2() + Neighbour.HEADER2HEADER);
                    header._setY2(header._getY2() + Neighbour.HEADER2HEADER);
                }
                map[(header._getX2() * base) + header._getY2()] = header.getId();
            }
        });

        return graphModel;
    }

    // 按照层次调整
    static adjustCoordinate(graphModel) {
        {
            let minX = 99999999;
            let minY = 99999999;

            const elementArray = graphModel.getElementArray();

            elementArray.forEach((ele) => {
                if (ele._getVisited() === -1 && !ele._getAdjusted()) {
                    switch (ele.getType()) {
                        case ElementType.HEADER:
                        case ElementType.ARROW:
                            minX = Math.min(ele._getX1(), ele._getX2(), minX);
                            minY = Math.min(ele._getY1(), ele._getY2(), minY);
                            break;
                        case ElementType.BODY:
                        case ElementType.JOINT:
                            minX = Math.min(ele._getX(), minX);
                            minY = Math.min(ele._getY(), minY);
                            break;
                        default:
                            break;
                    }
                }
            });
            const deltaX = Neighbour.LAYER_START_X - minX;
            const deltaY = Neighbour.LAYER_START_Y - minY;

            elementArray.forEach((ele) => {
                if (ele._getVisited() === -1 && !ele._getAdjusted()) {
                    switch (ele.getType()) {
                        case ElementType.HEADER:
                        case ElementType.ARROW:
                            ele._setX1(ele._getX1() + deltaX);
                            ele._setX2(ele._getX2() + deltaX);
                            ele._setY1(ele._getY1() + deltaY);
                            ele._setY2(ele._getY2() + deltaY);
                            break;
                        case ElementType.BODY:
                        case ElementType.JOINT:
                            ele._setX(ele._getX() + deltaX);
                            ele._setY(ele._getY() + deltaY);
                            break;
                        default:
                            break;
                    }
                    ele._setAdjusted(true);
                }
            });
        }

        return graphModel;
    }

    static adjustHeaderAndArrow(graphModel) {
        graphModel.getElementArray().forEach((ele) => {
            if (ele._getVisited() === -1) {
                switch (ele.getType()) {
                    case ElementType.HEADER:
                    case ElementType.ARROW:
                        ele.adjustCoordinate();
                        break;
                    default:
                        break;
                }
            }
        });
    }

    static springLayout(graphModel) {
        // 1 graphModel -> nodes
        let nodes = Array.of();
        const links = Array.of();

        graphModel.getBodyArray().forEach((body) => {
            nodes.push({
                id: body.getId(),
                type: body.getType(),
                x: body._getX(),
                y: body._getY(),
            });
        });
        graphModel.getJointArray().forEach((joint) => {
            nodes.push({
                id: joint.getId(),
                type: joint.getType(),
                x: joint._getX(),
                y: joint._getY(),
            });
        });
        graphModel.getHeaderArray().forEach((header) => {
            nodes.push({
                id: header.getId(),
                type: header.getType(),
                x: header._getX2(),
                y: header._getY2(),
            });

            if (!header.getBody()) {
                nodes.push({
                    id: -header.getId(),
                    type: header.getType(),
                    x: header._getX1(),
                    y: header._getY1(),
                });
            }

            links.push({
                id: header.getId(),
                type: header.getType(),
                startId: header.getId(),
                endId: header.getBody() ? header.getBody().getId() : -header.getId(),
            });
        });
        graphModel.getArrowArray().forEach((arrow) => {
            if (!arrow.getHeader()) {
                nodes.push({
                    id: `${-arrow.getId()}header`,
                    type: arrow.getType(),
                    x: arrow._getX2(),
                    y: arrow._getY2(),
                });
            }

            if (!arrow.getJoint()) {
                nodes.push({
                    id: `${-arrow.getId()}joint`,
                    type: arrow.getType(),
                    x: arrow._getX1(),
                    y: arrow._getY1(),
                });
            }

            links.push({
                id: arrow.getId(),
                type: arrow.getType(),
                startId: arrow.getJoint() ? arrow.getJoint().getId() : (`${-arrow.getId()}joint`),
                endId: arrow.getHeader() ? arrow.getHeader().getId() : (`${-arrow.getId()}header`),
            });
        });

        // 4.反复2,3步 迭代300次
        for (let i = 0; i < 10; i++) {
            nodes = Layout.springIterate(nodes, links);
        }


        // 还原坐标
        nodes.forEach((node) => {
            const ele = graphModel.getElementById(node.type, node.id);
            if (!!ele && !$.isEmptyObject(ele)) {
                switch (ele.getType()) {
                    case ElementType.BODY:
                        ele._setX(node.x);
                        ele._setY(node.y);
                        break;
                    case ElementType.JOINT:
                        ele._setX(node.x);
                        ele._setY(node.y);
                        break;
                    case ElementType.HEADER:
                        ele._setX2(node.x);
                        ele._setY2(node.y);
                        break;
                    default:
                        break;
                }
            }
        });

        links.forEach((edge) => {
            const ele = graphModel.getElementById(edge.type, edge.id);
            if (ele) {
                const startNode = Layout.findNodeById(nodes, edge.startId);
                const endNode = Layout.findNodeById(nodes, edge.endId);
                switch (ele.getType()) {
                    case ElementType.HEADER:
                        ele._setX1(endNode.x);
                        ele._setY1(endNode.y);
                        break;
                    case ElementType.ARROW:
                        ele._setX1(startNode.x);
                        ele._setY1(startNode.y);
                        ele._setX2(endNode.x);
                        ele._setY2(endNode.y);
                        break;
                    default:
                        break;
                }
            }
        });

        Layout.adjustCoordinate(graphModel);

        return graphModel;
    }

    static findNodeById(nodes, id) {
        for (const node of nodes) {
            if (node.id === id) {
                return node;
            }
        }

        return null;
    }

    static springIterate(nodes, edges) {
        // 2计算每次迭代局部区域内两两节点间的斥力所产生的单位位移（一般为正值）
        const area = 800 * 600;
        const k = Math.sqrt(area / nodes.length);
        let diffx;
        let diffy;
        let diff;

        const dispx = {};
        const dispy = {};

        let ejectfactor = 2;

        for (const node of nodes) {
            dispx[node.id] = 0;
            dispy[node.id] = 0;

            for (const node2 of nodes) {
                if (node !== node2) {
                    diffx = node.x - node2.x;
                    diffy = node.y - node2.y;

                    diff = Math.sqrt((diffx * diffx) + (diffy * diffy));

                    if (diff < 30) {
                        ejectfactor = 5;
                    }

                    if (diff > 0 && diff < 250) {
                        const id = node.id;
                        dispx[id] += (((diffx / diff) * k * k) / diff) * ejectfactor;
                        dispy[id] += (((diffy / diff) * k * k) / diff) * ejectfactor;
                    }
                }
            }
        }
        // 3. 计算每次迭代每条边的引力对两端节点所产生的单位位移（一般为负值）
        const condensefactor = 1;
        let visnodeS = null;
        let visnodeE = null;

        for (const edge of edges) {
            const eStartID = edge.startId;
            const eEndID = edge.endId;


            visnodeS = Layout.findNodeById(nodes, eStartID);
            visnodeE = Layout.findNodeById(nodes, eEndID);

            diffx = visnodeS.x - visnodeE.y;
            diffy = visnodeS.x - visnodeE.y;
            diff = Math.sqrt((diffx * diffx) + (diffy * diffy));

            dispx[eStartID] -= ((diffx * diff) / k) * condensefactor;
            dispy[eStartID] -= ((diffy * diff) / k) * condensefactor;

            dispx[eEndID] += ((diffx * diff) / k) * condensefactor;
            dispy[eEndID] += ((diffy * diff) / k) * condensefactor;
        }

        // set x,y
        const maxt = 4;
        const maxty = 3;
        nodes.forEach((node) => {
            const dx = dispx[node.id];
            const dy = dispy[node.id];

            let disppx = Math.floor(dx);
            let disppy = Math.floor(dy);
            if (disppx < -maxt) {
                disppx = -maxt;
            }
            if (disppx > maxt) {
                disppx = maxt;
            }
            if (disppy < -maxty) {
                disppy = -maxty;
            }
            if (disppy > maxty) {
                disppy = maxty;
            }

            node.x += disppx;
            node.y += disppy;
        });

        return nodes;
    }

}
