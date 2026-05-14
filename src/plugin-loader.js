const fs = require('fs')
const path = require('path')

const loaderStates = new WeakMap()

function ensureState (botState) {
  if (!loaderStates.has(botState)) {
    loaderStates.set(botState, {
      plugins: [],
      injected: false
    })
  }

  return loaderStates.get(botState)
}

function loadPlugin (botState, plugin) {
  const state = ensureState(botState)
  if (state.plugins.includes(plugin)) return

  state.plugins.push(plugin)
  if (state.injected) plugin(botState, botState.options)
}

function loadPlugins (botState, plugins = []) {
  plugins.forEach(plugin => loadPlugin(botState, plugin))
}

function hasPlugin (botState, plugin) {
  return ensureState(botState).plugins.includes(plugin)
}

function isInjected (botState) {
  return ensureState(botState).injected
}

function injectPlugins (botState) {
  const state = ensureState(botState)
  state.plugins.forEach(plugin => plugin(botState, botState.options))
  state.injected = true
}

function shouldLoadBuiltin (botState, entry) {
  if (entry === 'chunks.js' && !botState.worldDecodeEnabled) return false
  if ((entry === 'physics.js' || entry === 'physics') && !botState.physicsEnabled) return false
  return true
}

function loadBuiltins (botState) {
  const builtinsDir = path.join(__dirname, 'builtins')
  if (!fs.existsSync(builtinsDir)) return

  const entries = fs.readdirSync(builtinsDir)
  for (const entry of entries) {
    if (!shouldLoadBuiltin(botState, entry)) continue

    const entryPath = path.join(builtinsDir, entry)
    const stat = fs.statSync(entryPath)
    let pluginPath = null

    if (stat.isFile() && entry.endsWith('.js')) {
      pluginPath = entryPath
    } else if (stat.isDirectory()) {
      const indexPath = path.join(entryPath, 'index.js')
      const siblingFilePath = path.join(builtinsDir, `${entry}.js`)
      if (!fs.existsSync(siblingFilePath) && fs.existsSync(indexPath)) pluginPath = indexPath
    }

    if (!pluginPath) continue

    const plugin = require(pluginPath)
    if (typeof plugin === 'function') plugin(botState, botState.options)
  }
}

function injectAll (botState) {
  loadBuiltins(botState)
  injectPlugins(botState)
}

module.exports = {
  ensureState,
  hasPlugin,
  injectAll,
  injectPlugins,
  isInjected,
  loadBuiltins,
  loadPlugin,
  loadPlugins,
  shouldLoadBuiltin
}
