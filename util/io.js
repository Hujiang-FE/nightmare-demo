let fs = require('fs');

const writeJSONToFile = function (data, to, cb) {
    let ws = fs.createWriteStream(to);
    ws.write(JSON.stringify(data));
    ws.on('finish', cb);
}

const writeToFile = function (data, to, cb) {
    let ws = fs.createWriteStream(to);
    ws.write(data);
    ws.on('finish', cb);
}

const mixUpJSONFile = function (toFile, ...files) {
    const obj = {};
    for (let i = 0; i < files.length; i += 1) {
        Object.assign(obj, require(files[i]));
    }
    fs.createWriteStream(toFile)
        .write(JSON.stringify(obj));
}
const parseArrayToJSON = function (sourceFile, key) {
    let str = fs.readFileSync(sourceFile);
    let arr = JSON.parse(str);
    let obj = {};
    obj[key] = arr;
    return obj;
}

module.exports.parseArrayToJSON = parseArrayToJSON;
module.exports.mixUpJSONFile = mixUpJSONFile;
module.exports.writeToFile = writeToFile;
module.exports.writeJSONToFile = writeJSONToFile;