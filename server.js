const http = require('http')
const express = require('express')
const cors = require('cors')
const port = 5000
const { logger } = require('./services').loggerService
const WebSocket = require('ws')
const { v4: uuid } = require('uuid')
const roomService = require('./services/roomService')

const app = express()

const HTTPServer = http.createServer(app)

app.use(cors({ origin: '*' }))
app.use(express.json({}))
app.use(express.urlencoded({ extended: true }))

require('./routes')(app)

HTTPServer.listen(process.env.PORT || port, (error) => {
  if (error) {
    return logger.error(error)
  }

  logger.info(`Server listening on port ${process.env.PORT || port}`)
})

const wss = new WebSocket.Server({
  server: HTTPServer,
})

const send = (ws, data) => {
  const value = JSON.stringify(data)

  ws.send(value)
}

const broadcast = (roomName, playerId = null, _data = null) => {
  const room = roomService.hall()[roomName]
  if (!_data) {
    _data = { type: 'updateRoom', data: room }
  }

  for (const player in room.players) {
    player !== playerId && send(roomService.playerSockets[player], _data)
  }
}

const getPlayer = (roomName, playerId) => {
  const room = roomService.hall()[roomName]
  return room.players[playerId]
}

const verifyIfRoomIsInVote = roomName => {
  const room = roomService.hall()[roomName]
  const players = room.players

  let allVoted = true
  for (const player in players) {
    players[player].currentVote === null && (allVoted = false)
  }

  if (!allVoted) return

  broadcast(roomName, null, { type: 'revealTime', data: {} })
}

const setAllVotesToNull = roomName => {
  const room = roomService.hall()[roomName]
  const players = room.players

  for (const player in players) {
    players[player].currentVote = null
  }

  broadcast(roomName, null)
}

const setupWSS = wss => {
  wss.on('connection', (ws, req) => {
    ws._id = uuid()
    send(ws, { type: 'setPlayerId', data:  { playerId: ws._id } })

    const _send = data => {
      send(ws, data)
    }

    ws.on('message', function incoming(message) {
      const data_str = message.toString()
      const serverHall = roomService.hall()
  
      try {
        const _data = JSON.parse(data_str)
  
        const { type, data } = _data
        const { playerId, roomName, selectedNumber } = data
  
        switch (type) {
          case 'playerEnteringRoom' : {
            logger.info(`Received msg 'playerEnteringRoom' from player '${ws._id}'`)
            const newPlayer = new roomService.Player(data.userName, null)
            serverHall[roomName].players[ws._id] = newPlayer
            roomService.playerSockets[ws._id] = ws
            broadcast(roomName)
            break
          }
          case 'vote': {
            logger.info(`Received msg 'vote' from player '${ws._id}'`)
            const player = getPlayer(roomName, playerId)
            player.currentVote = selectedNumber
            broadcast(roomName, ws._id)
            verifyIfRoomIsInVote(roomName)
            break
          }
          case 'playAgain': {
            logger.info(`Received msg 'playAgain' from player '${ws._id}'`)
            setAllVotesToNull(roomName)
            break
          }
          case 'getRoom': {
            logger.info(`Received msg 'getRoom' from player '${ws._id}'`)
            const room = serverHall[roomName]
            const sendData = { type: 'updateRoom', data: room }
            _send(sendData)
            break
          }
        }
      } catch (err) {
        logger.error(err)
      }
    })

    ws.on('close', () => {
      const serverHall = roomService.hall()
      for (const room in serverHall) {
        const players = serverHall[room].players
        for (const player in players) {
          if (player === ws._id) {
            delete serverHall[room].players[ws._id]
            broadcast(room)
          }
        }
      }
    })
  })
}

setupWSS(wss)

module.exports = {
  wss
}