const express = require('express')
const fs = require('fs')
const app = express()
const AWS = require('aws-sdk')
AWS.config.update({ region: 'eu-central-1' })
const dynamoDb = new AWS.DynamoDB.DocumentClient()
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')
const { serverIp, id } = require('./config.json')

app.get('/:anything', (request, response) => {
  response.send('')
})

app.get('/player/:playerName/asset/:assetName', (request, response) => {
  const { playerName, assetName } = request.params
  if (assetName.includes('.map')) {
    return response.send('')
  }
  fs.createReadStream('player/' + playerName + '/' + assetName).pipe(response)
})

app.get('/player/:playerName', (request, response) => {
  const { playerName } = request.params
  fs.createReadStream('player/' + playerName + '/index.html').pipe(response)
})

app.get('/dataset/:title/:fileName', (request, response) => {
  const { title, fileName } = request.params
  const { playerABR } = request.query
  const BASEURL = 'http://' + serverIp + '/'

  log(playerABR, 'requesting', title, fileName, '')

  axios({
    method: 'get',
    url: BASEURL + title + '/' + fileName + '?playerABR=' + playerABR,
    headers: request.headers
  }).then((serverResponse) => {
    const manifest = serverResponse.data.replace(/queryString/g, 'playerABR=' + playerABR)
    log(playerABR, 'received', title, fileName, manifest)
    response.send(manifest)
  }).catch(console.error)
})

app.get('/dataset/:title/:filePath/:fileName', (request, response) => {
  const { title, filePath, fileName } = request.params
  const { playerABR } = request.query
  const BASEURL = 'http://' + serverIp + '/'

  log(playerABR, 'requesting', title, filePath + '/' + fileName, '')

  axios({
    method: 'get',
    url: BASEURL + title + '/' + filePath + '/' + fileName + '?playerABR=' + playerABR,
    responseType: 'stream',
    headers: request.headers
  }).then((serverResponse) => {
    serverResponse.data.pipe(response)
  }).catch(console.error)
})

app.get('/log/:title/:eventName', (request, response) => {
  const { title, eventName } = request.params
  const { playerABR } = request.query

  log(playerABR, 'event', title, eventName, '')

  response.send('ok')
})

app.listen(80, () => {
  console.log('Listening on port 80')
})

const log = (playerABR, action, title, name, content) => {
  const item = {
    id: uuidv4(),
    experimentId: id,
    time: (new Date()).toISOString(),
    playerABR,
    action,
    title,
    name
  }

  if (content && content !== '') {
    item.content = content
  }

  logItem(item)
}

const logItem = item => {
  dynamoDb.put({
    TableName: 'ppt-logs',
    Item: item
  }, function (error, data) {
    if (error) {
      console.log(error)
      setTimeout(() => {
        logItem(item)
      }, 500)
    }
  })
}
