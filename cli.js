#!/usr/bin/env node

const fs = require('fs')
const es = require('event-stream')
const program = require('commander')

const api = require('.')
const pkg = require('./package.json')

// see https://github.com/nodejs/node/issues/1741#issuecomment-190649817
if (process.stdout._handle && typeof process.stdout._handle.setBlocking === 'function') {
  process.stdout._handle.setBlocking(true)
}

program
  .version(pkg.version)
  .arguments('url [file]')

  .on('--help', function () {
    console.log('')
    console.log('  Notes:')
    console.log('')
    console.log('    The [file] argument is optional, if its missing (or if its')
    console.log('    \'-\'), input is expected to be piped via stdin. The tool')
    console.log('    is intended to be used in a command chain like')
    console.log('    cat docs.jsonl | couchdb-bulk')
    console.log('')
    console.log('    couchdb-bulk expects input to be line seperated JSON.')
    console.log('    See http://jsonlines.org for more info on this format.')
    console.log('')
    console.log('    Each line can either be a single doc:')
    console.log('    { "_id": "one" }')
    console.log('    a json object with doc property:')
    console.log('    { "doc": { "_id": "one" } }')
    console.log('    or an object with a `docs` property holding an array of docs:')
    console.log('    {')
    console.log('      "docs:" [')
    console.log('        { "_id": "one" },')
    console.log('        { "_id": "two" }')
    console.log('      ]')
    console.log('    }')
    console.log('    The docs array version is useful for batching:')
    console.log('    cat docs.jsonl | couchdb-bulk | couchdb-bulk')
    console.log('')
    console.log('    The `doc` object version can be used when pushing a couchdb view result.')
    console.log('')
  })

  .parse(process.argv)

const arg = program.args.shift()
const inStream = (!process.stdin.isTTY || arg === '-' || !arg)
  ? process.stdin
  : fs.createReadStream(arg)

const resultStream = inStream
  .pipe(es.split())
  .pipe(es.mapSync(function (data) {
    if (data) return JSON.parse(data) // weed empty lines
  }))
  .pipe(api(program.url))
  .on('error', function (error) {
    console.error(JSON.stringify(error))
  })

resultStream
  .pipe(es.mapSync(function (resp) {
    return JSON.stringify(resp) + '\n'
  }))
  .pipe(process.stdout)
