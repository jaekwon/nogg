Nogg: Simple logging for node.js
================================

Configure your logger in config.coffee/config.js in your NODE_PATH:

    exports.logging = {

      'default': [
        {file: 'logs/app.log',    level: 'debug'},
        {file: 'stdout',          level: 'warn'}]

      'foo': [
        {file: 'logs/foo.log',    level: 'debug'},
        {forward: 'default'}]

      'access': [
        {file: 'logs/access.log', formatter: null}]

    }

Then,

    logger = require('nogg').logger('foo.bar')
    logger.debug('this is a debug message')                           # logs to logs/foo.log and logs/app.log
    logger.error('this is an error')                                  # logs to logs/foo.log, logs/app.log, and stdout

    require('nogg').log 'bar.baz', 'debug', 'this is a debug message' # logs to logs/app.log (matches 'default')
    require('nogg').warn 'bar', 'this is a warning'                   # logs to logs/app.log and stdout

 - The 'default' and 'foo' are "log routes". You must define the 'default' route.
 - Each log route has N handlers.
 - Log route are "dot aware", so log messages to "foo.bar" will match the "foo" route unless "foo.bar" happens to be defined.
 - Messages do not propagate up (ala log4j).
 - stdout messages are in color.
 - You can turn off formatting/color for a handler with formatter: null.

Installation
============

    npm install nogg

Roadmap
=======

 - Real log formatting
 - Connect module for request logging

Development
===========

`npm link .` maybe as sudo, to link this project directory globally.
`cake build` to build src/*.coffee to lib/*
`cake test` to build and run a test script
