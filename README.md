
Leafpile
===========

A marker clustering layer for Leaflet maps.  Markers are grouped together based on pixel-distance from each other at a particular zoom level.  As the map zooms in and out, groups are recomputed.  Image assets are base64-encoded into the javascript file, so there's no need to host images/stylesheets.

There's a demo [available here](http://cav.is/leafpile/example/index.html "Demo").

![Alt text](http://cav.is/img/leafpile-example.png "Leafpile Demo")

Requirements
------------

### Leaflet

Requires [Leaflet](http://leaflet.cloudmade.com/ "Leaflet") version **>= 0.4**.  Get it from the site, or directly from [their github repo](https://github.com/CloudMade/Leaflet "github").


Getting Started
------------

Just include leafpile.min.js after leaflet.js...

### At the bottom of the `<body>` section (next to other JS)

    <script src="path/to/leaflet.js"></script>
    <script src="path/to/leafpile.min.js"></script>

### In your javascript (where you're setting up your Leaflet map)

    // normal map init stuff
    var map = new L.Map('leaflet-map');
    var tiles = new L.StamenTileLayer('toner');
    map.addLayer(tiles);
    map.setView(new L.LatLng(40.423, -98.7372), 4);

    // setup the leafpile
    var leafpile = new L.Leafpile();
    map.addLayer(leafpile);

    // add some markers to the pile
    var m1 = new L.Marker(new L.LatLng(47.81, -124.18)),
        m2 = new L.Marker(new L.LatLng(39.33, -93.81)),
        m3 = new L.Marker(new L.LatLng(42.37, -121.90));
    leafpile.addMarker(m1);
    leafpile.addMarker(m2);
    leafpile.addMarker(m3);

And away you go!


Configuration
------------

These are passed as an object to the L.Leafpile constructor

    var leafpile = new L.Leafpile({radius: 999});

`radius` - The pixel radius of each pile - __(default: 60)__

`maxZoomChange` - The maximum number of view levels the map will zoom in when clicking on a pile - __(default: 2)__

`maxZoomLevel` - The maximum zoom level where piles will display. After that, plain ol' markers will show up - __(default: 8)__

`autoEnable` - When set to true, will automatically start grouping markers as you add them. Otherwise, plain markers will show up until you `enable()` the Leafpile - __(default: true)__

`singlePiles` - When set to true, single markers will be displayed with the special "pile icon".  When false, the markers will display normally until there are 2 things in the pile.  Defaults to false.


Functions
------------

After creating the Leafpile, these public methods are available for your use and abuse.

    var leafpile = new L.Leafpile({maxZoomLevel: 5});
    leafpile.addMarker(mark);
    leafpile.enable();
    ...

`addMarker`__(marker)__ - add an L.Marker to the layer

`getMarkers`__()__ - get an array of L.Markers that belong to this layer

`removeMarker`__(marker)__ - remove an L.Marker from the layer

`setRadius`__(radius)__ - change the `radius` option of the Leafpile on-the-fly!

`clear`__()__ - remove everything from this layer and clear the map

`enable`__()__ - group markers on this layer

`disable`__()__ - ungroup markers on this layer


Events
------------

`leafpileclick` - listen for someone clicking on a leafpile

    leafpile.on('leafpileclick', function(e) {
        // e.markers - array of markers in the clicked leafpile
        // e.leafpile -  the clicked leafpile marker
        // e.zooming - if true, the map is about to zoom in
        // e.cancelZoom() - function to call if you want to cancel zooming
    });


Issues and Contributing
-----------------------

Please, let me know about any bugs/feature-requests via the issues tracker.  I've got a few things in the pipeline already (grouping-by-state, better images), but I'm always looking for new ideas.  And if you'd like to contribute, send me a note!  Thanks.


License
------------

Leafpile is free software, and may be redistributed under the MIT-LICENSE.

Thanks for listening!
