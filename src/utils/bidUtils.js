// ── Price formatting ──────────────────────────────────────────────────────────
export function formatPrice(paise) {
  if (!paise && paise !== 0) return '₹0';
  const crore = paise / 10000000;
  // Always display in Crores for amounts >= 1Cr
  if (crore >= 1) return `₹${crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(2)}Cr`;
  // Sub-crore: show in Lakhs
  const lakh = paise / 100000;
  if (lakh >= 1) return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)}L`;
  return `₹${paise}`;
}

// ── Convert base price string to paise ───────────────────────────────────────
export function getBasePriceInPaise(basePriceLabel) {
  if (typeof basePriceLabel === 'number') return basePriceLabel;
  const str = String(basePriceLabel || '20L').toUpperCase().trim();
  if (str.includes('CR')) return parseFloat(str) * 10000000;
  if (str.includes('L')) return parseFloat(str) * 100000;
  return parseFloat(str) * 100000 || 2000000;
}

// ── Get next bid amount (two-stage configurable increment) ────────────────────
// settings may contain:
//   bidThresholdCr — the bid amount (in Cr) at which rate switches (default 20)
//   bidRate1Cr     — increment (in Cr) below threshold              (default 0.25)
//   bidRate2Cr     — increment (in Cr) at/above threshold           (default 0.50)
export function getNextBidAmount(currentAmount, settings = {}) {
  const thresholdPaise = (settings?.bidThresholdCr ?? 20) * 10000000;
  const rate1Paise     = (settings?.bidRate1Cr     ?? 0.25) * 10000000;
  const rate2Paise     = (settings?.bidRate2Cr     ?? 0.50) * 10000000;

  const increment = currentAmount < thresholdPaise ? rate1Paise : rate2Paise;
  return currentAmount + increment;
}

// ── Quick bid amounts (derived from settings rates) ───────────────────────────
export function getQuickBidAmounts(settings = {}) {
  const rate1 = settings?.bidRate1Cr ?? 0.25;
  const rate2 = settings?.bidRate2Cr ?? 0.50;
  return [
    { label: `+${rate1 * 2}Cr`,  amount: Math.round(rate1 * 2  * 10000000) },
    { label: `+${rate2}Cr`,      amount: Math.round(rate2       * 10000000) },
    { label: `+${rate2 * 2}Cr`,  amount: Math.round(rate2 * 2  * 10000000) },
    { label: `+${rate2 * 4}Cr`,  amount: Math.round(rate2 * 4  * 10000000) },
  ];
}

// ── Format large number for display ──────────────────────────────────────────
export function formatBudget(amount) {
  if (!amount) return '₹0';
  const cr = amount / 10000000;
  return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)}Cr`;
}
