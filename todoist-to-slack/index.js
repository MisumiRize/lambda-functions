var co = require('co');
var FormData = require('form-data');
var moment = require('moment-timezone');
var fetch = require('node-fetch');

var form = new FormData();
form.append('token', process.env.TODOIST_API_TOKEN);
form.append('sync_token', '*');
form.append('resource_types', '["items"]');

var today = moment().tz('Asia/Tokyo');

exports.handler = function(event, context, callback) {
  co(function *() {
    var res = yield fetch('https://todoist.com/API/v7/sync', {method: 'post', body: form});
    var json = yield res.json();
    var items = json.items.filter(function(i) {
      return moment(i.due_date_utc, 'ddd DD MMM YYYY HH:mm:ss ZZ').isSame(today, 'day');
    });
  
    if (items.length === 0) {
      callback();
    }
  
    yield fetch(process.env.SLACK_WEBHOOK_URL, {method: 'post', body: JSON.stringify({
      username: 'todoist-bot',
      icon_emoji: ':todoist:',
      attachments: [
        {
          title: 'Todoist',
          title_link: 'https://ja.todoist.com/',
          pretext: 'There are ' + items.length + ' unfinished item(s) today',
          text: items.map(function(i) { return '*' + i.content; }).join('\n')
        }
      ]
    })});
  }).then(function() { callback(); })
    .catch(function(e) { callback(e); });
};
