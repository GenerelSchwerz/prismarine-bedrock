const { Vec3 } = require('vec3')
const { normalizePose } = require('../../entity-metadata')

const POSE_EYE_HEIGHTS = {
  standing: Math.fround(1.62),
  sneaking: Math.fround(1.27),
  swimming: Math.fround(0.4),
  crawling: Math.fround(0.4),
  fall_flying: Math.fround(0.4),
  gliding: Math.fround(0.4),
  sleeping: Math.fround(0.2)
}

function poseFor (self) {
  if (!self) return 'standing'
  if (self.swimming) return 'swimming'
  if (self.crawling || self.metadataFlagsExtended?.crawling) return 'crawling'
  if (self.gliding || self.fallFlying) return 'fall_flying'
  if (self.sneaking || self.crouching || self.serverSneaking) return 'sneaking'
  return normalizePose(self.pose ?? self.inferredPose)
}

function eyeHeightFor (self, C) {
  const pose = poseFor(self)
  return POSE_EYE_HEIGHTS[pose] ?? Math.fround(C?.EYE_HEIGHT ?? 1.62)
}

function updateSelfEyeHeight (self, C) {
  const eyeHeight = eyeHeightFor(self, C)
  if (self) self.eyeHeight = eyeHeight
  return eyeHeight
}

function toFeetPosition (position, self, C) {
  if (!position) return null
  const eyeHeight = updateSelfEyeHeight(self, C)
  return new Vec3(position.x, position.y - eyeHeight, position.z)
}

function toEyePosition (position, self, C) {
  if (!position) return null
  const eyeHeight = updateSelfEyeHeight(self, C)
  return new Vec3(position.x, position.y + eyeHeight, position.z)
}

function setSelfEyePosition (self, position, C) {
  if (!self?.position || !position) return
  updateSelfEyeHeight(self, C)
  self.position.set(position.x, position.y, position.z)
}

function withSelfFeetPosition (self, C, fn) {
  if (!self?.position) return fn()

  const eyePosition = self.position.clone()
  updateSelfEyeHeight(self, C)
  self.position = toFeetPosition(eyePosition, self, C)

  try {
    const result = fn()
    const feetPosition = self.position
    self.position = toEyePosition(feetPosition, self, C)
    return result
  } catch (err) {
    self.position = eyePosition
    throw err
  }
}

module.exports = {
  eyeHeightFor,
  poseFor,
  setSelfEyePosition,
  toEyePosition,
  toFeetPosition,
  updateSelfEyeHeight,
  withSelfFeetPosition
}
