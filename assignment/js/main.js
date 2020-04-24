/** ---------------
Routing and Leaflet Draw

Build an application that meets the following specifications
  - The user should click on a Leaflet draw marker button and add a marker to the map
  - When the user adds a second marker, an AJAX request is sent to Mapbox's optimized_route
    function. Add the shape of this route to the map. Hide the draw marker button and show the
    "Reset Map" button.
  - When the user adds a third, fourth, or nth marker, an updated AJAX request is sent and the
    new fastest/shortest path which visits all n points is plotted.
  - When the user clicks "Reset Map", the state should be reset to its original values and all
    markers and route should be removed from the map. Show the draw marker button and hide the
    "Reset Map" button.

Here is a video of what this would look like for two points: http://g.recordit.co/5pTMukE3PR.gif

Documentation of route optimization: https://docs.mapbox.com/api/navigation/#optimization

To get the route between your two markers, you will need to make an AJAX call to the Mapbox
optimized_route API. The text you send to the API should be formatted like this:


## Decoding the route
The part of the response we need for drawing the route is the shape property. Unfortunately, it's in
a format we can't use directly. It will be a string that looks something like this:

`ee~jkApakppCmPjB}TfCuaBbQa|@lJsd@dF|Dl~@pBfb@t@bQ?tEOtEe@vCs@xBuEfNkGdPMl@oNl^eFxMyLrZoDlJ{JhW}JxWuEjL]z@mJlUeAhC}Tzi@kAv`...

To plot these on the map, write a function to convert them to GeoJSON. Take a look at what GeoJSON
for a line looks like (you may want to create a line on geojson.io as an example). How can you
convert the array of points into the GeoJSON format? Hint: GeoJSON defines points as [lng, lat]
instead of [lat, lng], so you may need to flip your coordinates.

---------------- */

/** ---------------
State

- `markers` should keep track of all endpoints used to generate directions
- `line` should be set to the leaflet layer of the route.

Keeping track of `marker1`, `marker2`, and `line` will help us remove
them from the map when we need to reset the map.
---------------- */

// var state = {
//   markers: [],
//   line: undefined,
// };

/** ---------------
Mabox Map configuration
---------------- */
var mapboxAccessToken = 'pk.eyJ1Ijoic3JpLWdvIiwiYSI6ImNrODUyeHp1YjAyb2wzZXA4b21veGhqdjgifQ.wprAUOeXWkoWy1-nbUd1NQ';
mapboxgl.accessToken = mapboxAccessToken;
var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/dark-v10', // stylesheet location
  center: [-75.165222, 39.952583], // starting position [lng, lat]
  zoom: 10 // starting zoom
});

/** ---------------
Mapbox Draw configuration
---------------- */
var Draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    line_string: false,
    polygon: false,
    trash: false
  },
  styles: [
    //Points coloring
    {
      'id': 'highlight-active-points',
      'type': 'circle',
      'filter': ['all',
        ['==', '$type', 'Point'],
        ['==', 'meta', 'feature'],
        ['==', 'active', 'true']
      ],
      'paint': {
        'circle-radius': 7,
        'circle-color': '#FFFFFF'
      }
    },
    {
      'id': 'points-are-red',
      'type': 'circle',
      'filter': ['all',
        ['==', '$type', 'Point'],
        ['==', 'meta', 'feature'],
        ['==', 'active', 'false']
      ],
      'paint': {
        'circle-radius': 5,
        'circle-color': '#FF5F52'
      }
    }
  ]
});
map.addControl(Draw, 'top-left');
map.addControl(new mapboxgl.NavigationControl({
  showCompass: false
}));
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true
  })
);

//this function gets the directions between 2 given points
function getDirections() {
  var coords = Draw.getAll();
  console.log(Draw.getAll());
  var origin_longitude = coords.features[0].geometry.coordinates[0]
  var origin_latitude = coords.features[0].geometry.coordinates[1]
  var dest_longitude = coords.features[1].geometry.coordinates[0]
  var dest_latitude = coords.features[1].geometry.coordinates[1]

  //query returns optimized route in geojson format with 1st point being origin and last point being destination
  //query works for 2 points
  var http = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${origin_longitude},${origin_latitude};${dest_longitude},${dest_latitude}?geometries=geojson&source=first&destination=last&roundtrip=false&access_token=` + mapboxAccessToken;
  console.log(http);

  $.ajax(http).done(function (data) {
    // console.log(data);    
    //plot the returned geojson data
    //first add the source as a geojson layer
    map.addSource('route', {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': data.trips[0].geometry.coordinates
        }
      }
    });
    //now adding it as a layer
    map.addLayer({
      'id': 'route',
      'type': 'line',
      'source': 'route',
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': '#ff6347',
        'line-width': 8
      }
    });
  });
};

map.on('draw.create', function (e) {
  var coords = Draw.getAll();
  if(coords.features.length == 2 ){getDirections()};
  $('#button-reset').show();
});

map.on('draw.delete', function (e) {
  console.log(e.features);
});

$(document).ready(function () {
  console.log("Ready");

  var resetApplication = function () {
    Draw.deleteAll();
    if (map.getLayer('route')) {
      map.removeLayer('route');
      $('#button-reset').hide();
      map.removeSource('route');
    };
  };
  $('#button-reset').click(resetApplication);
});

/** ---------------
Reset application

Sets all of the state back to default values and removes both markers and the line from map. If you
write the rest of your application with this in mind, you won't need to make any changes to this
function. That being said, you are welcome to make changes if it helps.
---------------- */

// var resetApplication = function () {
//   _.each(state.markers, function (marker) {
//     map.removeLayer(marker);
//   });
//   map.removeLayer(state.line);

//   state.markers = [];
//   state.line = undefined;
//   $('#button-reset').hide();
// };

// $('#button-reset').click(resetApplication);

/** ---------------
On draw

Leaflet Draw runs every time a marker is added to the map. When this happens
---------------- */

// map.on('draw:created', function (e) {
//   var type = e.layerType; // The type of shape
//   var layer = e.layer; // The Leaflet layer for the shape
//   var id = L.stamp(layer); // The unique Leaflet ID for the

//   console.log('Do something with the layer you just created:', layer, layer._latlng);
// });