/* ==========================================================
 * L.Leafpile
 *
 * A layer used to cluster markers together into geographical
 * groups based on screen spacing, updating with every zoom level.
 * ========================================================== */
L.Leafpile = L.Class.extend({

    includes: L.Mixin.Events,

    /* ========================================
     * Configuration Options
     * ======================================== */

    options: {
        radius:        60,
        maxZoomChange: 2,
        maxZoomLevel:  8,
        autoEnable:    true,
        singlePiles:   false
    },

    /* ========================================
     * Public Methods
     * ======================================== */

    // add a marker
    addMarker: function(mark) {
        var id = L.Util.stamp(mark);
        this._markers[id] = mark;
        if (!this._map) return this;

        // add to map or pile
        if (this._enabled) {
            this._pileMarker(mark);
        }
        else {
            this._map.addLayer(mark);
        }
        return this;
    },

    // add a layer ... fails for non-markers
    addLayer: function(layer) {
        if (layer instanceof L.Marker) return this.addMarker(layer);
        throw new Error('Sorry, but L.Leafpile can only hold markers right now.');
    },

    // get markers from the map
    getMarkers: function() {
        var marks = [];
        for (var i in this._markers) marks.push(this._markers[i]);
        return marks;
    },

    // remove a marker
    removeMarker: function(mark) {
        var id = L.Util.stamp(mark);
        delete this._markers[id];
        if (!this._map) return this;

        // remove from map or pile
        if (this._enabled) {
            for (var i in this._leafpiles) {
                if (this._leafpiles[i].hasMarker(mark)) {
                    this._leafpiles[i].removeMarker(mark);
                }
            }
        }
        else {
            this._map.removeLayer(mark);
        }
        return this;
    },

    // add a layer ... fails for non-markers
    removeLayer: function(layer) {
        if (layer instanceof L.Marker) return this.removeMarker(layer);
        throw new Error('Sorry, but L.Leafpile can only hold markers right now.');
    },

    // change the radius of the groupings
    setRadius: function(radius) {
        if (radius == 0) return this.disable();
        this.options.radius = radius;
        if (!this._map) return this;

        // check zoom level - don't auto-enable if too zoomed
        if (this._map.getZoom() > this.options.maxZoomLevel) return false;

        // clear the map
        if (this._enabled) {
            this._iteratePiles(this._map.removeLayer, this._map);
            this._iterateMarkers(this._map.removeLayer, this._map);
            this._leafpiles = {};
        }
        else {
            this._iterateMarkers(this._map.removeLayer, this._map);
        }

        // regroup the piles
        this._iterateMarkers(this._pileMarker, this);
        this._enabled = true;
        return this;
    },

    // clear all markers/piles
    clear: function() {
        this._iteratePiles(this._map.removeLayer, this._map);
        this._iterateMarkers(this._map.removeLayer, this._map);
        this._leafpiles = {};
        this._markers = {};
        return this;
    },

    // enable the grouping of markers in this layer
    enable: function() {
        if (!this._enabled) {
            this._enabled = true;
            if (!this._map) return this;

            // check zoom level
            if (this._map.getZoom() > this.options.maxZoomLevel) return false;
            this._zoomDisabledMe = false;

            // remove markers, add piles
            this._iterateMarkers(this._map.removeLayer, this._map);
            this._iterateMarkers(this._pileMarker, this);
        }
        return this;
    },

    // disable grouping of markers in this layer
    disable: function() {
        if (this._enabled) {
            this._enabled = false;
            this._zoomDisabledMe = false;
            if (!this._map) return this;

            // remove piles, add markers
            this._iteratePiles(this._map.removeLayer, this._map);
            this._leafpiles = {};
            this._iterateMarkers(this._map.addLayer, this._map);
        }
        return true;
    },

    /* ========================================
     * Private Methods
     * ======================================== */

    // setup structs
    initialize: function(options) {
        L.Util.setOptions(this, options);
        this._markers = {};
        this._leafpiles = {};
        this._enabled = this.options.autoEnable;
    },

    // setup event handlers on map add
    onAdd: function(map) {
        this._map = map;
        this._map.on('zoomend', this._onZoomEnd, this);
        if (map.getZoom() > this.options.maxZoomLevel) {
            this._enabled = false;
            this._zoomDisabledMe = true;
        }

        // re-add markers (will not double-add since they're stamped)
        this._iterateMarkers(this.addMarker, this);
        return this;
    },

    // remove all on map remove
    onRemove: function(map) {
        this.clear();
        this._map.off('zoomend', this._onZoomEnd, this);
        this._map = null;
    },

    _onZoomEnd: function(e) {
        var zoom = this._map.getZoom();

        // check against max zoom level
        if (this._enabled && zoom > this.options.maxZoomLevel) {
            this.disable();
            this._zoomDisabledMe = true;
        }
        else if (zoom <= this.options.maxZoomLevel && this._zoomDisabledMe) {
            this.enable();
        }
        else if (this._enabled) {
            this._iteratePiles(this._map.removeLayer, this._map);
            this._iterateMarkers(this._map.removeLayer, this._map);
            this._leafpiles = {};
            this._iterateMarkers(this._pileMarker, this);
        }
    },

    _onPileClick: function(e) {
        this.fire('leafpileclick', {
            leafpile:   e.target,
            markers:    e.markers,
            zooming:    (e.markers.length > 1),
            cancelZoom: function() { e.cancel = true; }
        });
        if (e.cancel === true) return;

        // zoom in when multiple are clicked
        if (e.markers.length > 1 || this.options.singlePiles) {
            var all = [];
            for (var i=0; i<e.markers.length; i++) {
                all.push(e.markers[i].getLatLng());
            }
            var bnds = new L.LatLngBounds(all);
            var zoom = Math.min(this._map.getBoundsZoom(bnds),
                this._map.getZoom() + this.options.maxZoomChange);
            this._map.setView(bnds.getCenter(), zoom);
        }
    },

    // put a marker into a leafpile
    _pileMarker: function(mark) {
        var point = this._map.latLngToLayerPoint(mark.getLatLng()),
            pile = null, leastDistance = null;
        for (var i in this._leafpiles) {
            var dist = this._leafpiles[i].inBounds(point);
            if (dist !== false && (!pile || dist < leastDistance)) {
                pile = this._leafpiles[i];
                leastDistance = dist;
            }
        }

        // add or create
        if (pile) {
            pile.addMarker(mark);
        }
        else {
            pile = new L.Leafpile.Marker(mark, this._map, {
                radius:      this.options.radius,
                singlePiles: this.options.singlePiles
            });
            var id = L.Util.stamp(pile);
            this._leafpiles[id] = pile;
            this._leafpiles[id].on('click', this._onPileClick, this);
        }
        return this;
    },

    // helper to iterate over markers
    _iterateMarkers: function(method, context) {
        for (var i in this._markers) {
            if (this._markers.hasOwnProperty(i)) {
                method.call(context, this._markers[i]);
            }
        }
    },

    // helper to iterate over piles
    _iteratePiles: function(method, context) {
        for (var i in this._leafpiles) {
            if (this._leafpiles.hasOwnProperty(i)) {
                method.call(context, this._leafpiles[i]);
            }
        }
    }
});
