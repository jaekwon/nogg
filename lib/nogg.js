(function() {
  var COLORS, LEVELS, PIDMAP, STREAM_GENERATORS, assert, colors, fs, getWritestream, level, loggingConfig, num, writeLog, _fn, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  colors = require('./colors');

  assert = require('assert');

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
    error: 3
  };

  COLORS = {
    debug: colors.green,
    info: colors.white,
    warn: colors.yellow,
    error: colors.red
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

  getWritestream = function(name) {
    var stream, streamCache, _name;
    streamCache = (PIDMAP[_name = process.pid] || (PIDMAP[_name] = {}));
    if (streamCache[name] != null) return streamCache[name];
    if (STREAM_GENERATORS[name] != null) {
      stream = STREAM_GENERATORS[name]();
    } else {
      stream = fs.createWriteStream(name, {
        flags: 'a',
        mode: 0666
      });
    }
    return (streamCache[name] = stream);
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
    if ((handler.level != null) && LEVELS[handler.level] > LEVELS[level]) return;
    if (handler.forward != null) {
      exports.log(handler.forward, level, message);
      return;
    }
    if (handler.formatter === null) {
      logLine = message;
    } else {
      logLine = "" + (new Date()) + "\t" + level + "\t" + name + " - " + message + "\n";
      if (handler.file === 'stdout') logLine = COLORS[level](logLine);
    }
    wstream = getWritestream(handler.file);
    try {
      return wstream.write(logLine, 'utf8');
    } catch (e) {
      return console.log("ERROR IN LOGGING: COULD NOT WRITE TO FILE " + handler.file);
    }
  };

  exports.configure = function(config) {
    loggingConfig = config;
    return exports;
  };

  exports.setStream = function(name, streamGen) {
    var _ref2;
    STREAM_GENERATORS[name] = streamGen;
    return (_ref2 = PIDMAP[process.pid]) != null ? delete _ref2[name] : void 0;
  };

  exports.log = function(name, level, message) {
    var nameParts, routeHandlers, subname, useParts, _ref2;
    assert.ok(LEVELS[level] != null, "Unknown logging level '" + level + "'");
    assert.ok(loggingConfig != null, "Nogg wasn't configured. Call require('nogg').configure(...)");
    nameParts = name.split('.');
    for (useParts = _ref2 = nameParts.length; _ref2 <= 1 ? useParts <= 1 : useParts >= 1; _ref2 <= 1 ? useParts++ : useParts--) {
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
    return exports[level] = function(name, message) {
      return exports.log(name, level, message);
    };
  };
  for (level in LEVELS) {
    num = LEVELS[level];
    _fn(level, num);
  }

  exports.Logger = (function() {
    var level, num, _fn2;
    var _this = this;

    function Logger(name) {
      var level, num;
      this.name = name;
      this.log = __bind(this.log, this);
      for (level in LEVELS) {
        num = LEVELS[level];
        this[level] = Logger.prototype[level].bind(this);
      }
    }

    Logger.prototype.log = function(level, message) {
      return exports.log(this.name, level, message);
    };

    _fn2 = function(level, num) {
      return Logger.prototype[level] = function(message) {
        return this.log(level, message);
      };
    };
    for (level in LEVELS) {
      num = LEVELS[level];
      _fn2(level, num);
    }

    return Logger;

  }).call(this);

  exports.logger = function(name) {
    return new exports.Logger(name);
  };

}).call(this);
