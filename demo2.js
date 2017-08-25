let fs = require('fs');
let _ = require('lodash');
let util = require('./util/io');
let interactive = require('./util/interactive');

function crawlerMaintopics (toFile) {
    toFile = toFile || './mainTypes.json';
    let nightmare = new Nightmare();
    interactive
        .iMainTopic(url)
        .then(value => {
            util.writeJSONToFile(value, toFile, _ => {
                console.log('finish crawler mainTopics');
            })
        })
}

async function crawlerTopics (toFile) {
    let mainTopics = require('./mainTopics.json').mainTopics;
    toFile = toFile || './topics.json';
    let topics = [];
    let delay = 800;

    for (let i = 0; i < mainTopics.length; i += 1) {
        topics.push(await interactive.iSubTopic(mainTopics[i], delay));
    }

    topics = _.flatten(topics);
    topics = {
        topics: topics,
    };
    util.writeJSONToFile(topics, toFile, _ => {
        console.log('finish crawler topics');
    });
}


async function crawlerTopicsDetail (sourceFile, toFile) {
    sourceFile = sourceFile || './topics.json';
    toFile = toFile || './topicsDetail.json';
    let sourceData = require(sourceFile);
    let topics = sourceData.topics;

    for (let i = 0; i < topics.length; i += 1) {
        try {
            await interactive.iTopicDesc(topics[i]);
        } catch (error) {
            console.log(topics['id'], 'exists problem');
        }
    }
    interactive.close();
    util.writeJSONToFile(sourceData, toFile, _ => {
        console.log('finished crawler topics detail');
    });

}

/**
 * 
 * @param {string} rootUrl - 顶层的url
 * @param {int} deep - 抓取页面的深度
 * @param {string} toFile - 保存的深度
 * @param {Function} cb 
 */
async function crawlerTopicsFromRoot (rootUrl, deep, toFile, cb) {
    rootUrl = rootUrl ||'https://www.zhihu.com/topic/19776749/hot'
    toFile = toFile || './topicsTree.json'
    console.time();
    let result = await interactive
        .iAllTopics(rootUrl, deep);
    console.timeEnd();
    util.writeJSONToFile(result['topics'], toFile, cb);
}

crawlerTopicsFromRoot('', 2, '', _ => {
    console.log('完成抓取');
})
