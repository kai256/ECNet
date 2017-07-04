/**
 * Created by aswasn on 2017/3/18.
 */

import $ from '../assets/jquery-vendor';
import { LogicValidate, LogicTextLimit, LogicNodeType } from '../assets/constants';

export default class LogicValidator {

    static validateAddModal() {
        let result = LogicValidate.OK;
        const topic = $('#node-add-topic-input').val();
        const detail = $('#node-add-detail-input').val();
        result = LogicValidator._validateTopic(result, topic);
        result = LogicValidator._validateDetail(result, detail);
        return result;
    }

    static validatePanelSave(graphModel) {
        let result = LogicValidate.OK;
        const id = $('#panel-id-input').val();
        const topic = $('#panel-topic-input').val();
        const detail = $('#panel-detail-input').val();
        const type = $('#panel-type-select').val();

        result = LogicValidator._validateTopic(result, topic);
        result = LogicValidator._validateDetail(result, detail);
        result = LogicValidator._validateType(result, type, id, graphModel);

        return result;
    }

    static validateEditModal(graphModel) {
        let result = LogicValidate.OK;
        const id = $('#node-edit-id-input').val();
        const topic = $('#node-edit-topic-input').val();
        const detail = $('#node-edit-detail-input').val();
        const type = $('#node-edit-type-select').val();

        result = LogicValidator._validateTopic(result, topic);
        result = LogicValidator._validateDetail(result, detail);
        result = LogicValidator._validateType(result, type, id, graphModel);

        return result;
    }

    static _validateTopic(baseCode, topic) {
        if (!topic || topic.length === 0) {
            return (baseCode + LogicValidate.TOPIC_EMPTY);
        } else if (topic.length > LogicTextLimit.TOPIC) {
            return (baseCode + LogicValidate.TOPIC_TOO_LONG);
        }
        return baseCode;
    }

    static _validateDetail(baseCode, detail) {
        if (!detail || detail.length === 0) {
            return (baseCode + LogicValidate.DETAIL_EMPTY);
        } else if (detail.length > LogicTextLimit.DETAIL) {
            return (baseCode + LogicValidate.DETAIL_TOO_LONG);
        }
        return baseCode;
    }

    static _validateType(baseCode, typeSelected, id, graphModel) {
        const node = graphModel.findNodeById(id);
        if (node
            && node.type !== LogicNodeType.FINAL_CONCLUSION
            && typeSelected === LogicNodeType.FINAL_CONCLUSION) {
            return (baseCode + LogicValidate.DUPLICATE_ROOT);
        }
        return baseCode;
    }

    // 生成提示语句
    static generateHint(checkCode) {
        let hint = '';
        if ((checkCode & LogicValidate.TOPIC_EMPTY) !== 0) {
            hint += '请填写摘要。';
        }
        if ((checkCode & LogicValidate.TOPIC_TOO_LONG) !== 0) {
            hint += '摘要太长。';
        }
        if ((checkCode & LogicValidate.DETAIL_EMPTY) !== 0) {
            hint += '请填写详情。';
        }
        if ((checkCode & LogicValidate.DETAIL_TOO_LONG) !== 0) {
            hint += '详情太长。';
        }
        if ((checkCode & LogicValidate.DUPLICATE_ROOT) !== 0) {
            hint += '只能有一个最终结论。';
        }

        return hint;
    }
}
