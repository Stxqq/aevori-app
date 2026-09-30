# Mehrere Macs verbinden

Jeder Mac führt ein eigenes Modell aus. Aevori verteilt vollständige Anfragen an freie Rechner und zeigt den ausführenden Mac an der Antwort. Der Pool unterstützt bis zu acht Rechner und vereint keinen Arbeitsspeicher.

## Einrichtung

1. Das private Repository auf jedem Mac klonen, `npm ci`, `npm run build` und `npm start` ausführen. Ollama starten und mindestens ein Modell installieren.
2. Auf dem zusätzlichen Mac unter **Mac-Pool → Freigabe einrichten** einen Sitzungsschlüssel erstellen.
3. Auf dem steuernden Mac einen SSH-Tunnel öffnen. Dazu muss auf dem zusätzlichen Mac bereits Remote Login eingerichtet sein:

   ```sh
   ssh -N -L 5191:127.0.0.1:5190 BENUTZER@MAC.local
   ```

4. Auf dem steuernden Mac **Mac-Pool → Mac verbinden** wählen. Namen, Adresse `http://127.0.0.1:5191` und Verbindungsschlüssel eintragen. Für weitere Macs andere lokale Ports verwenden, etwa 5192 oder 5193. Alternativ kann eine bereits gesicherte HTTPS-Adresse verwendet werden.
5. Im Chat **Mac-Pool** auswählen. „Automatisch“ nimmt ein verfügbares Modell des zugeteilten Macs. Bildanfragen werden nur zu ausdrücklich bildfähigen Modellen geleitet.

## Verhalten und Grenzen

Freie Rechner werden bevorzugt; bei gleicher Belegung wechselt die Zuteilung. Fällt ein Rechner vor Antwortbeginn aus, kann Aevori einen anderen versuchen. Nach Beginn des Streams wird bei einem Fehler abgebrochen, damit keine Antworten verschiedener Modelle vermischt werden.

Freigaben und verbundene Rechner gelten für die laufende Sitzung und müssen nach einem Serverneustart neu eingerichtet werden. Verbindungsschlüssel erlauben Modellanfragen und kompakte Gerätestatistiken, keine Datei- oder Prozesssteuerung. Schlüssel nicht in Git, Screenshots oder öffentliche Nachrichten aufnehmen.

Aevori aktiviert weder Remote Login noch öffentliche Ports. `.aevori/` niemals zwischen Rechnern kopieren. Alle beteiligten Macs benötigen die aktuelle Aevori-Version, damit Modellfähigkeiten einschließlich Bildanalyse korrekt übertragen werden.

[Zurück zu Aevori](../README.md) · [Freunde über HTTPS einladen](../ONLINE.md)
