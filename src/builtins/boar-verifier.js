/**
 * Client‑side Boar verification module.
 * Replicates Boar's Prediction, Reach, and Timer checks for movement validation.
 * Call verifier.tick(playerState, tickMovement, authInputData) after every physics tick.
 */

const Vec3 = require('vec3').Vec3;

class BoarVerifier {
  constructor(options = {}) {
    this.config = {
      acceptanceThreshold: options.acceptanceThreshold ?? 0.001,
      alertThreshold: options.alertThreshold ?? 0.1,
      toleranceReach: options.toleranceReach ?? 3.0,
      maxBalanceAdvantage: options.maxBalanceAdvantage ?? 50,
      disabledChecks: options.disabledChecks ?? [],
    };

    // Prediction check internal state
    this.predictionChecks = {
      Phase: { fails: 0 },
      Velocity: { fails: 0 },
      Strafe: { fails: 0 },
      Speed: { fails: 0 },
      Flight: { fails: 0 },
      Collisions: { fails: 0 },
    };

    // Timer check state
    this.lastNS = 0;
    this.balance = 0;
    this.loseBalance = 0;
    this.prevTick = 0;
    this.beforeAuthInput = false;

    // Reach check state
    this.queuedHits = [];
    this.lastHitValid = true;
  }

  /**
   * Called on each physics tick with the player state and the auth input data (or server update).
   * @param {object} player - current player state (must have position, velocity, inputData, etc.)
   * @param {object} movement - the movement vector that was applied (pre‑collision velocity)
   * @param {bigint} inputData - PlayerAuthInput data flags
   * @param {object} hint - optional { horizontalCollision, verticalCollision, unvalidatedPosition }
   */
  tick(player, movement, inputData, hint = {}) {
    const tick = player.tick ?? 0n;
    if (tick < 10) return;

    // ── Prediction Check ──
    const offset = this._computeOffset(player, hint);
    if (offset > this.config.acceptanceThreshold) {
      this._runPredictionChecks(player, movement, inputData, hint, offset);
    }

    // ── Timer Check ──
    this._runTimerCheck(player, tick);
  }

  /**
   * Called when an attack was attempted (InventoryTransaction or InteractPacket).
   * @param {object} attackerPos - player position at attack time
   * @param {object} victimPos - victim entity position
   * @param {number} victimWidth - victim width (used for bounding box expansion)
   */
  queueHit(attackerPos, victimPos, victimWidth = 0.6) {
    this.queuedHits.push({ attackerPos: attackerPos.clone(), victimPos: victimPos.clone(), victimWidth });
  }

  /**
   * Poll queued hits after the auth input has been processed.
   * Returns array of { valid, distance, reason } for each hit.
   */
  pollQueuedHits(playerState) {
    const results = [];
    for (const hit of this.queuedHits) {
      const reach = this._calculateReach(playerState, hit.attackerPos, hit.victimPos, hit.victimWidth);
      const valid = reach <= this.config.toleranceReach;
      if (!valid) {
        results.push({ valid: false, distance: reach, reason: 'entity out of range' });
      } else {
        results.push({ valid: true, distance: reach, reason: '' });
      }
      this.lastHitValid = valid;
    }
    this.queuedHits = [];
    return results;
  }

  // ── Internal methods ──

  _computeOffset(player, hint) {
    const unvalidatedPos = hint.unvalidatedPosition || player.unvalidatedPosition || player.position;
    const predictedPos = player.position;
    return predictedPos.distanceTo(unvalidatedPos);
  }

  _runPredictionChecks(player, movement, inputData, hint, offset) {
    if (offset < this.config.alertThreshold) return;

    // Phase check
    const claimedVertical = (inputData & (1n << BigInt(1))) !== 0n; // VERTICAL_COLLISION bit
    const claimedHorizontal = (inputData & (1n << BigInt(2))) !== 0n; // HORIZONTAL_COLLISION bit
    if (claimedVertical !== hint.verticalCollision || claimedHorizontal !== hint.horizontalCollision) {
      this._fail('Phase', `o: ${offset}`, { expected: `(${hint.horizontalCollision},${hint.verticalCollision})`, actual: `(${claimedHorizontal},${claimedVertical})` });
    }

    // Velocity check (simplified)
    if (movement && movement.type === 'VELOCITY') {
      this._fail('Velocity', `o: ${offset}`);
      return;
    }

    // Collisions check (simplified)
    if (player.unvalidatedTickEnd && player.velocity.distanceTo(player.unvalidatedTickEnd) < this.config.acceptanceThreshold) {
      this._fail('Collisions', `o: ${offset}`);
    }

    // Strafe check – compare direction of actual vs predicted movement
    const actualDelta = player.unvalidatedPosition ? player.position.clone().subtract(player.unvalidatedPosition) : new Vec3(0, 0, 0);
    const predictedDelta = movement ? new Vec3(movement.x, movement.y, movement.z) : player.velocity.clone();
    if (actualDelta.x * predictedDelta.x < 0 || actualDelta.z * predictedDelta.z < 0) {
      this._fail('Strafe', `o: ${offset}`);
    }

    // Speed check – actual horizontal speed larger than predicted
    const actualHSpeed = Math.hypot(actualDelta.x, actualDelta.z);
    const predictedHSpeed = Math.hypot(predictedDelta.x, predictedDelta.z);
    if (actualHSpeed > predictedHSpeed) {
      this._fail('Speed', `o: ${offset}`, { expected: predictedHSpeed, actual: actualHSpeed });
    }

    // Flight check – vertical difference
    const expectedY = player.unvalidatedPosition ? player.unvalidatedPosition.y : player.position.y;
    if (Math.abs(player.position.y - expectedY) > this.config.acceptanceThreshold * 10) {
      this._fail('Flight', `o: ${offset}`);
    }
  }

  _runTimerCheck(player, tick) {
    const now = process.hrtime.bigint(); // ns
    const ns = Number(now);
    const averageDistance = 5e7; // 50ms per tick

    if (this.lastNS === 0 || player.inLoadingScreen) {
      this.lastNS = ns;
      this.prevTick = Number(tick);
      this.balance = 0;
      return;
    }

    const distance = ns - this.lastNS;
    const neededDistance = (Number(tick) - this.prevTick) * averageDistance;
    const limit = averageDistance + 1e7 + 3e6;

    if (this.balance > limit) {
      this.balance -= averageDistance;
      if (this.balance - this.loseBalance > limit) {
        this._fail('Timer', `balance=${this.balance}`, { playerAhead: true });
      }
    } else {
      const maxBalanceAdvantage = Math.max(0, (this.config.maxBalanceAdvantage || 0) * 1e6);
      if (this.balance <= -Math.abs(maxBalanceAdvantage + averageDistance) && maxBalanceAdvantage > 0) {
        this.loseBalance = Math.abs(this.balance);
        this.balance = -averageDistance;
      }
    }

    this.balance -= distance - neededDistance;
    this.lastNS = Math.max(this.lastNS, ns);
    this.prevTick = Number(tick);
    this.beforeAuthInput = true;
  }

  _calculateReach(playerState, attackerPos, victimPos, victimWidth) {
    // Simplified reach calculation – raycast to victim bounding box
    const eyePos = new Vec3(attackerPos.x, attackerPos.y + 1.62, attackerPos.z);
    const toVictim = victimPos.clone().subtract(eyePos);
    const distance = toVictim.length();
    // Subtract victim half‑width for a rough torso distance
    const halfWidth = victimWidth / 2;
    const adjusted = Math.max(0, distance - halfWidth);
    return adjusted;
  }

  _fail(checkName, verbose, extra = {}) {
    if (this.config.disabledChecks.includes(checkName)) return;
    // Log failure to console
    console.log(`[BoarVerifier] FAIL ${checkName}: ${verbose}`, extra);
    this.predictionChecks[checkName].fails++;
  }
}

// module.exports = BoarVerifier;