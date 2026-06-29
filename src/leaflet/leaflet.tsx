import { View } from "react-native";
import { WebView } from "react-native-webview";

export default function Map() {
    return (
        <View style={{ flex: 1 }}>
            <WebView
                style={{ flex: 1 }}
                originWhitelist={["*"]}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                source={{
                    html: `
                    <!doctype html>
                    <html>
                        <head>
                            <meta charset="utf-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

                            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

                            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

                            <style>
                                html,
                                body {
                                    height: 100%;
                                    margin: 0;
                                    padding: 0;
                                }

                                #map {
                                    height: 100vh;
                                    width: 100vw;
                                }
                            </style>
                        </head>

                        <body>
                            <div id="map"></div>

                            <script>
                                // INIT MAP
                                var map = L.map("map").setView([48.8566, 2.3522], 11.5);

                                // TILE LAYER (OpenStreetMap)
                                L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                                    maxZoom: 19,
                                }).addTo(map);

                                // DEFAULT MARKER
                                L.marker([48.8566, 2.3522]).addTo(map).bindPopup("Paris").openPopup();

                                // CLICK EVENT (safe version)
                                map.on("click", function (e) {
                                    L.popup()
                                        .setLatLng(e.latlng)
                                        .setContent("Click: " + e.latlng.toString())
                                        .openOn(map);
                                });
                            </script>
                        </body>
                    </html>

                    `,
                }}
            />
        </View>
    );
}
