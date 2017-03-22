'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _jquery = require('jquery');

var _tinyEmitter = require('tiny-emitter');

var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BaresoilClientLoader = function (_TinyEmitter) {
  _inherits(BaresoilClientLoader, _TinyEmitter);

  function BaresoilClientLoader(Vue, options) {
    _classCallCheck(this, BaresoilClientLoader);

    var _this = _possibleConstructorReturn(this, (BaresoilClientLoader.__proto__ || Object.getPrototypeOf(BaresoilClientLoader)).call(this));

    var defaultServerUrl = window.location.origin + '/__bs__/live';
    _this.vue = Vue;
    _this.options = options;
    _this.serverUrl = options.serverUrl || defaultServerUrl;
    _this.clientLibraryUrl = _this.serverUrl.replace(/live$/, 'client/BaresoilClient.js');
    _this.libraryStatus = 'not_loaded';
    _this.connectionStatus = 'offline';
    return _this;
  }

  _createClass(BaresoilClientLoader, [{
    key: 'status',
    value: function status() {
      return this.libraryStatus;
    }
  }, {
    key: 'loadClientLibrary',
    value: function loadClientLibrary(cb) {
      if (this.libraryStatus === 'loading' || this.libraryStatus === 'loaded') {
        return cb();
      }

      var options = this.options;
      var vue = this.vue;
      var loader = this;
      var cbOnce = (0, _lodash.once)(cb);
      var emitter = loader;
      vue.set(this, 'libraryStatus', 'loading');

      (0, _jquery.getScript)(this.clientLibraryUrl).done(function (script, textStatus) {
        // Script loaded and executed successfully.
        vue.set(loader, 'libraryStatus', 'loaded');

        // Bind key public methods of BaresoilClient to the $baresoil global
        var bsClient = new BaresoilClient(options);
        var publicMethods = ['run', 'getConnectionStatus', 'setConfigParameter', 'close', 'connect'];
        publicMethods.forEach(function (key) {
          if ((0, _lodash.isFunction)(bsClient[key])) {
            this[key] = bsClient[key].bind(bsClient);
          }
        }.bind(this));

        // Re-emit BaresoilClient events as our own.
        bsClient.on('*', function () {
          var args = Array.prototype.slice.call(arguments);
          if (args.length) {
            if (args[0] === 'connection_status') {
              emitter.vue.set(emitter, 'connectionStatus', args[1]);
            }
          }
          emitter.emit.apply(emitter, args);
          emitter.emit.apply(emitter, ['*', args]);
        });

        // Save reference to base client.
        this.bsClient_ = bsClient;

        // Client has been loaded.
        return cbOnce();
      }.bind(this)).fail(function (jqXhr, settings, exception) {
        // Script load failed.
        vue.set(loader, 'libraryStatus', 'error');
        vue.set(loader, 'error', exception);
        return cbOnce(new Error('Could not load client library: ' + exception));
      }.bind(this));
    }
  }]);

  return BaresoilClientLoader;
}(_tinyEmitter2.default);

var VueBaresoil = function () {
  function VueBaresoil() {
    _classCallCheck(this, VueBaresoil);

    this.installed = false;
  }

  _createClass(VueBaresoil, [{
    key: 'install',
    value: function install(Vue, options) {
      if (this.installed) return;
      Object.defineProperty(Vue.prototype, '$baresoil', {
        get: function get() {
          return this.$root.bsClientLoader_;
        }
      });
      Vue.mixin({
        beforeCreate: function beforeCreate() {
          this.bsClientLoader_ = new BaresoilClientLoader(Vue, options);
          Vue.util.defineReactive(this, 'bsClientLoader_', this.bsClientLoader_);
        }
      });
      this.installed = true;
    }
  }]);

  return VueBaresoil;
}();

exports.default = new VueBaresoil();