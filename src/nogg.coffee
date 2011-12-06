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
colors = require './colors'
assert = require 'assert'
try
  logging_config = require('config')?.logging
catch e
  logging_config = {'default': [{file: 'stdout', level: 'debug'}]}

LEVELS = {debug: 0, info: 1, warn: 2, error: 3}
COLORS = {debug: colors.green, info: colors.white, warn: colors.yellow, error: colors.red}
pidmap = {} # process -> file streams

# get a WritableStream
# filename: a relative path to the file, stdout, or stdin
# NOTE if the file gets deleted, you may end up writing to a zombie.
get_writestream = (filename) ->
  if filename == 'stdout'
    return process.stdout
  else if filename == 'stderr'
    return process.stderr
  filemap = (pidmap[process.pid] ||= {})
  return (filemap[filename] ||= fs.createWriteStream(filename, flags: 'a', mode: 0666))

# handler: an object (or list of objects) with the following keys:
#   level:   the desired level (debug, info, warn, error) threshold, or undefined (no threshold)
#   file:    the desired output file, 'stdout' or 'stderr'
#   forward: instead of specifying a file above, you can forward to another logger.
#            (beware of circular forwards)
# name: the original name of the log request.
write_log = (handler, name, level, message) ->
  # handler can be an array
  if handler instanceof Array
    for _handler in handler
      write_log(_handler, name, level, message)
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
    log_line = message
  else
    log_line = "#{new Date()}\t#{level}\t#{name} - #{message}\n"
    if handler.file == 'stdout'
      log_line = COLORS[level](log_line)
  #
  wstream = get_writestream(handler.file)
  try
    wstream.write(log_line, 'utf8')
  catch e
    console.log "ERROR IN LOGGING: COULD NOT WRITE TO FILE #{handler.file}"

# If your app doesn't have a global config module,
# you can also configure the logger by calling this function.
# Note that this relies on node.js's module caching behavior.
exports.configure = (config) ->
  logging_config = config
  return exports

# Main logging function.
# Logs a 'message' with 'level' to the logger named 'name'
exports.log = (name, level, message) ->
  # validation
  assert.ok(LEVELS[level]?, "Unknown logging level '#{level}'")
  assert.ok(logging_config?, "Nogg wasn't configured. Call require('nogg').configure(...)")
  # find log route, starting with the full name,
  name_parts = name.split('.')
  for use_parts in [name_parts.length..1]
    subname = name_parts[0...use_parts].join(".")
    route_handlers = logging_config[subname]
    if route_handlers?
      write_log(route_handlers, name, level, message)
      return # we're done. we don't propagate.
      # if you want propagation, you can forward
      # to the parent logger (for now).

  # if we're here, write to the default logger
  assert.ok(logging_config.default?, "Logging route 'default' not defined")
  write_log(logging_config.default, name, level, message)

# convenience
for level, num of LEVELS
  do (level, num) ->
    exports[level] = (name, message) ->
      exports.log name, level, message

# convenience, wraps the logger name into an object
class exports.Logger
  constructor: (@name) ->
  log: (level, message) ->
    exports.log @name, level, message
  for level, num of LEVELS
    do (level, num) =>
      this::[level] = (message) ->
        this.log(level, message)

# convenience, return a new logger
exports.logger = (name) ->
  return new exports.Logger(name)
