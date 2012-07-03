/* ==========================================================
 * leafclumper.js v0.0.1
 * http://github.com/cavis/leafclumper
 * ==========================================================
 * Copyright (c) 2012 Ryan Cavis
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


/* ==========================================================
 * L.MarkerClumper
 *
 * A layer used to clump markers together into geographical
 * groups based on screen spacing, updating with every zoom level.
 * ========================================================== */
L.MarkerClumper = L.Class.extend({
    includes: L.Mixin.Events,

    options: {
        radius: 60
    },

    initialize: function(marks) {
        this._markers = {};
        this._clumps  = {};
        if (marks) {
            for (var i=0; i<marks.length; i++) {
                this.addMarker(marks[i]);
            }
        }
    },

    addMarker: function(mark) {
        var id = L.Util.stamp(mark);
        this._markers[id] = mark;
        if (this._map) {
            this._clumpMarker(mark);
        }
        return this;
    },

    removeMarker: function(mark) {
        var id = L.Util.stamp(mark);
        delete this._markers[id];

        if (this._map) {
            this._map.removeLayer(mark);
        }

        return this;
    },

    clear: function() {
        this._iterateClumps(this._map.removeLayer, this._map);
        this._clumps = {};
        return this;
    },

    onAdd: function(map) {
        this._map = map;
        this._map.on('zoomend', this._onZoomEnd, this);
        this._iterateMarkers(this._clumpMarker, this);
    },

    onRemove: function(map) {
        this._iterateClumps(map.removeLayer, map);
        this._map = null;
    },

    _onZoomEnd: function(e) {
        this.clear();
        this._iterateMarkers(this._clumpMarker, this);
    },

    _onClumpClick: function(e) {
        this.fire('clumpclick', {
            clump: e.target,
            markers: e.markers,
            zooming: (e.markers.length > 1)
        });

        // zoom in when multiple are clicked
        if (e.markers.length > 1) {
            var all = [];
            for (var i=0; i<e.markers.length; i++) {
                all.push(e.markers[i].getLatLng());
            }
            this._map.fitBounds(new L.LatLngBounds(all));
        }
    },

    _clumpMarker: function(mark) {
        var point = this._map.latLngToLayerPoint(mark.getLatLng()),
            clump = null, leastDistance = null;
        for (var i in this._clumps) {
            var dist = this._clumps[i].inBounds(point);
            if (dist !== false && (!clump || dist < leastDistance)) {
                clump = this._clumps[i];
                leastDistance = dist;
            }
        }

        // add or create
        if (clump) {
            clump.addMarker(mark);
        }
        else {
            var clump = new L.Clump(mark, {radius: this.options.radius});
            var id = L.Util.stamp(clump);
            this._clumps[id] = clump;
            this._clumps[id].on('click', this._onClumpClick, this);
            this._map.addLayer(clump);
        }
        return this;
    },

    _iterateMarkers: function(method, context) {
        for (var i in this._markers) {
            if (this._markers.hasOwnProperty(i)) {
                method.call(context, this._markers[i]);
            }
        }
    },

    _iterateClumps: function(method, context) {
        for (var i in this._clumps) {
            if (this._clumps.hasOwnProperty(i)) {
                method.call(context, this._clumps[i]);
            }
        }
    }
});


/* ==========================================================
 * L.Icon.Clump
 *
 * An icon used for the clumping marker
 * ========================================================== */
L.Icon.Clump = L.Icon.extend({
    options: {
        size: null
    },

    _sizeOptions: {
        1: {
            image: L.Icon.Default.prototype._getIconUrl('icon'),
            iconSize: L.Icon.Default.prototype.options.iconSize,
            iconAnchor: L.Icon.Default.prototype.options.iconAnchor,
            popupAnchor: L.Icon.Default.prototype.options.popupAnchor,
            shadowSize: null
        },
        2: {
            image: '../lc1.png',
            iconSize: new L.Point(53, 52),
            iconAnchor: new L.Point(27, 26),
            popupAnchor: new L.Point(0, 0),
            shadowSize: null
        },
        10: {
            image: '../lc1.png',
            iconSize: new L.Point(53, 52),
            iconAnchor: new L.Point(27, 26),
            popupAnchor: new L.Point(0, 0),
            shadowSize: null
        },
        20: {
            image: '../lc1.png',
            iconSize: new L.Point(53, 52),
            iconAnchor: new L.Point(27, 26),
            popupAnchor: new L.Point(0, 0),
            shadowSize: null
        }
    },

    initialize: function(size) {
        this._setClumpOptions(size || 1);
    },

    update: function(size, div) {
        this._setClumpOptions(size);
        this._setIconStyles(div, size)
    },

    createIcon: function() {
        var div = document.createElement('div');
        this._setIconStyles(div);
        return div;
    },

    createShadow: function() {
        return null; // TODO: something else?
    },

    _setClumpOptions: function(size) {
        for (var i in this._sizeOptions) {
            if (size <= i) {
                this.options = this._sizeOptions[i];
                break;
            }
        }
    },

    _setIconStyles: function(div, size) {
        L.Icon.prototype._setIconStyles.call(this, div, 'icon');
        div.style['cursor'] = 'pointer';
        div.style['background'] = 'url('+this.options.image+') no-repeat 0 0';
        div.style['text-align'] = 'center';
        div.style['font-size'] = '12px';
        div.style['font-weight'] = 'bold';
        div.style['color'] = 'white';
        div.style['line-height'] = this.options.iconSize.y+'px';
        div.innerHTML = (size > 1 ) ? size : '';
    }
});


/* ==========================================================
 * L.Clump
 *
 * A marker representing a clump of other markers
 * ========================================================== */
L.Clump = L.Marker.extend({
    options: {
        radius: 60
    },

    initialize: function(mark, options) {
        var id = L.Util.stamp(mark);
        this._markers = {id: mark};
        this._latlng = mark.getLatLng();
        L.Util.setOptions(this, options);
        this.options.icon = new L.Icon.Clump(1);
    },

    onAdd: function(map) {
        L.Marker.prototype.onAdd.call(this, map);
        this._center = this._map.latLngToLayerPoint(this._latlng);
    },

    inBounds: function(point) {
        var dist = this._center.distanceTo(point);
        return (dist < this.options.radius ? dist : false);
    },

    addMarker: function(mark) {
        var id = L.Util.stamp(mark);
        this._markers[id] = mark;
        var weight = Object.keys(this._markers).length;
        this.options.icon.update(weight, this._icon);

        // weighted average the point location
        var point = this._map.latLngToLayerPoint(mark.getLatLng());
        this._center = new L.Point(
            (this._center.x * (weight-1) + point.x) / weight,
            (this._center.y * (weight-1) + point.y) / weight
        );
        this.setLatLng(this._map.layerPointToLatLng(this._center));
    },

    removeMarker: function(mark) {
        var id = L.Util.stamp(mark);
        delete this._markers[id];
        this._resetMapPosition();
    },

    _resetMapPosition: function() {
        var avg = [0, 0];
        var weight = Object.keys(this._markers).length;
        for (var i in this._markers) {
            var mark = this._markers[i];
            var point = this._map.latLngToLayerPoint(mark.getLatLng());
            avg[0] += (point.x / weight);
            avg[1] += (point.y / weight);
        }
        this._center = new L.Point(avg[0], avg[1]);
        this.setLatLng(this._map.layerPointToLatLng(this._center));
    },

    _onMouseClick: function (e) {
        L.DomEvent.stopPropagation(e);
        var marks = [];
        for (var i in this._markers) marks.push(this._markers[i]);
        this.fire('click', {originalEvent: e, markers: marks});
    }

});

