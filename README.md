# Bachelorarbeit Smartphone Fernsteuerung für 12V Modellfahrzeuge mit Videoübertragung über mobile  Daten

Dieses Projekt realisiert die Fernsteuerung eines 12-Volt-Modellfahrzeugs über mobile Daten.
Die Steuerung erfolgt über eine webbasierte Benutzeroberfläche (UI), während Video- und
Telemetriedaten in Echtzeit vom Fahrzeug übertragen werden.

Das System ist modular aufgebaut und besteht aus:
- einer **Weboberfläche (Server)** auf dem PC/Laptop,
- einem **Onboard-System** auf dem Raspberry Pi,
- einer **Middleware (Node-RED)** für Video- und Telemetrieübertragung,
- einer **direkten MQTT-Kommunikation** für Steuerbefehle.


# Projekt starten (Server + Onboard)

Dieses Projekt besteht aus zwei Hauptteilen:

- **Server/**: Weboberfläche (UI) wird auf einem PC/Laptop gestartet
- **Onboard/**: Fahrzeugsteuerung (Motor/Servo) läuft auf dem Raspberry Pi

---

## 1) Voraussetzungen

### Raspberry Pi (Onboard)
Damit die Motorsteuerung funktioniert, müssen auf dem Raspberry Pi installiert sein:

- **Node.js**
- **MQTT Broker** (z. B. Mosquitto) oder Zugang zu einem MQTT Broker
- **pigpio** (für GPIO/Servo/Motorsteuerung)

> Hinweis: Das Onboard-System wird später mit `sudo` gestartet, da GPIO-Zugriff benötigt wird.

### Netzwerk / Remote-Zugriff
Da Video und Steuerung über das Internet laufen, wird empfohlen:

- **Tailscale** (damit PC/Smartphone sicher den Raspberry Pi erreichen)
- optional **remote.it**, um per Konsole auf den Raspberry Pi zuzugreifen (z. B. zum Starten/Stoppen des Onboard-Codes)

---

## 2) Projektstruktur

- `Server/`  
  Startet die Weboberfläche (UI).

- `Onboard/`  
  Läuft auf dem Raspberry Pi und steuert Motor/Servo über GPIO.

---

## 3) Start: Weboberfläche (Server)

1. In den Server-Ordner wechseln:
  ```bash
  cd Server
  ```

Weboberfläche starten:

```bash
node index.js
```

Danach kann die UI im Browser geöffnet werden (lokal oder im Netzwerk):

http://<IP-des-PC>:1300

Wenn man die UI auf dem Smartphone nutzen will: Smartphone und PC müssen im selben Netzwerk sein oder beide über Tailscale verbunden sein.

## 4) Start: Onboard-System (Raspberry Pi)

- Per SSH/remote.it auf den Raspberry Pi verbinden.

- In den Onboard-Ordner wechseln:

```bash
cd Onboard
```

Onboard-System starten (GPIO benötigt sudo):

```bash
sudo node index.js
```

Dieses Modul empfängt Steuerbefehle über MQTT und steuert damit:

Motortreiber / DC-Motor (Antrieb)

Servo (Lenkung)

## 5) Videoübertragung (Node-RED)

Die Videoübertragung läuft über Node-RED im Hintergrund.
Das bedeutet:

Sobald die UI geöffnet ist, sollte der Videostream automatisch verfügbar sein,

da Node-RED den Stream bereitstellt und dauerhaft im Hintergrund läuft.

Falls kein Video angezeigt wird: prüfen, ob Node-RED läuft und ob die Stream-URL erreichbar ist.

Wichtige Ports & Endpunkte

| Dienst             | Port | Beschreibung       |
| ------------------ | ---- | ------------------ |
| Web-UI             | 1300 | Benutzeroberfläche |
| Node-RED           | 1880 | Middleware         |
| MJPEG Stream Front | 8080 | Kamera vorne       |
| MJPEG Stream Rear  | 8082 | Kamera hinten      |
| MQTT (TCP)         | 1883 | Steuerbefehle      |
| MQTT (WebSocket)   | 9001 | Browser-MQTT       |


## 6) Dieses Projekt wurde mit meinem persönlichen Tailscale-Konto entwickelt.
Für die Ausführung und Bewertung muss ein eigenes Tailscale-Konto verwendet werden.

Schritte :

- Tailscale auf allen benötigten Geräten installieren (Rasperry Pi , PC oder Handy): https://tailscale.com/download
- Mit dem eigenen Konto anmelden
- Eigene Tailscale-IP (100.x.x.x) ermitteln:
  tailscale ip
- Die im Projekt hinterlegte Tailscale-IP durch die eigene IP ersetzen
(z. B. in URLs, MQTT-Verbindungen, Node-RED)