# vue-baresoil

Vue.js plugin to dynamically load and expose an instance of [BaresoilClient](https://docs.baresoil.com/api/#BaresoilClient). Although you can directly install and `import`/`require` the `BaresoilClient` library into your project, it is better to load the latest version of the client library from the server.

This Vue.js plugin asynchronously loads the client library from the server, creates a singleton instance of `BaresoilClient`, and exposes it to the Vue application through the global constant `$baresoil` (similar to vue-router's `$route` or vuex's `$store`).

**Note:** this module requires ES6 module support, e.g. via Babel/Webpack.

### Install

    npm install --save vue-baresoil

### Usage

First, import the plugin and add it to Vue.

    import Vue from 'vue'
    import VueBaresoil from 'vue-baresoil'

    var options = {
      connectPolicy: auto
    }

    Vue.use(VueBaresoil, BaresoilClientOptions)

You can now access a global instance of `BaresoilClient` using the `$baresoil` property in templates and component functions.

For example, to run a server-side handler:

    this.$baresoil.run('some-function', 'arg', function (err, result) {
    })

To listen for `user_event`s:

    this.$baresoil.on('user_event', function(evtName, evtData) {
    })

The following properties are exposed on `$baresoil` and should be fully reactive.

  * **connectionStatus**: Current status of the Websocket connection to the server. One of `offline`, `connecting`, `setup`, `connected`, `error`.
  * **libraryStatus**: Whether the client library has been dynamically loaded from the server via the `/__bs__/client/BaresoilClient.js` endpoint. One of `not_loaded`, `error`, or `loaded`.

Use the exposed properties directly in templates:

    <div>{{ $baresoil.connectionStatus }}</div>

Or in Vue expressions:

    <div v-if='$baresoil.connectionStatus == "connected"'>Connected!</div>

### Documentation / Website

  * Read [Baresoil documentation](https://docs.baresoil.com/), specifically the section on [BaresoilClient](https://docs.baresoil.com/api/#BaresoilClient).
  * Learn more [about Baresoil](https://www.baresoil.com/).
