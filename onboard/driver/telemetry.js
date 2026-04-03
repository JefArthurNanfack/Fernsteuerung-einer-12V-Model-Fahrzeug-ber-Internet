// =====================================================
// 📡 telemetry.js – LTE-, Batterie- & System-Telemetrie
// =====================================================
// Misst regelmäßig LTE-Signal, Upload/Download-Rate,
// CPU-Temperatur und Batteriespannung und sendet sie per UDP.
// =====================================================

const axios = require("axios");
const parser = require("xml-js");
const dgram = require("dgram");
const fs = require("fs");
const os = require("os");
const config = require("../data/config.json");

const udpClient = dgram.createSocket("udp4");

// -----------------------------
// ⚙️ Konfiguration
// -----------------------------
const HOST = config.host;
const PORT = config.port_udp;
const MODEM_IP = "192.168.8.1"; // Huawei LTE Modem Standard-IP
const UPDATE_INTERVAL = 3000;   // 3 Sekunden Intervall
const BATTERY_ADC_PATH = "/sys/bus/iio/devices/iio:device0/in_voltage0_raw";

let lastTelemetry = null;

// -----------------------------
// 🚀 Initialisierung
// -----------------------------
function init() {
  console.log("📡 Telemetrie-System gestartet...");
  updateLoop();
}

// -----------------------------
// ♻️ Hauptloop – Telemetriedaten abrufen
// -----------------------------
async function updateLoop() {
  while (true) {
    try {
      const telemetry = {};

      telemetry.connection = await getLTEStatus();
      telemetry.battery = await getBatteryVoltage();
      telemetry.cpu = await getSystemStatus();
      telemetry.timestamp = new Date().toISOString();

      // Nur senden, wenn sich etwas geändert hat
      if (JSON.stringify(telemetry) !== JSON.stringify(lastTelemetry)) {
        sendTelemetry(telemetry);
        lastTelemetry = telemetry;
      }

    } catch (err) {
      console.error("⚠️ Telemetrie-Fehler:", err.message);
    }

    await sleep(UPDATE_INTERVAL);
  }
}

// -----------------------------
// 📶 LTE-Signal abrufen (Huawei / LTE-Stick)
// -----------------------------
async function getLTEStatus() {
  try {
    const statusUrl = `http://${MODEM_IP}/api/monitoring/status`;
    const trafficUrl = `http://${MODEM_IP}/api/monitoring/traffic-statistics`;

    const [statusRes, trafficRes] = await Promise.all([
      axios.get(statusUrl, { timeout: 1500 }),
      axios.get(trafficUrl, { timeout: 1500 })
    ]);

    const statusData = parser.xml2js(statusRes.data, { compact: true });
    const trafficData = parser.xml2js(trafficRes.data, { compact: true });

    const signal = Number(statusData.response.SignalIcon?._text ?? 0);
    const upload = Number(trafficData.response.CurrentUpload?._text ?? 0);
    const download = Number(trafficData.response.CurrentDownload?._text ?? 0);

    return {
      signalSimple: signal,                 // 0–5 Balken
      upload: (upload / 1024).toFixed(1),   // KB/s
      download: (download / 1024).toFixed(1),
    };
  } catch {
    return { signalSimple: 0, upload: 0, download: 0 };
  }
}

// -----------------------------
// 🔋 Batterie-Spannung abrufen (falls ADC vorhanden)
// -----------------------------
async function getBatteryVoltage() {
  try {
    if (fs.existsSync(BATTERY_ADC_PATH)) {
      const raw = fs.readFileSync(BATTERY_ADC_PATH, "utf8");
      const voltage = parseInt(raw) / 1000; // mV → V
      return { voltage: voltage.toFixed(2) + " V" };
    } else {
      return { voltage: "N/A" };
    }
  } catch {
    return { voltage: "Fehler" };
  }
}

// -----------------------------
// 🌡️ CPU-Temperatur & Systemstatus
// -----------------------------
async function getSystemStatus() {
  try {
    const tempRaw = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp", "utf8");
    const temp = (parseInt(tempRaw) / 1000).toFixed(1);
    const load = os.loadavg()[0].toFixed(2); // 1-Minuten-Load
    const uptime = Math.floor(os.uptime() / 60); // Minuten

    return {
      cpuTemp: temp + "°C",
      load: load,
      uptime: uptime + " min",
    };
  } catch {
    return { cpuTemp: "N/A", load: "-", uptime: "-" };
  }
}

// -----------------------------
// 📤 Telemetrie-Daten an Server senden
// -----------------------------
function sendTelemetry(data) {
  const msg = JSON.stringify({ type: "telemetry", data });
  udpClient.send(msg, PORT, HOST, (err) => {
    if (err) console.error("❌ UDP-Sendefehler (telemetry):", err);
  });
}

// -----------------------------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// -----------------------------
module.exports = { init };
