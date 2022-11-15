/* eslint-disable */


export const displayMap = locations => {

    mapboxgl.accessToken = 'pk.eyJ1Ijoia2FtZWx6NzAiLCJhIjoiY2xhNGtrOGZkMTFqZDNvb2o0ajlzcnZ1ZiJ9.mXkKGasgg92PUtvUujhufQ ';

    const map = new mapboxgl.Map({
        scrollZoom: false,
        style: "mapbox://styles/kamelz70/cla4kyt0f00k914qte3vfcdsl",
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/streets-v11', // style URL
        center: [-74.5, 40], // starting position [lng, lat]
        zoom: 10, // starting zoom
        center: [-118.113491, 34.111745],
        projection: 'globe' // display the map as a 3D globe
    });
    map.on('style.load', () => {
        map.setFog({}); // Set the default atmosphere style
    });
    const bounds = new mapboxgl.LngLatBounds()
    locations.forEach(loc => {
        //add Marker marker
        //create marker
        const el = document.createElement("div");
        el.className = 'marker';
        //add marker
        new mapboxgl.Marker({
            element: el,
            anchor: "bottom",
        }).setLngLat(loc.coordinates).addTo(map);
        //add popup
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);
        bounds.extend(loc.coordinates, );
    });
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        }
    });
    console.log(locations);

}