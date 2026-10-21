/**
 * Lamport Logical Clock implementation
 * Rule 1: Before an internal event, increment clock: L = L + 1
 * Rule 2: When receiving a message with timestamp L_msg: L = max(L, L_msg) + 1
 */
class LamportClock {
  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  // Increment on internal event
  tick() {
    this.value += 1;
    return this.value;
  }

  // Update on message receipt
  update(incomingValue) {
    this.value = Math.max(this.value, Number(incomingValue) || 0) + 1;
    return this.value;
  }

  getValue() {
    return this.value;
  }
}

module.exports = LamportClock;
