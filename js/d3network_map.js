var myMap;
var nodesLayer;
var linksLayer;
var baseMaps;
var overlayMaps;
var mapctrl;
var landcovermap2001;
var landcovermap2018;

function draw_map(){

  /*  if(myMap){
      myMap.remove();
      myMap = null;
    }
*/
  if(!myMap){
    $("#mapbox").html("<div id='map'></div>");
    myMap = L.map("map");
    
     // landcover maps
     // https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/#visualization-product-catalog
     var template =
      '//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
      '{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.png';
    
     landcovermap2001 = L.tileLayer(template, {
      //layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      layer: 'MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual',
      tileMatrixSet: 'GoogleMapsCompatible_Level8', // only works at level8
      maxZoom: 8,
      time: '2001-06-01',
      tileSize: 256,
      subdomains: 'abc',
      noWrap: false,
      continuousWorld: true,

      attribution:
        '<a href="https://wiki.earthdata.nasa.gov/display/GIBS" target="_blank">' +
        'NASA EOSDIS GIBS</a>'
    }); //.addTo(myMap);
    
    landcovermap2018 = L.tileLayer(template, {
      //layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      layer: 'MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual',
      tileMatrixSet: 'GoogleMapsCompatible_Level8', // only works at level8
      maxZoom: 8,
      time: '2018-06-01',
      tileSize: 256,
      subdomains: 'abc',
      noWrap: false,
      continuousWorld: true,

      attribution:
        '<a href="https://wiki.earthdata.nasa.gov/display/GIBS" target="_blank">' +
        'NASA EOSDIS GIBS</a>'
    }); //.addTo(myMap);
   
    // BASE MAP
    var basemap_osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
          maxZoom: 20,
          attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        }).addTo(myMap);

    var basemap_carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/{id}/{z}/{x}/{y}.png', {
      maxZoom: 20,
      id: 'voyager'
    }).addTo(myMap);

    var basemap_dark = L.tileLayer('https://cartodb-basemaps-d.global.ssl.fastly.net/dark_all/{z}/{x}/{y}@2x.png', {
      maxZoom: 20,
      id: 'darkmatter'
    }).addTo(myMap);

    var basemap_opentopo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",{
      maxZoom: 20,
      attribution: '&copy; <a href="https://opentopomap.org/" target="_blank">OpenTopoMap</a>'
    }).addTo(myMap);

    ///*



///////////////////////// LINKS LAYER //////////////////////////
    /*
    linksLayer = L.geoJSON([], {
        onEachFeature: function(feature, layer){
          layer.bindPopup(linktiphtml(feature.properties));
          layer.setStyle({
            color: "blue",
            weight: linkwidth(feature.properties),
            opacity: 0.5,
          })
        }
      }).addTo(myMap);
      */
      /*
      if(linksLayer) linksLayer = null;
      linkslyr = createlinkslayer(gl_dataset.links);
      linksLayer = linkslyr;
      linksLayer.addTo(myMap);
      */

      linksLayer = createlinkslayer(gl_dataset.links, gl_dataset.nodes).addTo(myMap);

      //var linksLayerB = createlinkslayer(gl_dataset.links).addTo(myMap);


///////////////////////////NODES LAYER /////////////////////
      /*
      nodesLayer = L.geoJSON([], {
      		onEachFeature: function(feature, layer){
            layer.bindPopup(nodetiphtml(feature.properties));
          },

      		pointToLayer: function (feature, latlng) {
      			return L.circleMarker(latlng, {
      				radius: nodesize(feature.properties),
      				fillColor: nodecolor(feature.properties),
      				color: "#ccc",
      				weight: 0.1,
      				opacity: 1,
      				fillOpacity: 0.8
      			});
      		}
      	}).addTo(myMap);
        */

        /*
      if(nodesLayer) nodesLayer = null;
      var nodeslyr = createnodeslayer(gl_dataset.nodes);
      nodesLayer = nodeslyr;
      nodesLayer.addTo(myMap);
      */

      nodesLayer = createnodeslayer(gl_dataset.nodes,gl_dataset.links).addTo(myMap);

      //var nodesLayerB = createnodeslayer(gl_dataset.nodes).addTo(myMap);

      baseMaps = {                
        "BaseMap Carto": basemap_carto,
        "BaseMap Dark": basemap_dark,
        "BaseMap Topo": basemap_opentopo,
        "BaseMap OSM": basemap_osm
      };

      //var linksLayerB = createlinkslayer(gl_dataset.links).addTo(myMap);
      //landcovermap2001.addTo(myMap);
      //landcovermap2018.addTo(myMap);      
      overlayMaps = {
        "Landcover 2018": landcovermap2018,
        "Landcover 2001": landcovermap2001,
        "Links": linksLayer,
        "Nodes": nodesLayer
      };

      mapctrl = L.control.layers(overlayMaps, baseMaps).addTo(myMap);

      //myMap.invalidateSize();



      var pov = myGlobe.pointOfView();

      myMap.setView([isNaN(pov.lat) ? 43.1147469 : pov.lat, isNaN(pov.lng) ? -95.5102336 : pov.lng], 3);

    }
    else{


      if(mapctrl) {
        myMap.removeControl(mapctrl);
        mapctrl = null;
      }

      if(nodesLayer) {
        //myMap.removeLayer(nodesLayer);
        nodesLayer.removeFrom(myMap);
        nodesLayer = null;
      }

      if(linksLayer) {
        //myMap.removeLayer(linksLayer);
        linksLayer.removeFrom(myMap);
        linksLayer = null;
      }

      nodesLayer = createnodeslayer(gl_dataset.nodes, gl_dataset.links);
      nodesLayer.addTo(myMap);
      linksLayer = createlinkslayer(gl_dataset.links, gl_dataset.nodes);
      linksLayer.addTo(myMap);
      linksLayer.bringToFront();
      nodesLayer.bringToFront();
      //landcovermap2001.addTo(myMap);
      //landcovermap2018.addTo(myMap);
      overlayMaps = {
        "Landcover 2018": landcovermap2018,
        "Landcover 2001": landcovermap2001,
        "Links": linksLayer,
        "Nodes": nodesLayer
      };

      mapctrl = L.control.layers(baseMaps, overlayMaps);
      mapctrl.addTo(myMap);

      //var zoomLevel = 3;
      //var center = [43.1147469,-95.5102336]//[39.737, -104.959];
      //var pov = myGlobe.pointOfView();
      //myMap.setView([isNaN(pov.lat) ? 43.1147469 : pov.lat, isNaN(pov.lng) ? -95.5102336 : pov.lng], 3);

  }
}

function createnodeslayer(nodes, links){
    var geojson_nodes = nodes2geojson(nodes);
    var geojson_links = links2geojson(links);
    var nodeslayer = L.vectorGrid.slicer(geojson_nodes, {
       rendererFactory: L.svg.tile,
       vectorTileLayerStyles: {
         sliced: function(properties, zoom) {
           return {
             fillColor: nodecolor(properties),
             fillOpacity: 1.0,
             stroke: true,
             fill: true,
             radius: nodesize(properties),
             color: '#ccc',
             opacity: 0.5,
             weight: 1,
           }
         }
       },
       interactive: true,
       getFeatureId: function(f) {
         return f.properties.id;
       }
     })
     .on('mouseover', function(e) {
       if(!MOUSE_QUERY) return;
       var properties = e.layer.properties;
       L.popup()
         .setContent(nodetiphtml(properties))
         .setLatLng(e.latlng)
         .openOn(myMap);



        // nodeslayer.setFeatureStyle(properties.id, nodestyle);
         // change the style of connected nodes
         for(var i in geojson_nodes.features){
           if(isConnected(properties, geojson_nodes.features[i].properties)){
             var nodestyle = {
               fillColor: "blue",
               fillOpacity: 1.0,
               stroke: true,
               fill: true,
               radius: 2*nodesize(geojson_nodes.features[i].properties),
               color: '#ccc',
               opacity: 0.5,
               weight: 1
             };
             //setTimeout(function(){
                nodeslayer.setFeatureStyle(geojson_nodes.features[i].properties.id, nodestyle);
              //}, 100);
           }
         }

         // change the style of connected links
         for(var i in geojson_links.features){
           if(geojson_links.features[i].properties.id.split("-").indexOf(parseInt(properties.id).toString()) >= 0){
             var linkstyle = {
               color: 'blue',
               opacity: 0.5,
               weight: 2*linkwidth(geojson_links.features[i].properties),
             };

             linksLayer.setFeatureStyle(geojson_links.features[i].properties.id, linkstyle);
          }
        }

       })
     .on('mouseout', function(e) {
         if(!MOUSE_QUERY) return;
         myMap.closePopup();
         var properties = e.layer.properties;


         //nodeslayer.setFeatureStyle(properties.id, nodestyle);
         // change the style of connected nodes
         for(var i in geojson_nodes.features){
           if(isConnected(properties, geojson_nodes.features[i].properties)){
             var nodestyle = {
               fillColor: nodecolor(geojson_nodes.features[i].properties),
               fillOpacity: 1.0,
               stroke: true,
               fill: true,
               radius: nodesize(geojson_nodes.features[i].properties),
               color: '#ccc',
               opacity: 0.5,
               weight: 1,
             };
             nodeslayer.setFeatureStyle(geojson_nodes.features[i].properties.id, nodestyle);
           }
         }

         // change the style of connected links
         for(var i in geojson_links.features){
           if(geojson_links.features[i].properties.id.split("-").indexOf(parseInt(properties.id).toString()) >= 0){
             var linkstyle = {
               color: linkcolor(geojson_links.features[i].properties),
               opacity: 0.1,
               weight: linkwidth(geojson_links.features[i].properties),
             };

             linksLayer.setFeatureStyle(geojson_links.features[i].properties.id, linkstyle);
          }
        }

       })
     .on('click', function(e){
         myMap.panTo(e.latlng);
     })
     .on('contextmenu', function(e){
         var properties = e.layer.properties;
         if(properties.login != null ) window.open(`https://www.inaturalist.org/people/${properties.login}`, '_blank')
     });
     return nodeslayer;
}

function createlinkslayer(links, nodes){
  var linksLayerGeod = new L.Geodesic(links2linearray(links), {
            wrap: false,
            steps: 6
          });

  var geojson_nodes = nodes2geojson(nodes);
  var geojson_links = links2geojson2(links, linksLayerGeod._latlngs);

  var linkslayer = L.vectorGrid.slicer(geojson_links, {
      rendererFactory: L.svg.tile,
      vectorTileLayerStyles: {
        sliced: function(properties, zoom) {
          return {
            color: linkcolor(properties),
            opacity: 0.1,
            weight: linkwidth(properties),
          }
        }
      },
      interactive: true,
      getFeatureId: function(f) {
        return f.properties.id;
      }
    })
    .on('mouseover', function(e) {
      if(!MOUSE_QUERY) return;
      var properties = e.layer.properties;
      L.popup()
        .setContent(linktiphtml(properties))
        .setLatLng(e.latlng)
        .openOn(myMap);

        var linkstyle = {
          color: 'blue',
          opacity: 0.5,
          weight: 2*linkwidth(properties),
        };
        linkslayer.setFeatureStyle(properties.id, linkstyle);

        // change the style of connected nodes
        var idsstr = properties.id.split("-");
        var ids = [];
        ids.push(parseInt(idsstr[0]));
        ids.push(parseInt(idsstr[1]));
        for(var i in geojson_nodes.features){
            if(ids.indexOf(geojson_nodes.features[i].properties.id) >= 0){

              var nodestyle = {
                fillColor: "blue",
                fillOpacity: 1.0,
                stroke: true,
                fill: true,
                radius: 2*nodesize(geojson_nodes.features[i].properties),
                color: '#ccc',
                opacity: 0.5,
                weight: 1
              };
              nodesLayer.setFeatureStyle(geojson_nodes.features[i].properties.id, nodestyle);
            }
          }
      })
    .on('mouseout', function(e) {
        if(!MOUSE_QUERY) return;
        myMap.closePopup();

        var properties = e.layer.properties;
        var style = {
          color: linkcolor(properties),
          opacity: 0.1,
          weight: linkwidth(properties),
        };
        linkslayer.setFeatureStyle(properties.id, style);

        // change the style of connected nodes
        var idsstr = properties.id.split("-");
        var ids = [];
        ids.push(parseInt(idsstr[0]));
        ids.push(parseInt(idsstr[1]));
        for(var i in geojson_nodes.features){
            if(ids.indexOf(geojson_nodes.features[i].properties.id) >= 0){

              var nodestyle = {
                fillColor: nodecolor(geojson_nodes.features[i].properties),
                fillOpacity: 1.0,
                stroke: true,
                fill: true,
                radius: nodesize(geojson_nodes.features[i].properties),
                color: '#ccc',
                opacity: 0.5,
                weight: 1
              };
              nodesLayer.setFeatureStyle(geojson_nodes.features[i].properties.id, nodestyle);
            }
          }

      });
      return linkslayer;
}

function nodes2geojson(nodes){
    var nodes_geojson = {
      type: "FeatureCollection",
      features:[]
    };

    for(var i in nodes){
      var feat = {
        geometry:{
          type: "Point",
          coordinates: [nodes[i].lng , nodes[i].lat]
        },
        type: "Feature",
        properties: jQuery.extend(true, {}, nodes[i]),
        id: nodes[i].id
      };
      nodes_geojson.features.push(feat);

    }

    return JSON.parse(JSON.stringify(nodes_geojson));
}

function links2geojson(links){

  var links_geojson = {
    type: "FeatureCollection",
    features:[]
  };

  for(var i in links){

    var props = jQuery.extend(true, {}, links[i]);
    props.id = links[i].source.id + '-' + links[i].target.id;

    links_geojson.features.push({
      geometry:{
        type: "LineString",
        coordinates: [
          [links[i].source.lng, links[i].source.lat],
          [links[i].target.lng, links[i].target.lat]
        ]
      },
      type: "Feature",
      properties: props
    })
  }
  //stackoverflow.com/questions/42376464
  return JSON.parse(JSON.stringify(links_geojson));

}


function links2geojson2(links, geodesic_latlngs){

  var links_geojson = {
    type: "FeatureCollection",
    features:[]
  };

  for(var i in links){

    var props = jQuery.extend(true, {}, links[i]);
    props.id = links[i].source.id + '-' + links[i].target.id;

    var latlngs = geodesic_latlngs[i];
    var coords = [];
    for(var j in latlngs){
      coords.push([latlngs[j].lng, latlngs[j].lat]);
    }

    links_geojson.features.push({
      geometry:{
        type: "LineString",
        coordinates: coords
      },
      type: "Feature",
      properties: props
    })
  }
  //stackoverflow.com/questions/42376464
  return JSON.parse(JSON.stringify(links_geojson));

}

function links2linearray(links){

  var links_array = [];

  for(var i in links){
    links_array.push([
      new L.LatLng(links[i].source.lat, links[i].source.lng),
      new L.LatLng(links[i].target.lat, links[i].target.lng)
    ])
  }

  return links_array;

}
