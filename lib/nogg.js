(function() {
  var COLORS, LEVELS, assert, colors, fs, get_writestream, level, logging_config, num, pidmap, write_log, _fn;

  fs = require('fs');

  colors = require('colors');

  logging_config = require('config').logging;

  assert = require('assert');

  LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  COLORS = {
    debug: colors.white,
    info: colors.green,
    warn: colors.yellow,
    error: colors.red
  };

  pidmap = {};

  get_writestream = function(filename) {
    var filemap, _name;
    if (filename === 'stdout') {
      return process.stdout;
    } else if (filename === 'stderr') {
      return process.stderr;
    }
    filemap = (pidmap[_name = process.pid] || (pidmap[_name] = {}));
    return (filemap[filename] || (filemap[filename] = fs.createWriteStream(filename, {
      flags: 'a',
      mode: 0666
    })));
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

  exports.log = function(name, level, message) {
    var name_parts, route_handlers, subname, use_parts, _ref;
    assert.ok(LEVELS[level] != null, "Unknown logging level '" + level + "'");
    name_parts = name.split('.');
    for (use_parts = _ref = name_parts.length; _ref <= 1 ? use_parts <= 1 : use_parts >= 1; _ref <= 1 ? use_parts++ : use_parts--) {
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
      this.name = name;
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
