module.exports = {
  roomStatuses: {
    waiting: 'waiting',
    reveal: 'reveal',
  },
  errors: {
    roomNotFound: 'Room not found',
    actionRequired: 'Action not specified in request',
    userRequired: 'User required for action but !userName',
    payloadRequired: 'Action requires payload but !payload',
    playerNotInRoom: 'Player executing action is not in room',
  },
  actions: {
    resetServer: 'resetServer',
    joinOrCreateRoom: 'joinOrCreateRoom',
    sse: {
      playerNameConflict: 'playerNameConflict'
    }
  }
}