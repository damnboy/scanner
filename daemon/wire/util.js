var wire = require('./')
function createMessage (type, object){
    // Obtain a message type
    var AwesomeMessage = type
    // Exemplary payload
    var payload = object
    // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
    var errMsg = AwesomeMessage.verify(payload);
    if (errMsg)
        throw Error(errMsg);
    // Create a new message
    var message = AwesomeMessage.create(payload); // or use .fromObject if conversion is necessary
    // Encode a message to an Uint8Array (browser) or Buffer (node)
    var buffer = AwesomeMessage.encode(message).finish();
    // ... do something with buffer
    return buffer
}

module.exports = {
    envelope: function(type, object, channel) {
        return createMessage(wire.Envelope, {
            "type" : type.$code,
            "message" : createMessage(type, object),
            "channel" : channel
        })
    }
}