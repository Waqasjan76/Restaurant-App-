// Named rates so the numbers are never hard-coded in screens.
export const SERVICE_CHARGE_RATE = 0.05; // 5 %
export const SALES_TAX_RATE = 0.15; // 15 %

// Discount is taken off the subtotal first; service charge and tax are then
// applied to the discounted amount.
export function calculateTotals(items, discountPercent = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = (subtotal * discountPercent) / 100;
  const taxable = subtotal - discount;
  const serviceCharge = taxable * SERVICE_CHARGE_RATE;
  const salesTax = taxable * SALES_TAX_RATE;
  const grandTotal = taxable + serviceCharge + salesTax;
  return { subtotal, discount, serviceCharge, salesTax, grandTotal };
}
