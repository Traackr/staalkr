/*
 * TRAACKR.staalkr library.
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
if (typeof (TRAACKR.staalkr) == "undefined")
    TRAACKR.staalkr = {};
   
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

// Global list vars
var known_screen_names = [];
var screen_name_tweets_count = [ ];
var screen_name_reach_score = [ ];


TRAACKR.staalkr_func = function() {
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
		setTimeout("TRAACKR.staalkr.getData()",2000);	

		// get search term from query string q=?
		searchTerm = _get_term();


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
 	setTimeout("TRAACKR.staalkr.getData()",2000);
 }
 
 /*
  * Make request to Elastic
  */
 var _getTweetData = function() {
 
 var elasticQuery = {
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
            };
            
            if (searchTerm != null) {
            	elasticQuery.query.bool.must.push({
                   	"term": {
                   		"text": searchTerm
                     	}
                     });
            }
 $.ajax({
         url: 'http://localhost:9200/twitter_location_sf/status/_search?pretty=true',
         type: 'POST',
         data : JSON.stringify(elasticQuery),
         dataType : 'json',
         processData: false,
         success: function(data, statusText, xhr) {
         			// only display when 10 more are available
         			 //if (undefined != data.hits.hits[data.hits.hits.length-1]) {
         			 		from_date = data.hits.hits[data.hits.hits.length-1]._source.created_at
         			 		 _renderAll(data);
         			 		 _process_list_data(data);
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
 
 
    var _process_list_data = function(data) {

//      console.log('Data: '+JSON.stringify(data.hits.hits[0]._id));
      for ( i = 0; i < data.hits.hits.length; i++ ) {
         console.log('Hit ID: '+data.hits.hits[i]._id + '(created at: '+ data.hits.hits[i]._source.created_at +')');
         _display_tweet(data.hits.hits[i]);
      }
      if ( data.hits.hits.length > 0 ) {
         latest_tweet_date = data.hits.hits[data.hits.hits.length-1]._source.created_at;
         latest_tweet_date = new Date((new Date(latest_tweet_date)).getTime()+1000);
      }

   } // End function _process_data()


 var _display_tweet = function(tweet) {

      var screen_name = tweet._source.user.screen_name;
      var text = tweet._source.text;

      if ( $.inArray(screen_name, known_screen_names) ===  -1 ) {
         screen_name_tweets_count[screen_name] = 1;
         //screen_name_reach_score[screen_name] = Math.floor((Math.random()*100)+1);
         screen_name_reach_score[screen_name] = tweet.fields.traackr_reach;
         var markup = '<div id="' + screen_name+ '" class="influencer">' +
               '<table><tr>' +
                  '<td>' +
                     '<img src="http://img.tweetimag.es/i/' + screen_name + '_n"/>' +
                  '</td>' +
                  '<td>' +
                     '<b>' + tweet._source.user.name + '</b>' +
                     ' (<i>Reach: <span class="reach_score">' + screen_name_reach_score[screen_name] + '</span></i>)' +
                     '<br/><b>Tweets count: </b> <span class="tweets_count">' +
                        screen_name_tweets_count[screen_name] + '</span>' +
                     '<br/><b>Latest tweet: </b> <span class="latest_tweet">' +
                        text + '</span>' +
                  '</td>' +
               '</tr></tabe>' +
            '</div>';
         // Never seen it, so only 1 tweet, add at the end
         $('#influencers_list').append(markup);
         known_screen_names.push(screen_name);
      } // screen_name not in array
      else {
         screen_name_tweets_count[screen_name] += 1;
         $('div.influencer#' + screen_name + ' span.tweets_count').text(screen_name_tweets_count[screen_name]);
         $('div.influencer#' + screen_name + ' span.latest_tweet').text(text);
      }
      // Sort
      var influencer = $('div.influencer#' + screen_name);
      $('div.influencer').each(function(index, elm) {
         var tweets_count = $(elm).find('span.tweets_count').text();
         var reach_score = $(elm).find('span.reach_score').text();
         console.log('Tweets count: '+tweets_count);
         if ( parseInt(tweets_count) < screen_name_tweets_count[screen_name] ) {
            influencer.insertBefore(elm)
            return false;
         }
         if ( parseInt(tweets_count) == screen_name_tweets_count[screen_name] ) {
            if ( parseInt(reach_score) < screen_name_reach_score[screen_name] ) {
               influencer.insertBefore(elm)
               return false;
            }
         }
      });

   } // End function _display_tweet


   var _get_term = function() {
      //var vars = [], hash;
      var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
      for(var i = 0; i < hashes.length; i++) {
         hash = hashes[i].split('=');
         if ( hash[0] == 'q') return hash[1];
      }
   } // End function get_url_vars


 return {
 	getData : _getData,
 	init: _init
 }
 
}
