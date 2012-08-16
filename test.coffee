assert = require 'assert'
try
  nogg = require 'nogg'
catch error
  console.log "Error in require('nogg'). Run `npm install nogg`, or if you have the source just `(sudo) npm link .; npm link nogg;`"
  process.exit(1)

# TODO: should capture output, like in the integration test below.
doTest = (description, testFn) ->
  # reset to default state
  nogg.configure {'default': [{file: 'stdout', level: 'debug'}]}
  logger = nogg.logger 'test'
  testFn(logger)
  console.log "* #{description}: ok"

doTest "test on the console, with colors", (logger) ->
  logger.debug "debug"
  logger.info  "info"
  logger.warn  "warn"
  logger.error "error"
  logger.fatal "fatal"

doTest "integration test", (logger) ->
  nogg.configure
   'default': [
     {file: 'test_debug', level: 'debug', formatter: null}
     {file: 'test_warn',  level: 'warn',  formatter: null}
    ]

  testOutput = []
  nogg.setStream 'test_debug', ->
    write: (message) ->
      testOutput.push(message)
    close: ->
  nogg.setStream 'test_warn', ->
    write: (message) ->
      testOutput.push(message)
    close: ->

  logger.debug 'debug!'
  logger.info  'info!'
  logger.warn  'warn!'
  logger.error 'error!'
  logger.fatal 'fatal!'

  assert.equal testOutput.join('\n'), "debug!\ninfo!\nwarn!\nwarn!\nerror!\nerror!\nfatal!\nfatal!"

doTest "test that logger functions are already bound as needed", (logger) ->

  blah = # some new object with methods detatched from logger
    debug: logger.debug
    info:  logger.info
    warn:  logger.warn
    error: logger.error
    fatal: logger.fatal

  blah.debug "debug"
  blah.info  "info"
  blah.warn  "warn", "second", "third"
  blah.error "error", "second", "third"
  blah.fatal "fatal", "second", "third"
