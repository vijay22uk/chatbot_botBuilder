
var data = require('../data');
const getPumps = (pumpId)=>{
    return data.pumps.find((x=>x.title.indexOf(pumpId)!==-1));
}
module.exports = {
    getPumps
};