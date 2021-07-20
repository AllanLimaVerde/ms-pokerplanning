const { roomStatuses, errors } = require('../../constants')
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

const testPlayers = [
  new Player('testPlayer 1', 5),
  new Player('testPlayer 2', 3),
]
const testRoom = new Room('teste', testPlayers)
let roomHall = { teste: testRoom }

const goToRoom = ({ roomName, userName, action }) => {
  const existingRoom = roomHall[roomName]
  const newPlayer = new Player(userName)

  if (action.description === 'joinOrCreateRoom') {
    if (existingRoom) {
      logger.info([`Room '${roomName}' already existed`, `User '${userName}' joining room '${roomName}'...`])
      existingRoom.players.push(newPlayer)
      return existingRoom
    }

    logger.info(`Player '${userName}' is creating room '${roomName}'...`)  
    
    const newRoom = new Room(roomName, [newPlayer])
    return roomHall[roomName] = newRoom
  }

  if (!existingRoom) throw new Error(errors.roomNotFound)

  return existingRoom
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
      console.log('room is in reveal')
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