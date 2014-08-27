var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var async= require('async')

module.exports = Emitter

function Emitter(r, opts) {
	var self = this, reconnect
	if (!(this instanceof Emitter)) return new Emitter(r, opts)

	opts.db = opts.db || 'emitterRethinkDB'
	opts.table = opts.table || 'emitterEvents'	

	this.init = false
	this.conn = null
	this.queue = async.queue(function (task, cb) {		
		r.db(opts.db).table(opts.table).insert({args:task.args}).run(self.conn, function(err, obj){   	
			err && cb(err)			
			r.db(opts.db).table(opts.table).get(obj.generated_keys[0]).delete().run(self.conn, function(err){
				cb(err ? err : null)
			})
		})
	}, 1)	

	this.queue.pause()

	reconnect = require('reconnect-rethinkdb')(r, opts)	

	reconnect
	.on('disconnect', function(err){
		self.conn = null
		self.queue.pause()
		self.emit('disconnect', err)
	})
	.on('connect', function(conn){
		self.conn = conn
		self.emit('connect', conn)
		_init(function(err){
		if (err) return self.emit('error', err)
			/* as of now rethinkdb doesn't let us know when
			table is ready and it's time to perform operations;
			using an ugly hack for now
			*/
			setTimeout(function(){
				_listen()
				self.queue.resume()				
			}, 2000)			
		})
	})
	.on('reconnect', function(n,d) {
		self.emit('reconnect', n,d)
	})
	.on('fail', self.emit.bind(self, 'fail'))
	.connect()

	function _listen() {
		var args
		r.db(opts.db).table(opts.table).changes().run(self.conn, function(err, cursor) {			
			if (err) return self.emit('error', err)
			cursor.each(function(err, data) {	
				if (!data.old_val) return		  		
				args = data.old_val.args
				self.emit.apply(self, args)
			})	  			  	
		})	
	}

	function _init(cb) {
		if (self.init) return cb(null)
		_initDb(function(err){
			if (err) return cb(err)
			_initTable(function(err){
				if (err) return cb(err)
				self.init = true				
				cb(null)
			})
		})
	}

	function _initTable(cb) {
		r.db(opts.db).tableList().run(self.conn, function(err, items){
			if (err) return cb(err)				
			if (items.indexOf(opts.table) !== -1) return cb(null)
				r.db(opts.db).tableCreate(opts.table).run(self.conn, function(err){
				cb(err ? err : null)
			})
		})
	}

	function _initDb(cb) {
		r.dbList().run(self.conn, function(err, items) {
			if (err) return cb(err)
			if (items.indexOf(opts.db) !== -1) return cb(null)
			r.dbCreate(opts.db).run(self.conn, function(err) {
				cb(err ? err : null)
			})	
		})
	}
}

Emitter.prototype.trigger = function() {
	var self = this
	var args = [].slice.call(arguments)
	if (['connect','disconnect','reconnect','fail','error'].indexOf(args[0]) !== -1)
		throw new Error('Reserved event name')
	this.queue.push({args:args}, function(err){
		err && self.emit('error', err)
	})
}

Emitter.prototype.kill = function() {
	this.queue.kill()
}

inherits(Emitter, require('events').EventEmitter)