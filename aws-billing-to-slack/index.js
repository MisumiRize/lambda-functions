var AWS = require('aws-sdk');
var co = require('co');
var fetch = require('node-fetch');
var moment = require('moment-timezone');
var rollbar = require('rollbar');

rollbar.init(process.env.ROLLBAR_TOKEN_LAMBDA_FUNCTIONS);

var cloudWatch = new AWS.CloudWatch({region: 'us-east-1'});
var kms = new AWS.KMS({region: process.env.AWS_REGION});
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
      Statistics: ['Maximum']
    }).promise();

    if (res.Datapoints.length === 0) {
      return;
    }

    var webhookUrl = yield kms.decrypt({
      CiphertextBlob: new Buffer(process.env.SLACK_WEBHOOK_URL_CHANNEL_FINANCE, 'base64')
    }).promise();

    return yield fetch(webhookUrl.Plaintext.toString(), {method: 'post', body: JSON.stringify({
      username: 'aws-billing-bot',
      icon_emoji: ':aws:',
      text: '昨日までの AWS の利用料\n```EstimatedCharges: '
        + res.Datapoints[0].Maximum + ' USD```'
    })});
  }).then(function() { cb(); })
    .catch(function(e) {
      rollbar.handleError(e, null, function() { cb(e); });
    });
};
