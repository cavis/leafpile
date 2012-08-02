/* ==========================================================
 * L.Leafpile
 *
 * A marker representing a grouping of other markers
 * ========================================================== */
L.Leafpile = L.Marker.extend({

    /* ========================================
     * Configuration Options
     * ======================================== */

    options: {
        clickable: true,
        icon: new L.Icon.Default() // will change right away
    },

    /* ========================================
     * Public Methods
     * ======================================== */

    // constructor
    initialize: function (markers, group, options) {
        L.Util.setOptions(this, options);
        this._group = group;
        this._markers = {};
        this._cacheLayerPt = new L.Point(0, 0);
        this.addMarker(markers);
    },

    // get the number of grouped markers
    getCount: function () {
        var size = 0;
        for (var i in this._markers) {
            if (this._markers.hasOwnProperty(i)) {
                size++;
            }
        }
        return size;
    },

    // add a marker to the pile
    addMarker: function (markers) {
        if (!(markers instanceof Array)) {
            return this.addMarker([markers]);
        }

        var c = this.getCount(),
            x = this._cacheLayerPt.x * c,
            y = this._cacheLayerPt.y * c;

        // add weighted
        for (var i = 0; i < markers.length; i++) {
            var id = L.Util.stamp(markers[i]);
            if (!this._markers[id]) {
                this._markers[id] = markers[i];
                var pt = this._group._markerToPoint(markers[i]);
                x += pt.x;
                y += pt.y;
            }
        }

        // average point location
        c = this.getCount();
        this._cacheLayerPt = new L.Point(x / c, y / c);
        this._latlng = this._group._map.layerPointToLatLng(this._cacheLayerPt);
        this._updateLeafpileIcon();

        return this;
    },

    // return an array of all markers in this group
    getMarkers: function () {
        var all = [];
        for (var i in this._markers) {
            if (this._markers.hasOwnProperty(i)) {
                all.push(this._markers[i]);
            }
        }
        return all;
    },

    // add listeners
    onAdd: function (map) {
        L.Marker.prototype.onAdd.call(this, map);
        this.on('click', this._onClick, this);
    },

    // remove listeners
    onRemove: function (map) {
        L.Marker.prototype.onRemove.call(this, map);
        this.off('click', this._onClick, this);
    },

    /* ========================================
     * Private Methods
     * ======================================== */

    // pull correct icon style from group
    _updateLeafpileIcon: function () {
        var sizes = this._group.options.styleSizes,
            defs  = this._group.options.styleDefs,
            count = this.getCount(),
            idx   = 0;

        // pick the biggest icon possible
        for (idx; idx < sizes.length; ++idx) {
            if (count <= sizes[idx]) {
                break; // used this index
            }
        }
        if (idx > sizes.length - 1) {
            idx = sizes.length - 1;
        }
        this.setIcon(new L.LeafpileIcon(count, idx, defs[idx]));
    },

    // zoom to bounds on click
    _onClick: function (e) {
        var marks = this.getMarkers(),
            latlngs = [];
        for (var i = 0; i < marks.length; i++) {
            latlngs.push(marks[i].getLatLng());
        }
        var bnds = new L.LatLngBounds(latlngs);
        var zoom = Math.min(this._map.getBoundsZoom(bnds),
            this._map.getZoom() + this._group.options.maxZoomChange);
        this._map.setView(bnds.getCenter(), zoom);
    }

});
