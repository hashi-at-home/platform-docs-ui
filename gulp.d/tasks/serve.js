import connect from 'gulp-connect'
import os from 'os'

const ANY_HOST = '0.0.0.0'
const URL_RX = /(https?):\/\/(?:[^/: ]+)(:\d+)?/

/**
 * Middleware to set proper MIME types
 */
function mimeTypeMiddleware(req, res, next) {
  // Set proper MIME type for JavaScript files
  if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
  }
  // Ensure fonts are served with correct MIME types
  else if (req.url.endsWith('.woff2')) {
    res.setHeader('Content-Type', 'font/woff2')
  } else if (req.url.endsWith('.woff')) {
    res.setHeader('Content-Type', 'font/woff')
  }
  next()
}

/**
 * Decorate server logs with local IP address
 */
function decorateLog(_, app) {
  const _log = app.log
  app.log = (msg) => {
    if (msg.startsWith('Server started ')) {
      const localIp = getLocalIp()
      const replacement = '$1://localhost$2' + (localIp ? ` and $1://${localIp}$2` : '')
      msg = msg.replace(URL_RX, replacement)
    }
    _log(msg)
  }
  return []
}

/**
 * Get local IP address
 */
function getLocalIp() {
  for (const records of Object.values(os.networkInterfaces())) {
    for (const record of records) {
      if (!record.internal && record.family === 'IPv4') {
        return record.address
      }
    }
  }
  return 'localhost'
}

/**
 * Start a development server
 */
export default (root, opts = {}, watch = undefined) => (done) => {
  // gulp-connect expects middleware to be a function that returns an array of middleware
  const middlewareFn = (connect, app) => {
    // Optionally decorate logs if host is ANY_HOST
    if (opts.host === ANY_HOST) {
      decorateLog(undefined, app)
    }
    // Return array of middleware functions
    return [mimeTypeMiddleware]
  }

  connect.server(
    { ...opts, middleware: middlewareFn, root },
    function () {
      this.server.on('close', done)
      if (watch) watch()
    }
  )
}
