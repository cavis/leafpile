/* ==========================================================
* leafpile.js v0.1.2
* A marker clustering layer for Leaflet maps
* http://github.com/cavis/leafpile
* ==========================================================
* Copyright (c) 2012 Ryan Cavis
* Licensed under http://en.wikipedia.org/wiki/MIT_License
* ========================================================== */
(function(e,t){L.LeafpileGroup=L.LayerGroup.extend({includes:L.Mixin.Events,options:{radius:100,maxZoomChange:2,maxZoomLevel:8,singlePiles:!1,inlineStyles:!0,styleSizes:[1,10,25,50],styleDefs:[{image:"iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAMAAADzN3VRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADNQTFRFAAAA/5kA/5kA/5kA/5kA/5kA/5kA/5kA/5kA/5kA/5kA/5kA/5kA/5kA/5kA/5kA/5kA8jf0CQAAABB0Uk5TABAgMEBQYHCAj5+vv8/f7yMagooAAACJSURBVHjapZFJDsMgDEVraKAeCr7/aUsIyMJJNulfWIgnT9+vfxQyYxTO4P6BtCnvgRYWq+6SHmt0wGQIBjA0C6J60UhpT580ct7iAELogLSsoMxyLuOY/zHhC8KdpAuS7vZRuPMAp29tgWHd8ShgXn9tjM9yhhCqubnF5aZ46mEssYhQai2e6wcf9hSNzav/NAAAAABJRU5ErkJggg==",size:new L.Point(25,25),anchor:new L.Point(12,12),popup:new L.Point(0,-8)},{image:"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",size:new L.Point(55,55),anchor:new L.Point(27,27),popup:new L.Point(0,-14)},{image:"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",size:new L.Point(65,65),anchor:new L.Point(32,32),popup:new L.Point(0,-18)},{image:"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",size:new L.Point(75,75),anchor:new L.Point(37,37),popup:new L.Point(0,-22)}]},initialize:function(e,t){L.Util.setOptions(this,e),this._layers={},this._loneMarkers={},this._leafPiles={};if(t)for(var n=0;n<t.length;n++)this.addLayer(t[n])},addLayer:function(e){var t=L.Util.stamp(e);return this._layers[t]=e,this._map&&(e instanceof L.Marker?(this._addMarkerSomewhere(e),e.on("click",this._onMarkerClick,this),e.openPopup=function(){if(this._popup&&this._leafpile){var e=L.Util.extend({},this._popup.options),t=this._popup._content;delete e.offset,this._leafpile.bindPopup(t,e),this._leafpile.openPopup()}else L.Marker.prototype.openPopup.call(this);return this}):this._map.addLayer(e)),this},removeLayer:function(e){var t=L.Util.stamp(e);delete this._layers[t];if(this._map){this._map.removeLayer(e),e instanceof L.Marker&&e.off("click",this._onMarkerClick,this);if(this._loneMarkers[t])delete this._loneMarkers[t];else for(var n in this._leafPiles)this._leafPiles.hasOwnProperty(n)&&this._removeFromLeafpile(e,this._leafPiles[n])}return this},clearLayers:function(e){if(this._map){for(var t in this._layers)this._layers.hasOwnProperty(t)&&this._map.removeLayer(this._layers[t]);for(var n in this._leafPiles)this._leafPiles.hasOwnProperty(n)&&this._map.removeLayer(this._leafPiles[n])}this._loneMarkers={},this._leafPiles={};if(e!==!0){this._layers={};for(var r in this._layers)this._layers.hasOwnProperty(r)&&this._layers[r]instanceof L.Marker&&this._layers[r].off("click",this._onMarkerClick,this)}return this},setRadius:function(e){this.options.radius=e,this._redraw()},onAdd:function(e){this._map=e;for(var t in this._layers)this._layers.hasOwnProperty(t)&&this.addLayer(this._layers[t]);this._map.on("zoomstart",this._onZoomStart,this),this._map.on("zoomend",this._onZoomEnd,this)},onRemove:function(e){this.clearLayers(),this._map=null,this._map.off("zoomstart",this._onZoomStart,this),this._map.off("zoomend",this._onZoomEnd,this)},_addMarkerSomewhere:function(e){for(var t in this._leafPiles)if(this._shouldGroup(e,this._leafPiles[t])){this._leafPiles[t].addMarker(e);return}for(var n in this._loneMarkers)if(this._shouldGroup(e,this._loneMarkers[n])){this._createLeafpile([e,this._loneMarkers[n]]);return}if(this.options.singlePiles){this._createLeafpile([e]);return}var r=L.Util.stamp(e);this._loneMarkers[r]=e,this._map.addLayer(e)},_shouldGroup:function(e,t){if(this._map.getZoom()>=this.options.maxZoomLevel)return!1;var n=this._markerToPoint(e),r=this._markerToPoint(t);return n.distanceTo(r)<this.options.radius?!0:!1},_markerToPoint:function(e){var t=this._map.getZoom();return e._cacheLayerPt||(e._cacheLayerPt=this._map.latLngToLayerPoint(e.getLatLng())),e._cacheLayerPt},_createLeafpile:function(e){var t=new L.Leafpile(e,this),n=L.Util.stamp(t);this._leafPiles[n]=t,this._map.addLayer(t),t.on("click",this._onMarkerClick,this);for(var r=0;r<e.length;r++){var i=L.Util.stamp(e[r]);this._loneMarkers[i]&&(this._map.removeLayer(e[r]),delete this._loneMarkers[i])}var s=""+n;for(n in this._leafPiles)if(this._leafPiles.hasOwnProperty(n)&&n!==s&&this._shouldGroup(t,this._leafPiles[n])){var o=this._leafPiles[n].getMarkers();t.addMarker(o),this._leafPiles[n].off("click",this._onMarkerClick,this),this._map.removeLayer(this._leafPiles[n]),delete this._leafPiles[n]}for(var u in this._loneMarkers)this._shouldGroup(t,this._loneMarkers[u])&&(t.addMarker(this._loneMarkers[u]),this._map.removeLayer(this._loneMarkers[u]),delete this._loneMarkers[u])},_removeFromLeafpile:function(e,t){t.removeMarker(e);if(t.getCount()<1)t.off("click",this._onMarkerClick,this),this._map.removeLayer(t),delete this._leafPiles[L.Util.stamp(t)];else if(t.getCount()===1&&!this.options.singlePiles){var n=t.getMarkers()[0],r=L.Util.stamp(n);t.off("click",this._onMarkerClick,this),this._map.removeLayer(t),delete this._leafPiles[L.Util.stamp(t)],this._map.addLayer(n),this._loneMarkers[r]=n}},_redraw:function(){this.clearLayers(!0);for(var e in this._layers)this._layers.hasOwnProperty(e)&&(this._layers[e]instanceof L.Marker?this._addMarkerSomewhere(this._layers[e]):this._map.addLayer(this._layers[e]))},_onZoomStart:function(){for(var e in this._layers)this._layers.hasOwnProperty(e)&&delete this._layers[e]._cacheLayerPt;this._map.closePopup()},_onZoomEnd:function(){this._redraw()},_onMarkerClick:function(e){var t=e.target instanceof L.Leafpile,n=t?e.target.getMarkers():[e.target],r=[];this.fire("click",{group:this,leafpile:t?e.target:!1,markers:n,zooming:n.length>1,cancelZoom:function(){e.cancel=!0}});if(n.length>1&&e.cancel!==!0){for(var i=0;i<n.length;i++)r.push(n[i].getLatLng());var s=new L.LatLngBounds(r),o=Math.min(this._map.getBoundsZoom(s),this._map.getZoom()+this.options.maxZoomChange);this._map.setView(s.getCenter(),o)}}}),L.LeafpileIcon=L.DivIcon.extend({initialize:function(e,t,n){this.lpCount=e,this.lpIndex=t,this.lpDef=n,L.Util.setOptions(this,{className:"leafpile-icon leafpile-size-"+t,html:"<b>"+e+"</b>",iconSize:n.size,iconAnchor:n.anchor,popupAnchor:n.popup})},_setIconStyles:function(e,t){L.Icon.prototype._setIconStyles.call(this,e,"icon"),e.style.cursor="pointer",e.style.background="url(data:image/png;base64,"+this.lpDef.image+") no-repeat 0 0",e.style.textAlign="center",e.style.fontSize="13px",e.style.color="#fff",e.style.lineHeight=this.options.iconSize.y+"px"}}),L.leafpileIcon=function(e){return new L.LeafpileIcon},L.Leafpile=L.Marker.extend({options:{clickable:!0,icon:new L.Icon.Default},initialize:function(e,t,n){L.Util.setOptions(this,n),this._group=t,this._markers={},this._cacheLayerPt=new L.Point(0,0),this.addMarker(e)},getCount:function(){var e=0;for(var t in this._markers)this._markers.hasOwnProperty(t)&&e++;return e},addMarker:function(e){if(e instanceof Array){var t=this.getCount(),n=this._cacheLayerPt.x*t,r=this._cacheLayerPt.y*t;for(var i=0;i<e.length;i++){var s=L.Util.stamp(e[i]);if(!this._markers[s]){this._markers[s]=e[i],this._markers[s]._leafpile=this;var o=this._group._markerToPoint(e[i]);n+=o.x,r+=o.y}}return t=this.getCount(),this._cacheLayerPt=new L.Point(n/t,r/t),this._latlng=this._group._map.layerPointToLatLng(this._cacheLayerPt),this._updateLeafpileIcon(),this}return this.addMarker([e])},removeMarker:function(e){var t=L.Util.stamp(e);if(this._markers[t]){var n=this._group._markerToPoint(this._markers[t]),r=this.getCount(),i=this._cacheLayerPt.x*r-n.x,s=this._cacheLayerPt.y*r-n.y;delete this._markers[t]._leafpile,delete this._markers[t],r=this.getCount(),this._cacheLayerPt=new L.Point(i/r,s/r),this._latlng=this._group._map.layerPointToLatLng(this._cacheLayerPt),this._updateLeafpileIcon()}return this},getMarkers:function(){var e=[];for(var t in this._markers)this._markers.hasOwnProperty(t)&&e.push(this._markers[t]);return e},onRemove:function(e){for(var t in this._markers)this._markers.hasOwnProperty(t)&&delete this._markers[t]._leafpile;L.Marker.prototype.onRemove.call(this,e)},_updateLeafpileIcon:function(){var e=this._group.options.styleSizes,t=this._group.options.styleDefs,n=this.getCount(),r=0;for(r;r<e.length;++r)if(n<=e[r])break;r>e.length-1&&(r=e.length-1),this.setIcon(new L.LeafpileIcon(n,r,t[r]))}})})(this);