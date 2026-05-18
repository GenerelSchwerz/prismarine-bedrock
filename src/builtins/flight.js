'use strict'

const installAuthInput = require('./auth-input')
const { isSpectatorGameMode } = require('../entity-metadata')

function flightSnapshot (botState) {
  const self = botState.self
  const spectator = !!self?.spectator || isSpectatorGameMode(self?.gamemode ?? botState.game?.gameMode)

  return {
    canFly: !!(self?.mayFly || self?.allowFlight || spectator),
    flying: !!(self?.flying || spectator),
    spectator,
    noClip: !!self?.noClip,
    flySpeed: self?.flySpeed,
    verticalFlySpeed: self?.verticalFlySpeed,
    walkSpeed: self?.walkSpeed
  }
}

function waitForFlightChanged (botState, enabled, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out waiting for flight ${enabled ? 'start' : 'stop'} confirmation`))
    }, timeoutMs)

    function cleanup () {
      clearTimeout(timeout)
      botState.removeListener('flightChanged', onFlightChanged)
    }

    function onFlightChanged (state) {
      if (!!state.flying !== !!enabled) return
      cleanup()
      resolve(state)
    }

    botState.on('flightChanged', onFlightChanged)
  })
}

function setOptimisticFlying (botState, enabled) {
  const self = botState.self
  if (!self) return

  self.flying = !!enabled
  if (enabled) {
    self.onGround = false
    self.verticalCollision = false
    self.isCollidedVertically = false
  }
}

module.exports = function flightPlugin (botState) {
  installAuthInput(botState)

  function requestFlying (enabled, options = {}) {
    const current = flightSnapshot(botState)
    if (!!current.flying === !!enabled) {
      return options.wait ? Promise.resolve(current) : true
    }

    if (enabled && !current.canFly && !options.force) return false
    if (!botState.queuePlayerAuthInputEdit || !botState.setAuthInputFlag) {
      throw new Error('[flight] auth-input builtin is required before requesting flight')
    }

    const wait = options.wait
      ? waitForFlightChanged(botState, enabled, options.timeoutMs ?? 2000)
      : null

    if (options.optimistic !== false) setOptimisticFlying(botState, enabled)

    botState.queuePlayerAuthInputEdit((packet) => {
      botState.setAuthInputFlag(packet, 'start_flying', !!enabled)
      botState.setAuthInputFlag(packet, 'stop_flying', !enabled)
      return null
    })

    botState.emit('flightRequest', { flying: !!enabled, state: flightSnapshot(botState) })
    return wait || true
  }

  botState.startFlying = (options) => requestFlying(true, options)
  botState.stopFlying = (options) => requestFlying(false, options)
  botState.setFlying = (enabled, options) => requestFlying(!!enabled, options)
  botState.canFly = () => flightSnapshot(botState).canFly
  botState.isFlying = () => flightSnapshot(botState).flying
  botState.isSpectator = () => flightSnapshot(botState).spectator
}
