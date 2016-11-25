var AWS = require('aws-sdk');
var co = require('co');
var moment = require('moment-timezone');
var fetch = require('node-fetch');
var path = require('path');

exports.handler = function(evt, ctx, cb) {
  co(function *() {
    var region = evt.Records[0].awsRegion;
    var srcBucket = evt.Records[0].s3.bucket.name;
    var dstBucket = srcBucket + '-archive';
    var srcKey = decodeURIComponent(evt.Records[0].s3.object.key.replace(/\+/g, ' '));
    var ext = path.extname(srcKey);
    var time = moment(evt.Records[0].eventTime).tz('Asia/Tokyo');
    var dstKey = time.format('YYYY-MM-DD') + '/' + time.unix().toString() + ext;

    var s3 = new AWS.S3({region: region});
    var obj = yield s3.getObject({Bucket: srcBucket, Key: srcKey}).promise();

    yield s3.putObject({
      Bucket: dstBucket,
      Key: dstKey,
      Body: obj.Body,
      ContentType: obj.ContentType
    }).promise();

    return yield fetch(process.env.SLACK_WEBHOOK_URL, {method: 'post', body: JSON.stringify({
      username: 'home-monitoring-bot',
      icon_emoji: ':camera:',
      text: 'https://s3-' + region + '.amazonaws.com/' + srcBucket + '/' + srcKey
    })});
  }).then(function() { cb(); })
    .catch(function(e) { cb(e); });
};
