const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawn
const request = require('request')
const test = require('tap').test

const api = require('..')

var fixturePath = path.resolve(path.join(__dirname, 'fixtures/docs.jsonl'))
var cliPath = path.resolve(path.join(__dirname, '../cli.js'))

const url = 'http://localhost:5984/testdb'

function resetDb (callback) {
  request({
    method: 'delete',
    url: url
  }, function () {
    request({
      method: 'put',
      url: url
    }, callback)
  })
}

test('API exposes a function', function (t) {
  t.equal(typeof api, 'function')
  t.end()
})

test('API exposes a writable Stream', function (t) {
  t.ok(typeof api(url).writable)
  t.end()
})

test('API exposes a readable Stream', function (t) {
  t.ok(typeof api(url).readable)
  t.end()
})

test('API throws if no db option is passed', function (t) {
  t.throws(api)
  t.end()
})

test('API answers with a response if we write a doc to it', function (t) {
  const push = api(url)
  const docs = [
    { _id: 'bar' },
    { _id: 'baz' }
  ]
  resetDb(function () {
    var i = 0
    push.on('respata', function (resp) {
      t.equal(resp.length, 1)
      t.ok(resp[0].ok)
      t.equal(resp[0].id, docs[i]._id)
      t.ok('rev' in resp[0])
      i++
    })
    push.on('end', t.end)
    push.write(docs[0])
    push.write(docs[1])
    push.end()
  })
})

test('cli', function (t) {
  resetDb(function () {
    var cli = spawn(cliPath, [url])
    var output = Buffer.from('')
    cli.stdout.on('data', function (data) {
      output = Buffer.concat([output, data])
    })
    cli.on('close', function () {
      var responses = output
        .toString()
        .split('\n')
        .filter(function (line) { return line })
        .map(JSON.parse)
      responses.forEach(function (resp) {
        t.equal(resp.length, 1)
        t.ok(resp[0].ok)
        t.ok('id' in resp[0])
        t.ok('rev' in resp[0])
      })
      t.end()
    })
    fs.createReadStream(fixturePath).pipe(cli.stdin)
  })
})
