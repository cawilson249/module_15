// creating tile layers for the background of the map

var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

//darkscale layer
var darkscale =   L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
});


//worldview layer
var worldview = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

//nightview layer
var nightview = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 8,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});

// make a basemap object
let basemap = {
    Default: defaultMap,
    DarkScale: darkscale,
    "World View": worldview,
    "Night View": nightview
};


// make map object
var myMap = L.map( "map", {
    center: [36.7783, -119.4179],
    zoom: 5,
    layers: [defaultMap, darkscale, worldview, nightview]
});

// add default map to map
defaultMap.addTo(myMap);


// layer control panel - this changes map color
L.control.layers(basemap).addTo(myMap);

// get the data for tectomic plates and draw on the map
// variable to hold the tectonic plates layer
let tectonicsplates = new L.layerGroup();

// call API to get tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    // console log to make sure the data loaded
    // console.log(plateData)

    // load data using geoJson and add to the tectonic plate layer group
    L.geoJson(plateData, {
        // add styling to make lines visible
        color: "orange",
        weight: 1
    }).addTo(tectonicsplates);
});

// add the tectonic plates to the map
tectonicsplates.addTo(myMap);

// variable to hold the earthquake information
let earthquakes = new L.layerGroup();

// get the data for earthquakes and populate layer group
// call the USGS GeoJson API
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson")
.then(
    function(earthquakedata){
        // make sure data loaded
        console.log(earthquakedata);
        // plot circles, where radius is dependent on magnitude
        // color depends on depth

        // make sure function chooses color of dataset
        function dataColor(depth){
            if (depth>90)
            return "red";
        else if (depth>70)
        return "#afc4903";
        else if (depth>50)
        return "#afc4803";
        else if (depth > 30)
        return  "#fcad03";
        else if (depth > 10)
        return "#cafc03";
        else
            return "green";
        
        }

        // make a function that determines radius of quakes
        function radiusSize(mag){
            if (mag == 0)
                return 1; // make sure a 0 mag is relavent
            else 
                return mag* 5;
        }

        // add on the style
        function dataStyle(feature)
        {
            return { 
                opacity: 0.5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]), // use index 2 for depth
                color: "000000", // black outline
                radius: radiusSize(feature.properties.mag), // grabs the magnitude
                weight: 0.5
            }
        }

        // add the GeoJson
        L.geoJson(earthquakedata, {
            // make each feature a marker on the map, each one a circle
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            
            // set style for each marker
            style: dataStyle, // calls the data style function and earthquake data
            // add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.geometry.coordinates[2]}</b><br>`);
            }
        }).addTo(earthquakes);
    }

    
);

// add earthquake layer
earthquakes.addTo(myMap);

// add the overlay for the tectonic plates and the earthquakes
let overlay = {
    "Tectonic Plates": tectonicsplates,
    "Earthquake Data": earthquakes
};

// layer control panel - this toggles tectonic plates on and off
L.control.layers(basemap, overlay).addTo(myMap);

// add the overlay to the map
let legend = L.control({
    position: "bottomright"
});

// add properties for the legend
legend.onAdd = function() {
    // div for the legend to appear in the page
    let div = L.DomUtil.create("div", "info legend");

    // set up the intervals
    let intervals = [-10, 10, 30, 50, 70, 90];
    // set colors for the intervals
    let colors = [
        "green", "#cafc03","#fcad03", "#ee9c00", "cornsilk", "red"
    ];
    // loop through colors and intervals with a colored square
    for(var i = 0; i < intervals.length; i++)
    {
        // inner html to set square for wach interval
        div.innerHTML += "<i style='background: "
        + colors[i]
        + "'></i> "
        + intervals[i]
        + (intervals[i +1 ] ? "km &ndash; km" + intervals[i + 1] + "km<br>" : "+");
    }

    return div;
};

// add legend to the map 
legend.addTo(myMap)