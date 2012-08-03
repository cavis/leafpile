
Leafpile Versions!
==================

0.1.0
------------

* Initial version.  Some stuff went down.
* Decided to call it "leafpile".  Because it's catchy.  And "pile" is a great noun, and I'll fight any man who says otherwise.


0.1.1
------------

* Improved `L.Leafpile.Marker` icons.
* Fixed positioning of `L.Leafpile.Marker` popups.
* Allow "pile'd" markers to display their own popups through their `L.Leafpile.Marker`.  Basically, if you just call `openPopup()` on any marker in the Leafpile, and it will be displayed aligned with the pile.
* Add option for single-marker leafpiles to either display the new circular icons, or the boring-ol' default marker icons.
* Misc bug fixes related to add/removing markers from things.
* The usual leaflet `addLayer()` and `removeLayer()` functions now alias to `addMarker()` and `removeMarker()`.


0.1.2
------------

* Port the whole thing to a leaflet-style build system
* Fix some animation bugs with the new leaflet 0.4.1 stable
* Hopefully made options/extensions simpler
