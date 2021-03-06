// Generated by CoffeeScript 1.3.3
(function() {
  var COLORS, LEVELS, PIDMAP, STREAM_GENERATORS, assert, colors, fs, getStream, inspect, level, loggingConfig, num, toMessage, writeLog, _fn, _ref,
    __slice = [].slice,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  try {
    colors = require('cardamom/src/colors');
  } catch (e) {
    colors = require('./colors');
  }

  assert = require('assert');

  inspect = require('util').inspect;

  try {
    loggingConfig = (_ref = require('config')) != null ? _ref.logging : void 0;
  } catch (e) {
    loggingConfig = {
      'default': [
        {
          file: 'stdout',
          level: 'debug'
        }
      ]
    };
  }

  LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 3
  };

  COLORS = {
    debug: colors.green,
    info: colors.white,
    warn: colors.yellow,
    error: colors.red,
    fatal: colors.red
  };

  STREAM_GENERATORS = {
    stdout: function() {
      return process.stdout;
    },
    stderr: function() {
      return process.stderr;
    }
  };

  PIDMAP = {};

  getStream = function(handler) {
    var name, stream, streamCache, _name;
    if (handler.file.write != null) {
      return handler.file;
    } else {
      name = handler.file;
      streamCache = (PIDMAP[_name = process.pid] || (PIDMAP[_name] = {}));
      if (streamCache[name] != null) {
        return streamCache[name];
      }
      if (STREAM_GENERATORS[name] != null) {
        stream = STREAM_GENERATORS[name]();
      } else {
        stream = {
          write: function(msg, encoding) {
            if (encoding == null) {
              encoding = 'utf8';
            }
            return fs.appendFileSync(name, msg, encoding);
          }
        };
      }
      return (streamCache[name] = stream);
    }
  };

  this.setStream = function(name, streamGen) {
    var _ref1;
    STREAM_GENERATORS[name] = streamGen;
    return (_ref1 = PIDMAP[process.pid]) != null ? delete _ref1[name] : void 0;
  };

  writeLog = function(handler, name, level, message) {
    var logLine, wstream, _handler, _i, _len;
    if (handler instanceof Array) {
      for (_i = 0, _len = handler.length; _i < _len; _i++) {
        _handler = handler[_i];
        writeLog(_handler, name, level, message);
      }
      return;
    }
    if ((handler.level != null) && LEVELS[handler.level] > LEVELS[level]) {
      return;
    }
    if (handler.forward != null) {
      exports.log(handler.forward, level, message);
      return;
    }
    if (handler.formatter === null) {
      logLine = message;
    } else if (handler.formatter === void 0) {
      logLine = "   " + (COLORS[level](level + ' -')) + " " + (colors.blue('[' + name + ']')) + " " + message + "\n";
    } else {
      logLine = handler.formatter({
        level: level,
        name: name,
        message: message
      });
    }
    wstream = getStream(handler);
    try {
      return wstream.write(logLine, 'utf8');
    } catch (e) {
      return console.log("ERROR IN LOGGING: COULD NOT WRITE TO FILE " + handler.file + ". " + e.stack);
    }
  };

  this.configure = function(config) {
    loggingConfig = config;
    return exports;
  };

  toMessage = function(obj) {
    if (typeof obj === 'object') {
      return inspect(obj);
    } else {
      return '' + obj;
    }
  };

  exports.log = function() {
    var level, message, name, nameParts, routeHandlers, subname, useParts, x, _i, _ref1;
    name = arguments[0], level = arguments[1], message = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    assert.ok(LEVELS[level] != null, "Unknown logging level '" + level + "'");
    assert.ok(loggingConfig != null, "Nogg wasn't configured. Call require('nogg').configure(...)");
    switch (message.length) {
      case 0:
        message = '';
        break;
      case 1:
        message = toMessage(message[0]);
        break;
      default:
        message = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = message.length; _i < _len; _i++) {
            x = message[_i];
            _results.push(toMessage(x));
          }
          return _results;
        })()).join(' ');
    }
    nameParts = name.split('.');
    for (useParts = _i = _ref1 = nameParts.length; _ref1 <= 1 ? _i <= 1 : _i >= 1; useParts = _ref1 <= 1 ? ++_i : --_i) {
      subname = nameParts.slice(0, useParts).join(".");
      routeHandlers = loggingConfig[subname];
      if (routeHandlers != null) {
        writeLog(routeHandlers, name, level, message);
        return;
      }
    }
    assert.ok(loggingConfig["default"] != null, "Logging route 'default' not defined");
    return writeLog(loggingConfig["default"], name, level, message);
  };

  _fn = function(level, num) {
    return exports[level] = function() {
      var message, name;
      name = arguments[0], message = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return exports.log.apply(exports, [name, level].concat(__slice.call(message)));
    };
  };
  for (level in LEVELS) {
    num = LEVELS[level];
    _fn(level, num);
  }

  exports.Logger = (function() {
    var _fn1,
      _this = this;

    function Logger(name) {
      this.name = name;
      this.log = __bind(this.log, this);

      for (level in LEVELS) {
        num = LEVELS[level];
        this[level] = Logger.prototype[level].bind(this);
      }
    }

    Logger.prototype.log = function() {
      var level, message;
      level = arguments[0], message = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return exports.log.apply(exports, [this.name, level].concat(__slice.call(message)));
    };

    _fn1 = function(level, num) {
      return Logger.prototype[level] = function() {
        var message;
        message = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return this.log.apply(this, [level].concat(__slice.call(message)));
      };
    };
    for (level in LEVELS) {
      num = LEVELS[level];
      _fn1(level, num);
    }

    return Logger;

  }).call(this);

  exports.logger = function(name) {
    return new exports.Logger(name);
  };

}).call(this);
