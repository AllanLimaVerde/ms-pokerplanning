const { roomStatuses, actions, errors } = require('../../constants')
const { logger } = require('../loggerService')
const { wss } = require('../../server')
const { v4: uuid } = require('uuid')

class Room {
  constructor(name, players = {}, status = roomStatuses.waiting) {
    this.name = name
    this.players = players
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

let playerSockets = {}

const goToRoom = ({ roomName, userName, action }) => {
  const existingRoom = roomHall[roomName]

  if (action.description === actions.joinOrCreateRoom) {
    if (existingRoom) {
      logger.info([`Room '${roomName}' already existed`, `User '${userName}' trying to join room '${roomName}'...`])
      return { room: existingRoom }
    }

    logger.info(`Player '${userName}' is creating room '${roomName}'...`)  
    const newRoom = new Room(roomName)
    return { room: roomHall[roomName] = newRoom }
  }

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
  reset,
  Player,
  playerSockets
}

module.exports = roomService