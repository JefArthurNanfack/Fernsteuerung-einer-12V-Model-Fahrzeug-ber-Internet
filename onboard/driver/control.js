// =====================================================
// ⚙️ control.js – Fahrzeugsteuerung
// Cytron MD30C (PWM + DIR) + Achslenkung (Servo)
// GPIO18 = PWM (Speed), GPIO23 = DIR (Richtung), GPIO22 = Servo
// =====================================================

const { Gpio } = require("pigpio");

// -------------------------------
// ⚙️ Hardware
// -------------------------------

// Servo (Achslenkung)
const steerServo = new Gpio(22, { mode: Gpio.OUTPUT });

// Cytron MD30C: PWM + DIR
const motorPWM = new Gpio(18, { mode: Gpio.OUTPUT }); // PWM-Speed
const motorDIR = new Gpio(23, { mode: Gpio.OUTPUT }); // DIR (Richtung)

// PWM-Frequenz (MD30C + DC-Motor)
motorPWM.pwmFrequency(1000);

// -------------------------------
// 🧭 Servo-Pulse (µs)
// -------------------------------
const SERVO_CENTER = 1500;
const SERVO_LEFT   = 1200;
const SERVO_RIGHT  = 1800;

// -------------------------------
// ✅ Smooth-Steering Settings
// -------------------------------
// Je kleiner STEP und je größer DELAY, desto langsamer/ruhiger.
const SERVO_STEP_US   = 10;   // z.B. 5..20 (kleiner = weicher)
const SERVO_DELAY_MS  = 10;   // z.B. 5..20 (größer = langsamer)
const SERVO_MIN_US    = 1000; // Sicherheits-Limits (je nach Servo)
const SERVO_MAX_US    = 2000;

// -------------------------------
// ⚙️ Status
// -------------------------------
let currentSpeed = 0;
let lastCommand  = "stop";
let motorDirection = "forward"; // "forward" | "backward"

// Mindest-PWM für sicheren Motorstart
const MIN_PWM = 60;

// Servo runtime state
let currentServoUs = SERVO_CENTER;
let servoTargetUs  = SERVO_CENTER;
let servoTimer     = null;

// -------------------------------
// 🚗 Init
// -------------------------------
function init() {
  console.log("🚗 Fahrzeugsteuerung gestartet (MD30C PWM+DIR @ GPIO23 + Servo)");

  // Servo initial
  currentServoUs = SERVO_CENTER;
  servoTargetUs  = SERVO_CENTER;
  steerServo.servoWrite(SERVO_CENTER);

  // Motor initial
  setDirectionForward();
  motorPWM.pwmWrite(0);
}

// -------------------------------
// 🔁 Richtungslogik
// -------------------------------
function handleControl(data) {
  const cmd = data?.command;
  if (!cmd) return;

  if (cmd !== lastCommand || cmd === "stop") {
    console.log(`➡️ Befehl: ${cmd} | Speed: ${currentSpeed}%`);
    lastCommand = cmd;
  }

  switch (cmd) {
    case "forward":
      motorDirection = "forward";
      setDirectionForward();
      steerTo(SERVO_CENTER);    // ✅ sanft geradeaus
      applyMotorSpeed();
      break;

    case "backward":
      motorDirection = "backward";
      setDirectionBackward();
      steerTo(SERVO_CENTER);    // ✅ sanft geradeaus
      applyMotorSpeed();
      break;

    case "left":
      // Optional: Rückwärts spiegeln (natürlicher)
      if (motorDirection === "backward") steerTo(SERVO_RIGHT);
      else steerTo(SERVO_LEFT);
      applyMotorSpeed();
      break;

    case "right":
      if (motorDirection === "backward") steerTo(SERVO_LEFT);
      else steerTo(SERVO_RIGHT);
      applyMotorSpeed();
      break;

    case "stop":
    default:
      stopAll();
      break;
  }
}

// -------------------------------
// ⚡ Speed (LIVE)
// -------------------------------
function handleSpeed(value) {
  const v = parseInt(value);
  currentSpeed = Math.max(0, Math.min(100, isNaN(v) ? 0 : v));
  console.log(`⚡ Zielgeschwindigkeit: ${currentSpeed}%`);

  if (lastCommand !== "stop") {
    applyMotorSpeed();
  }
}

// -------------------------------
// 🚗 Motor (PWM + Richtung)
// -------------------------------
function applyMotorSpeed() {
  let pwmValue = Math.round((currentSpeed / 100) * 255);

  if (pwmValue > 0 && pwmValue < MIN_PWM) pwmValue = MIN_PWM;

  motorPWM.pwmWrite(pwmValue);
  console.log(`🔧 Motor ${motorDirection} PWM=${pwmValue}`);
}

// -------------------------------
// 🧭 Richtung (DIR-Pin)
// -------------------------------
function setDirectionForward() {
  motorDIR.digitalWrite(1);
}

function setDirectionBackward() {
  motorDIR.digitalWrite(0);
}

// -------------------------------
// ✅ Smooth Servo Steuerung
// -------------------------------
function clampServo(us) {
  return Math.max(SERVO_MIN_US, Math.min(SERVO_MAX_US, us));
}

function steerTo(targetUs) {
  servoTargetUs = clampServo(targetUs);

  // ggf. laufende Bewegung stoppen und neu starten
  if (servoTimer) {
    clearInterval(servoTimer);
    servoTimer = null;
  }

  // Falls wir schon am Ziel sind
  if (currentServoUs === servoTargetUs) {
    steerServo.servoWrite(currentServoUs);
    return;
  }

  servoTimer = setInterval(() => {
    if (currentServoUs < servoTargetUs) {
      currentServoUs = Math.min(currentServoUs + SERVO_STEP_US, servoTargetUs);
    } else if (currentServoUs > servoTargetUs) {
      currentServoUs = Math.max(currentServoUs - SERVO_STEP_US, servoTargetUs);
    }

    steerServo.servoWrite(currentServoUs);

    // Ziel erreicht -> Timer aus
    if (currentServoUs === servoTargetUs) {
      clearInterval(servoTimer);
      servoTimer = null;
    }
  }, SERVO_DELAY_MS);
}

// -------------------------------
// 🛑 STOP
// -------------------------------
function stopAll() {
  motorPWM.pwmWrite(0);
  steerTo(SERVO_CENTER); // ✅ sanft zurück zur Mitte
  console.log("🛑 Fahrzeug gestoppt");
}

// -------------------------------
module.exports = {
  init,
  handleControl,
  handleSpeed,
};
