const bedrock = require('bedrock-protocol');
const Vec3 = require('vec3').Vec3;
const { logAction } = require('./utils');
const { EventEmitter } = require('stream');

class BotState extends EventEmitter {
  constructor (options) {
    super();
    this.options = { ...options };
    const registry = require('prismarine-registry')(`bedrock_${options.version}`);

    this.registry = registry;

    this.client = null;

    // Shared state
    this.currentTargetBlock = null;
    this.targetStateIds = null;
    this.isDead = false;
    this.respawnTimeout = null;
    this.playerHealth = null;
    this.spawnPosition = null;
    this.spawnRotation = null;
    this.playerGamemode = null;
    this.chunkCount = 0;

    // Plugin system
    this.plugins = [];
    this.pluginsInjected = false;

    // ── Normalized prismarine‑X instantiations ──
    this.entityClass = require('prismarine-entity')(registry);
    this.itemClass = require('prismarine-item')(registry);
    this.blockClass = require('prismarine-block')(registry);
    this.chatMessageClass = require('prismarine-chat')(registry);
    this.windowFactory = require('prismarine-windows')(registry);
    this.chunkColumn = require('prismarine-chunk')(registry);
    this.worldClass = require('prismarine-world')(registry);

    this.world = new this.worldClass(null);

    // Entity & player storage (populated by entityHandler / playerHandler)
    this.entities = new Map();
    this.players = new Map();
    this.self = null;
  }

  loadPlugin (plugin) {
    if (this.plugins.indexOf(plugin) !== -1) return;
    this.plugins.push(plugin);
    if (this.pluginsInjected) {
      plugin(this, this.options);
    }
  }

  loadPlugins (plugins) {
    plugins.forEach(p => this.loadPlugin(p));
  }

  hasPlugin (plugin) {
    return this.plugins.indexOf(plugin) !== -1;
  }

  injectPlugins () {
    this.plugins.forEach(p => p(this, this.options));
    this.pluginsInjected = true;
  }

  _loadBuiltins () {
    const path = require('path');
    const fs = require('fs');
    const builtinsDir = path.join(__dirname, 'builtins');
    if (!fs.existsSync(builtinsDir)) return;
    const entries = fs.readdirSync(builtinsDir);
    for (const entry of entries) {
      const entryPath = path.join(builtinsDir, entry);
      const stat = fs.statSync(entryPath);
      let pluginPath = null;
      if (stat.isFile() && entry.endsWith('.js')) {
        pluginPath = entryPath;
      } else if (stat.isDirectory()) {
        const indexPath = path.join(entryPath, 'index.js');
        const siblingFilePath = path.join(builtinsDir, `${entry}.js`);
        if (!fs.existsSync(siblingFilePath) && fs.existsSync(indexPath)) pluginPath = indexPath;
      }
      if (!pluginPath) continue;
      const plugin = require(pluginPath);
      if (typeof plugin === 'function') {
        plugin(this, this.options);
      }
    }
  }

  start () {
    this.client = bedrock.createClient({ ...this.options, delayedInit: true });
    this.client.registry = this.registry;

    this._loadBuiltins();
    this.injectPlugins();
  }

  disconnect (reason = 'Client shutting down') {
    logAction('[→]', 'disconnect', { reason });
    if (this.client.status !== 0) {
      this.client.disconnect(reason);
    } else {
      this.client.close();
    }
  }

  async getBlock(pos) {
    try {
      return await this.world.getBlock(pos);
    } catch (err) {
      console.error(err)
      return null;
    }
  }
}

module.exports = BotState;
