/* ==========================================================
 * leafpile.js v0.0.1
 * http://github.com/cavis/leafpile
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
        autoEnable:    true
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

    // get markers from the map
    getMarkers: function() {
        return Object.values(this._markers);
    },

    // remove a marker
    removeMarker: function(mark) {
        var id = L.Util.stamp(mark);
        delete this._markers[id];
        if (!this._map) return this;

        // remove from map or pile
        if (this._enabled) {
            for (var i in this._leafpiles) {
                this._leafpiles[i].removeMarker(mark);
            }
        }
        else {
            this._map.removeLayer(mark);
        }
        return this;
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
        if (this._enabled) this._iteratePiles(this._map.removeLayer, this._map);
        else this._iterateMarkers(this._map.removeLayer, this._map);
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
            this._leafpiles = {};
            this._iterateMarkers(this._pileMarker, this);
        }
    },

    _onPileClick: function(e) {
        this.fire('leafpileclick', {
            leafpile: e.target,
            markers:  e.markers,
            zooming:  (e.markers.length > 1)
        });

        // zoom in when multiple are clicked
        if (e.markers.length > 1) {
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
            pile = new L.Leafpile.Marker(mark, {radius: this.options.radius});
            var id = L.Util.stamp(pile);
            this._leafpiles[id] = pile;
            this._leafpiles[id].on('click', this._onPileClick, this);
            this._map.addLayer(pile);
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


/* ==========================================================
 * L.Leafpile.Icon
 *
 * An icon used for the leafpile marker
 * ========================================================== */
L.Leafpile.Icon = L.Icon.extend({
    options: {
        size: null
    },

    // private style - includes base64 png icons
    _sizeOptions: {
        1: {
            image: 'iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAKpJREFUeNpi/P//PwO5gImBAsACYzAyMoLpNN2JAUCqHogNkNRdAOLGWZfzN4A4MNei2AzU2ACk1qNpZIDy10Pl4YARZkq63qQAqEZ0sAOIdwKxOxB7AHHgzEt5G9BtrsfhtZ1QZ+9EV8eC5jRswB2NNsCmGRfwgGLqRhUTWnQQAy5g09xIpOZGDM3QBEDIAHhCwfAzUAKUCAKxeAHED4TKYyYSumcMgAADAC0VMpNJzrHjAAAAAElFTkSuQmCC',
            iconSize: new L.Point(15, 15),
            iconAnchor: new L.Point(7, 7),
            popupAnchor: new L.Point(0, 0),
            shadowSize: null
        },
        2: {
            image: 'iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABNRJREFUeNrEWE1vlFUUnk6n7UBbOhZbKwJC8ZMQU3ChpiIuTCTAQn+Aste1YeWKP+DKNZpo4gJhAdGEHUiAGC2KGogV8AMyadpxOjM2ZaYtPsc8NzmenvdzSLjJk/d973s/nnu+7rm3p9BF+fjC9AAeJaD43v6LTVVfxGMQWANW8O9e3jlKOUiV8Qgoql9N9d4HDKs+QnRZALLLWebryUhsBOiNaLIQJIW2w5qgKavAYlqipRTEhNAjQH+KsYIqe2Payb9RjNvG828QXY0btJhCamMx5MaBl4BDwD5V/ybwBrAX2BTRV8Yc4xzZJYiOG/GoOL8GOPHTyhGkrAAX+P48n5NcQB34EfjFEZBIsw5JLqWWYAy5l4F3gBeADYqclAn2nTB91ijF/cC7wDZn3ArnTHYSho7NjtQOU933YzTyEbADeCvBrESS5+MczSXI+DVuJCvfBxlWPDvaSu+W92OU8tuU3CJwF2g5grkDnFOOFaQ9B5JrUTZYMeQGIsgJmWeAx4G2qt9H+wvtRW07gXnghiIqWtgCvEaSWrrCobbOBqlaS+SwUzdKe9psyEnZBTxl6iTeDdFZJs2/SUpclzK5rHOSYcchxhxyL9JjvTJBMl5Z4QI0yfuMCOOm7aCn4iZJ9lO1e4xDBHJWamXaoRCbUvWi1qpZTJskpdxUO8s0cEpJfDHOi2XCA8Ar5tcBJ4buILlCjNRuA385fa8omxRNfg7civViQ3RKOYio5UkV90qU1lDKrVwked3UCbnvGMRPg9jtzMkCpSm2+AE9MpTnQmDOUH6i2kMRTz0OYldjsxmSGA25G/AYnaNOVCmx9ynRirG1tEXGvswxT4LYCc49wTErNIdWyDFlESXmbsEO+ml72q5CvJOVzgJHusg9y1zwNMgdpdNcUm2+BWZ0XlmK2B08l59SwTxv2Wp2FRtj+zKlWxGEy10QLCeMXchD8KGWNARbztaVt9i+7TwEbaeO+a53QbCesPiOR9BWLpjvebMlVnOSWzFxsKC3NMZk+7/jEbxlJFtzpDCfg+Cs2ZfLzBX1ae/PdQR5qtInqzngnwTS1x31JG11VUczegy71a0Kt2KE8f5qvm+a1cv7N04S4Kn1qrMPi/SuGVO74TlUMcJYZ5yzx4yKW9L+DNV2mUTrJLTM91m1tX1iYt/PxhnnHPW2/pcsYOt51ATO3cycbU74LPfl4xkShq+BH4APgd9ULhgO8p8BDR1JoN75QszdSoEnrzumToz6KMlvyWCDB3kuPmbI9TAvbJj2zXVxkImiPTyfU41FVSfQrsr88HeVdSRtlRK6XkVfsdvTipyQ/d60X9JJq00WGkz3w92KNPySOeEpufBhIlvh4ILtTFxHzEF+iXGuSnvbLemV5H94hpzyvHOx1IjcSXgerZmJxFi/ULdRr5tB/6A5XKK6Aq7xX9scxApMUk+aef6bW5+J3a0ODTpqFR2e9tfoSOMMET05ArXMtYuXA2GeBUWywbrkZIEXOTVNTq3yU14SNVImGyWGobPAV/pIqUjWoi6Pslxgenc2m9SR8wkVktrcKWqMb7HXGw/qCti7MW04V2ppVD3ohLWuE9ZmmvwtRWlnGSezsfNKeIjO0puy2yq3wFbSlW/XBB2yfd5hR0WBTlZSuvwrwACGr5zwIv/jvAAAAABJRU5ErkJggg==',
            iconSize: new L.Point(40, 40),
            iconAnchor: new L.Point(20, 20),
            popupAnchor: new L.Point(0, 0),
            shadowSize: null
        },
        10: {
            image: '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',
            iconSize: new L.Point(50, 50),
            iconAnchor: new L.Point(25, 25),
            popupAnchor: new L.Point(0, 0),
            shadowSize: null
        },
        20: {
            image: 'iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAB5ZJREFUeNrUW91vFFUUn06n29JuP1IKVqgRoUqDiBWilihaNCRVX4wmmpgQojE+y5NP/gG8+eijxvhiNPFBEg3xI34kqMiH1qYqxYoVV/qRQtvtdru7eI78hlyn95yZ2ZkBPcnJ0p27d+7vnnN+554zQ4OTgcz29TfSRzNpjtTDZ3n91NkZYfwm/HMVWiZdofHVtNfmpQjSpY91pK2kTVHvRb9rNv5sgrbiGoMvki4T+Foa62xIyZrt/iJDpBBcOP2+jT46I/yWgS8ktbqX0KIdEYGaFlyxfBdF+D6tdF8Gfrlei7t1gmWrbIwJ1kEsJ910vudGrCFbC8Oq3cLCo8jN7JaB73rYYnUYqpPWw5wxF8faXgyw7HrrY3gFe8BmgNwE1z1H+rMxZy99PAcumeOvSC+QTlhcX/IYtvYsgV5NDTBN2Ip4DQPLjLuD9C64nrnzTDa3BsZ3GWM6oVtJh0knSX8g/T2CtdfTGjmui4ljGGC7QsYy0CHSg6T3krYEwDoBq/rSK8xXIe0jfYL0EOktEXB0Ya31A6YJWgBWk22kz5Luiuju5nxbQsbWsJkM/Cl4mTo31hwfMGK2K8SqB6AtMQinVwAfBpzJ7RlscBjopliADTZ2FbC847dJrqvIbtwjTx8DMRnfxQYPhYzpBobIpMU736iw70hEq+YQi8zuefx9Htf6SbdjHl7cvMHSiyHWvhunu2PCmEZgmAu1MGKgRbFsFLAMbg/pwyAcn7FL2DAfsIPvitgMTmF7SR9QCI3lCtj8gDKmxRbPrsWVu0LcOAzsTtL7AboshMygEotleN6dpPswjwZ6d0g8u5qF25S4fQhupLnvftINSCua9IdY0E9NLjZvqwL6PiVtucC0FjB2ok1JPRo7dgNsLSKJ3UQ6GJGoKrj3gBLT++GBNmkzrewGLOQKrvyIAqQb8VqKwbYjMZm9jPjeKcUrPEGr0tbWw8hfnYFUMYRDheTG+yK4cA80b4lJZucZaNim5XDOPicw89uBQmRNKdmgdCE6sLiDSlzvDcmjPYjXqAeTAs7QpZDz/9dC6voVqUpsFljzMA3kSmUa3YzLAnP3Id1I1h2IQEy2Uxhv0jgsLsX0PaRfCFaexfrrb/EQ8GG4tmmpRwWwHggpn7B7NA6LS1b+0bjOnx8S0MnUelpI4kPQHSj1ailZVpLTiHHJ0kdJPyOgpyM38eC2btQCmsaze79E+pjgkgNOesKgjls8ieP3LVrzOzEbGDUG3G24ahXKN7gd7ZiSzVVQ175i5FMP1vecdGUS6gN9j/RdWtOixQN7gWUV53IPce3XBSUG3CMw7YsBdi4hVjpAZAUox+rTyK0DTvriW/kD0o+Mk1oeRcQZS13NLv6NLZ97AthmJOtqILlvAUN2CCkoC/GQJUYsBxZe0yXLbzZLedxVSsBqjFZrloC1RkEFJz3bGbu+npZFWoVyMEvJK4BzcTa/HsBpNNOzlqY0Af+vpR7AZcG1/kuymCbgYpwbZAzAEwywEBfwRaWJJ3X3528A4JytUSe1lnzAtosrOK3YZEkp7bKQilI5SZssjS+7SvxdEL6fElLTTEaxPKXMOyt8PydtnqtY8k+FtGYES5zNwLpTijtfEOJaegC36ir+PqHE+F/CtYLiTvXWxBWFSxaFYmNFdGmUhba69rISI+cduak3nhJra10PDwaRqiub1Bira1RCNvleaRL8JJy6KqhWCgnceDzk90Xhek3ZiJKZlpaFQWPKtQLSlytYh8u5USde+5bnPMHtGmUMV0jfCddGFXdevgYYTS+pOjqhWPmM5TsmrjdRs86glh0FmJKQWqYwbtwYc0QA+63AO2zdU8I6q35jzwsk907Byrsc+WH0V87Vh181gD2MTkgwZcUhs0Fs2hFjLg6fX4SUwwY5qVh30XbSWlaI6BPl5FUG6HGA5VLuwRRI6xBZhV37VVhdasD7BHtSIiszLK8BRnd+QTlqnlJcm1n7MPpMz6eUkgb5KSPN+SXmHFMAHVXmWTCfPPyLcOjCkhLLx4UdPk2/e520hI7mNoRK0tKT4/VxrIvj/w0LB/A9PnXk97yqwKQWD1oR8HnACxjs+8bfwyCgj0l/A/A4zQEXsbqIMMn5b/1YQLtYz4Qy37wt2NceUPv6mbykR6f+g/EJEyys+7JlPPecekGIecsmuyCiIhpy5y0eZN6H53rBudqVHFPALtHvLkUCjIk3KK2SIk02Hxj/pBP9mW9cec28X4S3Aldp/HTcBsCswNo2sF0ZgvVDxeQav9FeFUhsNnbHA8wWBH0pCBZyR8b9sT14JBQEPR2o9v5Zs/ayqbpIYyd5gvkg48G6LuLuGAglTeAMkp/58oPudsUoqwZY9RlZ1MelrrRrdK09sBh+wWQ7rM4ud6WOxuISTlVjgZRTsK0Dm94Q5W35RP8FADfaqFi1Hyy9GSTTpHQoFtB0+AMHHekQsZBkzUkBtzv6q0xpC1v3YpL/8OEmtG6bc30l8T3rBmycvWvX2cK1G+bShqXX4RTVmBHQKo6bif//UkOaqzJeTG1JIT35L6PyGwiltNbYkJXv4fiXAzNLD96DdXUFObUc9Z2TuPK3AAMAt1KCuAWFwk0AAAAASUVORK5CYII=',
            iconSize: new L.Point(60, 60),
            iconAnchor: new L.Point(30, 30),
            popupAnchor: new L.Point(0, 0),
            shadowSize: null
        }
    },

    // setup options
    initialize: function(size) {
        this._setPileOptions(size || 1);
    },

    // update the size of an existing pile
    update: function(size, div) {
        this._setPileOptions(size);
        this._setIconStyles(div, size)
    },

    // make a new icon
    createIcon: function() {
        var div = document.createElement('div');
        this._setIconStyles(div);
        return div;
    },

    // no shadows
    createShadow: function() {
        return null; // TODO: something else?
    },

    // change inline styles based on leafpile size
    _setPileOptions: function(size) {
        for (var i in this._sizeOptions) {
            if (size <= i) {
                this.options = this._sizeOptions[i];
                break;
            }
        }
    },

    // set some inline styles for the leafpile icon
    _setIconStyles: function(div, size) {
        L.Icon.prototype._setIconStyles.call(this, div, 'icon');
        div.style['cursor'] = 'pointer';
        div.style['background'] = 'url(data:image/png;base64,'+this.options.image+') no-repeat 0 0';
        div.style['text-align'] = 'center';
        div.style['font-size'] = '12px';
        div.style['font-weight'] = 'bold';
        div.style['color'] = 'white';
        div.style['line-height'] = this.options.iconSize.y+'px';
        div.innerHTML = (size > 1 ) ? size : '';
    }
});


/* ==========================================================
 * L.Leafpile.Marker
 *
 * A marker representing a clustering of other markers
 * ========================================================== */
L.Leafpile.Marker = L.Marker.extend({

    options: {
        radius: 60
    },

    // setup - requires a marker
    initialize: function(mark, options) {
        var id = L.Util.stamp(mark);
        this._markers = {id: mark};
        this._latlng = mark.getLatLng();
        L.Util.setOptions(this, options);
        this.options.icon = new L.Leafpile.Icon(1);
    },

    // set center on map add
    onAdd: function(map) {
        L.Marker.prototype.onAdd.call(this, map);
        this._center = this._map.latLngToLayerPoint(this._latlng);
        this.options.icon.update(Object.keys(this._markers).length, this._icon);
    },

    // calculate if a point is within the bounds of the pile
    inBounds: function(point) {
        var dist = this._center.distanceTo(point);
        return (dist < this.options.radius ? dist : false);
    },

    // add a marker to the pile
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

    // remove a marker from the pile
    removeMarker: function(mark) {
        var id = L.Util.stamp(mark);
        delete this._markers[id];
        this._resetMapPosition();
        this.options.icon.update(Object.keys(this._markers).length, this._icon);
    },

    // re-calculate the leafpile position based on its markers
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

    // fire a click event
    _onMouseClick: function(e) {
        L.DomEvent.stopPropagation(e);
        var marks = [];
        for (var i in this._markers) marks.push(this._markers[i]);
        this.fire('click', {originalEvent: e, markers: marks});
    }

});
