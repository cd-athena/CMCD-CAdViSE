const express = require('express')
const fs = require('fs')
const app = express()

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

  const CMCDParams = {}
  request.headers['cmcd-object'].split(',').forEach(CMCDParam => {
    CMCDParams[CMCDParam.split('=')[0]] = CMCDParam.split('=')[1]
  })

  if (CMCDParams.dt) {
    console.log('Serving', title, 'manifest_' + getMaxBitrateInMPD(CMCDParams.dt) + '.mpd')
    fs.createReadStream('manifests/stc/manifest_' + getMaxBitrateInMPD(CMCDParams.dt) + '.mpd').pipe(response)
  } else {
    console.log('Serving', title, fileName)
    fs.createReadStream('dataset/' + title + '/' + fileName).pipe(response)
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
  '17000000'
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

const getMaxBitrateInMPD = (deviceType) => {
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

  let maxBitrateInMPD = availableBitrates[0]

  for (let i = availableBitrates.length - 1; i >= 0; i--) {
    let bitrate = availableBitrates[i]
    let width = resolutionWidth[i]

    if (bitrate <= maxWidthForDevice && width <= maxWidthForDevice) {
      maxBitrateInMPD = bitrate
      break
    }
  }

  return maxBitrateInMPD
}