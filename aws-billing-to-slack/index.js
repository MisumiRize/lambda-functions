var AWS = require('aws-sdk');
var co = require('co');
var fetch = require('node-fetch');
var moment = require('moment-timezone');

var cloudWatch = new AWS.CloudWatch({region: 'us-east-1'});
var yesterday = moment().tz('Asia/Tokyo').subtract(1, 'days');

exports.handler = function(evt, ctx, cb) {
  co(function *() {
    var res = yield cloudWatch.getMetricStatistics({
      Dimensions: [
        {
          Name: 'Currency',
          Value: 'USD'
        }
      ],
      EndTime: yesterday.endOf('day').unix(),
      MetricName: 'EstimatedCharges',
      Namespace: 'AWS/Billing',
      Period: 86400,
      StartTime: yesterday.startOf('day').unix(),
      Statistics: ['Sum']
    }).promise();

    if (res.Datapoints.length === 0) {
      return;
    }

    yield fetch(process.env.SLACK_WEBHOOK_URL, {method: 'post', body: JSON.stringify({
      username: 'aws-billing-bot',
      icon_emoji: ':aws:',
      text: '昨日までの AWS の利用料\n```EstimatedCharges: '
        + res.Datapoints[0].Sum + ' USD```'
    })});
  }).then(function() { cb(); })
    .catch(function(e) { cb(e); });
};
