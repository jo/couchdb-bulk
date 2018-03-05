const assert = require('assert')
const es = require('event-stream')
const request = require('request')

function hasError (response) {
  return response.error
}

module.exports = function push (url) {
  assert(url, 'url is required')

  const bulkDocs = request.defaults({
    pool: {
      maxSockets: 4
    },
    method: 'POST',
    url: url + '/_bulk_docs',
    json: true
  })

  return es.map(function (data, callback) {
    const body = data.docs ? data : { docs: [data.doc ? data.doc : data] }
    bulkDocs({
      body: body
    }, function (error, headers, response) {
      if (error) return callback(error)
      if (response.error) return callback(response)

      var errors = response.filter(hasError)
      if (errors.length) {
        return callback(errors)
      }
      callback(null, response)
    })
  })
}
