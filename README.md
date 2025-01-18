# SocialNetworkVGI
Exploring social interaction patterns and drivers in VGI communities using a custom geovisual analytics tool

# Implementation Overview
Force-graph (https://github.com/vasturiano/force-graph) and 3d-force-graph (https://github.com/vasturiano/3d-force-graph) were used to visualize the network with a force-directed layout in 2D and 3D, respectively. 

Leaflet (https://leafletjs.com) was used to draw nodes and edges of the network and render web map service (WMS) tiles provisioned by third parties (e.g., topography WMS by OpenTopMap (https://opentopomap.org) and land cover WMS by NAS (https://wiki.earthdata.nasa.gov/display/GIBS)). 

Globe.gl (https://globe.gl) was utilized to visualize the spatial social network on a 3D globe. 

D3.js (https://d3js.org) was used to draw statistical graphs (e.g., pie chart and scatter plot). 

These libraries have built-in interactivity functions to support various user interactions with the visual elements (panning, zooming in and out, hovering over to highlight, etc.). 

In the background, Cytoscape.js (https://js.cytoscape.org) was utilized for basic network analysis (e.g., PageRank), jLouvain (https://github.com/noduslabs/jLouvain) for community detection using the Louvain algorithm, and jStat.js (https://github.com/jstat/jstat) for statistical analyses (e.g., correlation coefficient).

