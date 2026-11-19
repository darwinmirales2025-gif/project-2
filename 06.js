// Shopping Cart Total
const prices = [120, 50, 35];
const total = prices.reduce((sum, price) => sum + price, 0);
console.log("Items:", prices);
console.log("Total: ₱" + total);
