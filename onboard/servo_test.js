// servo_test.js
const { Gpio } = require("pigpio");

const servo = new Gpio(22, { mode: Gpio.OUTPUT });

console.log("⬅️ LEFT (1000)");
servo.servoWrite(1000);

setTimeout(() => {
  console.log("⬆️ CENTER (1500)");
  servo.servoWrite(1500);
}, 2000);

setTimeout(() => {
  console.log("➡️ RIGHT (2000)");
  servo.servoWrite(2000);
}, 4000);
