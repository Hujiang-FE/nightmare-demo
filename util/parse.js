let cheerio = require('cheerio');

/**
 * 获得话题广场下的topc包含特有的小图标
 * @param {string} html - 待解析的html
 * @param {string} tid - topic的id
 */
function extractTopics(html, tid) {
    topics = [];
    let $ = cheerio.load(html);
    $('.blk a[target]').each((index, elm) => {
        topic = {}
        let id = elm.attribs['href'].split('/')[2];
        const length = elm.children.length;
        let $img = $(elm).find('img')
        topic['avatar'] = $img.attr('src');
        topic['value'] = $img.attr('alt');
        topic['id'] = id;
        topic['tid'] = tid;
        if (Object.keys(topic).length !== 0) {
            topics.push(topic);
        }
    });
    return topics;
}

/**
 *  获得话题的详细信息
 * @param {string} html - 待解析的html
 * @param {object} topic - 话题对象
 */
function crawlerTopicsDetail(html, topic) {
    let $ = cheerio.load(html);
    // 解析关注人数
    topic['focusNum'] = $('.zm-topic-side-followers-info strong').text();
    // 解析主题的关注
    topic['desc'] = $('div.zm-editable-content').text();
    //父子话题解析
    topic['fatherTopics'] = crawlerAttachTopic($('.parent-topic'));
    topic['childTopics'] = crawlerAttachTopic($('.child-topic'));
    // 解析动态
    topic['dynamics'] = crawlerDynamic($);
    return topic;
}
/**
* 获得最近的动态
* @param {string} html - 待解析的html
* 抓取知乎的动态，包含
* {
*     question,
*     questionId,
*     answer: {
*         author,
*         id,
*         commentNum,
*         voteNum,
*         value,
*         publicDate,
*     },
*     answer
* }
*/
const crawlerDynamic = function ($) {
    let dynamics = [];
    $('.feed-content').each((index, elm) => {
        let dynamic = {};
        let answer = {};
        let self = $(elm);
        dynamic['question'] = self.find('h2').text().trim();
        dynamic['questionId'] = self.find('.question_link').attr('href').split('/')[2];
        answer['author'] = {
            username: self.find('.author-link').text().trim(),
            brief_desc: self.find('.summary-wrapper .bio').text().trim() || '',
            id: self.find('.author-link').attr('href').split('/')[2],
        }
        answer['id'] = self.find('[data-entry-url]').attr('data-entry-url').split('/')[5];
        answer['commentNum'] = self.find('.toggle-comment').text().trim().split(' ')[0];
        answer['voteNum'] = self.find('.zm-item-vote-count').text().trim();
        answer['value'] = self.find('.content').text().trim();
        let publicDate = self.find('.answer-date-link').attr('data-tooltip');
        answer['publishDate'] = publicDate === undefined ? '' : publicDate.split(' ')[1]
        dynamic['answer'] = answer;
        dynamics.push(dynamic);
    });
    return dynamics;
}



/**
 * 获得子话题的top/follower/question数量
 * @param {string} html - 待解析的html
 */
const crawlerTopicNumbericalAttr = function (html) {
    let $ = cheerio.load(html);
    let keys = ['questions', 'top-answers', 'followers'];
    let obj = {};
    obj['avatar'] = $('.Avatar.Avatar--xs').attr('src');
    keys.forEach(key => {
        obj[key] = ($(`div.meta a.item[href$=${key}] .value`).text() || '').trim();
    })
    return obj;
}

/**
 * 抓取话题的信息
 * @param {string} html - 子话题的top/follower/question数量
 */
const crawlerTopics = function (html) {
    let $ = cheerio.load(html);
    // topic description
    let obj = {};
    obj['desc'] = $('div.zm-editable-content').text() || '';
    //child topic mine
    let childTopics = crawlerAttachTopic($, '.child-topic');
    if (childTopics.length > 0) {
        obj['childTopics'] = childTopics;
    }
    return obj;
}

/**
 * 抓取子话题的id/value字段
 * @param {cheerio} $ - cheerio对象
 * @param {string} selector - 选择器
 */
const crawlerAttachTopic = function ($, selector) {
    let topicsSet = [];
    $(selector).find('.zm-item-tag').each((index, elm) => {
        let self = $(elm);
        let topic = {};
        topic['id'] = self.attr('data-token');
        topic['value'] = self.text().trim();
        topicsSet.push(topic);
    });
    return topicsSet;
}

module.exports.crawlerTopicNumbericalAttr = crawlerTopicNumbericalAttr;
module.exports.crawlerTopics = crawlerTopics;
module.exports.crawlerTopicsDetail = crawlerTopicsDetail;
module.exports.extractTopics = extractTopics;
