class LamportClock {
  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  tick() {
    this.value += 1;
    return this.value;
  }

  update(incomingValue) {
    this.value = Math.max(this.value, Number(incomingValue) || 0) + 1;
    return this.value;
  }

  getValue() {
    return this.value;
  }
}

module.exports = LamportClock;
