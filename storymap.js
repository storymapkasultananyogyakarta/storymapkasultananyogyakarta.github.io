(function ($) {
    'use strict';

    var customIcon = L.icon({
        iconUrl: 'icon/icons8-marker-100.png',
        iconSize: [50, 50],
        iconAnchor: [25,40]
    });

    var legend = L.control({ position: "bottomright"});
    var div = L.DomUtil.create("div", "legend");
    
    $.fn.storymap = function (options) {

        var defaults = {
            selector: '[data-place]',
            breakpointPos: '38%',
            createMap: function () {
                // create a map in the "map" div, set the view to a given place and zoom
                var map = L.map('map', {
                    center: [-7.793601659345258, 110.3704267303214],
                    zoom: 10,
                    zoomControl: false
                });

                var zoom = L.control.zoom({
                    position: 'bottomleft'
                }).addTo(map);

                // Tile Layer
                var baseMap = L.tileLayer('https://tile.jawg.io/5cae44b4-28df-481a-a2d9-9b261d78a039/{z}/{x}/{y}{r}.png?access-token=L4Kh1ENETghHg0LTVRBLUNWZ4KWkXciY6fI0V47U8VlNgTdUNQkj2bLIy0ovMB8X', {
                    maxZoom: 16
                });
                map.attributionControl.addAttribution("<a href=\"https://www.jawg.io\" target=\"_blank\">&copy; Jawg</a> - <a href=\"https://www.openstreetmap.org\" target=\"_blank\">&copy; OpenStreetMap</a>&nbsp;contributors");
                baseMap.addTo(map)

                // var petaLatar = L.tileLayer('https://api.mapbox.com/styles/v1/ignatiusivan99/cko8ovkze4nt418tet26t6mov/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiaWduYXRpdXNpdmFuOTkiLCJhIjoiY2tuNWMwYmwzMDJwODJ4cWRtZmlpdHF3eSJ9.37uVfMF5jz3yTIxsY1-Uxw', {
                //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                //     subdomains: 'abcd',
                //     maxZoom: 14
                // });
                // petaLatar.addTo(map);

                return map;
            }
        };

        var settings = $.extend(defaults, options);


        if (typeof (L) === 'undefined') {
            throw new Error('Storymap requires Laeaflet');
        }
        if (typeof (_) === 'undefined') {
            throw new Error('Storymap requires underscore.js');
        }

        function getDistanceToTop(elem, top) {
            var docViewTop = $(window).scrollTop();

            var elemTop = $(elem).offset().top;

            var dist = elemTop - docViewTop;

            var d1 = top - dist;

            if (d1 < 0) {
                return $(window).height();
            }
            return d1;

        }

        function highlightTopPara(paragraphs, top) {

            var distances = _.map(paragraphs, function (element) {
                var dist = getDistanceToTop(element, top);
                return { el: $(element), distance: dist };
            });

            var closest = _.min(distances, function (dist) {
                return dist.distance;
            });

            _.each(paragraphs, function (element) {
                var paragraph = $(element);
                if (paragraph[0] !== closest.el[0]) {
                    paragraph.trigger('notviewing');
                }
            });

            if (!closest.el.hasClass('viewing')) {
                closest.el.trigger('viewing');
            }
        }

        function watchHighlight(element, searchfor, top) {
            var paragraphs = element.find(searchfor);
            highlightTopPara(paragraphs, top);
            $(window).scroll(function () {
                highlightTopPara(paragraphs, top);
            });
        }

        var makeStoryMap = function(element, markers) {

            var topElem = $('<div class="breakpoint-current"></div>')
                .css('top', settings.breakpointPos);
            $('body').append(topElem);

            var top = topElem.offset().top - $(window).scrollTop();

            var searchfor = settings.selector;

            var paragraphs = element.find(searchfor);

            paragraphs.on('viewing', function () {
                $(this).addClass('viewing');
            });

            paragraphs.on('notviewing', function () {
                $(this).removeClass('viewing');
            });

            watchHighlight(element, searchfor, top);

            var map = settings.createMap();

            var initPoint = map.getCenter();
            var initZoom = map.getZoom();

            var fg = L.featureGroup().addTo(map);

            function showMapView(key) {

                fg.clearLayers();
                if (key === 'intro') {
                    map.setView(initPoint, initZoom, true);
                    map.removeControl(legend)
                }
                if (key === 'additional') {
                    map.removeControl(legend)
                } else if (markers[key]) {
                    var marker = markers[key];
                    var layer = marker.layer;
                    if (typeof layer !== 'undefined') {
                        fg.addLayer(layer);
                    };
                    var dataGeojson = L.geoJSON(marker.geometry, {
                        color: "black",
                        fillColor: "green",
                        weight: 2
                    });
                    fg.addLayer(dataGeojson);
                    
                    fg.addLayer(L.marker([
                        marker.lat, marker.lon
                    ], { icon: customIcon }).bindPopup(marker.description, marker.properties).bindTooltip(marker.tooltip, marker.tooltipsetting));
                    map.setView([marker.lat, marker.lon], marker.zoom, 1);

                    map.removeControl(legend)

                    legend.onAdd = function() {
                        div.innerHTML = "<h4>Legenda</h4>";
                        if(marker.geometry == undefined) {
                            div.innerHTML += '<i class="icon" style="background-image: url(icon/icons8-marker-100.png);background-repeat: no-repeat;background-color: rgb(124, 106, 73, 0);"></i><span>Titik Lokasi</span><br>';
                        } else {
                            div.innerHTML += '<i class="icon" style="background-image: url(icon/icons8-marker-100.png);background-repeat: no-repeat;background-color: rgb(124, 106, 73, 0);"></i><span>Titik Lokasi</span><br>';
                            div.innerHTML += '<i class="icon" style="background-image: url(icon/boundary.png);background-repeat: no-repeat;background-color: rgb(124, 106, 73, 0);"></i><span>Perkiraan Wilayah Kekuasaan</span><br>';
                        } 
                        
                        return div;
                    }

                    map.on('popupopen', function(e) {
                        map.removeControl(legend);
                    })
                    map.on('popupclose', function(e) {
                        legend.addTo(map);
                    })

                    legend.addTo(map);

                }

            }

            paragraphs.on('viewing', function () {
                showMapView($(this).data('place'));
            });
        };

        makeStoryMap(this, settings.markers);

        return this;
    }

}(jQuery));
