# CouchDB Bulk

This is a little command line tool meant to eat line seperated JSON (CouchDB documents)
on stdin and POSTing them to the 
[_bulk_docs](http://docs.couchdb.org/en/stable/api/database/bulk-api.html#db-bulk-docs) 
endpoint of a CouchDB server.

## Installation

```sh
npm install -g couchdb-bulk
```

## API
```js
const bulk = require('couchdb-bulk')

const url = 'http://localhost:5984/mydb'

process.stdin
  .pipe(bulk(url))
  .pipe(process.stdout)
```

## CLI
For options and examples, use the built-in help

```sh
couchdb-bulk --help
```

Example:

```sh
cat test.jsonl | couchdb-bulk http://localhost:5984/testdb
```
