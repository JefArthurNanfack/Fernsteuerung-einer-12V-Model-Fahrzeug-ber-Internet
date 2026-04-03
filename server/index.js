// =====================================================
// 🌐 index.js – Node.js-Server für Fahrzeugsteuerung
// Empfängt Socket.IO-Befehle vom Web-Frontend
// und leitet sie als UDP-Nachrichten an den Raspberry Pi weiter.
// =====================================================

const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");
const fs = require("fs");
const dgram = require("dgram"); // 🟢 UDP-Kommunikation

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

// ---------------------------------------------
// 🔧 Konfiguration
// ---------------------------------------------
const HTTP_PORT = 1300;          // Browser-Frontend
const UDP_PORT = 5005;           // UDP-Port für Raspberry Pi
const VIDEO_PORT = 5600; // UDP-Port für Kamera-Frames
const PI_IP = "192.168.0.109";   // ✏️ IP-Adresse deines Raspberry Pi
const udpClient = dgram.createSocket("udp4");

// ---------------------------------------------
// 📁 Client (Frontend)
// ---------------------------------------------
const clientPath = path.join(__dirname, "client");
const indexPath = path.join(clientPath, "index.html");
app.use(express.static(clientPath));

app.get("/", (req, res) => {
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send(`<h1>404</h1><p>index.html nicht gefunden!</p>`);
});

io.on("connection", (socket) => {
  console.log("🔗 Client verbunden");

  // 🚗 Fahrzeug starten
  socket.on("car-start", () => {
    console.log("Fahrzeug gestartet");
    io.emit("server-msg", "Fahrzeug wurde gestartet!");
  });

  // 🕹 Bewegungsbefehle
  socket.on("car-control", (data) => {
    const time = data.time || new Date().toLocaleTimeString();

    console.log(`Steuerbefehl: ${JSON.stringify({
      command: data.command,
      speed: data.speed ?? "-",
      time,
    })}`);

    io.emit("server-msg", `Befehl "${data.command}" empfangen.`);

    const msg = JSON.stringify({
      type: "control",
      command: data.command,
      speed: data.speed ?? 0,
    });

    udpClient.send(msg, UDP_PORT, PI_IP, (err) => {
      if (err) console.error("❌ UDP Sendefehler:", err);
    });
  });

  // ⚙️ Geschwindigkeitsänderung
  socket.on("car-speed", (data) => {
    console.log(`Geschwindigkeitsänderung: ${data.speed}%`);

    io.emit("telemetry", { speed: data.speed });

    const msg = JSON.stringify({ type: "speed", value: data.speed });
    udpClient.send(msg, UDP_PORT, PI_IP, (err) => {
      if (err) console.error("❌ UDP Sendefehler:", err);
    });
  });

  // 🎥 NEU: Video-Frames vom Raspberry Pi
  socket.on("video-frame", (data) => {
    if (!data || !data.frame) return;

    // An alle Browser weiterleiten
    io.emit("video", {
      frame: data.frame,
      timestamp: data.timestamp || Date.now(),
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client getrennt");
  });
});


// ---------------------------------------------
// 🚀 Serverstart
// ---------------------------------------------
server.listen(HTTP_PORT, () => {
  console.log(`✅ Webserver läuft auf http://localhost:${HTTP_PORT}`);
  console.log(`🎥 Erwartet MJPEG-Frames auf UDP-Port ${VIDEO_PORT}`);
});

// ================================================
// 🎥 Video-Stream Base64 (einfach & sicher)
// ================================================

/*
const videoServer = dgram.createSocket("udp4");

videoServer.on("message", (msg) => {
  try {
    const data = JSON.parse(msg.toString());

    if (data.type === "video" && data.frame) {
      io.sockets.emit("video", {
        frame: data.frame,          // Base64 JPEG
        timestamp: data.timestamp,
      });
    }
  } catch (err) {
    console.error("❌ Fehler im Video-Paket:", err.message);
  }
});

videoServer.bind(VIDEO_PORT, () => {
  console.log(`🎥 Video-Server lauscht auf UDP-Port ${VIDEO_PORT}`);
});
*/
