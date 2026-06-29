import { View } from "react-native";
import { WebView } from "react-native-webview";
import { useColorScheme } from "react-native";

export default function Map() {
    const colorScheme = useColorScheme();

    const DarkModeMap = colorScheme === "dark" ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const mapFilter = colorScheme === "dark" ? "brightness(2.3) contrast(1) saturate(0.9)" : "none";

    return (
        <View style={{ flex: 1 }}>
            <WebView
                style={{ flex: 1 }}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                source={{
                    html: `
                    <!doctype html>
                    <html>
                    <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

                    <style>
                    html, body { margin:0; padding:0; height:100%; }
                    #map { height:100vh; width:100vw;}
                    </style>
                    </head>

                    <body>
                    <div id="map"></div>

                    <script>
                    const map = L.map("map", {
                        zoomControl: false
                    }).setView([48.8566, 2.3522], 13);

                    const customIcon = L.icon({
                        iconUrl: "data:image/png;base64,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",
                        iconSize: [23, 30],
                        iconAnchor: [11.5, 30],
                        popupAnchor: [0, -15],
                    });


                    // 1. Créer un Pane dédié aux tuiles
                    map.createPane("filteredTiles");

                    // 2. Applique le filtre AU PANE (et pas aux images)
                    map.getPane("filteredTiles").style.filter = "${mapFilter}";
                    map.getPane("filteredTiles").style.transform = "translateZ(0)";

                    // 3. Tiles dans ce pane
                    L.tileLayer("${DarkModeMap}", {
                        maxZoom: 18,
                        subdomains: "abcd",
                        pane: "filteredTiles"
                    }).addTo(map);

                    // MARKER LIST
                    const waypoints = [
                    { id: 1, lat: 48.788741, lng: 2.363725, label: "Efrei Paris" },
                    { id: 2, lat: 48.846249, lng: 2.346409, label: "Le Panthéon" },
                    { id: 3, lat: 48.845908, lng: 2.349079, label: "Le Bateau Ivre" },
                    { id: 4, lat: 48.843507, lng: 2.359379, label: "Jardin des Plantes" },
                    { id: 5, lat: 48.853227, lng: 2.350153, label: "Notre-Dame" },
                    { id: 6, lat: 48.860706, lng: 2.337432, label: "Le Louvre" },
                    { id: 9, lat: 48.862120, lng: 2.346668, label: "Les Halles - Chatelet" },
                    { id: 10, lat: 48.87263, lng: 2.331246, label: "Parlais Garnier" },
                    { id: 11, lat: 48.88687, lng: 2.338142, label: "Montmartre" },
                    { id: 12, lat: 48.87334, lng: 2.295190, label: "Arc de Triomphe" },
                    { id: 13, lat: 48.85546, lng: 2.311022, label: "Les Invalides" },
                    { id: 14, lat: 48.84252, lng: 2.322411, label: "Montparnasse" },
                    { id: 15, lat: 48.84682, lng: 2.337203, label: "Parc du Luxembourg" },
                    { id: 16, lat: 48.86124, lng: 2.394740, label: "Cimetière Père Lachaise" },
                    { id: 17, lat: 48.84839, lng: 2.395899, label: "Nation" },
                    { id: 18, lat: 48.83364, lng: 2.375745, label: "Bibliothèque François-Mitterand" },
                    { id: 19, lat: 48.83146, lng: 2.355532, label: "Place d'Italie" },
                    { id: 20, lat: 48.82160, lng: 2.358573, label: "Maison Blanche" },
                    { id: 21, lat: 48.89052, lng: 2.242103, label: "La Défense" },
                    { id: 22, lat: 48.86762, lng: 2.363986, label: "République" },
                    ];
                    const markersLayer = L.layerGroup().addTo(map);

                    function renderMarkers() {
                    markersLayer.clearLayers();

                    waypoints.forEach((wp) => {
                        const marker = L.marker([wp.lat, wp.lng], { icon: customIcon })
                            .bindPopup(wp.label);

                        markersLayer.addLayer(marker);
                        });
                    }
                    renderMarkers();

                    

                    </script>

                    </body>
                    </html>
                    `,
                }}
            />
        </View>
    );
}
