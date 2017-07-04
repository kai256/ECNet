/**
 * Created by apple on 2017/4/13.
 */
const logicNode = require('../models/logicNode');

exports.bulkCreateNode = async(nodes) => {
    return logicNode.bulkCreate(nodes);
};

exports.bulkUpdateNode = async(logicID,nodes) => {
    let records = await logicNode.findAll({
        'where': {
            'logicID': logicID
        }
    });
    let map={};
    let idList = Array.of();
    records.forEach((record) => {
       map[record.relativeID] = record;
    });
    nodes.forEach((node) => {
        let record = map[node.relativeID];
        Object.assign(record,node);
        record.save();
        idList.push(record.id);
    });
    // destroy
    let where = {
        'logicID': {
            '$eq': logicID,
        }
    };
    if (!!idList && !!idList.length) {
        where['relativeID'] = {'$notIn': idList};
    }
    logicNode.destroy({
        'where': where
    });
};

exports.findByLogicId = async(logicID) =>{
    return await logicNode.findAll({
        'where': {
            'logicID': logicID
        },
        'order': 'relativeID asc'
    });
};