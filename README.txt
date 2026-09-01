RitterManager Handy-Dashboard
==============================

Enthalten:
- index.html
- styles.css
- app.js
- manifest.webmanifest
- service-worker.js
- assets/klausi.jpg und App-Icons

Start:
1. Diesen Ordner auf einen HTTPS-Webspace laden (z.B. GitHub Pages, Netlify, eigener Webspace).
2. index.html öffnen.
3. Im Dialog den eigenen RitterManager-API-Token eingeben.
4. Im Handy-Browser 'Zum Startbildschirm hinzufügen' wählen.
5. Danach startet die Übersicht wie eine App.

Wichtig:
- Der Token ist NICHT in den Dateien enthalten.
- Er wird nur im localStorage des jeweiligen Browsers gespeichert.
- Die App verwendet ausschließlich dokumentierte GET-Endpunkte der Knight-Manager Premium API v1.0.
- Standardmäßig wird alle 30 Sekunden aktualisiert.
- Falls der Browser direkte API-Anfragen wegen CORS blockiert, muss die App über einen kleinen Server/Proxy bereitgestellt werden. In diesem Fall keinen Token in öffentlichen Quellcode eintragen.
