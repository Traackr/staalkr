
ESHackDay = (function() {

   console.log('ESHackDay - Initializing');


   //var latest_tweet_date = "2012-03-28T17:19:00.000Z";
   var latest_tweet_date = "2012-03-28T00:00:00.000Z";
   var search_term = '';
   var known_screen_names = [];
   var screen_name_tweets_count = [ ];
   var screen_name_reach_score = [ ];

   $(document).ready(function() {

        console.log('ESHackDay - document.ready()');

        //search_term = _get_term();

        //console.log('Query term: ' + search_term);

        setTimeout("ESHackDay.get_more_data()", 1000);

        console.log('ESHackDay - document.ready() done')
   });


   console.log('ESHackDay - Initilization done');

   var _get_more_data = function() {

      //console.log(latest_tweet_date);
      //console.log((new Date(latest_tweet_date)).getTime());
      //console.log(new Date((new Date(latest_tweet_date)).getTime()+1000));

      console.log('Getting more data');
      _query_es(latest_tweet_date);
      setTimeout("ESHackDay.get_more_data()", 5000);

   } // End function _get_more_data


   var _query_es = function(from_date) {

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
                     "lang": "js"
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
                     }//,
                     //{
                     //   "term": {
                     //      "text": search_term
                     //   }
                     //}
                     ]
                  }
               },
               "size" : 100,
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
            _process_data(data);
            //console.log('Data: '+JSON.stringify(data));
         },
         error: function(xhr, message, error) {
            console.error("Error while loading data from ElasticSearch", message);
         }
      });

   } // End _query_es()


   var _process_data = function(data) {

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

   // Public functions
   return {
      get_more_data: _get_more_data
   };

})();
