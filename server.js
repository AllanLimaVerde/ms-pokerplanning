const http = require('http')
const express = require('express')
const cors = require('cors')
const port = 5000
const { logger } = require('./services').loggerService
const WebSocket = require('ws')
const { v4: uuid } = require('uuid')
const roomService = require('./services/roomService')
const playerSockets = require('./services/roomService')

const _HALL = {}

const app = express()

app.use(async (req, res, next) => {
  req.sessionId = req.url
  next()
})

const HTTPServer = http.createServer(app)

app.use(cors({ origin: '*' }))
app.use(express.json({}))
app.use(express.urlencoded({ extended: true }))

require('./routes')(app)

// const _USER = {}
// const _SOCKET = {}
// // const _SESSION = {}
// const _SOCKET_USER = {}
// const _SESSION_SOCKET = {}
// const _SESSION_USER = {}
// const _SOCKET_SESSION = {}
// const _USER_SESSION_SOCKET = {}
// const _USER_TO_SOCKET = {}

const uuidNotIn = obj => {
  let id = uuid()
  while(obj[id]) {
    id = uuid()
  }
  return id
}

const getUsers = () => {
  let users = {}
  for (const session in _HALL) {
    users = {...users, ..._HALL[session]}
  }
  return users
}

const getSocket = socketId => {
  return getAllSockets()[socketId]
}

const getAllSockets = () => {
  const users = getUsers()
  let sockets = {}
  for (const user in users) {
    sockets = {...sockets, ...users[user]}
  }
  return sockets
}

const addSocket = (userId, sessionId, ws) => {
  const socketId = newSocketId()
  _HALL[sessionId][userId][socketId] = ws
  return socketId
}

const newSocketId = () => {
  return uuidNotIn(getAllSockets())
}

const newUserId = () => {
  return uuidNotIn(getUsers())
}

HTTPServer.listen(process.env.PORT || port, (error) => {
  if (error) {
    return logger.error(error)
  }

  logger.info(`Server listening on port ${process.env.PORT || port}`)
})

const wss = new WebSocket.Server({
  server: HTTPServer,
})

// if (environment === 'production') {
  
// }

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
    console.log(_data)
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

    // const roomName = req.url
    // const room = roomService.hall()[roomName]

    // const newPlayer = new roomService.Player('...', ws)

    // room.players[ws._id] = newPlayer

    // broadcast(roomName, null, { type: 'newPlayerInRoom', room })

    const _send = data => {
      send(ws, data)
    }

    ws.on('message', function incoming(message) {
      const data_str = message.toString()
      const serverHall = roomService.hall()
  
      try {
        const _data = JSON.parse(data_str)
  
        const { type, data } = _data
        const { room, userName, playerId, roomName, selectedNumber } = data
        console.log('data', data)
  
        switch (type) {
          case 'playerEnteringRoom' : {
            console.log('received msg playerEnteringRoom')
            const newPlayer = new roomService.Player(data.userName, null)
            serverHall[roomName].players[ws._id] = newPlayer
            roomService.playerSockets[ws._id] = ws
            console.log('agagaegaeg', serverHall[roomName])
            broadcast(roomName)
            break
          }
          case 'vote': {
            console.log('received msg vote')
            const player = getPlayer(roomName, playerId)
            console.log(selectedNumber)
            player.currentVote = selectedNumber
            broadcast(roomName, ws._id)
            verifyIfRoomIsInVote(roomName)
            break
          }
          case 'playAgain': {
            console.log('received msg playAgain')
            setAllVotesToNull(roomName)
            break
          }
          case 'getRoom': {
            console.log('received msg getRoom')
            const room = serverHall[roomName]
            const sendData = { type: 'updateRoom', data: room }
            _send(sendData)
            break
          }
        }
      } catch (err) {
        console.error(err)
      }
    })

    ws.on('close', () => {
      console.log('caught a closing event for id ' + ws._id)
      const serverHall = roomService.hall()
      for (const room in serverHall) {
        const players = serverHall[room].players
        for (const player in players) {
          if (player === ws._id) {
            console.log('room b4 delete', serverHall[room])
            delete serverHall[room].players[ws._id]
            console.log('room after delete', serverHall[room])
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