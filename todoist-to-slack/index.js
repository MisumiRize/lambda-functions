const co = require('co')
const FormData = require('form-data')
const moment = require('moment')
const fetch = require('node-fetch')

const body = new FormData()
body.append('token', process.env.TODOIST_API_TOKEN)
body.append('sync_token', '*')
body.append('resource_types', '["items"]')

const today = moment()

co(function *() {
  const res = yield fetch('https://todoist.com/API/v7/sync', {method: 'post', body})
  const json = yield res.json()
  const items = json.items.filter(i => {
    return moment(i['due_date_utc'], 'ddd DD MMM YYYY HH:mm:ss ZZ').isSame(today, 'day')
  })

  if (items.length == 0) {
    return
  }

  yield fetch(process.env.SLACK_WEBHOOK_URL, {method: 'post', body: JSON.stringify({
    username: 'todoist-bot',
    icon_emoji: ':todoist:',
    attachments: [
      {
        title: 'Todoist',
        title_link: 'https://ja.todoist.com/',
        pretext: `There are ${items.length} unfinished item(s) today`,
        text: items.map(i => `* ${i.content}`).join('\n')
      }
    ]
  })})
}).then(() => console.log('ok'))
  .catch(e => console.error(e))