// =====================================================
// 🛰️ onboard/index.js – Hauptstartpunkt auf dem Raspberry Pi
// =====================================================
// Startet das Onboard-System (Fahrzeugsteuerung, Video, Telemetrie)
// und den Watchdog mit DeepSleep-Unterstützung.
//
// Dieses Skript wird automatisch beim Booten ausgeführt
// (z. B. über systemd oder rc.local).
// =====================================================

// =====================================================
// 🛰️ onboard/index.js – Hauptstartpunkt für das Fahrzeug
// =====================================================

// =====================================================
// 🛰️ onboard/index.js – Hauptstartpunkt
// =====================================================
// Hinweis:
// Die Steuerkommunikation erfolgt über MQTT
// (siehe driver/index.js)


const path = require("path");
const fs = require("fs");
const driver = require("./driver");

// ----------------------------------------------------
// 🚀 Systemstart
// ----------------------------------------------------
function init() {
  console.log("🚗 Starte Onboard-System...");

  // Prüfen, ob Konfigurationsdatei existiert
  const configPath = path.join(__dirname, "data", "config.json");
  if (!fs.existsSync(configPath)) {
    console.error("❌ Konfigurationsdatei nicht gefunden:", configPath);
    process.exit(1);
  }

  try {
    driver.init();
    console.log("✅ Onboard-Treiber initialisiert");
  } catch (err) {
    console.error("⚠️ Fehler beim Start der Treiber:", err);
  }

  console.log("🟢 Watchdog deaktiviert.");
}

// ----------------------------------------------------
process.on("uncaughtException", (err) => {
  console.error("❌ Unerwarteter Fehler:", err);
  fs.writeFileSync("/tmp/onboard_crash.log", err.stack || err.toString());
  setTimeout(() => process.exit(1), 2000);
});

// ----------------------------------------------------
init();
