var rethinkdb = require('rethinkdb')
var opts = {host: 'localhost',port: 28015}
var emitter = require('../index')(rethinkdb, opts)

emitter.trigger('beep', 'boop')

emitter.on('beep', function(d){
	console.log(d)
})

// optional stuff

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
})
