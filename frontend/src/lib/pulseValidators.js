
export const isValidPulsePrice = (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0;
