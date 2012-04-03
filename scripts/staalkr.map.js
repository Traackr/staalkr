/*
 * TRAACKR.eshackday library.
 */
 
 /*
 	OPTIONS:
 	
 	searchTerm: what term do you wanna search for?  blank = bring it all!
 	esHost: elasticHost
 	esIndex: elasticsearch index name
 	startLocation: Where do you want the map to open?  { lat: x, lon: y}
 	cloudMadeKey: 
 	
 */
if (typeof (TRAACKR) == "undefined")
    TRAACKR = {};
if (typeof (TRAACKR.eshackday) == "undefined")
    TRAACKR.eshackday = {};
   
// Render Map
var map = new L.Map('map');

// Start from date
var from_date =  "2012-03-25T00:00:00.000Z";

// Search Term
var searchTerm = '';

// Elastic Search Host
var esHost = '';

// CloudMade Key
var cloudMadeKey = 'e9c4b141b3c64736a8db238eb1f8a4dd';


TRAACKR.eshackday_func = function() {
 $(document).ready(function() {
 });
 
 var _init = function(config) {
 	console.log("Initializing Map");

		// Add copyright
		var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/'+cloudMadeKey+'/27783/256/{z}/{x}/{y}.png',
			cloudmadeAttribution = '<img src="http://campaigns.traackr.com/img/powered_by.png"><br/>Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
			cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttribution});

		// start view
		map.setView(new L.LatLng(37.766915,-122.44503), 12).addLayer(cloudmade);
		setTimeout("TRAACKR.eshackday.getData()",2000);	
 }
 
 
/*
 * Takes an array of elastic results and renders on map 
 */
 var _renderAll = function(dataArray) {
 	 jQuery.each(dataArray.hits.hits, function() {
 	 	_renderTweet(this);
 	 });

 }
 
 /*
  * Renders a single tweet as a point on the map
  */
 var _renderTweet = function(esresult) {
 	var data = esresult._source
 	var fields = esresult.fields
 	if (null == data.location) return;
 	var circleLocation = new L.LatLng(data.location.lat, data.location.lon)
 	// Temporary random score
 	var score = fields.traackr_reach;//_random(1,100);
	
	var circleOptions = {};
	
	
	if (score < 20) {
    circleOptions = {
        color: 'black',
        fillColor: '#999',
        fillOpacity: 0.2
    };
    } 
    
   else if (score < 75) {
      circleOptions = {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.2
    };  
    }

 	else if (score <= 100) {
      circleOptions = {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.2
    };  
    }
    
	var circle = new L.Circle(circleLocation,2*score, circleOptions);
	map.addLayer(circle);
	circle.bindPopup("<img style=float:left;margin:4px width=40 height=40 src=\"http://img.tweetimag.es/i/"+data.user.screen_name+"_n\"/><span style=font-size:18px;font-weight:bold>"+data.user.name+
	" <a target=_blank href=\"http://twitter.com/"+data.user.screen_name+"\">(@"+data.user.screen_name+
	")</a></span><br/>TRAACKR INFLUENCER SCORE"+
	": <span style=color:red;font-weight:bold>"+score+"</span>"+
	"<br /><b><i>"+data.user.location+"</i></b><br/><br/>"+data.text);
 }
 
 /*
  * Wrapper to get Tweet Data from Elastic
  */
 var _getData = function() {
 	_getTweetData();
 	setTimeout("TRAACKR.eshackday.getData()",2000);
 }
 
 /*
  * Make request to Elastic
  */
 var _getTweetData = function() {
 $.ajax({
         url: 'http://localhost:9200/twitter_location_sf/status/_search?pretty=true',
         type: 'POST',
         data : JSON.stringify(
            {
            	"fields": [
            		"_source"
            	],
            	"script_fields": {
            		"traackr_reach": {
            			"script": "com_traackr_elasticsearch_scoreTweets",
            			"lang":"js"
            			
            		}
            	},
               "query": {
               	  
                  "bool": {
                     "must": [
                     {
                        "range": {
                           "created_at": {
                           "from": from_date
                           }
                        }
                     }
                   //  , {
                     //	"term": {
                     	//	"text":"ca"
                     //	}
                    // }
                     ]
                  }
               },
               "sort": [
                  {
                     "created_at": {
                     "order": "asc"
                     }
                  }
               ]
            }
         ),
         dataType : 'json',
         processData: false,
         success: function(data, statusText, xhr) {
         			// only display when 10 more are available
         			 //if (undefined != data.hits.hits[data.hits.hits.length-1]) {
         			 		from_date = data.hits.hits[data.hits.hits.length-1]._source.created_at
         			 		 _renderAll(data);
         			 		 console.log('Data: '+JSON.stringify(data));
         			// }  else {
         			 //	console.log("Not enough data available, waiting...");
         			// }
                     
         },
         error: function(xhr, message, error) {
            console.error("Error while loading data from ElasticSearch", message);
         }
      });
 }
 
 /* 
  * Internal random number generator
  */
 var _random = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
 return {
 	getData : _getData,
 	init: _init
 }
 
}
