const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/liberty",
  center: [35.18306, 31.77220],
  zoom: 9,
  preserveDrawingBuffer: true,
  pixelRatio: 1
});
map.fitBounds([
  [35.11783, 31.71310], // southwest corner [longitude, latitude]
  [35.24829, 31.83131]  // northeast corner [longitude, latitude]
], {
  padding: 0,
  duration: 0});
map.addControl(new maplibregl.NavigationControl());

map.on("load", async () => {
  const boundary = {"features":[{"type":"Feature","id":"sm3b76beaf","geometry":{"type":"Polygon","coordinates":[[[35.229495229,31.782041064],[35.224549796,31.793306706],[35.226781394,31.790899253],[35.246522452,31.791847651],[35.246608282,31.805634798],[35.237853552,31.809281848],[35.197341467,31.829410969],[35.179832007,31.823285179],[35.190475012,31.813512245],[35.152709509,31.788564695],[35.119922186,31.767696952],[35.132110144,31.744780794],[35.163695838,31.73397758],[35.192019965,31.722443029],[35.231673742,31.71499591],[35.238454367,31.741240691],[35.238025213,31.75193358],[35.233615102,31.754348201],[35.226362409,31.764966603],[35.230267705,31.769709825],[35.238850774,31.775328404],[35.23833579,31.781019604],[35.237219991,31.780946642],[35.230954351,31.780362945],[35.229495229,31.782041064]]]},"properties":{"name":"Jerusalem Outline"}}],"type":"FeatureCollection","id":"root"};

  map.addSource("my-boundary", {
    type: "geojson",
    data: boundary
  });

  map.addLayer({
    id: "boundary-fill",
    type: "fill",
    source: "my-boundary",
    paint: {
      "fill-color": "#3388ff",
      "fill-opacity": 0.2
    }
  });

  map.addLayer({
    id: "boundary-outline",
    type: "line",
    source: "my-boundary",
    paint: {
      "line-color": "#0055ff",
      "line-width": 3
    }
  });
// Load the bus routes from GitHub
  const response = await fetch(
    "https://raw.githubusercontent.com/Spelldaddy/jerusalem-transit-map/main/routes_small.geojson"
  );

  if (!response.ok) {
    throw new Error("Could not load bus routes");
  }

  const routes = await response.json();

  map.addSource("bus-routes", {
    type: "geojson",
    data: routes
  });

  map.addLayer({
    id: "bus-routes-lines",
    type: "line",
    source: "bus-routes",
    paint: {
      "line-color": "#e4572e",
      "line-width": 2.5,
      "line-opacity": 0.85
    }
  });

  map.on("click", "bus-routes-lines", (event) => {
    const feature = event.features[0];
    const props = feature.properties;

    new maplibregl.Popup()
      .setLngLat(event.lngLat)
      .setHTML(
        "<strong>Bus " +
        (props.route_number || "Unknown") +
        "</strong><br>" +
        (props.route_name || "Bus route")
      )
      .addTo(map);
  });

  map.on("mouseenter", "bus-routes-lines", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "bus-routes-lines", () => {
    map.getCanvas().style.cursor = "";
});
});
const exportButton = document.createElement("button");

exportButton.textContent = "Export A1 poster PNG";
exportButton.style.cssText =
  "position:fixed;top:10px;left:10px;z-index:99999;padding:12px;";

document.body.appendChild(exportButton);

exportButton.addEventListener("click", async () => {
  exportButton.disabled = true;
  exportButton.textContent = "Preparing poster...";

  const originalWidth = map.getContainer().style.width;
  const originalHeight = map.getContainer().style.height;

  try {
    map.getContainer().style.width = "4966px";
    map.getContainer().style.height = "3508px";

    map.resize();
map.fitBounds([
  [35.11783, 31.71310],
  [35.24829, 31.83131]
], {
  padding: 0,
  duration: 0
});

    await new Promise((resolve) => {
      map.once("idle", resolve);
    });

    const blob = await new Promise((resolve) => {
      map.getCanvas().toBlob(resolve, "image/png");
    });

    if (!blob) {
      throw new Error("The browser could not export the map.");
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "jerusalem-poster-A1.png";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) {
    alert("Poster export failed: " + error.message);
  } finally {
    map.getContainer().style.width = originalWidth;
    map.getContainer().style.height = originalHeight;
    map.resize();

    exportButton.disabled = false;
    exportButton.textContent = "Export A1 poster PNG";
  }
});
   