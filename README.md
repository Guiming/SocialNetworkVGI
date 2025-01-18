# SocialNetworkVGI
Exploring social interaction patterns and drivers in VGI communities using a custom geovisual analytics tool

# Implementation Overview
The geovisual analytics tool was implemented as a single web page provisioned through a standard web server. The social network was loaded from a .csv data file containing edges of the iNaturalist social network that was pre-generated through queries on the datasets. Each edge connects an observer to an identifier and is associated with a weight (i.e., number of observations submitted by the observer and identified by the identifier). Basic information (user id, login, etc.) and node attributes (e.g., number of observations, number of identifications, geographic location, land cover composition and species taxon composition) of the observer and identifier were also obtained through the queries and stored in the data file, whilst edge attributes (geographic distance, land cover composition similarity, and species taxon composition similarity) are computed on-the-fly based on node attributes.

Force-graph (https://github.com/vasturiano/force-graph) and 3d-force-graph (https://github.com/vasturiano/3d-force-graph) were used to visualize the network with a force-directed layout in 2D and 3D, respectively. 

Leaflet (https://leafletjs.com) was used to draw nodes and edges of the network and render web map service (WMS) tiles provisioned by third parties (e.g., topography WMS by OpenTopMap (https://opentopomap.org) and land cover WMS by NAS (https://wiki.earthdata.nasa.gov/display/GIBS)). 

Globe.gl (https://globe.gl) was utilized to visualize the spatial social network on a 3D globe. 

D3.js (https://d3js.org) was used to draw statistical graphs (e.g., pie chart and scatter plot). 

These libraries have built-in interactivity functions to support various user interactions with the visual elements (panning, zooming in and out, hovering over to highlight, etc.). 

In the background, Cytoscape.js (https://js.cytoscape.org) was utilized for basic network analysis (e.g., PageRank), jLouvain (https://github.com/noduslabs/jLouvain) for community detection using the Louvain algorithm, and jStat.js (https://github.com/jstat/jstat) for statistical analyses (e.g., correlation coefficient).

