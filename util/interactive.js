var Nightmare = require('nightmare');
var parseRule = require('./parse');

// 下面两个config可以不设置，可以取得更好的效率
let nightmare = new Nightmare({
    show: true, 
    openDevTools: {
        mode: 'detach'
    },
});

/**
 * 抓取知乎话题广场的小图标
 * @param {string} topic - 话题对象
 */
const iSubTopic = function (topic, delay) {
    delay = delay || 1000;
    return nightmare // nightware 最终将返回一个Promise使得tasks可以继续
        .goto(`https://www.zhihu.com/topics#${topic.value}`)
        .wait('.zh-general-list')
        .click('.zu-button-more')
        .wait(delay)
        .evaluate(function (resolve, lib) {
            return document.querySelector('.zh-general-list').innerHTML;
        })
        .then(val => {
            return parseRule.extractTopics(val, topic.id);
        })
        .catch(err => {
            console.error(err);
        })
}

/**
 * 抓取对应话题的热点问题
 * @param {string} topic - 话题对象
 */
const iTopicDesc = function (topic) {
    const url = `https://www.zhihu.com/topic/${topic.id}/hot`
    return nightmare
        .goto(url)
        .wait('.feed-content')
        .evaluate(function () {
            return document.querySelector('.zu-main').innerHTML;
        })
        .then(html => {
            return parseRule.crawlerTopicsDetail(html, topic);
        })
        .catch(error => {
            console.error(`topic is ${topic.id} and error is ${error}`);
        })
}

/**
 * 
 * @param {爬取的起点} rootUrl 
 * @param {爬取的深度} deep 
 */
const iAllTopics = async function (rootUrl, deep) {
    /*
        抓取方式BFS
        该函数不允许爬取当前节点的信息，抓取当前节点的子节点信息
        所以当前节点不算深度，从第一个子节点才是深度
    */
    let rootId = rootUrl.match(/(\d+)/)[0];
    let topics = [];
    let queue = [];
    let fails = [];
    let cntLayer = 1;
    let allLayer = 0;
    let rootObj = {
        'value': 'rootValue',
        'id': rootId,
        'fatherId': '-1'
    };
    queue.push(rootObj);
    // add the father topic directly didn't with any child node;
    // relationship like this [fatherId, childId]
    while (deep >= 0 && queue.length !== 0) {
        let cntObj = queue.shift();
        let url = `https://www.zhihu.com/topic/${cntObj['id']}/hot`
        let topicOriginalInfo = await nightmare
            .goto(url)
            .wait('.zu-main-sidebar')
            .evaluate(function () {
                return document.querySelector('.zu-main-sidebar').innerHTML;
            })
            .then(parseRule.crawlerTopics)
        cntObj['desc'] = topicOriginalInfo['desc'];
        let childTopics = topicOriginalInfo['childTopics'];
        topics.push(cntObj);
        if (childTopics) {
            allLayer += childTopics.length;
            cntObj['cids'] = topicOriginalInfo['childTopics'].map(elm => elm['id'], this); // 只添加子节点的id
        }

        if (deep > 0 && childTopics) {
            let failedTimes = 0;
            for (let i = 0; i < childTopics.length;) {
                // 如果出现超时的错误，刷新当前页面继续抓取
                if (failedTimes >= 2) {
                    fails.push(childTopics[i]);
                    continue;
                }
                try {
                    let hoverElement = `a.zm-item-tag[href$='${childTopics[i]['id']}']`;
                    let waitElement = `.avatar-link[href$='${childTopics[i]['id']}']`;
                    let topicAttached = await nightmare
                        .mouseover(hoverElement)
                        .wait(waitElement)
                        .evaluate(function () {
                            return document.querySelector('.zh-profile-card').innerHTML;
                        })
                        .then(val => {
                            return parseRule.crawlerTopicNumbericalAttr(val);
                        })
                        .catch(error => {
                            console.error(error);
                        });
                    Object.assign(childTopics[i], topicAttached);
                    childTopics[i]['fid'] = cntObj['id'];
                    queue.push(childTopics[i]);
                    i += 1;
                    failedTimes = 0;
                } catch (e) {
                    // 处理timeout
                    await nightmare
                        .refresh(url);
                    failedTimes += 1;
                }

            }
        }
        if (--cntLayer === 0) {
            deep -= 1;
            cntLayer = allLayer;
            allLayer = 0;
        }
    }
    queue = []; // 当离开时，剩下大量的子节点，清空下
    return new Promise((resolve, reject) => {
        resolve({
            topics: topics,
            fails: fails
        });
    });
}

const close = function () {
    nightmare
        .end()
        .then(_ => {
            console.log('end up the tasks');
        })
}
module.exports.iAllTopics = iAllTopics;
module.exports.iSubTopic = iSubTopic;
module.exports.iTopicDesc = iTopicDesc;
module.exports.close = close;
