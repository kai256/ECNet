import * as d3 from 'd3';
import LogicPainter from './LogicPainter';

export class NodeDrag {

    dragStart(controller, node) {
        this.x_start = d3.event.x;
        this.y_start = d3.event.y;
        this.oriChildPaths = Array.of();
        const path = d3.select(`#path-${node.id}`);
        if (node.parent) {
            if (controller.isStraight) {
                this.oriPath = {
                    x: parseFloat(path.attr('d').replace(/[ML]/g, '').replace(/ /, ',').split(',')[0]),
                    y: parseFloat(path.attr('d').replace(/[ML]/g, '').replace(/ /, ',').split(',')[1]),
                    parentX: parseFloat(path.attr('d').replace(/[ML]/g, '').replace(/ /, ',').split(',')[2]),
                    parentY: parseFloat(path.attr('d').replace(/[ML]/g, '').replace(/ /, ',').split(',')[3]),
                };
            } else {
                this.oriPath = {
                    x: parseFloat(path.attr('d').replace(/[MC]/g, '').replace(/ /g, ',').split(',')[0]),
                    y: parseFloat(path.attr('d').replace(/[MC]/g, '').replace(/ /g, ',').split(',')[2]),
                    parentX: parseFloat(path.attr('d').replace(/[MC]/g, '').replace(/ /g, ',').split(',')[5]),
                    parentY: parseFloat(path.attr('d').replace(/[MC]/g, '').replace(/ /g, ',').split(',')[6]),
                };
            }
        }
        if (node.children) {
            for (const childNode of node.children) {
                const childPath = d3.select(`#path-${childNode.id}`);
                if (controller.isStraight) {
                    this.oriChildPaths.push({
                        x: parseFloat(childPath.attr('d').replace(/[ML]/g, '').replace(/ /, ',').split(',')[0]),
                        y: parseFloat(childPath.attr('d').replace(/[ML]/g, '').replace(/ /, ',').split(',')[1]),
                        parentX: parseFloat(childPath.attr('d').replace(/[ML]/g, '').replace(/ /, ',').split(',')[2]),
                        parentY: parseFloat(childPath.attr('d').replace(/[ML]/g, '').replace(/ /, ',').split(',')[3]),
                    });
                } else {
                    this.oriChildPaths.push({
                        x: parseFloat(childPath.attr('d').replace(/[MC]/g, '').replace(/ /g, ',').split(',')[0]),
                        y: parseFloat(childPath.attr('d').replace(/[MC]/g, '').replace(/ /g, ',').split(',')[2]),
                        parentX: parseFloat(childPath.attr('d').replace(/[MC]/g, '').replace(/ /g, ',').split(',')[5]),
                        parentY: parseFloat(childPath.attr('d').replace(/[MC]/g, '').replace(/ /g, ',').split(',')[6]),
                    });
                }
            }
        }
        showDetail(node,controller);
    }

    drag(controller, node) {
        this.x_change = d3.event.x - this.x_start;
        this.y_change = d3.event.y - this.y_start;
        LogicPainter.moveNode(controller, node,
            this.x_change, this.y_change, this.oriPath, this.oriChildPaths);
    }

    dragEnd(controller, node) {
        this.x_change = d3.event.x - this.x_start;
        this.y_change = d3.event.y - this.y_start;
        LogicPainter.moveNode(controller, node,
            this.x_change, this.y_change, this.oriPath, this.oriChildPaths);
        node.x += this.y_change;
        node.y += this.x_change;
    }
}

export const showDetail = (node, controller) => {
    controller.selectedId && LogicPainter.renderSelectedNode(controller.selectedId, false);
    controller.selectedId = node.id;
    LogicPainter.renderSelectedNode(controller.selectedId, true);
    LogicPainter.showInfoPanel(controller.graphModel, node);
};
