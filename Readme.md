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

The 'default' and 'db' keys are "log routes".
Each log route has N handlers.
Log route are "dot aware", so logging to "db.foo" will
match the "db" route unless "db.foo" is also defined.

Development
===========

coffee -o lib src/*
