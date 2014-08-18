# emitter-rethinkdb

Network event emitter based on [rethinkdb](http://www.rethinkdb.com/) with support for fibonacci backoff reconnections and event queues. Connection and reconnection is handled automatically. Events are queued when the database connection is down and drained when reconnection is established. 

This module relies on [change feeds](http://rethinkdb.com/api/javascript/changes/) by inserting a row into a temporary table followed by a delete operation, keeping the table empty. 

Any connected client can trigger an event, events are triggered on all connected clients.

## Usage

```js
var rethinkdb = require('rethinkdb')
var opts = {host: 'localhost',port: 28015}
var emitter = require('emitter-rethinkdb')(rethinkdb, opts)

emitter.trigger('beep', 'boop')

emitter.on('boop', function(d){
	console.log(d) //should log "boop"
})

/* optional stuff
emitter.on('connect', function(conn){
	console.log('connected!')
})
.on('disconnect', function(err){
	console.log('disconnected!')
})
.on('reconnect', function(number, delay){
	console.log('reconnecting in ', delay, 'ms.', 'total retries so far is ', number)
})
.on('fail', function(){
	console.log('given up trying to connect!')
})
.on('error', function(err){
	console.log('error', err)
})*/
```

## Options
Constructor accepts the same [reconnect-rethinkdb](https://github.com/1N50MN14/reconnect-rethinkdb) with an addition of the following optional options:

### db
The name of the database which holds the events table, defaults to`emitterRethinkDB`

### table
The table name to insert/delete event records, defaults to`emitterEvents`

## Methods
### trigger(evt, args[n])
Triggers and event on call connected clients

### kill()
Empties the events queue (usefull if you wish to empty all outstanding events upon disconnection)

## Installation

```
npm install emitter-rethinkdb
```

## License

(MIT)

Copyright (c) 2014 Ayman Mackouly &lt;ayman.mackouly@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.