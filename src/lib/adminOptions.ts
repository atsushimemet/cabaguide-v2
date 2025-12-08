const createRange = (start: number, end: number, step: number) => {
  const values: number[] = [];
  for (let value = start; value <= end; value += step) {
    values.push(value);
  }
  return values;
};

const createDecimalRange = (start: number, end: number, step: number) => {
  const values: number[] = [];
  for (let value = start; value <= end + 1e-8; value += step) {
    values.push(Number(value.toFixed(2)));
  }
  return values;
};

export const NOMINATION_PRICE_OPTIONS = createRange(1000, 10000, 1000);
export const MAIN_PRICE_OPTIONS = createRange(1000, 20000, 1000);
export const TIME_SLOT_OPTIONS = createRange(20, 24, 1);
export const AGE_OPTIONS = createRange(18, 40, 1);
export const SERVICE_FEE_OPTIONS = createDecimalRange(0.1, 0.5, 0.05);
