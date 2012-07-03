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

	_clumpMarker: function(mark) {
		var point = this._map.latLngToLayerPoint(mark.getLatLng());
		for (var i in this._clumps) {
			if (this._clumps[i].inBounds(point)) {
				this._clumps[i].addMarker(mark);
				return this;
			}
		}

		// not found - create new clump
		var clump = new L.Clump(mark, {radius: this.options.radius});
		var id = L.Util.stamp(clump);
		this._clumps[id] = clump;
		this._map.addLayer(clump);
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
		this._iterateClumps(map.removeMarker, map);
		return this;
	},

	onAdd: function(map) {
		this._map = map;
		this._iterateMarkers(this._clumpMarker, this);
	},

	onRemove: function(map) {
		this._iterateClumps(map.removeMarker, map);
		this._map = null;
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
		20: {
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
		1: {
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

	update: function(size) {
		this._setClumpOptions(size);
		this._setIconStyles(this._div, 'icon')
	},

	createIcon: function() {
		this._div = document.createElement('div');
		this._setIconStyles(this._div, 'icon');
		return this._div;
	},

	createShadow: function() {
		return null; // TODO: something else?
	},

	_setClumpOptions: function(size) {
		this.options.size = size;

		// start with default marker icon
		this.options.image = L.Icon.Default.prototype._getIconUrl('icon');
		L.Util.setOptions(this, L.Icon.Default.prototype.options);

		// look for alt icon
		for (var i in this._sizeOptions) {
			if (size >= i) {
				L.Util.setOptions(this, this._sizeOptions[i]);
				break;
			}
		}
	},

	_setIconStyles: function(div, name) {
		L.Icon.prototype._setIconStyles.call(this, div, name);
		div.style['cursor'] = 'pointer';
		div.style['background'] = 'url('+this.options.image+') no-repeat 0 0';
		div.style['text-align'] = 'center';
		div.style['font-size'] = '12px';
		div.style['font-weight'] = 'bold';
		div.style['color'] = 'white';
		div.style['line-height'] = this.options.iconSize.y+'px';
		div.innerHTML = (this.options.size > 1 ) ? this.options.size : '';
	}
});


/* ==========================================================
 * L.Clump
 *
 * A marker representing a clump of other markers
 * ========================================================== */
L.Clump = L.Marker.extend({
	options: {
		icon: new L.Icon.Clump(1),
		radius: 60
	},

	initialize: function(mark, options) {
		this._markers = [mark];
		this._latlng = mark.getLatLng();
		L.Util.setOptions(this, options);
	},

	onAdd: function(map) {
		L.Marker.prototype.onAdd.call(this, map);
		this._center = this._map.latLngToLayerPoint(this._latlng);
	},

	inBounds: function(point) {
		return this._center.distanceTo(point) < this.options.radius;
	},

	addMarker: function(mark) {
		this._markers.push(mark);
		this.options.icon.update(this._markers.length);

		// average the point location
		var point = this._map.latLngToLayerPoint(mark.getLatLng());
		this._center = new L.Point(
			(this._center.x + point.x) / 2,
			(this._center.y + point.y) / 2
		);
		this.setLatLng(this._map.layerPointToLatLng(this._center));
	}
});

