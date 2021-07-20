const { roomStatuses, actions, errors } = require('../../constants')
const { logger } = require('../loggerService')

class Room {
  constructor(name, players, pollingInterval = 2000, status = roomStatuses.waiting) {
    this.name = name
    this.players = players
    this.pollingInterval = pollingInterval
    this.status = status
  }
}

class Player {
  constructor(userName, currentVote = null) {
    this.userName = userName
    this.currentVote = currentVote
  }
}

// const testPlayers = [
//   new Player('testPlayer 1', 5),
//   new Player('testPlayer 2', 3),
// ]
// const testRoom = new Room('teste', testPlayers)
let roomHall = {}

const goToRoom = ({ roomName, userName, action }) => {
  const existingRoom = roomHall[roomName]
  const newPlayer = new Player(userName)

  if (action.description === actions.joinOrCreateRoom) {
    if (existingRoom) {
      logger.info([`Room '${roomName}' already existed`, `User '${userName}' trying to join room '${roomName}'...`])
      const existingUserWithSameName = existingRoom.players.find(player => player.userName === userName)
      if (existingUserWithSameName) {
        logger.info([`Room '${roomName}' already had a player named ${userName}`, `Player should choose a different name`])
        return { SSEaction: actions.sse.playerNameConflict }
      }
      existingRoom.players.push(newPlayer)
      return { room: existingRoom }
    }

    logger.info(`Player '${userName}' is creating room '${roomName}'...`)  
    
    const newRoom = new Room(roomName, [newPlayer])
    return { room: roomHall[roomName] = newRoom }
  }

  // if (!existingRoom) throw new Error(errors.roomNotFound)

  return { room: existingRoom }
}

const checkIfRoomStatusShouldChange = roomName => {
  const existingRoom = roomHall[roomName]

  if (!existingRoom) throw new Error(errors.roomNotFound)

  switch (existingRoom.status) {
    case roomStatuses.waiting: {
      const everyPlayerHasVoted = !existingRoom.players.find(player => player.currentVote === null)

      if (everyPlayerHasVoted) {
        logger.info(`Every player has voted. Changing room status to 'reveal'...`)
        existingRoom.status = roomStatuses.reveal
        return true
      }

      logger.info(`Not every player has voted. Room status is still 'waiting'...`)
      return false
    }
    case roomStatuses.reveal: {
      logger.info(`room is in reveal...`)
      return false
    }
    default: {
      return false
    }
  }
}

const reset = () => {
  roomHall = {}
}

const hall = () => roomHall

const roomService = {
  goToRoom,
  checkIfRoomStatusShouldChange,
  hall,
  reset
}

module.exports = roomService