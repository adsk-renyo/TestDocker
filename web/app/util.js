
var getClassName = function (obj) {
    if (obj === null || obj === undefined)
        return 'undefined';
    var constr = obj.constructor.toString();
    var funcStr = 'function ';
    var funcPos = constr.indexOf(funcStr);
    var postFuncPos = funcPos + funcStr.length;
    var n = constr.indexOf('(');
    if (funcPos < 0 || n <= postFuncPos)
        return 'undefined';
    return constr.substring(postFuncPos, n);
}

var generateUUID = function () {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};

module.exports = {
    getClassName:   getClassName,
    generateUUID:   generateUUID
}
