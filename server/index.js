const express = require('express')
const fs = require('fs')
const app = express()
const kmeans = require('./kMeansClustering')

var idx = 0
var MaxManifestID = 16

app.use((request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*')
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/ping', (request, response) => {
  console.log('Pinged!')
  response.send('pong')
})

app.get('/:title/:fileName', (request, response) => {
  const { title, fileName } = request.params
  const clientID = request.query.playerABR.split('-').pop()

  const CMCDParams = {}
  if (request.headers['cmcd-object']) {
    request.headers['cmcd-object'].split(',').forEach(CMCDParam => {
      CMCDParams[CMCDParam.split('=')[0]] = CMCDParam.split('=')[1]
    })
  }

  if (CMCDParams.dt && CMCDParams.sw && CMCDParams.tb) {
    const finalMaxBitrate = getMaxBitrateInMPDMultipleClient(CMCDParams.dt, CMCDParams.sw, CMCDParams.tb, clientID)
    console.log('Serving', title, 'manifest_' + finalMaxBitrate + '.mpd')
    fs.createReadStream('manifests/stc/manifest_' + finalMaxBitrate + '.mpd').pipe(response)
  } else if (CMCDParams.dt){
    var dt = getDeviceType(CMCDParams.dt)
    responseFile = 'manifests/' + title + '/' + 'manifest_' + dt + '_' + Math.min(idx, MaxManifestID) + '.mpd'
    console.log('Serving', title, responseFile)
    fs.createReadStream(responseFile).pipe(response)
  } else {
    console.log('Serving', title, fileName)
    // fs.createReadStream('dataset/' + title + '/' + fileName).pipe(response)
    fs.createReadStream('manifests/' + title + '/' + fileName).pipe(response)
  }
})

app.get('/:title/:filePath/:fileName', (request, response) => {
  const { title, filePath, fileName } = request.params
  idx = getCorrespondingMPDIndex(fileName)
  console.log('Serving', title, filePath, fileName)
  fs.createReadStream('dataset/' + title + '/' + filePath + '/' + fileName).pipe(response)
})

app.listen(80, () => {
  console.log('Listening on port 80')
})

const availableBitrates = [
  '100000',
  '200000',
  '375000',
  '550000',
  '750000',
  '1000000',
  '1500000',
  '3000000',
  '5800000',
  '7500000',
  '12000000',
  '17000000',
]

const resolutionWidth = [
  '256',
  '320',
  '384',
  '512',
  '640',
  '768',
  '1024',
  '1280',
  '1920',
  '2560',
  '3840',
  '3840'
]

const clientData = {}

const getMaxBitrateInMPDSignleClient = (deviceType, screenWidth, topBitrate) => {
  let maxWidthForDevice = 0
  switch (deviceType) {
    case 't':	// tv
      maxWidthForDevice = 3840 // 4k
      break
    case 'd':	// desktop
      maxWidthForDevice = 1920 // 1080p
      break
    case 'm':	// mobile
      maxWidthForDevice = 1024 // 720p
      break
    default:
      maxWidthForDevice = 3840
      break
  }

  maxWidthForDevice = Math.min(maxWidthForDevice, screenWidth)

  let maxBitrateInMPD = availableBitrates[0]

  for (let i = availableBitrates.length - 1; i >= 0; i--) {
    let bitrate = availableBitrates[i]
    let width = resolutionWidth[i]

    if (bitrate <= (topBitrate * 1000) && width <= maxWidthForDevice) {
      maxBitrateInMPD = bitrate
      break
    }
  }

  return maxBitrateInMPD
}

// sample client data =
// {
//     'm': {                 // mobile
//         'p0': [720, 4000], // <client_ID>: [<screenWidth>, <tb>]
//         'p1': [720, 5000]
//     },
//     'd': {                 // desktop
//         'p0': [1080, 7000],
//         'p1': [1080, 9000]
//     },
//     't': {                 // tv
//         'p0': [2160, 20000],
//         'p1': [2160, 25000]
//     }
// }
const getMaxBitrateInMPDMultipleClient = (deviceType, screenWidth, topBitrate, clientID) => {
  console.log('---- deviceType: ' + deviceType)
  console.log('---- clientD: ' + clientID);
  console.log('---- clientData[' + deviceType + ']: ' + JSON.stringify(clientData[deviceType]))
  if (typeof clientData[deviceType] === 'undefined') {
    clientData[deviceType] = {
      [clientID] : [screenWidth, topBitrate]
    }
    console.log('---- First clientData: ' + JSON.stringify(clientData))
  }
  else {
    clientData[deviceType][clientID] = [screenWidth, topBitrate]
  }

  console.log('---- CURRENT clientData: ' + JSON.stringify(clientData))

  let data = new Array()

  for (let key in clientData[deviceType]) {
    let val = clientData[deviceType][key]
    data.push(val)
  }

  if (data.length == 1) {
    console.log('========== data length = 1 ----- END')
    return getMaxBitrateInMPDSignleClient(deviceType, screenWidth, topBitrate)
  }

  const k = getK(data)
  const clusters = kmeans(data, k)
  let location = -1

  for (let i = 0; i < clusters.centroids.length; i++) {
    console.log(' clusters idx ' + i + ': ' + JSON.stringify(clusters.clusters[i]))

    const pointsArray = clusters.clusters[i].points
    for (let j = 0; j < pointsArray.length; j++) {
      if (pointsArray[j].includes(screenWidth) && pointsArray[j].includes(topBitrate)) {
        location = i
        break
      }
    }

    if (location != -1) {
      break
    }
  }

  for (let i = resolutionWidth.length - 1; i >= 0; i--) {
    if (resolutionWidth[i] <= Math.min(clusters.centroids[location][0], screenWidth) &&
      availableBitrates[i] <= clusters.centroids[location][1] * 1000) {
      return availableBitrates[i]
    }
  }

  return availableBitrates[0]
}

const getK = (data) => {
  const screen_array = []

  for (let i = 0; i < data.length; i++) {
    if (screen_array.includes(data[i][0])) {
    } else {
      screen_array.push(data[i][0])
    }
  }

  return screen_array.length
}

const getDeviceType = (cmcdDt) => {
  switch(cmcdDt.replace(/['"]+/g, '')) {
    case 't':
      return 'tv'
    case 'd':
      return 'desktop'
    case 'm':
      return 'phone'
    default:
      return ''
  }
}

const getCorrespondingMPDIndex = (fileName) => {
  var tmp = fileName.split(/[-.]/)

  if (tmp.length == 3) {
    return Math.round(parseInt(tmp[1])/5)
  } else {
    return 0
  }
}