# A simple synchronous logging utility
#
# Sample configuration in config.coffee
#
# exports.logging = {
#  'default': [
#    {file: 'logs/app.log',    level: 'debug'},
#    {file: 'stdout',          level: 'warn'}]
#  'db': [                                                                                                                                       
#    {file: 'logs/db.log',     level: 'debug'},
#    {forward: 'default'}]
# }
#
# 'default' and 'db' are "log routes".
# The value is an array of "handler" configuration objects.
# Log route names are "dot aware", so logging to "db.foo" will
# match the "db" route unless "db.foo" is also defined.
#

fs = require 'fs'
try
  colors = require 'cardamom/src/colors'
catch e
  colors = require './colors'
assert = require 'assert'
{inspect} = require 'util'
try
  loggingConfig = require('config')?.logging
catch e
  loggingConfig = {'default': [{file: 'stdout', level: 'debug'}]}

LEVELS = {debug: 0, info: 1, warn: 2, error: 3, fatal: 3}
COLORS = {debug: colors.green, info: colors.white, warn: colors.yellow, error: colors.red, fatal: colors.red}
STREAM_GENERATORS = # name -> stream generator
  stdout: ->
    process.stdout
  stderr: ->
    process.stderr
PIDMAP = {} # process -> file streams cache

# NOTE if the file gets deleted, you may end up writing to a zombie.
getStream = (handler) ->
  if handler.file.write?
    return handler.file
  else
    name = handler.file # file or stream name
    streamCache = (PIDMAP[process.pid] ||= {})
    if streamCache[name]?
      return streamCache[name]
    if STREAM_GENERATORS[name]?
      stream = STREAM_GENERATORS[name]()
    else
      stream = write: (msg, encoding='utf8') -> fs.appendFileSync(name, msg, encoding)
      #stream = fs.createWriteStream(name, flags: 'a', mode: 0666)
    return (streamCache[name] = stream)

# NOTE Generator should return a stream appropriate for that process.
@setStream = (name, streamGen) ->
  STREAM_GENERATORS[name] = streamGen
  # clear existing streams if necessary
  # TODO consider closing these streams
  delete PIDMAP[process.pid]?[name]

# handler: an object (or list of objects) with the following keys:
#   level:   the desired level (debug, info, warn, error) threshold, or undefined (no threshold)
#   file:    the desired output file, 'stdout' or 'stderr'
#   forward: instead of specifying a file above, you can forward to another logger.
#            (beware of circular forwards)
# name: the original name of the log request.
writeLog = (handler, name, level, message) ->
  # handler can be an array
  if handler instanceof Array
    for _handler in handler
      writeLog(_handler, name, level, message)
    return
  # skip if level threshold isn't met
  if handler.level? and LEVELS[handler.level] > LEVELS[level]
    return
  # maybe forward to another name
  if handler.forward?
    exports.log(handler.forward, level, message)
    return
  # TODO implement formatting/coloring
  if handler.formatter is null
    logLine = message
  else if handler.formatter is undefined
    #logLine = "#{colors.blue new Date()}\t#{COLORS[level] level}\t#{colors.blue name+':'}\n#{COLORS[level] message}\n"
    logLine = "   #{COLORS[level] level+' -'} #{colors.blue '['+name+']'} #{message}\n"
  else
    logLine = handler.formatter({level,name,message})
  #
  wstream = getStream(handler)
  try
    wstream.write(logLine, 'utf8')
  catch e
    console.log "ERROR IN LOGGING: COULD NOT WRITE TO FILE #{handler.file}. #{e.stack}"

# If your app doesn't have a global config module,
# you can also configure the logger by calling this function.
# Note that this relies on node.js's module caching behavior.
@configure = (config) ->
  loggingConfig = config
  return exports

toMessage = (obj) ->
  if typeof obj is 'object'
    return inspect obj
  else
    return ''+obj

# Main logging function.
# Logs a 'message' with 'level' to the logger named 'name'
exports.log = (name, level, message...) ->
  # validation
  assert.ok(LEVELS[level]?, "Unknown logging level '#{level}'")
  assert.ok(loggingConfig?, "Nogg wasn't configured. Call require('nogg').configure(...)")

  switch message.length
    when 0 then message = ''
    when 1 then message = toMessage message[0]
    else        message = (toMessage(x) for x in message).join(' ')

  # find log route, starting with the full name,
  nameParts = name.split('.')
  for useParts in [nameParts.length..1]
    subname = nameParts[0...useParts].join(".")
    routeHandlers = loggingConfig[subname]
    if routeHandlers?
      writeLog(routeHandlers, name, level, message)
      return # we're done. we don't propagate.
      # if you want propagation, you can forward
      # to the parent logger (for now).

  # if we're here, write to the default logger
  assert.ok(loggingConfig.default?, "Logging route 'default' not defined")
  writeLog(loggingConfig.default, name, level, message)

# convenience
for level, num of LEVELS
  do (level, num) ->
    exports[level] = (name, message...) ->
      exports.log name, level, message...

# convenience, wraps the logger name into an object
class exports.Logger
  constructor: (@name) ->
    # bind 'this' to this functions manually
    for level, num of LEVELS
      this[level] = (Logger::[level]).bind(this)

  # log function to specify the level dynamically
  log: (level, message...) =>
    exports.log @name, level, message...

  # debug, info, warn, error etc functions
  for level, num of LEVELS
    do (level, num) =>
      this::[level] = (message...) ->
        this.log(level, message...)

# convenience, return a new logger
exports.logger = (name) ->
  return new exports.Logger(name)
