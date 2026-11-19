// ATM Simulator (simple balance check and withdrawal)
let balance = 1000;
const withdrawal = 250;
if (withdrawal <= balance) {
  balance -= withdrawal;
  console.log("Withdrawal successful: ₱" + withdrawal);
  console.log("Remaining balance: ₱" + balance);
} else {
  console.log("Insufficient balance.");
}
