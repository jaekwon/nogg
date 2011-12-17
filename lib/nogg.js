(function() {
  var COLORS, LEVELS, PIDMAP, STREAM_GENERATORS, assert, colors, fs, get_writestream, level, logging_config, num, write_log, _fn, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  fs = require('fs');

  colors = require('./colors');

  assert = require('assert');

  try {
    logging_config = (_ref = require('config')) != null ? _ref.logging : void 0;
  } catch (e) {
    logging_config = {
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

  get_writestream = function(name) {
    var stream, stream_cache, _name;
    stream_cache = (PIDMAP[_name = process.pid] || (PIDMAP[_name] = {}));
    if (stream_cache[name] != null) return stream_cache[name];
    if (STREAM_GENERATORS[name] != null) {
      stream = STREAM_GENERATORS[name]();
    } else {
      stream = fs.createWriteStream(name, {
        flags: 'a',
        mode: 0666
      });
    }
    return (stream_cache[name] = stream);
  };

  write_log = function(handler, name, level, message) {
    var log_line, wstream, _handler, _i, _len;
    if (handler instanceof Array) {
      for (_i = 0, _len = handler.length; _i < _len; _i++) {
        _handler = handler[_i];
        write_log(_handler, name, level, message);
      }
      return;
    }
    if ((handler.level != null) && LEVELS[handler.level] > LEVELS[level]) return;
    if (handler.forward != null) {
      exports.log(handler.forward, level, message);
      return;
    }
    if (handler.formatter === null) {
      log_line = message;
    } else {
      log_line = "" + (new Date()) + "\t" + level + "\t" + name + " - " + message + "\n";
      if (handler.file === 'stdout') log_line = COLORS[level](log_line);
    }
    wstream = get_writestream(handler.file);
    try {
      return wstream.write(log_line, 'utf8');
    } catch (e) {
      return console.log("ERROR IN LOGGING: COULD NOT WRITE TO FILE " + handler.file);
    }
  };

  exports.configure = function(config) {
    logging_config = config;
    return exports;
  };

  exports.set_stream = function(name, stream_gen) {
    var _ref2;
    STREAM_GENERATORS[name] = stream_gen;
    return (_ref2 = PIDMAP[process.pid]) != null ? delete _ref2[name] : void 0;
  };

  exports.log = function(name, level, message) {
    var name_parts, route_handlers, subname, use_parts, _ref2;
    assert.ok(LEVELS[level] != null, "Unknown logging level '" + level + "'");
    assert.ok(logging_config != null, "Nogg wasn't configured. Call require('nogg').configure(...)");
    name_parts = name.split('.');
    for (use_parts = _ref2 = name_parts.length; _ref2 <= 1 ? use_parts <= 1 : use_parts >= 1; _ref2 <= 1 ? use_parts++ : use_parts--) {
      subname = name_parts.slice(0, use_parts).join(".");
      route_handlers = logging_config[subname];
      if (route_handlers != null) {
        write_log(route_handlers, name, level, message);
        return;
      }
    }
    assert.ok(logging_config["default"] != null, "Logging route 'default' not defined");
    return write_log(logging_config["default"], name, level, message);
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
