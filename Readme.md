Nogg: A simple logging utility
==============================

Configure your logger in config.coffee/config.js in your NODE_PATH:

    exports.logging = {

     'default': [
       {file: 'logs/app.log',    level: 'debug'},
       {file: 'stdout',          level: 'warn'}]

     'db': [
       {file: 'logs/db.log',     level: 'debug'},
       {forward: 'default'}]

    }

Then,

    logger = require('nogg').logger('db.query')
    logger.debug('this is a debug message')                           # logs to logs/db.log and logs/app.log
    logger.error('this is an error')                                  # logs to logs/db.log, logs/app.log, and stdout

    require('nogg').log 'foo.bar', 'debug', 'this is a debug message' # logs to logs/app.log (matches 'default')
    require('nogg').warn 'foo.bar', 'this is a warning'               # logs to logs/app.log and stdout

 - The 'default' and 'db' keys are "log routes".
 - Each log route has N handlers.
 - Log route are "dot aware", so logging to "db.foo" will match the "db" route unless "db.foo" is also defined.
 - stdout messages are in color.

Development
===========

coffee -o lib src/*
