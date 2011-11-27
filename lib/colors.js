(function() {
  var _wrap_with;

  _wrap_with = function(code) {
    return function(text, bold) {
      return "\033[" + (bold ? '1;' : '') + code + "m" + text + "\033[0m";
    };
  };

  exports.red = _wrap_with('31');

  exports.green = _wrap_with('32');

  exports.yellow = _wrap_with('33');

  exports.blue = _wrap_with('34');

  exports.magenta = _wrap_with('35');

  exports.cyan = _wrap_with('36');

  exports.white = _wrap_with('37');

  exports.normal = function(text) {
    return text;
  };

}).call(this);
