/* ==========================================================
 * L.LeafpileIcon
 *
 * Icon for use with a Leafpile
 * ========================================================== */
L.LeafpileIcon = L.DivIcon.extend({

    // special constructor to include group count, index (in
    // the sizes array), and size def object
    initialize: function (count, index, def) {
        this.lpCount = count;
        this.lpIndex = index;
        this.lpDef = def;

        L.Util.setOptions(this, {
            className:   'leafpile-icon leafpile-size-' + index,
            html:        '<b>' + count + '</b>',
            iconSize:    def.size,
            iconAnchor:  def.anchor,
            popupAnchor: def.popup
        });
    },

    // set special inline styles
    _setIconStyles: function (div, name) {
        L.Icon.prototype._setIconStyles.call(this, div, 'icon');
        div.style.cursor = 'pointer';
        div.style.background = 'url(data:image/png;base64,' + this.lpDef.image + ') no-repeat 0 0';
        div.style['text-align'] = 'center';
        div.style['font-size'] = '13px';
        div.style.color = '#fff';
        div.style['line-height'] = this.options.iconSize.y + 'px';
    }

});

L.leafpileIcon = function (options) {
    return new L.LeafpileIcon();
};
