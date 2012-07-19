Staalkr
=======

Build proudly by Traackr at ElasticSearch Hackday (#ESHackDay) at Rackspace (03/28/2012)

Requirements:
- Instance of ElasticSearch running on the same host as the web server.
- Valid Twitter Account (Register at http://twitter.com)
- CloudMade API Key (More info at http://support.cloudmade.com/answers/api-keys-and-authentication)


Installing The Twitter River
=============================
TRAACKR has patched the Twitter River to capture more meta-data from Tweets than originally 
specified by the current version of the Twitter River. For our version of the Twitter River:

https://github.com/Traackr/elasticsearch-river-twitter


Installing Our Custom Scoring Plugin
====================================
1) Install the ElasticSearch JavaScript plugin:
	<ELASTICSEARCH_HOME>$ bin/plugin -install elasticsearch/elasticsearch-lang-javascript/1.1.0
	
2) Install the custom scoring JS files
	<ELASTICSEARCH_HOME>$ mkdir -p config/scripts/com/traackr/elasticsearch/
	Copy score.js, score.mvel, and scoreTweets.js into this directory
	
Creating The Twitter River & Index
==========================================

Have the following information ready:
 - The bounding box of a location you'd like to "STAALK". You need two points: lower-left geo-coordinates, and upper-right geo-coordinates.
 		- Note: Right clicking on a Google Map and selecting "What's Here" will bring up a new view of the map with the Lat/Long
 - Your Twitter Information
 - Your CloudMade API Key
 - Your $HOST and $INDEX_NAME
 
While ElasticSearch is running, run the following command:

curl -XPUT $HOST:9200/_river/$INDEX_NAME/_meta -d '
{
    "type" : "twitter",
    "twitter" : {
        "user" : "$TWITTER_USER",
        "password" : "$TWITTER_PASS",
        "filter":{
            "locations" : "$LOWER_LEFT_LONGITUDE,$LOWER_LEFT_LATITUDE,$UPPER_RIGHT_LONGITUDE,$UPPER_RIGHT_LATITUDE"
         }
    },
    "index" : {
        "index" : "$INDEX_NAME",
        "type" : "status",
        "bulk_size" : 1
    },
   "mappings" : {
   	"status" : { 
   		"_ttl" : { 
   			"enabled" : true, "default" : "$TTL_TIMEFRAME" 
   		 }
   	  } 
  	  }
}
'
$TWITTER_USER: twitter username
$TWITTER_PASS :twitter password
$LOWER_LEFT/$UPPER_RIGHT_LONGITUDE/LATITUDE: bounding box coordinates
$INDEX_NAME: whatever you want to name your index
$TTL_TIMEFRAME: formatted duration: e.g. 1s, 3h, 4d, 5M   How long the tweet will remain in the database
	
CONFIGURATION
==========================================

In the index.html file, the Staalkr app is initialized with the following parameters:

               esHost: "localhost:9200", // HOST and PORT
               esIndex: "my_index", // INDEX NAME
               cloudMadeKey: "xxxxxxxxxxxxxxxxxxxxxxx", // CLOUD MADE API KEY
               mapLat : 40.764421, // STARTING LATITUDE ON MAP
               mapLong :-73.525314,  // STARTING LONGITUDE ON MAP
               mapZoomLevel: 11, // MAP ZOOM LEVEL (0-18 Ascending Zoom)
               influenceThresh: 0, // INFLUENCE PERCENTAGE THRESHOLD (Filter out anyone below this score)