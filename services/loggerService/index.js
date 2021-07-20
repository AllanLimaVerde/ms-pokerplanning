const logger = {
  info: input => {
    console.log('{')
    if (Array.isArray(input)) {
      input.forEach(msg => console.log('  ' + msg))
    } else {
      console.log('  ' + input)
    }
    console.log('{')
  },
  error: (err, filename) => {
    console.log('!! [ERROR] {')
    if (Array.isArray(err)) {
      err.forEach(msg => console.log('  ' + msg))
    } else {
      console.log('  ' + err)
    }
    filename && console.log(`at: ${filename}`)
    console.log('{')
  },
}

module.exports = { logger }