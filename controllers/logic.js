// index:
const logicDao = require('../dao/logicDao');
const logicNodeDao = require('../dao/logicNodeDao');
const trans = require("../models/dbutil");

let createLogic = async(ctx, next) => {
    let model = ctx.request.body;

    let id = model.id;
    if(!!id){
        let logic = await logicDao.findECMById(Number(id));
        if(!!logic){
            ctx.throw(400, '已经存在的id,请调用update接口');
        }
    }

    // trans函数结果使用await获得
    let res = await trans(async() => {
        let logic = await logicDao.createLogic(model.title,model.caseReason,model.caseNumber);
        id=logic.dataValues.id;
        let filter = function (arr) {
            arr.forEach(n => {
                n.logicID = id;
                n.relativeID = n.id || -1;
                if(!n.leadTo){
                    n.leadTo = 0;
                }
                delete n["id"];
            });
            return arr;
        };
        let nodes = filter(model.data);
        await logicNodeDao.bulkCreateNode(nodes);
    });

    ctx.response.type='text/plain';
    ctx.response.body = `success`;

};

let updateLogic = async(ctx, next) => {
    let model = ctx.request.body;
    if (!model) {
        ctx.throw(400, 'miss parameter LogicModel');
    }
    let id = model.id;
    if (!id) {
        ctx.throw(400, 'miss parameter id');
    }
    let logic = await logicDao.findLogicById(Number(id));
    let res = await trans(async() => {
        await logicDao.updateLogic(logic, model.title,model.caseReason,model.caseNumber);
        await logicNodeDao.bulkUpdateNode(id, model.data);
    });
    ctx.response.body='success';
    ctx.response.type='text/plain';
};

let findLogicDetail = async(ctx, next) => {
    let id = ctx.params.logicID;
    if(!id){
        ctx.throw(400, 'miss logicID');
    }
    let logicNodes=await logicNodeDao.findByLogicId(id);
    logicNodes.forEach((node) => {
        if(node.leadTo === 0){
            node.leadTo = null;
        }
        node.id = node.relativeID;
    });
    ctx.response.body = logicNodes||{};
    ctx.response.type = 'application/json';
};

module.exports = {
    'GET /logic.html': async (ctx, next) => {
        ctx.render('logic.html', {});
    },
    'POST /saveLogic': createLogic,
    'POST /updateLogic': updateLogic,
    'GET /findLogicDetail/:logicID': findLogicDetail
};