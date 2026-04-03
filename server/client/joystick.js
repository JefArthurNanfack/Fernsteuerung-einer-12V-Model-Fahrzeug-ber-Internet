// ===========================================
// joystick.js – Fahrzeugsteuerung über MQTT
// Verbesserte Version (Hold-to-Move + Safety)
// ===========================================

let lastCommand  = "";
let currentSpeed = 50;     // EINZIGE Speed-Quelle
let safetyTimer  = null;   // Failsafe

// ===========================================
// Initialisierung
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
  const speedSlider = document.getElementById("speedSlider");
  const speedValue  = document.getElementById("speedValue");

  // 🎚 Speed-Slider (bleibt unverändert)
  if (speedSlider) {
    currentSpeed = parseInt(speedSlider.value);
    speedValue.textContent = currentSpeed + "%";

    speedSlider.addEventListener("input", (e) => {
      currentSpeed = parseInt(e.target.value);
      speedValue.textContent = currentSpeed + "%";

      console.log(`⚙️ Speed geändert: ${currentSpeed}%`);

      // 🔴 MQTT: Speed senden
      mqttClient.publish("vehicle/speed", currentSpeed.toString());
    });
  }

  // 🕹 Richtungsbuttons (Hold-to-Move)
  const controlButtons = document.querySelectorAll(".control-buttons button");

  controlButtons.forEach(btn => {
    const cmd = btn.getAttribute("data-cmd");

    // ▶ Start bewegen (Maus)
    btn.addEventListener("mousedown", () => handleCommand(cmd));

    // ▶ Start bewegen (Touch)
    btn.addEventListener("touchstart", e => {
      e.preventDefault();
      handleCommand(cmd);
    });

    // ■ Stop bei Loslassen
    btn.addEventListener("mouseup", stopVehicle);
    btn.addEventListener("mouseleave", stopVehicle);
    btn.addEventListener("touchend", stopVehicle);
  });

  // ⌨️ Tastatursteuerung
  document.addEventListener("keydown", e => {
    if (e.repeat) return;

    switch (e.key) {
      case "ArrowUp":    handleCommand("forward");  break;
      case "ArrowDown":  handleCommand("backward"); break;
      case "ArrowLeft":  handleCommand("left");     break;
      case "ArrowRight": handleCommand("right");    break;
      case " ":          stopVehicle();             break;
    }
  });

  document.addEventListener("keyup", stopVehicle);
});

// ===========================================
// Richtung senden
// ===========================================
function handleCommand(cmd) {
  let direction = null;

  switch (cmd) {
    case "forward":
    case "↑":
      direction = "forward";
      break;
    case "backward":
    case "↓":
      direction = "backward";
      break;
    case "left":
    case "←":
      direction = "left";
      break;
    case "right":
    case "→":
      direction = "right";
      break;
    case "stop":
    case "■":
      direction = "stop";
      break;
    default:
      return;
  }

  // MQTT nur bei Änderung oder STOP
  if (direction !== lastCommand || direction === "stop") {
    console.log("📤 Richtung:", direction, "| Speed:", currentSpeed);
    mqttClient.publish("vehicle/direction", direction);
    lastCommand = direction;
  }

  // 🔐 Safety-Timer zurücksetzen
  resetSafetyTimer();
}

// ===========================================
// Stop-Funktion
// ===========================================
function stopVehicle() {
  if (lastCommand !== "stop") {
    mqttClient.publish("vehicle/direction", "stop");
    console.log("🛑 STOP");
    lastCommand = "stop";
  }
}

// ===========================================
// Safety-Failsafe
// ===========================================
function resetSafetyTimer() {
  clearTimeout(safetyTimer);

  safetyTimer = setTimeout(() => {
    mqttClient.publish("vehicle/direction", "stop");
    console.warn("⚠️ Safety-Stop ausgelöst");
    lastCommand = "stop";
  }, 10000);
}
