(function ($) {
    'use strict';

    var customIcon = L.icon({
        iconUrl: 'icon/icons8-marker-100.png',
        iconSize: [50, 50],
        iconAnchor: [25,40]
    });
    
    $.fn.storymap = function (options) {

        var defaults = {
            selector: '[data-place]',
            breakpointPos: '33.333%',
            createMap: function () {
                // create a map in the "map" div, set the view to a given place and zoom
                var map = L.map('map', {
                    center: [-7.793601659345258, 110.3704267303214],
                    zoom: 11,
                    zoomControl: false
                });

                L.control.zoom({
                    position: 'topleft'
                }).addTo(map)

                // add an OpenStreetMap tile layer
                var baseMap = L.tileLayer('https://api.mapbox.com/styles/v1/ignatiusivan99/cko8ovkze4nt418tet26t6mov/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiaWduYXRpdXNpdmFuOTkiLCJhIjoiY2tuNWMwYmwzMDJwODJ4cWRtZmlpdHF3eSJ9.37uVfMF5jz3yTIxsY1-Uxw', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 19
                });
                baseMap.addTo(map);
                

                var legend = L.control({ position: "bottomright" });

                legend.onAdd = function(map) {
                var div = L.DomUtil.create("div", "legend");
                div.innerHTML += "<h4>Legenda</h4>";
                div.innerHTML += '<i class="icon" style="background-image: url(icon/icons8-marker-100.png);background-repeat: no-repeat;background-color: rgb(124, 106, 73, 0);"></i><span>Titik Lokasi</span><br>';
                div.innerHTML += '<i class="icon" style="background-image: url(icon/garisImajiner.png);background-repeat: no-repeat;background-color: rgb(124, 106, 73, 0);"></i><span>Garis Sumbu Filosofis</span><br>';
                div.innerHTML += '<i class="icon" style="background-image: url(icon/boundary-benteng.png);background-repeat: no-repeat;background-color: rgb(124, 106, 73, 0);"></i><span>Luasan Wilayah</span><br>';
                
                return div;
                };

                legend.addTo(map);

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
                if (key === 'caution') {
                    map.setView(initPoint, initZoom, true);
                } else if (markers[key]) {
                    var marker = markers[key];
                    var layer = marker.layer;
                    if (typeof layer !== 'undefined') {
                        fg.addLayer(layer);
                    };
                    var dataGeojson = L.geoJSON(marker.geometry, {
                        color: "green",
                        weight: 3
                    });
                    fg.addLayer(dataGeojson).addLayer(L.marker([
                        marker.lat, marker.lon
                    ], { icon: customIcon }).bindPopup(marker.description, marker.properties))
                    map.setView([marker.lat, marker.lon], marker.zoom, 1);
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
