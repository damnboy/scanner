var EventEmitter = require('eventemitter3')
var util = require('util')

var wire = require('./')
var log = require('../../utils/logger').createLogger('wire:router')
var on = EventEmitter.prototype.on

function Router() {
  if (!(this instanceof Router)) {
    return new Router()
  }

  EventEmitter.call(this)
}

util.inherits(Router, EventEmitter)

Router.prototype.on = function(message, handler) {
  return on.call(this, message.$code, handler)
}

Router.prototype.removeListener = function(message, handler) {
  return EventEmitter.prototype.removeListener.call(
    this
  , message.$code
  , handler
  )
}

Router.prototype.msghandler = function() {
  return function(channel, data) {
    var wrapper = wire.Envelope.decode(data)
    var type = wire.ReverseMessageType[wrapper.type]

    if (type) {
      this.emit(
        wrapper.type
      , wrapper.channel || channel
      , wire[type].decode(wrapper.message)
      , data
      )
      this.emit(
        'message'
      , channel
      )
    }
    else {
      log.warn(
        'Unknown message type "%d", perhaps we need an update?'
      , wrapper.type
      )
    }
  }.bind(this)
}
/*
events.js:160
      throw er; // Unhandled 'error' event
      ^

Error: invalid wire type 4 at offset 1
    at Error (native)
    at BufferReader.Reader.skipType (/Users/cboy/Desktop/Project/github/scanner/node_modules/protobufjs/src/reader.js:375:19)
    at Type.Envelope$decode [as decode] (eval at Codegen (/Users/cboy/Desktop/Project/github/scanner/node_modules/@protobufjs/codegen/index.js:50:33), <anonymous>:20:5)
    at Type.decode_setup [as decode] (/Users/cboy/Desktop/Project/github/scanner/node_modules/protobufjs/src/type.js:502:25)
    at Router.<anonymous> (/Users/cboy/Desktop/Project/github/scanner/daemon/wire/router.js:58:33)
    at emitTwo (events.js:106:13)
    at emit (events.js:191:7)
    at Socket._flushRead (/Users/cboy/Desktop/Project/github/scanner/node_modules/zmq/lib/index.js:638:15)
    at Socket._flushReads (/Users/cboy/Desktop/Project/github/scanner/node_modules/zmq/lib/index.js:676:23)
    at _zmq.onReadReady (/Users/cboy/Desktop/Project/github/scanner/node_modules/zmq/lib/index.js:297:10)

  执行ssl扫描时，自连7111端口，触发该异常。
*/
Router.prototype.handler = function() {
  return function(channel, data) {
    var wrapper = wire.Envelope.decode(data)
    var type = wire.ReverseMessageType[wrapper.type]
    if (type) {
      this.emit(
        wrapper.type
      , wrapper.channel || channel
      , wire[type].decode(wrapper.message)
      , data
      )
      this.emit(
        'message'
      , channel
      )
    }
    else {
      log.warn(
        'Unknown message type "%d", perhaps we need an update?'
      , wrapper.type
      )
    }
  }.bind(this)
}

module.exports = Router