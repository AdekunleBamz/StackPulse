
export const isValidPulsePrice = (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0;

export const isValidBlockHeight = (b) => Number.isInteger(b) && b >= 0;

export const isValidPulseTxId = (id) => typeof id === "string" && id.length === 64;
