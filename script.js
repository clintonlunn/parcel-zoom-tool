
require([
    // ArcGIS
    "esri/Map",
    "esri/PopupTemplate",
    "esri/layers/FeatureLayer",
    "esri/layers/MapImageLayer",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/views/MapView",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/geometry/geometryEngine",
    "dojo/query",

    
    

    // Widgets
    "esri/widgets/Home",
    "esri/widgets/Zoom",
    "esri/widgets/Compass",
    "esri/widgets/Search",
    "esri/widgets/Legend",
    "esri/widgets/BasemapToggle",
    "esri/widgets/ScaleBar",
    "esri/widgets/Attribution",
    "esri/tasks/Locator",
    // Bootstrap
    "bootstrap/Collapse",
    "bootstrap/Dropdown",

    // Calcite Maps
    "calcite-maps/calcitemaps-v0.7",
    // Calcite Maps ArcGIS Support
    "calcite-maps/calcitemaps-arcgis-support-v0.7",

    "dojo/_base/Color",
    "dojo/number",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/domReady!"
    ], function(Map, PopupTemplate, FeatureLayer, MapImageLayer, QueryTask, Query, MapView, SimpleFillSymbol, SimpleLineSymbol, Graphic, GraphicsLayer, geometryEngine, query, Home, Zoom, Compass, Search, Legend, BasemapToggle, ScaleBar, Attribution, Locator, Collapse, Dropdown, CalciteMaps, CalciteMapArcGISSupport, Color, number, dom, domConstruct) {

    /******************************************************************
     *
     * Create the map, view and widgets
     * 
     ******************************************************************/

    var parcelsTemplate = {
        title: 'Owner: {own_name}',
        content:
        "<p><b>Parcel ID:</b> {parcel_id}</p>" +
        "<p><b>State Parcel ID:</b> {state_par_}</p>" +
        "<p><b>PLI Code:</b> {pli_code}</p>" +
        "<p><b>Size:</b> {no_lnd_unt:NumberFormat(places: 2)} Acres<p>" +
        "<p><b>Value:</b> ${av_nsd:NumberFormat(places: 2)}</p>" +  
        "<p><b>TRS:</b> {twn} {rng} {sec}</p>" +
        "<p><b>Legal Description:</b> {s_legal}</p>" ,
        actions: [{
        title: "Visit the FL Public Lands Inventory Website",
        id: "pliWebsite",
        className: "esri-icon-launch-link-external"
        }]
    };


    var parcelsSearchTemplate = {        
        title: 'Owner: {own_name}',
        content:
        "<p><b>Parcel ID:</b> {PARCEL_ID}</p>" +
        "<p><b>State Parcel ID:</b> {STATE_PAR_}</p>" +
        "<p><b>PLI Code:</b> {PLI_CODE}</p>" +
        "<p><b>Size:</b> {NO_LND_UNT} Acres<p>" +
        "<p><b>Value:</b> ${AV_NSD}</p>" +  
        "<p><b>TRS:</b> {TWN} {RNG} {SEC}</p>" +
        "<p><b>Legal Description:</b> {S_LEGAL}</p>" ,
        actions: [{
        title: "Visit the FL Public Lands Inventory Website",
        id: "pliWebsite",
        className: "esri-icon-launch-link-external"
        }]
    };

    var highlightSymbol = new SimpleLineSymbol(
    SimpleLineSymbol.STYLE_SOLID,
    new Color([66, 244, 217]), 1);


    var parcelsLayerURL = "https://admin205.ispa.fsu.edu/arcgis/rest/services/PLI/PLI_2017/MapServer";
    var parcelsLayer = new MapImageLayer ({
        url: parcelsLayerURL,
        title: "Parcels Layer",
        sublayers: [{
        id: 0,
        title: "State Agencies",
        visible: true,
        minScale: 150000,
        popupTemplate: parcelsTemplate
        }]
    });

    var selectionLayer = new GraphicsLayer({
        listMode: "hide",
        visible: true
      });


    // Map
    var map = new Map({
        basemap: "topo",
        layers: [parcelsLayer, selectionLayer]
    });
    
    // View
    var mapView = new MapView({
        container: "mapViewDiv",
        map: map,
        padding: {
        top: 50,
        bottom: 0
        },
        center: [-82.28, 27.8],
        zoom: 7,
        ui: {components: []}
    });

    // Popup and panel sync
    mapView.when(function(){
        CalciteMapArcGISSupport.setPopupPanelSync(mapView);
    });

    //  Dropdown panel function
    function buildSelectPanel(url, attribute, zoomParam, panelParam) {

        var task = new QueryTask({
          url: url
        });
  
        var params = new Query({
          where: "1 = 1 AND " + attribute + " IS NOT NULL",
          outFields: [attribute],
          returnDistinctValues: true,
          });
  
        var option = domConstruct.create("option");
        option.text = zoomParam;
        dom.byId(panelParam).add(option);
  
        task.execute(params)
          .then(function (response) {
            //console.log(response.features);
            var features = response.features;
            var values = features.map(function (feature) {
              return feature.attributes[attribute];
            });
            //console.log(response);
            return values;
  
          })
          .then(function (uniqueValues) {
            //console.log(uniqueValues);
            uniqueValues.sort();
            uniqueValues.forEach(function (value) {
              var option = domConstruct.create("option");
              option.text = value;
              dom.byId(panelParam).add(option);
            });
          });
      }

    function zoomToCounty(county) {

    var task = new QueryTask({
        url: parcelsLayerURL + "/0"
    });
    var params = new Query({
        where: "own_name = '" + county + "'",
        returnGeometry: true
    });
    task.execute(params)
        .then(function(response) {
            console.log(response.features[0].geometry);            
            mapView.goTo(response.features[0].geometry);
        });
    }


    // Build State Agency dropdown
    buildSelectPanel(parcelsLayerURL + "/0", "own_name", "Select a State Agency", "selectAgencyPanel");

    // Search - add to navbar
    var searchWidget = new Search({
        container: "searchWidgetDiv",
        view: mapView,
        allPlaceHolder: "Text search for Parcel ID",
        sources: [{
        featureLayer: {
        url: parcelsLayerURL,
        popupTemplate: parcelsSearchTemplate
        },
        searchFields: ["PARCEL_ID", "STATE_PAR_", "OWN_CITY", "OWN_NAME"],
        suggestionTemplate: "PID: {parcel_id}, State PID: {state_par_}, City: {own_city}, Parcel Name: {own_name}",
        displayField: "PLI_CODE",
        exactMatch: false,
        outFields: ["PLI_CODE", "PARCEL_ID", "OWN_NAME", "OWN_STATE", "STATE_PAR_", "NO_LND_UNT", "AV_NSD", "TWN", "SEC", "S_LEGAL", "RNG"],
        name: "Florida Public Land Inventories Parcels",
        placeholder: "Search by Parcel ID, City, or County",
        resultGraphicEnabled: true,
        resultSymbol: {
        type: "simple-line",
        width: 2,
        color: [0, 255, 197, 1]
        },
        autoNavigate: false

    }, {
        locator: new Locator({ url: "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer" }),
        singleLineFieldName: "SingleLine",
        name: "Geocoder",
        localSearchOptions: {
        minScale: 300000,
        distance: 50000
        },
        placeholder: "Search Geocoder",
        maxResults: 3,
        maxSuggestions: 6,
        suggestionsEnabled: true,
        minSuggestCharacters: 0,
        countryCode: "US"
    }],
    });
    CalciteMapArcGISSupport.setSearchExpandEvents(searchWidget);

    // Map widgets
    var home = new Home({
        view: mapView
    });
    mapView.ui.add(home, "top-left");

    var zoom = new Zoom({
        view: mapView
    });
    mapView.ui.add(zoom, "top-left");

    var compass = new Compass({
        view: mapView
    });
    mapView.ui.add(compass, "top-left");
    
    var basemapToggle = new BasemapToggle({
        view: mapView,
        secondBasemap: "satellite"
    });
    mapView.ui.add(basemapToggle, "bottom-right");          
    
    var scaleBar = new ScaleBar({
        view: mapView
    });
    mapView.ui.add(scaleBar, "bottom-left");

    var attribution = new Attribution({
        view: mapView
    });
    mapView.ui.add(attribution, "manual");

    // Panel widgets - add legend
    var legendWidget = new Legend({
        container: "legendDiv",
        view: mapView,
        layerInfos: [{
        layer: parcelsLayer,
        title: "Florida Public Lands Inventory"
        }]

    });

    // Set initial opacity value
    mapView.when(parcelsLayer.opacity=.5);

    // Watch Opacity-Slider
    query("#opacity-slider").on("input", function() {
        var value = parseFloat(dom.byId("opacity-slider").value);
        dom.byId("opacity-label").innerText = "Opacity: " + Math.round(value * 100) + "%";
        parcelsLayer.opacity = value;
        console.log(parcelsLayer.opacity);
        });
    
    // Watch search result
    searchWidget.on("select-result", function(event){
        var ext = event.result.extent;
        var cloneExt = ext.clone();
        mapView.goTo({
        target: event.result.feature,
        extent: cloneExt.expand(1.75)
        });
    });

    // Watch Select State Agency dropdown
    query("#selectAgencyPanel").on("change", function(e){
       return zoomToCounty(e.target.value);
        //return zoomToFeature(parcelsLayerURL + "/0", e.target.value, "own_name");
    });
    

    // Popup Link event listener
    mapView.popup.on("trigger-action", function (event) {
    if (event.action.id === "pliWebsite") {
        window.open("http://floridapli.net/");
    }
    }); 


    });