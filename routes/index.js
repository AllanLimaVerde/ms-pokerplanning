const { updateRoomController } = require('../controllers')

module.exports = (app) => {
  app.post(
    '/:roomName',
    updateRoomController
  )
}