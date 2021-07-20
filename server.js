const http = require('http')
const express = require('express')
const cors = require('cors')
const port = 5000
const { logger } = require('./services').loggerService

const app = express()

const server = http.createServer(app)

app.use(cors({ origin: '*' }))
app.use(express.json({}))
app.use(express.urlencoded({ extended: true }))

require('./routes')(app)

server.listen(process.env.PORT || port, (error) => {
  if (error) {
    return logger.error(error)
  }

  logger.info(`Server listening on port ${process.env.PORT || port}`)
})
