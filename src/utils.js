let seq = 0

function jsonSafeReplacer (_, value) {
  if (typeof value === 'bigint') return value.toString()
  return value
}

function safeJson (value) {
  try {
    return JSON.stringify(value, jsonSafeReplacer)
  } catch (err) {
    return JSON.stringify({ error: 'failed_to_serialize_log_detail', message: err.message })
  }
}

function logAction (dir, packetName, detail = '') {
  const ts = new Date().toISOString().slice(11, 23)
  const renderedDetail = detail ? ' ' + safeJson(detail) : ''
  console.log(`[${ts}] [#${++seq}] ${dir} ${packetName}${renderedDetail}`)
}

function sameRuntimeId (a, b) {
  if (a == null || b == null) return false
  return BigInt(a) === BigInt(b)
}

function toPlainId (value) {
  if (typeof value === 'bigint') return value.toString()
  return value
}

module.exports = { logAction, sameRuntimeId, toPlainId, jsonSafeReplacer }