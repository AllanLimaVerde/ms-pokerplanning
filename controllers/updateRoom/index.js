const { errors, actions } = require('../../constants')
const { roomService } = require('../../services')
const { logger } = require('../../services').loggerService
const userActions = require('./userActions')

/**
 * @description updates a room based on a user input
 * @async
 * @function
 * @name updateRoom
 * @param {Object} req Request instance
 * @param {Object} res Response instance
 * @returns {Promise<Object>}
 */
const updateRoom = async (req, res) => {
  try {
    const { userName, action } = req.body
    const { roomName } = req.params

    if (!action) {
      return res.status(400).json(errors.actionRequired)
    }

    if (action.description === actions.resetServer) {
      await userActions[action.description].execute()
      return res.status(200).json({ message: `Servidor resetado com sucesso`, status: 200 })
    }

    const room = roomService.goToRoom({ roomName, userName, action })

    const { description, payload } = action
    const predictedAction = userActions[description]
    
    if (predictedAction) {
      await predictedAction.execute({ userName, roomName, payload })
    } 
    
    return res.status(200).json({ room })
  } catch (error) {
    logger.error(error, __filename)
  }
}

module.exports = updateRoom
