// graph visualization using forece-graphy
var data_raw; //raw data
var data_componentfiltered; // subset of the raw data after component filtering

// datasets with all nodes
var fg_dataset_all;
var cy_dataset_all; //dataset for Cytoscape graph
var cy_all; //cytoscape graph object
// keep track of the size of graph components, i.e., number of nodes (all nodes)
var GRAPH_COMPONENTS_SIZE_ALL = {};
var GRAPH_COMPONENTS_SIZE_THRESHOLD = 1;

// filtered datasets
var fg_dataset; //fg_dataset for force-graph
var linkedByIndex; // auxilliary data structure to help detecting connections in the network
var Graph; // force-graph object
//var MODE3D = $("#3dmode").prop("checked"); //3D vs. 2D network visualization
var MODE3D = $("#ctr3d").prop("checked"); //3D vs. 2D network visualization
var TEXT_NODE_MODE = $("#textnodecb").prop("checked"); // render nodes as node (user) image, text, or circle (2D)/ball (3D) (default)
var IMAGE_NODE_MODE = $("#textnodecb").prop("checked"); // render nodes as node (user) image, text, or circle (2D)/ball (3D) (default)

// graph analysis using Cytoscape.js
var cy_dataset = null; //dataset for Cytoscape graph
var cy; //cytoscape graph object

// visualize network for a particular foci user (node) vs. all users (nodes)
var foci_user = $("#username").val() ; //'All Users';
var FOCI_NODE_MODE = $("focinodecb").prop("checked"); //false;

// include only linked nodes (i.e., no dangling nodes)? linkage impacted by LINK_WEIGHT_THRESHOD (see below)
var LINKED_NODES_ONLY = $("#nodevisibilitycb").prop("checked");
// include only connections with link weight above (or equal to) LINK_WEIGHT_THRESHOD
var LINK_WEIGHT_THRESHOD = $("#thresholdinput").val();

// include only nodes (and links) linked to the foci user (node)
var LINKED_WITH_FOCI_NODE_ONLY = $("#focinodecb").prop("checked");
// include nodes that are no more than GRAPH_STEP_THRESHOD step from the foci node
var GRAPH_STEP_THRESHOD = $("#graphstep").val();
var GRAPH_STEP_MAX; // max number of steps to reach the containing graph component from foci node

// enable mouseover popups on nodes and links?
var MOUSE_QUERY = $("#mousequery").prop("checked");

var COMPONENTS_ANALYSIS_DONE = false;
var CLUSTER_ANALYSIS_DONE = false;
var PAGERANK_ANALYSIS_DONE = false;

// color nodes by componentid, cluster id, or node id (default)
//var COMPONENTS_MODE = $("#componentscb").prop("checked");
var COMPONENTS_MODE = $("#componentidrd").prop("checked");
//var CLUSTER_MODE = $("#clustercb").prop("checked");
var CLUSTER_MODE = $("#clusteridrd").prop("checked");

// size nodes by node.size (totalids by a user; default), or pagerank?
//var PAGERANK_MODE = $("#pagerankcb").prop("checked");
var PAGERANK_MODE = $("#pagerankrd").prop("checked");

// minimum, maximum size of rendered nodes
const NODE_SIZE_MIN = 1;
const NODE_SIZE_MAX = 10;

// minimum, maximum line width of rendered links
const LINK_WIDTH_MIN = 1;
const LINK_WIDTH_MAX = 1;

// keep track of the size of graph components (filtered nodes)
var GRAPH_COMPONENTS_SIZE = {};

// all names present in the raw data -
var _names;

var gl_dataset; //gl_dataset for globe.gl
var gl_linkedByIndex; // auxilliary data structure to help detecting connections in the network

var GEOMODE = $("#geocb").prop("checked");
var DISTTHRESHOLD = $("#distinput").val();

function init_graph_component_analysis(data){
    var names = new Set(); // list of node names given all the filtering parameters
    var nodes = []; // array to hold nodes
    var links = []; // array to hold links

    var id = 0; // assign id to node, starting from 0
    for(var i in data){
      if(data[i].recorder == data[i].identifier){
        continue;
      }
      if(!names.has(data[i].identifier)
		    && (GEOMODE ? floatfrombrackets(data[i].identifierlat) && floatfrombrackets(data[i].identifierlon) : true) ){

        names.add(data[i].identifier);

        var uid = intfrombrackets(data[i].identifierid);
        var ulogin = strfrombrackets(data[i].identifierlogin);
        var uplace = strfrombrackets(data[i].identifierplace);
        if(uplace) uplace = uplace.replaceAll("\"", "");
        var ulat = floatfrombrackets(data[i].identifierlat);
        var ulon = floatfrombrackets(data[i].identifierlon);

        var recs;
        for(var j in data){
          if(data[j].recorder == data[i].identifier){
            recs = data[j].records;
            break;
          }
        }

        nodes.push({id: id, name: data[i].identifier, uid: uid, login: ulogin,
          place: uplace, lat: ulat, lng: ulon,
          size: data[i].totalids, resgradobs: recs, componentid:null, clusterid: null, pagerank:null});
        id += 1;
      }
    }

    for(var i in data){
      if(data[i].recorder == data[i].identifier){
        continue;
      }
        var rec = data[i].recorder;
        if(!names.has(rec)
		      && (GEOMODE ? floatfrombrackets(data[i].recorderlat) && floatfrombrackets(data[i].recorderlon) : true) ){

          names.add(data[i].recorder);

          /*
          var uid = data[i].recorderid;
          if(uid != null){
            uid = uid.substring(1,uid.length-1);
          }
          var ulogin = data[i].recorderlogin;
          if(ulogin != null){
            ulogin = ulogin.substring(1,ulogin.length-1);
          }

          var uplace = data[i].recorderplace;
          if(uplace != null){
            uplace = uplace.substring(2,uplace.length-2); //.split("\"")[1];
          }

          var ulat = data[i].recorderlat;
          if(ulat != null){
            ulat = parseFloat(ulat.substring(1,ulat.length-1));
          }

          var ulon = data[i].recorderlon;
          if(ulon != null){
            ulon = parseFloat(ulon.substring(1,ulon.length-1));
          }
          */
          var uid = intfrombrackets(data[i].recorderid);
          var ulogin = strfrombrackets(data[i].recorderlogin);
          var uplace = strfrombrackets(data[i].recorderplace);
          if(uplace) uplace = uplace.replaceAll("\"", "");
          var ulat = floatfrombrackets(data[i].recorderlat);
          var ulon = floatfrombrackets(data[i].recorderlon);

          nodes.push({id: id, name: data[i].recorder, uid: uid, login: ulogin,
              place: uplace, lat: ulat, lng: ulon,
              size: 1, resgradobs: data[i].records, componentid:null, clusterid: null, pagerank:null});
          id += 1;
        }
    }

    names = Array.from(names); // turn set to array so we can use the indexOf function

    var dist_min = 999999;
    var dist_max = 0;

    for(var i in data){
      // skip self-links, i.e., self-identified species observations
      if(data[i].recorder == data[i].identifier){
        continue;
      }

      var from = names.indexOf(data[i].recorder);
      var to = names.indexOf(data[i].identifier);
      if(from >= 0 && to >= 0){
        if(GEOMODE ? greatcircledistance(nodes[from], nodes[to]) : true){
          links.push({source: from, target: to, weight: parseInt(data[i].ids), distance: greatcircledistance(nodes[from], nodes[to])});

        	var dist = greatcircledistancelatlng(floatfrombrackets(data[i].identifierlat),
                                      floatfrombrackets(data[i].identifierlon),
                                      floatfrombrackets(data[i].recorderlat),
                                      floatfrombrackets(data[i].recorderlon));
        	if(dist && dist > dist_max){
        		dist_max = dist;
        	}
        	if(dist && dist < dist_min){
        		dist_min = dist;
        	}
        }else{
          console.log("aspatial link...");
        }
      }else{
        var str;
        GEOMODE ? str = "at least one node is aspatial ..." : str = "node(s) not found ..."
        console.log(str);
      }
    }

    dist_min = Math.floor(dist_min);
    dist_max = Math.ceil(dist_max);

    $("#distslider").prop({'min': dist_min, 'max': dist_max});
    $("#distmin").html(dist_min);
    $("#distmax").html(dist_max);
    $("#distslider").val(dist_max);

    $("#distinput").prop({'min': dist_min, 'max': dist_max});
    $("#distinput").val(dist_max);
    DISTTHRESHOLD = $("#distinput").val();

    // finally, after data filtering, construct a dataset for force-graph to visualize the network
    fg_dataset_all = {
      nodes: nodes, //Array.from(nodes),
      links: links
    };

    console.log("fg_dataset_all: ", fg_dataset_all)

    /* network analysis*/
    /** START OF cytoscapejs network analysis **/
    cy_dataset_all = jQuery.extend(true, [], fg_dataset_all);
    cy_all = cytoscape({
        elements: [],
      });

      for(var i in cy_dataset_all.nodes){
        cy_all.add({
            data: cy_dataset_all.nodes[i]
            }
        );
      }

      for(var i in cy_dataset_all.links){
        cy_all.add({
          data: cy_dataset_all.links[i]
        });
      }

    var gcomponents = cy_all.$().components();
    for(var i = 0; i < gcomponents.length; i++){
      var nnodes = 0, nedges = 0;
      var gcomponent = gcomponents[i];
      for(var j=0; j < gcomponent.length; j++){
        if(gcomponent[j].group() == "nodes"){
          fg_dataset_all.nodes[gcomponent[j].data("id")].componentid = i;
          nnodes += 1;
        }else{
          nedges += 1;
        }
      }
      GRAPH_COMPONENTS_SIZE_ALL[i] = nnodes;
    }

    $("#componentsizethreshold").find("option").remove().end();

    var size_count = ucomponent_size_count(GRAPH_COMPONENTS_SIZE_ALL);

    for(var i = 0; i < size_count.size.length; i++){
      var s = size_count.size[i];
      var c = size_count.count[i];
      $("#componentsizethreshold").append(new Option(s + " nodes - " + c + ' (components)', s));
    }

    $("#componentsizethreshold").append(new Option(1 + " node - " + ' (all components)', 1, true, true));
}

function prepare_data_component_size_threshold(data){

  COMPONENTS_ANALYSIS_DONE = false;
  CLUSTER_ANALYSIS_DONE = false;
  PAGERANK_ANALYSIS_DONE = false;

  for(var key in cy_dataset){
    for(var inkey in cy_dataset[key]){
      delete cy_dataset[key][inkey];
    }
    delete cy_dataset[key];
  }
  cy_dataset = null;

  for(var key in data_componentfiltered){
    delete data_componentfiltered[key];
  }

  data_componentfiltered = [];

  var comids = ncomponents_over_size(GRAPH_COMPONENTS_SIZE_ALL, GRAPH_COMPONENTS_SIZE_THRESHOLD);

  var names = new Set(); // list of node names given all the filtering parameters
  var nodes = []; // array to hold nodes
  var links = []; // array to hold links
  /*
  var gl_names = new Set(); // list of node names given all the filtering parameters + has lat/lon
  var gl_nodes = []; // array to hold nodes
  var gl_links = []; // array to hold links
  */
  var id = 0;
  //var gl_id = 0;

  for(var i in fg_dataset_all.nodes){
    if(comids.indexOf(fg_dataset_all.nodes[i].componentid) >= 0
	   && (GEOMODE ? fg_dataset_all.nodes[i].lat && fg_dataset_all.nodes[i].lng: true) ){
      var node = jQuery.extend(true, {}, fg_dataset_all.nodes[i]);
      node.id = id;
      node.componentid = null;
      nodes.push(node);
      names.add(node.name);
      id += 1;
    }
  }
  names = Array.from(names); // turn set to array so we can use the indexOf function

  for(var i in data){
    // skip self-links, i.e., self-identified species observations
    if(data[i].recorder == data[i].identifier){
      continue;
    }

    var from = names.indexOf(data[i].recorder);
    var to = names.indexOf(data[i].identifier);
    if(from >= 0 && to >= 0){
      if(GEOMODE ? greatcircledistance(nodes[from], nodes[to]) : true){
        links.push({source: from, target: to, weight: parseInt(data[i].ids), distance: greatcircledistance(nodes[from], nodes[to])});
        data_componentfiltered.push(data[i]);
      }else{
        console.log("aspatial link ... should never reach here");
      }
    }else{
      var str;
      GEOMODE ? str = "at least one node is aspatial ..." : str = "node(s) not found ..."
      console.log(str);
    }
  }

  // finally, after data filtering, construct a dataset for force-graph to visualize the network
  /*
  for(var key in fg_dataset){
    for(var inkey in fg_dataset[key]){
      delete fg_dataset[key][inkey];
    }
    delete fg_dataset[key];
  }
  */
  fg_dataset = {
    nodes: nodes, //Array.from(nodes),
    links: links
  };

  console.log("fg_dataset: ", fg_dataset);
  //console.log(gl_dataset);

  // reset
  for(var key in linkedByIndex){
    delete linkedByIndex[key];
  }

  linkedByIndex = {};
  fg_dataset.links.forEach(function(d) {
      linkedByIndex[d.source + "," + d.target] = true;
  });
}

function list_users(data){
  _names = new Set();

  // set up list of names for autocompleting user name selection
  for(var i in data){
    if(data[i].recorder == data[i].identifier){
      continue;
    }
    if(true && (GEOMODE ? floatfrombrackets(data[i].recorderlat) && floatfrombrackets(data[i].recorderlon) : true)){
		_names.add(data[i].recorder);
	}
	if(true && (GEOMODE ? floatfrombrackets(data[i].identifierlat) && floatfrombrackets(data[i].identifierlon) : true)){
		_names.add(data[i].identifier);
	}
  }
  _names.add('All Users');

  $("#username").autocomplete({
    source: Array.from(_names),
    select: function(event, ui){
      $( "#username" )[0].value = ui.item.value;
      foci_user = ui.item.value;
      prepare_data(data);
      //analyze_network();
      async_analyze_network();
      draw_network();
    }
  });
}

function prepare_data(data){

  COMPONENTS_ANALYSIS_DONE = false;
  CLUSTER_ANALYSIS_DONE = false;
  PAGERANK_ANALYSIS_DONE = false;

  cy_dataset = null;

  // find out min and max of link wieght, and foci node
  var ids_min = 9999;
  var ids_max = 0;
  var totalids_min = 9999;
  var totalids_max = 0;


  for(var i in data){
    if(data[i].recorder == data[i].identifier){
      continue;
    }
    if(parseInt(data[i].ids) < ids_min){
      ids_min = parseInt(data[i].ids);
    }
    if(parseInt(data[i].ids) > ids_max){
      ids_max = parseInt(data[i].ids);
    }
    if(data[i].totalids < totalids_min){
      totalids_min = data[i].totalids;
    }
    if(data[i].totalids > totalids_max){
      totalids_max = data[i].totalids;
    }

  }

  // update UI
  $("#thresholdslider").prop({'min': ids_min, 'max': ids_max});
  $("#thresholdinput").prop({'min': ids_min, 'max': ids_max});
  $("#thresholdmin").html(ids_min);
  $("#thresholdmax").html(ids_max);
  $("#nodelabelcb").prop("checked", false);

  // now work on preparing dataset for network visualization and analysis
  if(foci_user != 'All Users'){
    FOCI_NODE_MODE = true;
    $("#focinodecb").prop( "disabled", false );
    $("#focinodecblbl").css("color", "black");
    $("#graphstep").prop( "disabled", false );
    $("#graphsteplabel").css("color", "black");

    // figure out the GRAPH_STEP_MAX
    var _names_tmp = new Set();
    GRAPH_STEP_MAX = 1;
    for(var i in data){
      if(data[i].identifier == foci_user || data[i].recorder == foci_user){
        if(true && (GEOMODE ? floatfrombrackets(data[i].identifierlat) && floatfrombrackets(data[i].identifierlon) : true)){
    			_names_tmp.add(data[i].identifier);
    		}
    		if(true && (GEOMODE ? floatfrombrackets(data[i].recorderlat) && floatfrombrackets(data[i].recorderlon) : true)){
    			_names_tmp.add(data[i].recorder);
    		}
      }
    }

    var _names_step_pre_tmp = new Set(_names_tmp);
    var _names_step_cur_tmp = new Set();
    var size_pre = _names_tmp.size;
    while(true){
      for(var i in data){
        if(_names_step_pre_tmp.has(data[i].identifier) || _names_step_pre_tmp.has(data[i].recorder)){
    		  if(true && (GEOMODE ? floatfrombrackets(data[i].identifierlat) && floatfrombrackets(data[i].identifierlon) : true)){
    			     _names_tmp.add(data[i].identifier);
    			     _names_step_cur_tmp.add(data[i].identifier);
    		  }
    		  if(true && (GEOMODE ? floatfrombrackets(data[i].recorderlat) && floatfrombrackets(data[i].recorderlon) : true)){
    			     _names_tmp.add(data[i].recorder);
    			     _names_step_cur_tmp.add(data[i].recorder);
    		  }
        }
      }
      if(_names_tmp.size > size_pre){
        GRAPH_STEP_MAX += 1;
        _names_step_pre_tmp = new Set(_names_step_cur_tmp);
        _names_step_cur_tmp = new Set();
        size_pre = _names_tmp.size;
      }
      else{
        break;
      }
    }
    // END OF figuring out GRAPH_STEP_MAX
    //$("#graphstep").prop({'min': 1, 'max': GRAPH_STEP_MAX});
    $("#graphstep").find("option").remove().end();
    for(var i = 1; i <= GRAPH_STEP_MAX; i++){
      $("#graphstep").append(new Option(i, i));
    }
    $("#graphstep").val(GRAPH_STEP_THRESHOD);

    var _names_foci = new Set();

    for(var i in data){
      if(data[i].identifier == foci_user || data[i].recorder == foci_user){
        if(true && (GEOMODE ? floatfrombrackets(data[i].identifierlat) && floatfrombrackets(data[i].identifierlon) : true)){
    			_names_foci.add(data[i].identifier);
    		}
    		if(true && (GEOMODE ? floatfrombrackets(data[i].recorderlat) && floatfrombrackets(data[i].recorderlon) : true)){
    			_names_foci.add(data[i].recorder);
    		}
      }
    }

    var _names_step_pre = new Set(_names_foci);
    var _names_step_cur = new Set();
    var wi = 1;
    while(wi < GRAPH_STEP_THRESHOD){
      for(var i in data){
        if(_names_step_pre.has(data[i].identifier) || _names_step_pre.has(data[i].recorder)){
          if(true && (GEOMODE ? floatfrombrackets(data[i].identifierlat) && floatfrombrackets(data[i].identifierlon) : true)){
      			_names_foci.add(data[i].identifier);
      			_names_step_cur.add(data[i].identifier);
      		 }
  		  if(true && (GEOMODE ? floatfrombrackets(data[i].recorderlat) && floatfrombrackets(data[i].recorderlon) : true)){
    			_names_foci.add(data[i].recorder);
    			_names_step_cur.add(data[i].recorder);
    		  }
        }
      }

      _names_step_pre = new Set(_names_step_cur);
      _names_step_cur = new Set();

      wi++;
    }

  }else{
    FOCI_NODE_MODE = false;
    $("#focinodecb").prop( "disabled", true );
    $("#graphstep").prop( "disabled", true );
    $("#focinodecblbl").css("color", "gray");
    $("#graphsteplabel").css("color", "gray");
  }

  // filtering parameters
  var names = new Set(); // list of node names given all the filtering parameters
  var nodes = []; // array to hold nodes
  var links = []; // array to hold links
  /*
  var gl_names = new Set(); // list of node names given all the filtering parameters + has lat/lon
  var gl_nodes = []; // array to hold nodes
  var gl_links = []; // array to hold links
  */
  var id = 0; // assign id to node, starting from 0
  //var gl_id = 0;

  for(var i in data){
    if(data[i].recorder == data[i].identifier){
      continue;
    }
    if(!names.has(data[i].identifier)
       && (LINKED_NODES_ONLY ? parseInt(data[i].ids) >= LINK_WEIGHT_THRESHOD : true)
       && (LINKED_WITH_FOCI_NODE_ONLY ? (data[i].identifier == foci_user || data[i].recorder == foci_user) : true)
       && (FOCI_NODE_MODE ? _names_foci.has(data[i].identifier) && _names_foci.has(data[i].recorder): true)
	     && (GEOMODE ? floatfrombrackets(data[i].identifierlat) && floatfrombrackets(data[i].identifierlon) : true) ){
      names.add(data[i].identifier);

      /*
      var uid = data[i].identifierid;
      if(uid != null){
        uid = uid.substring(1,uid.length-1);
      }

      var ulogin = data[i].identifierlogin;
      if(ulogin != null){
        ulogin = ulogin.substring(1,ulogin.length-1);
      }

      var uplace = data[i].identifierplace;
      if(uplace != null){
        uplace = uplace.substring(2,uplace.length-2);
      }

      var ulat = data[i].identifierlat;
      if(ulat != null){
        ulat = parseFloat(ulat.substring(1,ulat.length-1));
      }

      var ulon = data[i].identifierlon;
      if(ulon != null){
        ulon = parseFloat(ulon.substring(1,ulon.length-1));
      }
      */
      var uid = intfrombrackets(data[i].identifierid);
      var ulogin = strfrombrackets(data[i].identifierlogin);
      var uplace = strfrombrackets(data[i].identifierplace);
      if(uplace) uplace = uplace.replaceAll("\"", "");
      var ulat = floatfrombrackets(data[i].identifierlat);
      var ulon = floatfrombrackets(data[i].identifierlon);

      var recs;
      for(var j in data){
        if(data[j].recorder == data[i].identifier){
          recs = data[j].records;
          break;
        }
      }

      nodes.push({id: id, name: data[i].identifier, uid: uid, login: ulogin,
        place: uplace, lat: ulat, lng: ulon,
        size: data[i].totalids, resgradobs: recs, componentid:null, clusterid: null, pagerank:null});

      id += 1;
      /*
      if(ulat && ulon){
        gl_names.add(data[i].identifier);
        gl_nodes.push({id: gl_id, name: data[i].identifier, uid: uid, login: ulogin,
          place: uplace, lat: ulat, lng: ulon,
          size: data[i].totalids, resgradobs: recs, componentid:null, clusterid: null, pagerank:null});
        gl_id += 1;
      }*/
    }
  }

  for(var i in data){
    if(data[i].recorder == data[i].identifier){
      continue;
    }
      var rec = data[i].recorder;
      if(!names.has(rec)
         && (LINKED_NODES_ONLY ? parseInt(data[i].ids) >= LINK_WEIGHT_THRESHOD : true) // apply link weight threshold, i.e., # of species identifications between two users
         && (FOCI_NODE_MODE ? _names_foci.has(data[i].identifier) && _names_foci.has(data[i].recorder): true) // apply foci node mode filter
         && (LINKED_WITH_FOCI_NODE_ONLY ? (data[i].identifier == foci_user || data[i].recorder == foci_user) : true)
		     && (GEOMODE ? floatfrombrackets(data[i].recorderlat) && floatfrombrackets(data[i].recorderlon) : true)){ // apply linked to foci node mode filter
        names.add(data[i].recorder);

        /*
        var uid = data[i].recorderid;
        if(uid != null){
          uid = uid.substring(1,uid.length-1);
        }
        var ulogin = data[i].recorderlogin;
        if(ulogin != null){
          ulogin = ulogin.substring(1,ulogin.length-1);
        }

        var uplace = data[i].recorderplace;
        if(uplace != null){
          uplace = uplace.substring(2,uplace.length-2);
        }

        var ulat = data[i].recorderlat;
        if(ulat != null){
          ulat = parseFloat(ulat.substring(1,ulat.length-1));
        }

        var ulon = data[i].recorderlon;
        if(ulon != null){
          ulon = parseFloat(ulon.substring(1,ulon.length-1));
        }
        */

        var uid = intfrombrackets(data[i].recorderid);
        var ulogin = strfrombrackets(data[i].recorderlogin);
        var uplace = strfrombrackets(data[i].recorderplace);
        if(uplace) uplace = uplace.replaceAll("\"", "");
        var ulat = floatfrombrackets(data[i].recorderlat);
        var ulon = floatfrombrackets(data[i].recorderlon);

        nodes.push({id: id, name: data[i].recorder, uid: uid, login: ulogin,
          place: uplace, lat: ulat, lng: ulon,
          size: 1, resgradobs: data[i].records, componentid:null, clusterid: null, pagerank:null});
        id += 1;
      }
  }

  names = Array.from(names); // turn set to array so we can use the indexOf function
  //gl_names = Array.from(gl_names);
  for(var i in data){
    // skip self-links, i.e., self-identified species observations
    if(data[i].recorder == data[i].identifier){
      continue;
    }

    if(parseInt(data[i].ids) >= LINK_WEIGHT_THRESHOD // apply link weight threshold, i.e., # of species identifications between two users
       && (FOCI_NODE_MODE ? _names_foci.has(data[i].identifier) && _names_foci.has(data[i].recorder): true) // apply foci node mode filter
       && (LINKED_WITH_FOCI_NODE_ONLY ? (data[i].identifier == foci_user || data[i].recorder == foci_user) : true) ){  // apply linked to foci node mode filter
      var from = names.indexOf(data[i].recorder);
      var to = names.indexOf(data[i].identifier);
      if(from >= 0 && to >= 0){
        if(GEOMODE ? greatcircledistance(nodes[from], nodes[to]) <= DISTTHRESHOLD : true){
          links.push({source: from, target: to, weight: parseInt(data[i].ids), distance: greatcircledistance(nodes[from], nodes[to])});
        }else{
          console.log("distance below " + DISTTHRESHOLD);
        }
      }
      else{
        var str;
        GEOMODE ? str = "at least one node is aspatial ..." : str = "node(s) not found ..."
        console.log(str);
      }
    }
  }

  // finally, after data filtering, construct a dataset for force-graph to visualize the network
  /*
  for(var key in fg_dataset){
    for(var inkey in fg_dataset[key]){
      delete fg_dataset[key][inkey];
    }
    delete fg_dataset[key];
  }
  */

  fg_dataset = {
    nodes: nodes, //Array.from(nodes),
    links: links
  };

  console.log("fg_dataset: ", fg_dataset);
  //console.log(gl_dataset);

  // reset
  for(var key in linkedByIndex){
    delete linkedByIndex[key];
  }
  linkedByIndex = {};
  fg_dataset.links.forEach(function(d) {
      linkedByIndex[d.source + "," + d.target] = true;
  });

}

function analyze_network(){
  if(COMPONENTS_ANALYSIS_DONE && CLUSTER_ANALYSIS_DONE && PAGERANK_ANALYSIS_DONE) return;

  /** START OF cytoscapejs network analysis **/
  if(cy_dataset == null){
    cy_dataset = jQuery.extend(true, [], fg_dataset);
    cy = cytoscape({
        //container: document.getElementById('cynetwork'),
        elements: [],
        // not interested in visualization
        /*style: [
            {
              selector: 'node',
              style: {
                  shape: 'point',
                  'background-color': 'gray',
                  label: 'data(id)'
              }
            }]
        */
      });

      for(var i in cy_dataset.nodes){
        cy.add({
            data: cy_dataset.nodes[i]
            }
        );
      }

      for(var i in cy_dataset.links){
        cy.add({
          data: cy_dataset.links[i]
        });
      }
  }
  //cy.layout({name: 'cose'}).run();

  if(true && (!COMPONENTS_ANALYSIS_DONE)){ // label each node with a component id
    var gcomponents = cy.$().components();
    for(var i = 0; i < gcomponents.length; i++){
      var nnodes = 0, nedges = 0;
      var gcomponent = gcomponents[i];
      for(var j=0; j < gcomponent.length; j++){
        //console.log(i, j);
        if(gcomponent[j].group() == "nodes"){
          //console.log(gcomponent[j].data("id"))
          fg_dataset.nodes[gcomponent[j].data("id")].componentid = i;
          nnodes += 1;
        }else{
          nedges += 1;
        }
      }
      //console.log('component ' + i + ': ' + nnodes + ' nodes ' + nedges + ' edges');
      GRAPH_COMPONENTS_SIZE[i] = nnodes;
    }
    COMPONENTS_ANALYSIS_DONE = true;
  }


  if(CLUSTER_MODE && (!CLUSTER_ANALYSIS_DONE)){ // label each node with a cluster id, after running the (!!slow!!) markovClustering algorithm https://micans.org/mcl/
    console.log("clustering started...");
    var totalnodes = 0;
    var clusters = cy.elements().markovClustering({
        attributes: [function(edge){return edge.data("weight")}], //Attributes are used to cluster the nodes; i.e. the attributes of an edge indicate similarity between its nodes.
        expandFactor: 2,   // A number that affects time of computation and cluster granularity to some extent: M * M (default 2)
        inflateFactor: 2, // A number that affects cluster granularity (the greater the value, the more clusters): M(i,j) / E(j) (default 2)
        multFactor: 1,     // Optional number of self loops for each node. Use a neutral value to improve cluster computations (default 1).
        maxIterations: 20  // Maximum number of iterations of the MCL algorithm in a single run (default 20).
      });
    console.log("clustering finished...");
    for(var i=0; i<clusters.length; i++){
      var cluster = clusters[i];
      totalnodes += cluster.length
      //console.log('cluster ' + i + ' has ' + cluster.length + ' elements');
      for(var j=0; j<cluster.length; j++){
        //console.log('cluster ' + i + ', ' + cluster[j].group() + ' ' + cluster[j].data('id'));
        //console.log(cluster[j].data());
        fg_dataset.nodes[cluster[j].data("id")].clusterid = i;
        //console.log(fg_dataset.nodes[cluster[j].data("id")]);
      }
    }
    //console.log(totalnodes + ' nodes in clusters');
    CLUSTER_ANALYSIS_DONE = true;
  }


  if(PAGERANK_MODE && (!PAGERANK_ANALYSIS_DONE)){ //run page rank on the network (graph) and fill in a pagerank value for each node
    var fpagerank = cy.elements().pageRank({
      dampingFactor: 1,  // The damping factor, affecting how long the algorithm goes along the topology of the graph (default 0.8).
      precision: 0.000001, // Numeric parameter that represents the required precision (default 0.000001).
                           // The algorithm stops when the difference between iterations is this value or less.
      iterations: 200      // Maximum number of iterations to perform (default 200)
    });

    // find out min and max of page rank values
    var rk_max = 0;
    var rk_min = 1000;
    for(var i in cy_dataset.nodes){
      var rk = fpagerank.rank(cy.$('#' + cy_dataset.nodes[i].id));
      if(rk > rk_max) rk_max = rk;
      if(rk < rk_min) rk_min = rk;
    }

    for(var i in cy_dataset.nodes){
      var rk = fpagerank.rank(cy.$('#' + cy_dataset.nodes[i].id));
      //console.log('node ' + cy_dataset.nodes[i].id + ' ' + cy_dataset.nodes[i].name + ': ' + rk);
      fg_dataset.nodes[cy_dataset.nodes[i].id].pagerank = rk ; // / rk_max;
    }

    PAGERANK_ANALYSIS_DONE = true;
  }
  /** END OF cytoscapejs rendering **/
  console.log("fg_dataset:", fg_dataset);
  //updateglDataset();
}

function async_analyze_network(){
  /*return new Promise(resolve =>{
      analyze_network();
      console.log('network analysis done...');
    }
  );*/
  analyze_network();
}

var colors = d3.scale.category20();

var Graph2D, Graph3D;

function draw_network(){

  //$("#network").html("");

  if(MODE3D){
      if(!Graph3D){
        Graph3D = ForceGraph3D({
          extraRenderers: [new THREE.CSS2DRenderer()]
        })
        (document.getElementById('network3d'))
          //.graphData(fg_dataset)
          .cooldownTicks(100)
          .nodeLabel(function(d){return nodetiphtml(d);})
          .nodeColor(function(d){return nodecolor(d)})
          .nodeRelSize(5)
          .nodeVal(function(d){return nodesize(d)})
          .onNodeClick(node => {
            // Aim at node from outside it
            const distance = 500;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

            Graph3D.cameraPosition(
              { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
              node, // lookAt ({ x, y, z })
              3000  // ms transition duration
            )})

          .onNodeRightClick(function(node){
              if(node.login != null ) window.open(`https://www.inaturalist.org/people/${node.login}`, '_blank')
            })

          .onNodeHover(function(d, pd){
              nodemouseover(d, pd);
            })
          .linkLabel(function(d){ return linktiphtml(d);})
          .linkWidth(function(d){return linkwidth(d)})
          .linkColor(function(d){return linkcolor(d);})
          .linkDirectionalParticles(function(d){return 2; /*Math.max(2, d.weight)*/})
          .linkDirectionalParticleSpeed(function(d){ return d.weight * 0.01})
          .linkDirectionalParticleWidth(4)
          .linkDirectionalParticleColor('#ccc')
          //.linkCurvature(function(d){return d.source == d.target ? 1 : 0})
          .onLinkHover(function(d, pd){
              linkmouseover(d, pd);
            });
        }
        if(TEXT_NODE_MODE){
          Graph3D.nodeThreeObject(node => {
            const sprite = new SpriteText(nodelabel(node));
            sprite.material.depthWrite = false; // make sprite background transparent
            sprite.color = nodecolor(node);
            sprite.textHeight = 2*nodesize(node); //8;
            return sprite;
          });

        }else if(IMAGE_NODE_MODE){
          Graph3D.nodeThreeObject(node => {

            var imgsrc = `https://static.inaturalist.org/attachments/users/icons/${node.uid}/thumb.jpeg`;
            if(node.uid == null ? true : node.uid.split(",").length>=2){
              imgsrc = './img/owl.jpg';
            }
            imgsrc = './img/owl.jpg';
            //console.log(imgsrc);
            var size = nodesize(node);

            /*
            //const img = new Image();
            //img.src = imgsrc;
            const circleimg = createCircleImageTexture(node.x, node.y, imgsrc, nodecolor(node), 3*size)
            //const imgloader = new THREE.TextureLoader();
            //const imgTexture = imgloader.load(circleimg.image, function(t){applyTextureImage(t, node.x, node.y, imgsrc, node.color, size)});
            //const imgTexture = imgloader.load(circleimg);
            //const material = new THREE.SpriteMaterial({ map: imgTexture });
            //const material = new THREE.SpriteMaterial({ size: 3*size, map: circleimg });
            const material = new THREE.PointsMaterial({
                size: 20,
                map: createCircleTexture(nodecolor(node), node.x, node.y, 3*size),
                transparent: false,
                depthWrite: true
            });
            const sprite = new THREE.Sprite(material);
            //sprite.material.depthWrite = false; // make sprite background transparent
            sprite.scale.set(3*nodesize(node), 3*nodesize(node));
            return sprite;
            */

            ///*
            const imgTexture = new THREE.TextureLoader().load(imgsrc);
            const material = new THREE.SpriteMaterial({ map: imgTexture });
            const sprite = new THREE.Sprite(material);
            //sprite.material.depthWrite = false; // make sprite background transparent
            sprite.scale.set(3*nodesize(node), 3*nodesize(node));
            return sprite;
            //*/

            /*
            const nodeEl = document.createElement('img');
        		nodeEl.src = imgsrc;
        		nodeEl.style.width = size*3 + 'px';
        		nodeEl.style.height = size*3 + 'px';
        		nodeEl.className = 'node-img';
        		return new THREE.CSS2DObject(nodeEl);
            */
          })
          .nodeThreeObjectExtend(false)

        }else{
          Graph3D.nodeThreeObject(null);
        }

        //Graph.d3Force('center', null);
        //Graph.onEngineStop(() => Graph.zoomToFit(400));
        //Graph.zoomToFit(400);

        // Spread nodes a little wider
        //Graph.d3Force('charge').strength(-120);

        Graph = Graph3D;


  }else{
      if(!Graph2D){
        Graph2D = ForceGraph()
        (document.getElementById('network'))
          //.graphData(fg_dataset)
          //.backgroundColor('#000000') //'#101020'
          .cooldownTicks(100)
          .nodeLabel(function(d){return nodetiphtml(d);})
          .nodeColor(function(d){return nodecolor(d)})
          .nodeRelSize(5)
          .nodeVal(function(d){return nodesize(d)})

          //.nodeVisibility(function(d){return d.id % 2 == 0})

          .onNodeClick(node => {
              // Center/zoom on node
              Graph2D.centerAt(node.x, node.y, 1000);
              Graph2D.zoom(2, 2000);
            })
          .onNodeRightClick(function(node){
              if(node.login != null ) window.open(`https://www.inaturalist.org/people/${node.login}`, '_blank')
            })
          .onNodeHover(function(d, pd){
              nodemouseover(d, pd);
            })
          .linkLabel(function(d){ return linktiphtml(d);})
          .linkWidth(function(d){return linkwidth(d)})
          .linkColor(function(d){return linkcolor(d);})

          /*
          .linkVisibility(function(d){
              return d.source.id % 2 == 0 && d.target.id % 2 == 0;
            })
          */

          .linkDirectionalParticles(function(d){return 2; /*Math.max(2, d.weight)*/})
          .linkDirectionalParticleSpeed(function(d){ return d.weight * 0.01})
          .linkDirectionalParticleWidth(4)
          .linkDirectionalParticleColor('#ccc')
          .onLinkHover(function(d, pd){
              linkmouseover(d, pd);
            });

          //.linkCurvature(function(d){console.log(d.source == d.target ? 1 : 0);return d.source == d.target ? 1 : 0});

          // fit to canvas when engine stops
          //Graph.d3Force('center', null);
          //Graph.onEngineStop(() => Graph.zoomToFit(400));
          //Graph.zoomToFit(400);
      }

        if(TEXT_NODE_MODE){
          Graph2D.nodeCanvasObject((node, ctx, globalScale) => {
            const label = nodelabel(node);
            const fontSize = 3/globalScale*nodesize(node);
            ctx.font = `${fontSize}px Sans-Serif`;
            var textWidth = ctx.measureText(label).width;
            if(ctx.measureText(label).width == 0){
              textWidth = ctx.measureText("O").width;
              var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            }else{
              var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            }
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = nodecolor(node);
            ctx.fillText(label, node.x, node.y);

            node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
          })
          .nodePointerAreaPaint((node, color, ctx) => {
            ctx.fillStyle = color;
            const bckgDimensions = node.__bckgDimensions;
            bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
          })
          .nodeCanvasObjectMode(() => 'replace')

        }else if(IMAGE_NODE_MODE){
            Graph2D.nodeCanvasObject((node, ctx) => {
              //console.log(node.uid);
              const img = new Image();
              /*img.src = `https://static.inaturalist.org/attachments/users/icons/${node.uid}/thumb.jpeg`;
              if(node.uid == null ? true : node.uid.split(",").length>=2){
                img.src = './img/owl.jpg';
              }*/
              img.src = './img/owl.jpg';
              const size = 3*nodesize(node);
              //ctx.drawImage(img, node.x - size / 2, node.y - size / 2, size, size)
              ///*
              // draw image with circle shape clip
        	    ctx.save()
        	    ctx.beginPath()
        	    ctx.arc(node.x, node.y, size/2, 0, Math.PI * 2, false)
        	    ctx.strokeStyle = nodecolor(node)
        	    ctx.stroke()
        	    ctx.clip()
        	    ctx.drawImage(img, node.x - size / 2, node.y - size / 2, size, size)
        	    ctx.restore()
              //*/
            })

            .nodePointerAreaPaint((node, color, ctx) => {
              const size = 3*nodesize(node);
              ctx.fillStyle = color; //nodecolor(node); //
              ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size); // draw square as pointer trap
            })
            .nodeCanvasObjectMode(() => 'replace')
        }else{
          Graph2D.nodeCanvasObject(null);
        }

        // Spread nodes a little wider
        //Graph.d3Force('charge').strength(-120);
        Graph = Graph2D;
        //$("#network3d").hide();
        //$("#network").show();
  }

  //if(Graph.graphData().nodes.length != 0) {
    //Graph.pauseAnimation();
    //Graph._destructor();
    Graph.graphData(fg_dataset);
          //.resumeAnimation();
          //.cooldownTicks(100);
  //}

  if($("#ctrnetwork").prop("checked")){
    if(MODE3D){
      $("#network").hide();
      $("#network3d").show();
    }else{
      $("#network3d").hide();
      $("#network").show();
    }
  }


  draw_globe();
  draw_map();
  draw_histogram();
  draw_scatter();
}

function createCircleTexture(color, x, y, size) {
  var matCanvas = document.createElement('canvas');
  matCanvas.width = matCanvas.height = size;
  var matContext = matCanvas.getContext('2d');
  // create texture object from canvas.
  var texture = new THREE.Texture(matCanvas);
  // Draw a circle

  matContext.beginPath();
  matContext.arc(x, y, size/2, 0, 2 * Math.PI, false);
  matContext.closePath();
  matContext.fillStyle = color;
  matContext.fill();
  // need to set needsUpdate
  texture.needsUpdate = true;
  // return a texture made from the canvas
  return texture;
}

function createCircleImageTexture(x, y, imgsrc, color, size) {
  var matCanvas = document.createElement('canvas');
  matCanvas.width = matCanvas.height = size;
  var ctx = matCanvas.getContext('2d');
  // create texture object from canvas.
  var texture = new THREE.Texture(matCanvas);
  // Draw a circle
  ctx.beginPath();
  ctx.arc(x, y, size/2, 0, 2 * Math.PI, false);
  ctx.closePath();
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.clip();
  var image = new Image();
  image.src = imgsrc;
  ctx.drawImage(image, x - size / 2, y - size / 2, size, size)
  ctx.fillStyle = color;
  ctx.fill();
  // need to set needsUpdate
  texture.needsUpdate = true;
  // return a texture made from the canvas
  return texture;
}

function applyTextureImage(texture, x, y, image, color, size){
    const tLoader = new THREE.TextureLoader();
    tLoader.load(
      image,
      (t) => {
        const circle = createCircleImageTexture(x, y, t.image, color, size);
        tLoader.load(circle.image, (it) => {
          texture.image = it.image;
          texture.format = it.format;
          texture.needsUpdate = true;
          return texture;})
        })
      }

///*
var MAP_CENTER;
var OPACITY;
var myGlobe;
//*/
function draw_globe(){

	OPACITY = 1.0;

  if(!myGlobe){
  	myGlobe = Globe()
  		(document.getElementById('globe'))
  		.globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
  		//.globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  		.bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
  		//.backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
  		//.arcLabel(d => `${d.weight}: ${d.source.name} &#8594; ${d.target.name}`)
  		.arcLabel(d => linktiphtml(d))
  		.arcStartLat(d => d.source.lat)
  		.arcStartLng(d => d.source.lng)
  		.arcEndLat(d => d.target.lat)
  		.arcEndLng(d => d.target.lng)
  		//.arcAltitude(0.05)
  		.arcColor(d => [`rgba(0, 255, 0, ${OPACITY})`, `rgba(255, 0, 0, ${OPACITY})`])
  		.arcStroke(null) //d => d.weight
  		.arcDashLength(0.5)
  		.arcDashGap(0.1)
  		.arcDashAnimateTime(d => 5000/d.weight)
      ///*
  		.onArcHover(function(hoverArc){
  			if(!MOUSE_QUERY){
          return;
          /*
          myGlobe
  					.arcColor(d => {
  						return [`rgba(0, 255, 0, ${OPACITY})`, `rgba(255, 0, 0, ${OPACITY})`];
  					})
            .pointAltitude(0)
            .pointRadius(d => nodesize(d)*0.01)
          */
  			}else{
  				myGlobe
  					.arcColor(d => {
  					const op = !hoverArc ? OPACITY : d === hoverArc ? 0.9 : OPACITY / 4;
  					return [`rgba(0, 255, 0, ${op})`, `rgba(255, 0, 0, ${op})`];
  				})
          .pointAltitude(function (node){
            if(!hoverArc) return 0;
            return node.id == hoverArc.source.id || node.id == hoverArc.target.id ? 0.1*myGlobe.pointOfView().altitude: 0;
          })
          .pointRadius(function(node) {
            if(!hoverArc) return nodesize(node)*0.01;
            return node.id == hoverArc.source.id || node.id == hoverArc.target.id ? nodesize(node)*0.01*20: nodesize(node)*0.01;
          })
          .labelAltitude(function(node){
            if(!hoverArc) return 0.000001;
            return node.id == hoverArc.source.id || node.id == hoverArc.target.id ? 0.1*myGlobe.pointOfView().altitude + 0.000001: 0.000001;
          })
          .labelSize(function(node){
            if(!hoverArc) return nodesize(node)*0.01;
            return node.id == hoverArc.source.id || node.id == hoverArc.target.id ? nodesize(node)*0.01*5: nodesize(node)*0.01;
          })
  			}
  		})
      //*/
  		.pointLat('lat')
  		.pointLng('lng')
  		.pointColor(d => nodecolor(d))
  		.pointLabel(d => nodetiphtml(d))
  		.pointAltitude(0)
  		.pointRadius(d => nodesize(d)*0.01)
  		.pointsMerge(false) //if true, pointLabel won't show

      .onPointHover(function(node){
        myGlobe.pointRadius(function(nodea) {
            if(!node) return nodesize(nodea)*0.01;
            return isConnected(node, nodea) ? nodesize(nodea)*0.01*20 : nodesize(nodea)*0.01;
          })
          .pointAltitude(function(nodea){
              if(!node) return 0;
              return isConnected(node, nodea) ? 0.1*myGlobe.pointOfView().altitude : 0;
          })
          .labelSize(function(nodea) {
            if(!node) return nodesize(nodea)*0.01;
            return isConnected(node, nodea) ? nodesize(nodea)*0.01*5 : nodesize(nodea)*0.01;
          })
          .labelAltitude(function(nodea){
              if(!node) return 0.000001;
              return isConnected(node, nodea) ? 0.1*myGlobe.pointOfView().altitude + 0.000001: 0.000001;
          })
          .arcColor(function(arc){
            if(!node) return [`rgba(0, 255, 0, ${OPACITY})`, `rgba(255, 0, 0, ${OPACITY})`];
            return node.id == arc.source.id || node.id == arc.target.id ?  [`rgba(0, 255, 0, 0.9)`, `rgba(255, 0, 0, 0.9)`] : [`rgba(0, 255, 0, ${OPACITY/4})`, `rgba(255, 0, 0, ${OPACITY/4})`];
          })

      })
      .onPointClick(function(node){
        var alt = myGlobe.pointOfView.altitude;
        myGlobe.pointOfView({lat: node.lat, lng: node.lng, altitude: alt}, 2000)
      })
      .onPointRightClick(function(node){
        if(node.login != null ) window.open(`https://www.inaturalist.org/people/${node.login}`, '_blank');
      })

  		.labelLat('lat')
  		.labelLng('lng')
  		.labelDotRadius(d => nodesize(d)*0.005) //* MAP_CENTER.altitude/myGlobe.pointOfView.altitude)
  	    .labelDotOrientation(() => 'bottom')
  	    .labelColor(d => nodecolor(d))
  	    .labelText(d => d.name)
  	    .labelSize(d => nodesize(d)*0.01) //* MAP_CENTER.altitude/myGlobe.pointOfView.altitude)
  	    .labelResolution(1)
  		  .labelAltitude(0 + 0.000001)
  	    .labelLabel(d => nodetiphtml(d));
    }


  ///*
  if(myGlobe){
    //myGlobe._destructor();
    myGlobe.pauseAnimation();
    //myGlobe.pointsData([]);
    //myGlobe.arcsData([]);
    myGlobe.labelsData([]);
  }
  //*/

  gl_dataset = updateglDataset();
  var center = computecenter(gl_dataset.nodes);
  MAP_CENTER = { lat: center.lat, lng: center.lng, altitude: 2.0 };
  //MAP_CENTER = { lat: 39.7392, lng: -104.9903, altitude: 1.4 };

	myGlobe
      .pointsData(gl_dataset.nodes)
	    .labelsData(jQuery.extend(true, [], gl_dataset.nodes))
      .arcsData(gl_dataset.links)
      .pointOfView(MAP_CENTER, 4000)
      .resumeAnimation();
	/*
	myGlobe
	  .onZoom(function(g){
		  myGlobe.pointRadius(function(d){
			var r = nodesize(d)*0.01*MAP_CENTER.altitude/g.altitude;
			console.log(r);
			return r;
		  })
		});
	*/
}

function update_all(){

    var datestart = $("#datestart").val();
    var dateend = $("#dateend").val();
    //var featureServer = "http://130.253.215.92:9000/"
	  var featureServer = "http://130.253.215.10:9000/"
    var networkDataUrlBase = featureServer + "functions/query_network_date/items.json?";
    var params = "datestart=" + datestart + "&dateend=" + dateend;
    var usernetworkDataUrl = networkDataUrlBase + params;

    $("body").css("cursor", "wait");

    usernetworkDataUrl = './data/network/' + $("#csvfilelist").val();
    console.log(usernetworkDataUrl);

    $.get(usernetworkDataUrl, function(data, status)
    {

        console.log("fetched network data");
        //console.log(data);

        data = $.csv.toObjects(data);
        console.log(data);

        // reset so all components are shown
        GRAPH_COMPONENTS_SIZE_THRESHOLD = 1;

        data_raw = jQuery.extend(true, [], data);

        init_graph_component_analysis(data_raw);

        // this function initialize/update data_componentfiltered
        prepare_data_component_size_threshold(data_raw);

        list_users(data_componentfiltered);

        prepare_data(data_componentfiltered);
        //analyze_network();
        async_analyze_network();
        draw_network();

        $("body").css("cursor", "auto");

    }).fail(function(){
        console.log("fetching network data failed");
    });
}

function update_geodata_ntanalysis_visualization(){
	GRAPH_COMPONENTS_SIZE_THRESHOLD = 1;
	init_graph_component_analysis(data_raw);
	prepare_data_component_size_threshold(data_raw);
	list_users(data_componentfiltered);
	prepare_data(data_componentfiltered);
	//analyze_network();
	async_analyze_network();
	draw_network();

}

function update_data_ntanalysis_visualization(){
  // update data (and visualization) according to changed filtering parameters
  prepare_data(data_componentfiltered);
  //analyze_network();
  async_analyze_network();
  draw_network();
}

function update_ntanalysis_visualization(){
  //analyze_network();
  async_analyze_network();
  // update visualization only - data did not change
  draw_network();


}

function update_visualization(){
  // update visualization only - data did not change
  draw_network();

}

function initload(){

    $.get('./data/network/files.txt', function(data, status)
    {

        console.log("fetched list of networks");
        //console.log(data);

        files = $.csv.toArrays(data);
        console.log(files);

        $("#csvfilelist").find("option").remove().end();

        for(var i = 0; i < files.length; i++){
          $("#csvfilelist").append(new Option(files[i][0]));
        }

        $("#csvfilelist option:first").attr('selected','selected')
        console.log($("#csvfilelist").val())
        
        $("body").css("cursor", "auto");
        
        update_all(); //initial run

    }).fail(function(){
        console.log("fetching list of networks failed");
    });
}

initload();

// update gl_dataset everytime fg_dataset is updated
function updateglDataset(){
  ///*
  for(var key in gl_dataset){
    for(var inkey in gl_dataset[key]){
      delete gl_dataset[key][inkey];
    }
    delete gl_dataset[key];
  }
//*/

   var gl_nodes = [];
   var gl_links = [];
   var names = [];

   for(var i in fg_dataset.nodes){
     if(fg_dataset.nodes[i].lat && fg_dataset.nodes[i].lng){
       names.push(fg_dataset.nodes[i].name);
       gl_nodes.push(jQuery.extend(true, {}, fg_dataset.nodes[i]));
     }else{
       console.log("aspatial node ...");
     }
   }

   for(var i in fg_dataset.links){
     if(fg_dataset.links[i].distance != null){

       var flag = fg_dataset.links[i].source;
       var srcname, tarname;

       if(typeof(flag) == "object"){
         srcname = fg_dataset.links[i].source.name;
         tarname = fg_dataset.links[i].target.name;
       }else{
         srcname = fg_dataset.nodes[fg_dataset.links[i].source].name;
         tarname = fg_dataset.nodes[fg_dataset.links[i].target].name;
       }

       gl_links.push({source: gl_nodes[names.indexOf(srcname)],
                    target: gl_nodes[names.indexOf(tarname)],
                    weight: fg_dataset.links[i].weight,
                    distance: fg_dataset.links[i].distance})
     }else{
        console.log("aspatial link ...");
     }
   }

   gl_dataset = {
     nodes: gl_nodes,
     links: gl_links
   };

   // reset
   for(var key in gl_linkedByIndex){
     delete gl_linkedByIndex[key];
   }

   gl_linkedByIndex = {};
   gl_dataset.links.forEach(function(d) {
       gl_linkedByIndex[d.source.id + "," + d.target.id] = true;
   });

   console.log("gl_dataset: ", gl_dataset);

   return gl_dataset;
}

function floatfrombrackets(inputstring){ //"{37.555}"
  //var res = inputstring ? parseFloat(inputstring.substring(1,inputstring.length-1)) : null;
  var res = inputstring ? parseFloat(inputstring) : null;
  return isNaN(res) ? null : res;
}

function intfrombrackets(inputstring){ //"{37}"
  //var res = inputstring ? parseInt(inputstring.substring(1,inputstring.length-1)) : null;
  var res = inputstring ? parseInt(inputstring) : null;
  return isNaN(res) ? null : res;
}

function strfrombrackets(inputstring){ //"{"Denver, CO"}"
  //var res = inputstring ? inputstring.substring(1,inputstring.length-1) : null;
  var res = inputstring ? inputstring : null;
  return res=="NULL" ? null : res;
}

function greatcircledistance(m, n){

  if(!(m.lat && m.lng && n.lat && n.lng)){
    return null;
  }

  const R = 6371; // kilometres
  var lat1 = m.lat * Math.PI/180; // φ, λ in radians
  const lat2 = n.lat * Math.PI/180;
  const lat_diff = (n.lat-m.lat) * Math.PI/180;
  const lng_diff = (n.lng-m.lng) * Math.PI/180;

  const a = Math.sin(lat_diff/2) * Math.sin(lat_diff/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(lng_diff/2) * Math.sin(lng_diff/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = R * c; // in kilometres

  return d;
}

function greatcircledistancelatlng(mlat, mlng, nlat, nlng){

  if(!(mlat && mlng && nlat && nlng)){
    return null;
  }

  const R = 6371; // kilometres
  const lat1 = mlat * Math.PI/180; // φ, λ in radians
  const lat2 = nlat * Math.PI/180;
  const lat_diff = (nlat-mlat) * Math.PI/180;
  const lng_diff = (nlng-mlng) * Math.PI/180;

  const a = Math.sin(lat_diff/2) * Math.sin(lat_diff/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(lng_diff/2) * Math.sin(lng_diff/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = R * c; // in kilometres

  return d;
}

/// helper functions
// deterine if two nodes are directly connected
function isConnected(a, b) {
	if($("#ctrmap").prop("checked")){
		return gl_linkedByIndex[a.id + "," + b.id] || gl_linkedByIndex[b.id + "," + a.id] || a.id == b.id
	}else{
		return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
	}
}
// this function does not seem to be in use
function hasConnections(a) {
  for (var property in linkedByIndex) {
      s = property.split(",");
      if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) 					return true;
  }
  return false;
}

function nodetiphtml(d){
  if(!MOUSE_QUERY){
     return null;
  }

  var nconnected = -1;
  var globemode = $("#ctrmap").prop("checked");
  for(var i in globemode ? gl_dataset.nodes : fg_dataset.nodes){
  	if(globemode){
  		nconnected += isConnected(d, gl_dataset.nodes[i]);
  	}else{
  		nconnected += isConnected(d, fg_dataset.nodes[i]);
  	}
  }

  var tailstr = " identifications";
  var nbrstr = " linked users";
  var nresgradobs = " observations";
  if(d.size == 1){
    tailstr = " identification";
  }
  if(nconnected == 1){
    nbrstr = " linked user";
  }
  var nobs = d.resgradobs == null ? 0 : d.resgradobs;
  if(nobs <= 1){
    nresgradobs = " observation";
  }

  var inhtml = '';
  /*if(!TEXT_NODE_MODE)*/ inhtml += d.name + '<br>';
  if(d.uid != null) inhtml += "uid: " + d.uid + '<br>'
  if(d.login != null) inhtml += "login: " + d.login + '<br>'
  inhtml += nconnected + nbrstr + '<br>'
  inhtml += d.size + tailstr + '<br>'
  inhtml += nobs + nresgradobs + '<br>'

  if(d.place != null) inhtml += d.place + '<br>'
  //if(d.lat != null) inhtml += "lat: " + d.lat + '<br>'
  //if(d.lng != null) inhtml += "lng: " + d.lng + '<br>'

  if(d.componentid != null) inhtml += "componentid: " + d.componentid + '<br>'
  if(d.clusterid != null) inhtml += "clusterid: " + d.clusterid + '<br>'
  if(d.pagerank != null) inhtml += "pagerank: " + d.pagerank.toFixed(2) + '<br>'

  inhtml += '[click: center | '
  inhtml += 'bio]<br>'

  return inhtml
}

function linktiphtml(d){
  if(!MOUSE_QUERY){
     return null;
  }

  var tailstr = " identifications";
  if(d.weight == 1){
    tailstr = " identification";
  }
  var inhtml = '';
  inhtml += d.target.name + "&#8592;" + d.source.name + '<br>'
  inhtml += "uid: " + d.target.uid + "&#8592;" + d.source.uid + '<br>'
  inhtml += "login: " + d.target.login + "&#8592;" + d.source.login + '<br>'
  //inhtml += "rank: " + d.target.pagerank == null ? null : d.target.pagerank.toFixed(3) + "&#8592;" + d.source.pagerank == null ? null : d.source.pagerank.toFixed(3) + '<br>'

  if(d.target.place && d.source.place) inhtml += d.target.place + "&#8592;" + d.source.place + '<br>'

  inhtml += d.weight + tailstr
  return inhtml;
}

function nodemouseover(d, pd) {
  if(!MOUSE_QUERY){
    //Graph.nodeLabel("");
    return;
  }

  if(d == null){ //mimic mouseout event

    $("#network").css("cursor", "default");
    $("#network3d").css("cursor", "default");

    Graph.nodeColor(function(o){
      //console.log(o.id);
      return nodecolor(o);
    })

    Graph.nodeVal(function(o){
      return nodesize(o);
    })

    if(TEXT_NODE_MODE){
      if(MODE3D){
        Graph.nodeThreeObject(node => {
          const sprite = new SpriteText(nodelabel(node));
          sprite.material.depthWrite = false; // make sprite background transparent
          sprite.color = nodecolor(node);
          sprite.textHeight = 8;
          return sprite;
        });
      }else{
          Graph.nodeCanvasObject((node, ctx, globalScale) => {
            const label = nodelabel(node);
            const fontSize = 3/globalScale*nodesize(node);
            ctx.font = `${fontSize}px Sans-Serif`;
            var textWidth = ctx.measureText(label).width;
            if(ctx.measureText(label).width == 0){
              textWidth = ctx.measureText("O").width;
              var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            }else{
              var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            }
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = nodecolor(node);
            ctx.fillText(label, node.x, node.y);

            node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
          })
          .nodePointerAreaPaint((node, color, ctx) => {
            ctx.fillStyle = color;
            const bckgDimensions = node.__bckgDimensions;
            bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
          })
          .nodeCanvasObjectMode(() => 'replace')
        }
      }

    if(false && IMAGE_NODE_MODE){
      if(MODE3D){
          Graph.nodeThreeObject(node => {
            var imgsrc = './img/owl.jpg';
            var size = 3*nodesize(node);
            const imgTexture = new THREE.TextureLoader().load(imgsrc);
            const material = new THREE.SpriteMaterial({ map: imgTexture });
            const sprite = new THREE.Sprite(material);
            //sprite.color = nodecolor(node);
            sprite.scale.set(3*nodesize(node), 3*nodesize(node));
            return sprite;
          })
          .nodeThreeObjectExtend(false)

      }else{
          Graph.nodeCanvasObject((node, ctx) => {
            const img = new Image();
            img.src = './img/owl.jpg';
            const size = 3*nodesize(node);
            ctx.save()
            ctx.beginPath()
            ctx.arc(node.x, node.y, size/2, 0, Math.PI * 2, false)
            ctx.strokeStyle = nodecolor(node)
            ctx.stroke()
            ctx.clip()
            ctx.drawImage(img, node.x - size / 2, node.y - size / 2, size, size)
            ctx.restore()
          })
          .nodePointerAreaPaint((node, color, ctx) => {
            const size = 3*nodesize(node);
            ctx.fillStyle = color; //nodecolor(node); //
            ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size); // draw square as pointer trap
          })
          .nodeCanvasObjectMode(() => 'replace')
      }
    }

    Graph.linkColor(function(o){
      return linkcolor(o);
    })

    Graph.linkWidth(function(o){
      return linkwidth(o);
    })

  }else{

    $("#network").css("cursor", "pointer");
    $("#network3d").css("cursor", "pointer");

    Graph.nodeLabel(function(d){return nodetiphtml(d);});

    Graph.nodeColor(function(o){
      //console.log(o.id);
      return isConnected(d, o) ? "blue": nodecolor(o);
    })

    Graph.nodeVal(function(o){
        return isConnected(d, o) ? 1.5*nodesize(o): nodesize(o);
    })

    if(TEXT_NODE_MODE){
      if(MODE3D){
        Graph.nodeThreeObject(node => {
          const sprite = new SpriteText(nodelabel(node));
          sprite.material.depthWrite = false; // make sprite background transparent
          sprite.color = isConnected(node, d) ? "blue": nodecolor(node);
          sprite.textHeight = isConnected(node, d) ? 12 : 8;
          return sprite;
        });
      }else{
          Graph.nodeCanvasObject((node, ctx, globalScale) => {
            const label = nodelabel(node);
            const fontSize = isConnected(node, d) ? 4.5/globalScale*nodesize(node): 3/globalScale*nodesize(node);
            ctx.font = `${fontSize}px Sans-Serif`;
            var textWidth = ctx.measureText(label).width;
            if(ctx.measureText(label).width == 0){
              textWidth = ctx.measureText("O").width;
              var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            }else{
              var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            }
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isConnected(node, d) ? 'blue' : nodecolor(node);
            ctx.fillText(label, node.x, node.y);

            node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
          })
          .nodePointerAreaPaint((node, color, ctx) => {
            ctx.fillStyle = color;
            const bckgDimensions = node.__bckgDimensions;
            bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
          })
          .nodeCanvasObjectMode(() => 'replace')
        }
    }

    if(false && IMAGE_NODE_MODE){
      if(MODE3D){
        Graph.nodeThreeObject(node => {
          var imgsrc = './img/owl.jpg';
          var size = isConnected(node, d) ? 4.5 * nodesize(node) : 3 * nodesize(node);
          const imgTexture = new THREE.TextureLoader().load(imgsrc);
          const material = new THREE.SpriteMaterial({ map: imgTexture });
          const sprite = new THREE.Sprite(material);
          //sprite.color = isConnected(node, d) ? "blue": nodecolor(node);
          sprite.scale.set(isConnected(node, d) ? 4.5 * nodesize(node) : 3 * nodesize(node), isConnected(node, d) ? 4.5 * nodesize(node) : 3 * nodesize(node));
          return sprite;
        })
        .nodeThreeObjectExtend(false)

      }else{
          Graph.nodeCanvasObject((node, ctx) => {
            const img = new Image();
            img.src = './img/owl.jpg';
            const size = isConnected(node, d) ? 4.5 * nodesize(node) : 3 * nodesize(node);
            ctx.save()
            ctx.beginPath()
            ctx.arc(node.x, node.y, size/2, 0, Math.PI * 2, false)
            ctx.strokeStyle = isConnected(node, d) ? "blue": nodecolor(node)
            ctx.stroke()
            ctx.clip()
            ctx.drawImage(img, node.x - size / 2, node.y - size / 2, size, size)
            ctx.restore()
          })
          .nodePointerAreaPaint((node, color, ctx) => {
            const size = 4.5*nodesize(node);
            ctx.fillStyle = color; //nodecolor(node); //
            ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size); // draw square as pointer trap
          })
          .nodeCanvasObjectMode(() => 'replace')
      }
    }

    Graph.linkColor(function(o){
      return o.source.index == d.index || o.target.index == d.index ? "blue" : linkcolor(o);
    })

    Graph.linkWidth(function(o){
      return o.source.index == d.index || o.target.index == d.index ? linkwidth(o)*2 : linkwidth(o);
    })
  }
}

function linkmouseover(d, pd){
    if(!MOUSE_QUERY){
      //Graph.linkLabel("");
      return;
    }

    if(d == null){ //mimic mouseout event

      $("#network").css("cursor", "default");
      $("#network3d").css("cursor", "default");

      Graph.nodeColor(function(o){
        //console.log(o.id);
        return nodecolor(o);
      })

      Graph.nodeVal(function(o){
        return nodesize(o);
      })

	if(TEXT_NODE_MODE){
		if(MODE3D){
		  Graph.nodeThreeObject(node => {
			const sprite = new SpriteText(nodelabel(node));
			sprite.material.depthWrite = false; // make sprite background transparent
			sprite.color = nodecolor(node);
			sprite.textHeight = 8;
			return sprite;
		  });
		}else{
			Graph.nodeCanvasObject((node, ctx, globalScale) => {
			  const label = nodelabel(node);
			  const fontSize = 3/globalScale*nodesize(node);
			  ctx.font = `${fontSize}px Sans-Serif`;
			  var textWidth = ctx.measureText(label).width;
			  if(ctx.measureText(label).width == 0){
				textWidth = ctx.measureText("O").width;
				var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
				ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
			  }else{
				var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
				ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
			  }
			  ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

			  ctx.textAlign = 'center';
			  ctx.textBaseline = 'middle';
			  ctx.fillStyle = nodecolor(node);
			  ctx.fillText(label, node.x, node.y);

			  node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
			})
			.nodePointerAreaPaint((node, color, ctx) => {
			  ctx.fillStyle = color;
			  const bckgDimensions = node.__bckgDimensions;
			  bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
			})
			.nodeCanvasObjectMode(() => 'replace')
		}
      }

      Graph.linkColor(function(o){
        return linkcolor(o);
      })

      Graph.linkWidth(function(o){
        return linkwidth(o);
      })

    }else{

      $("#network").css("cursor", "pointer");
      $("#network3d").css("cursor", "pointer");

      Graph.linkLabel(function(d){ return linktiphtml(d);})

      Graph.nodeColor(function(o){
        return o.index == d.source.index || o.index == d.target.index ? "blue": nodecolor(o);
      })

      Graph.nodeVal(function(o){
          return o.index == d.source.index || o.index == d.target.index ? 1.5*nodesize(o): nodesize(o);
      })

	if(TEXT_NODE_MODE){
		if(MODE3D){
		  Graph.nodeThreeObject(node => {
			const sprite = new SpriteText(nodelabel(node));
			sprite.material.depthWrite = false; // make sprite background transparent
			sprite.color = node.index == d.source.index || node.index == d.target.index ?  "blue": nodecolor(node);
			sprite.textHeight = node.index == d.source.index || node.index == d.target.index ? 12 : 8;
			return sprite;
		  });
		}else{
			Graph.nodeCanvasObject((node, ctx, globalScale) => {
			  const label = nodelabel(node);
			  const fontSize = node.index == d.source.index || node.index == d.target.index ? 4.5/globalScale*nodesize(node): 3/globalScale*nodesize(node);
			  ctx.font = `${fontSize}px Sans-Serif`;
			  var textWidth = ctx.measureText(label).width;
			  if(ctx.measureText(label).width == 0){
				textWidth = ctx.measureText("O").width;
				var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
				ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
			  }else{
				var bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
				ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
			  }
			  ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

			  ctx.textAlign = 'center';
			  ctx.textBaseline = 'middle';
			  ctx.fillStyle = node.index == d.source.index || node.index == d.target.index ?  'blue' : nodecolor(node);
			  ctx.fillText(label, node.x, node.y);

			  node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
			})
			.nodePointerAreaPaint((node, color, ctx) => {
			  ctx.fillStyle = color;
			  const bckgDimensions = node.__bckgDimensions;
			  bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
			})
			.nodeCanvasObjectMode(() => 'replace')
		  }
	  }

      Graph.linkColor(function(o){
        return o.source.index == d.source.index && o.target.index == d.target.index ? "blue" : linkcolor(o);
      })

      Graph.linkWidth(function(o){
        return o.source.index == d.source.index && o.target.index == d.target.index ? linkwidth(o)*2 : linkwidth(o);
      })
    }
}

function nodecolor(d){
  if(COMPONENTS_MODE){
    //return colors(d.componentid);
    return randomcolor(d.componentid);
  }else if(CLUSTER_MODE){
    //return colors(d.clusterid);
    return randomcolor(d.clusterid);
  }else{
    //return FOCI_NODE_MODE ? (d.name == foci_user ? (MODE3D ? 'red' : 'black') : '#ccc') : nodesize(d) > NODE_SIZE_MIN ? colors(d.id) : '#ccc';
    return FOCI_NODE_MODE ? (d.name == foci_user ? (MODE3D ? 'red' : 'black') : '#ccc') : nodesize(d) > NODE_SIZE_MIN ? randomcolor(d.id) : '#ccc';
  }
}

function linkcolor(o){
  if(!MODE3D && $("#ctrmap").prop("checked")){
    return "black";
  }
  return linkwidth(o) == LINK_WIDTH_MIN ? "#ccc" : "#808080";
}

function nodesize(d){
  if(PAGERANK_MODE){
    return Math.min(NODE_SIZE_MAX, Math.max(NODE_SIZE_MIN, Math.ceil(d.pagerank*10)));
  }else{
    //return Math.min(NODE_SIZE_MAX, Math.max(NODE_SIZE_MIN, Math.ceil(Math.log2(d.size + d.resgradobs==null?0:d.resgradobs))));
    return Math.min(NODE_SIZE_MAX, Math.max(NODE_SIZE_MIN, Math.ceil(Math.log2(d.size))));
  }
}

function nodelabel(d){
  return d.name;
  //return nodesize(d.size) > NODE_SIZE_MIN ? d.name : "";
}

function linkwidth(o){
  return Math.min(LINK_WIDTH_MAX, Math.max(LINK_WIDTH_MIN, Math.ceil(Math.sqrt(o.weight))));
}

function ucomponent_size_count(dict_components_size){
  var usizes = [];
  var counts = [];

  var ids = Object.keys(dict_components_size);
  for(var i in ids){
    var size = dict_components_size[ids[i]];
    var idx = usizes.indexOf(size);
    if(idx == -1){
      usizes.push(size);
      counts.push(1);
    }else{
      counts[idx] += 1
    }
  }
  var _usizes = jQuery.extend(true, [], usizes)
  _usizes.sort(function(a, b){return b-a});

  var _counts = []
  for(var i in _usizes){
    _counts.push(counts[usizes.indexOf(_usizes[i])]);
  }

  return {size: _usizes, count: _counts}
}

function ncomponents_over_size(dict_components_size, size_threshold){
  var componentids = [];
  var ids = Object.keys(dict_components_size);
  for(var i in ids){
    var size = dict_components_size[ids[i]];
    if(size >= size_threshold){
      componentids.push(parseInt(ids[i]));
    }
  }
  return componentids;
}


function randomcolor(id){
	var rnd = new Math.seedrandom(id.toString()+"ha");
    //var randomColor = '#'+Math.floor(Math.random()*16777215).toString(16);
    return '#'+Math.floor(rnd()*16777215).toString(16);
}

function computecenter(nodes){
  var lat, lng;

  if(FOCI_NODE_MODE){
    for(var i in nodes){
      if(nodes[i].name == foci_user){
        lat = nodes[i].lat;
        lng = nodes[i].lng;
        break;
      }
    }
  }else{

  	var latsum = 0;
  	var lonsum = 0;

  	for(var i in nodes){
  		latsum += nodes[i].lat;
  		lonsum += nodes[i].lng;
  	}

    lat = latsum/nodes.length;
    lng = lonsum/nodes.length;
  }

	return {lat: lat, lng: lng};
}
