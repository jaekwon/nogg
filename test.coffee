assert = require 'assert'
nogg = require 'nogg'

# TODO: should capture output, like in the integration test below.
do_test = (description, test_fn) ->
  # reset to default state
  nogg.configure {'default': [{file: 'stdout', level: 'debug'}]}
  logger = nogg.logger 'test'
  test_fn(logger)
  console.log "* #{description}: ok"

do_test "test on the console, with colors", (logger) ->
  logger.debug "debug"
  logger.info  "info"
  logger.warn  "warn"
  logger.error "error"

do_test "integration test", (logger) ->
  nogg.configure
   'default': [
     {file: 'test_debug', level: 'debug', formatter: null}
     {file: 'test_warn',  level: 'warn',  formatter: null}
    ]

  test_output = []
  nogg.set_stream 'test_debug', ->
    write: (message) ->
      test_output.push(message)
    close: ->
  nogg.set_stream 'test_warn', ->
    write: (message) ->
      test_output.push(message)
    close: ->

  logger.debug 'debug!'
  logger.info  'info!'
  logger.warn  'warn!'
  logger.error 'error!'

  assert.equal test_output.join('\n'), "debug!\ninfo!\nwarn!\nwarn!\nerror!\nerror!"

do_test "test that logger functions are already bound as needed", (logger) ->

  blah = # some new object with methods detatched from logger
    debug: logger.debug
    info:  logger.info
    warn:  logger.warn
    error: logger.error

  blah.debug "debug"
  blah.info  "info"
  blah.warn  "warn"
  blah.error "error"
