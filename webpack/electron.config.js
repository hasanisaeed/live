var merge = require('webpack-merge')
var WebpackShellPlugin = require('webpack-shell-plugin')
var baseConfig = require('./base.config.js')

var plugins = []

/* In dev mode, also run Electron and let it load the live bundle */
if (process.env.NODE_ENV !== 'production' && process.env.DEPLOYMENT !== '1') {
  plugins.push(
    new WebpackShellPlugin({
      onBuildEnd: ['electron launcher.js'],
      dev: true
    })
  )
}

module.exports = merge.smart(baseConfig, {
  entry: './src/index',
  output: {
    filename: 'bundle.js'
  },

  plugins: plugins
})