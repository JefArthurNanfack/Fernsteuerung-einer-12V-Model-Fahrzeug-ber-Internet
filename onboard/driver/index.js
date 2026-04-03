// =====================================================
// 🛰️ onboard/driver/index.js
// =====================================================
// Hauptmodul des Onboard-Systems auf dem Raspberry Pi
//
// NEUE ARCHITEKTUR (MQTT):
// - Empfängt Steuerbefehle über MQTT (Tailscale / Internet)
// - Leitet sie an control.js weiter (Motor, Servo)
// - Telemetry / Stream bleiben optional und getrennt
// =====================================================

const mqtt = require("mqtt");
const config = require("../data/config.json");
const control = require("./control");
// const telemetry = require("./telemetry");
// const stream = require("./stream");

// -----------------------------
// ⚙️ MQTT-Konfiguration
// -----------------------------
const MQTT_BROKER_URL = config.mqtt_broker; // z.B. "mqtt://localhost:1883" oder "ws://100.122.x.x:9001"
const MQTT_OPTIONS = {
  clientId: "vehicle-onboard-" + Math.random().toString(16).substr(2, 8),
  clean: true,
  reconnectPeriod: 2000
};

// Topics (müssen mit Browser übereinstimmen!)
const TOPIC_SPEED     = "vehicle/speed";
const TOPIC_DIRECTION = "vehicle/direction";

// -----------------------------
// ⚙️ Initialisierung
// -----------------------------
function init() {
  console.log("🚀 Starte Onboard-System (MQTT)...");
  console.log(`📡 Verbinde mit MQTT-Broker: ${MQTT_BROKER_URL}`);

  try {
    // MQTT-Client erstellen
    const client = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

    // Verbindung erfolgreich
    client.on("connect", () => {
      console.log("✅ MQTT verbunden");

      // Topics abonnieren
      client.subscribe([TOPIC_SPEED, TOPIC_DIRECTION], (err) => {
        if (err) {
          console.error("❌ MQTT Subscribe-Fehler:", err.message);
        } else {
          console.log("📥 Abonniert:", TOPIC_SPEED, ",", TOPIC_DIRECTION);
        }
      });

      // Fahrzeugsteuerung initialisieren
      if (control.init) control.init();

      console.log("✅ Modul geladen: control");
    });

    // MQTT-Nachrichten empfangen
    client.on("message", (topic, message) => {
      try {
        const payload = message.toString();

        switch (topic) {

          // -----------------------------
          // ⚙️ Geschwindigkeit (Slider)
          // -----------------------------
          case TOPIC_SPEED:
            if (control && control.handleSpeed) {
              control.handleSpeed(payload);
            }
            break;

          // -----------------------------
          // 🕹 Richtung (Joystick / Buttons)
          // -----------------------------
          case TOPIC_DIRECTION:
            if (control && control.handleControl) {
              control.handleControl({ command: payload });
            }
            break;

          default:
            console.warn("⚠️ Unbekanntes MQTT-Topic:", topic);
            break;
        }

      } catch (err) {
        console.error("⚠️ Fehler bei MQTT-Nachricht:", err.message);
      }
    });

    // Fehlerbehandlung
    client.on("error", (err) => {
      console.error("❌ MQTT-Fehler:", err.message);
    });

    client.on("reconnect", () => {
      console.log("🔁 MQTT reconnect...");
    });

  } catch (err) {
    console.error("💥 Initialisierungsfehler:", err.message);
    setTimeout(init, 10000);
  }
}

// -----------------------------
// WICHTIG:
// - KEIN automatischer Start hier
// - Start erfolgt über übergeordnetes index.js
// -----------------------------
module.exports = { init };
