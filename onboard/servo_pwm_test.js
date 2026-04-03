// servo_pwm_test.js
const { Gpio } = require("pigpio");

// GPIO22 = BCM22 (Pin 15)
const servo = new Gpio(22, { mode: Gpio.OUTPUT });

// Dauerhaft Mittelstellung (1.5 ms Puls bei 50 Hz)
const PULSE = 1500;

console.log("📡 Dauer-PWM aktiv auf GPIO22");
console.log("➡️ Pulsweite:", PULSE, "µs");

servo.servoWrite(PULSE);

// Script absichtlich NICHT beenden
setInterval(() => {
  // hält Node am Leben
}, 1000);
