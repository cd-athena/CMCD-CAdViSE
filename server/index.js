const express = require('express')
const fs = require('fs')
const app = express()
const kmeans = require('./kMeansClustering')

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
  const { title, fileName, playerABR } = request.params
  const clientID = playerABR.split('-').pop()

  const CMCDParams = {}
  if (request.headers['cmcd-object']) {
    request.headers['cmcd-object'].split(',').forEach(CMCDParam => {
      CMCDParams[CMCDParam.split('=')[0]] = CMCDParam.split('=')[1]
    })
  }

  if (CMCDParams.dt && CMCDParams.sw && CMCDParams.tb) {
    console.log('Serving', title, 'manifest_' + getMaxBitrateInMPDMultipleClient(CMCDParams.dt, CMCDParams.sw, CMCDParams.tb, clientID) + '.mpd')
    fs.createReadStream('manifests/stc/manifest_' + getMaxBitrateInMPDMultipleClient(CMCDParams.dt, CMCDParams.sw, CMCDParams.tb, clientID) + '.mpd').pipe(response)
  } else {
    console.log('Serving', title, fileName)
    // fs.createReadStream('dataset/' + title + '/' + fileName).pipe(response)
    fs.createReadStream('manifests/stc/manifest_17000000.mpd').pipe(response)
  }
})

app.get('/:title/:filePath/:fileName', (request, response) => {
  const { title, filePath, fileName } = request.params
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

const clientData = {
  'm': {}, // 'm' stands for mobile devices
  'd': {}, // 'd' stands for desktop devices
  't': {}  // 't' stands for TV devices
}

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
//     'm': {
//         'p0': [720, 4000],
//         'p1': [720, 5000]
//     },
//     'd': {
//         'p0': [1080, 7000],
//         'p1': [1080, 9000]
//     },
//     't': {
//         'p0': [2160, 20000],
//         'p1': [2160, 25000]
//     }
// }
const getMaxBitrateInMPDMultipleClient = (deviceType, screenWidth, topBitrate, clientID) => {
  clientData[deviceType][clientID] = [screenWidth, topBitrate]

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
    if (resolutionWidth[i] <= clusters.centroids[location][0] &&
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
