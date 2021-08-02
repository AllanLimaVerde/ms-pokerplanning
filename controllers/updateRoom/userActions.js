const { logger } = require("../../services/loggerService")
const { roomService } = require('../../services')
const { errors, roomStatuses } = require("../../constants")

/**
 * @description defines possible user actions
 * @async
 * @function
 * @name handleUserAction
 * @param {Object} input Input instance
 * @returns {Promise<Object>} Result
 */
const userActions = {
  selectCard: {
    execute: 
      async ({ userName, roomName, payload }) => {
        // const room = roomService.hall()[roomName]

        // if (!room) {
        //   throw new Error(errors.roomNotFound)
        // }

        // if (!userName) {
        //   throw new Error(errors.userRequired)
        // }

        // logger.info([`[Room ${roomName}]`, `User '${userName}' has selected card ${payload}`])

        // const player = room.players.find(p => p.userName === userName)

        // if (!player) {
        //   throw new Error(errors.playerNotInRoom)
        // }

        // player.currentVote = payload
        // console.log('uaegaeg', payload)

        // roomService.checkIfRoomStatusShouldChange(roomName)
      }
  },
  checkRoomForChange: {
    execute:
      async ({ userName, roomName }) => {
        logger.info(`Player '${userName}' has pinged server for room '${roomName}' update`)
      }
  },
  resetRoomForNewVote: {
    execute:
      async ({ userName, roomName }) => {
        logger.info(`Player '${userName}' has activated room '${roomName}' reset for new voting`)

        const room = roomService.hall()[roomName]

        if (!room) {
          throw new Error(errors.roomNotFound)
        }

        room.players.forEach(player => player.currentVote = null)
        room.status = roomStatuses.waiting
      }
  },
  playerOnLobby: {
    execute:
      async ({ payload }) => {
        const { playerId } = payload
        logger.info(`Player '${playerId}' is on lobby. Quitting all rooms...`)

        const socket = roomService.playerSockets[playerId]
        console.log(roomService.playerSockets)
        socket && socket.close()
      }
  },
  resetServer: {
    execute:
      async () => {
        logger.info(`Someone wants to reset server`)
        roomService.reset()
        logger.info(`Server reset: Object.keys(roomHall).length = ${Object.keys(roomService.hall()).length}`)
      }
  }
}

module.exports = userActions
