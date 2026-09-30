# Aevori mit Freunden nutzen

Der Team-Zugang ist implementiert und lokal getestet. Noch kein Tunnel, keine Domain und kein öffentlicher Port wurden aktiviert.

## Auf dem Haupt-Mac

1. Aevori und Ollama laufen lassen. Optional weitere Macs über den bestehenden Mac-Pool verbinden.
2. Einen HTTPS-Reverse-Proxy oder einen HTTPS-Tunnel einrichten, dessen Ziel `127.0.0.1:5190` ist. Er muss den öffentlichen `Host` unverändert an Aevori weitergeben und `X-Forwarded-For` setzen. Andernfalls lehnt Aevori die Verbindung ab. Port 5190 bleibt lokal gebunden.
3. In **Team → Deine HTTPS-Adresse** die tatsächliche Hauptadresse speichern, z. B. `https://aevori.example.com`. Die Adresse allein erstellt keinen Tunnel.
4. Für jede Person unter **Freunde einladen** einen eigenen Namen und Link erzeugen. Den Link selbst an die betreffende Person senden. Der Fragment-Token landet nicht im HTTP-URL-Log.
5. Die Person nimmt die Einladung im Browser an. Ein Link funktioniert einmal und 24 Stunden lang. Der Browser erhält eine sieben Tage gültige, nur serverseitig lesbare Sitzung. Bei Widerruf werden auch laufende Anfragen dieser Person gestoppt.

Caddy-Beispiel auf einem bereits eingerichteten Haupt-Mac mit erreichbarer Domain:

```caddyfile
aevori.example.com {
  reverse_proxy 127.0.0.1:5190
}
```

Dieses Beispiel ist keine eingerichtete Bereitstellung. DNS, HTTPS und Netzwerkerreichbarkeit müssen zur verwendeten Umgebung passen. Bei einem externen Server muss der Rückweg zum Haupt-Mac über einen gesicherten Tunnel erfolgen. Ollama/11434 wird nicht öffentlich freigegeben.

## Rechte und Daten

- Lokaler Haupt-Mac: Modelle, Verbindungen, Pool-Freigaben, Gerätewerte und Team verwalten.
- Freunde: verfügbare Modelle und Pool nutzen, Präsenz und Nutzungsstatistiken sehen. Keine Prozessliste, App-Icons, Modellinstallation, Anbieter-Schlüssel oder Geräteeinstellungen. Privater Systemkontext ist serverseitig gesperrt.
- Chats, Notizen und Aufgaben bleiben im jeweiligen Browser. Das Team sieht keine Nachrichteninhalte.
- Nutzungsdaten sind tatsächliche Dauer und vom Anbieter gemeldete Tokens. Bei abgebrochener Antwort oder fehlenden Angaben steht „—“.
- Bis zu zwei parallele Anfragen je Freund, vier beim Gastgeber. Der Pool verteilt ganze Anfragen; er vereint keinen GPU-/RAM-Speicher.
- Im Download liegen Anmeldung und Einladungshashes unter `~/Library/Application Support/Aevori/`, bei `npm start` unter `.aevori/team-5190.json`; nie in `public` oder `dist`. Beim Kopieren des Projekts auf einen anderen Mac `.aevori` ausschließen.
- Sitzungsablauf erfordert eine neue Einladung. Derzeit keine E-Mail-Anmeldung und keine automatischen E-Mails.
