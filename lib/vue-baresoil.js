import { extend, get, isFunction, once } from 'lodash'
import { getScript } from 'jquery'
import TinyEmitter from 'tiny-emitter'


class BaresoilClientLoader extends TinyEmitter {
  constructor (Vue, options) {
    super()
    const defaultServerUrl = window.location.origin + '/__bs__/live'
    this.vue = Vue
    this.options = options
    this.serverUrl = options.serverUrl || defaultServerUrl
    this.clientLibraryUrl = this.serverUrl.replace(
        /live$/, 'client/BaresoilClient.js')
    this.libraryStatus = 'not_loaded'
    this.connectionStatus = 'offline'
  }
  status () {
    return this.libraryStatus
  }
  loadClientLibrary (cb) {
    if (this.libraryStatus === 'loading' || this.libraryStatus === 'loaded') {
      return cb()
    }

    var options = this.options
    var vue = this.vue
    var loader = this
    var cbOnce = once(cb)
    var emitter = loader
    vue.set(this, 'libraryStatus', 'loading')

    getScript(this.clientLibraryUrl).done(function(script, textStatus) {
      // Script loaded and executed successfully.
      vue.set(loader, 'libraryStatus', 'loaded')

      // Bind key public methods of BaresoilClient to the $baresoil global
      var bsClient = new BaresoilClient(options)
      var publicMethods = [
        'run', 'getConnectionStatus', 'setConfigParameter', 'close', 'connect'];
      publicMethods.forEach(function(key) {
        if (isFunction(bsClient[key])) {
          this[key] = bsClient[key].bind(bsClient)
        }
      }.bind(this))

      // Re-emit BaresoilClient events as our own.
      bsClient.on('*', function () {
        var args = Array.prototype.slice.call(arguments)
        if (args.length) {
          if (args[0] === 'connection_status') {
            emitter.vue.set(emitter, 'connectionStatus', args[1])
          }
        }
        emitter.emit.apply(emitter, args)
        emitter.emit.apply(emitter, ['*', args])
      })

      // Save reference to base client.
      this.bsClient_ = bsClient

      // Client has been loaded.
      return cbOnce();
    }.bind(this)).fail(function(jqXhr, settings, exception) {
      // Script load failed.
      vue.set(loader, 'libraryStatus', 'error')
      vue.set(loader, 'error', exception)
      return cbOnce(new Error('Could not load client library: ' + exception));
    }.bind(this));
  }
}


class VueBaresoil {
  constructor () {
    this.installed = false
  }

  install (Vue, options) {
    if (this.installed) return
    Object.defineProperty(Vue.prototype, '$baresoil', {
      get () { return this.$root.bsClientLoader_ }
    })
    Vue.mixin({
      beforeCreate () {
        this.bsClientLoader_ = new BaresoilClientLoader(Vue, options)
        Vue.util.defineReactive(this, 'bsClientLoader_', this.bsClientLoader_)
      }
    })
    this.installed = true
  }
}


export default new VueBaresoil()
