var debugTweets = [
    {
        author: 'Nick Ferraro',
        username: 'NickFerraro88',
        content: 'Playing Rainbow Six Siege later. Who\'s going to be online?'
    },
    {
        author: 'Cookie Monster',
        username: 'cookie_crack',
        content: 'C is for Cookie and Cookies are for me'
    },
    {
        author: 'Bobs Burgers',
        username: 'burgerBOB',
        content: 'Fridays are half off burgers from noon til 3pm. Get them while they\'re hot!'
    }
];

$(document).ready(function() {
    $('.nav').on('click', 'li', function() {
        if( $(this).hasClass('active') ) {
            return;
        }

        var currentlyActiveNav = $(".nav li.active");
        var currentlyActivePanel = currentlyActiveNav.data('target');
        currentlyActiveNav.removeClass('active');
        $('#main #' + currentlyActivePanel).addClass('hide');

        var nextActiveNav = $(this);
        var nextActivePanel = nextActiveNav.data('target');
        nextActiveNav.addClass('active');
        $('#main #' + nextActivePanel).removeClass('hide');
    });

    $('#keyword-prefix').on('click', function() {
        $(this).text($(this).text() === '@' ? '#' : '@');
    });

    $('#keyword-tweets').on('click', '.tweet', function() {
        var $tweet = $(this);

        watson.selectTweetToAnalyze($tweet);
    });

    $('#analyze-tweet #keyword').on('keypress', function(e) {
        if( e.keyCode === 13 ) {
            watson.getTweetsByKeyword();
        }
    });
    $('#analyze-tweet #analyze').on('click', watson.getTweetsByKeyword);
});

var watson = {
    openHat: function() {
        $('#watson .hat').addClass('open');
    },

    closeHat: function() {
        $('#watson .hat').removeClass('open');
    },

    selectTweetToAnalyze: function($tweet) {
        $('#keyword-tweets .tweet.active').removeClass('active');
        var text = $tweet.find('.tweet-content').data('text');

        $tweet.addClass('active');
        $.ajax({
            url: '/watson/analyze',
            method: 'POST',
            data: JSON.stringify({ text: text }),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                var documentSentiment = response.sentiment.document;
                var sentimentLabel = documentSentiment.label[0].toUpperCase() + documentSentiment.label.substring(1).toLowerCase();
                var sentimentScore = (documentSentiment.score * 100).toFixed(2) + '%';

                $('#analysis .sentiment .direction').text(sentimentLabel);
                $('#analysis .sentiment .value').text(sentimentScore);
                $('#analysis .sentiment img').attr('src', 'assets/' + documentSentiment.label + '.png');

                var documentEmotions = response.emotion.document.emotion;
                var joy = documentEmotions.joy || 0;
                var sadness = documentEmotions.sadness || 0;
                var disgust = documentEmotions.disgust || 0;
                var fear = documentEmotions.fear || 0;
                var anger = documentEmotions.anger || 0;

                $('#analysis .emotions .emotion.joy .score').text(joy.toFixed(2) + '%');
                $('#analysis .emotions .emotion.sad .score').text(sadness.toFixed(2) + '%');
                $('#analysis .emotions .emotion.disgust .score').text(disgust.toFixed(2) + '%');
                $('#analysis .emotions .emotion.fear .score').text(fear.toFixed(2) + '%');
                $('#analysis .emotions .emotion.anger .score').text(anger.toFixed(2) + '%');

                watson.openHat();
            }
        });
    },

    getTweetsByKeyword: function() {
        $('#analyze-tweet #analyze').button('loading');

        var prefix = encodeURIComponent($('#keyword-prefix').text());
        var keyword = encodeURIComponent($('#analyze-tweet #keyword').val());

        if( !keyword ) {
            return;
        }

        $.get('/tweets/' + prefix + keyword, function(results) {
            var tweets = _.map(results.tweets, function(tweet) {
                return {
                    author: tweet.user.name,
                    username: tweet.user.screen_name,
                    content: tweet.text,
                    cleanContent: tweet.cleanText
                };
            });
            watson.loadTweetsByKeyword(tweets);
        }).always(function() {
            $('#analyze-tweet #analyze').button('reset');
        });
    },

    loadTweetsByKeyword: function(tweets) {
        watson.removeTweetsByKeyword();

        var tweetTemplate = $('template#tweet-template');
        var keywordTweets = $('#keyword-tweets');

        var length = Math.min(tweets.length, 3);
        for(var i = 0; i < length; i++ ) {
            var tweet = $(tweetTemplate.html());

            tweet.find('.tweet-author').text(tweets[i].author);
            tweet.find('.tweet-author-username').text('@' + tweets[i].username);
            tweet.find('.tweet-content').text(tweets[i].cleanContent);
            tweet.find('.tweet-content').data(tweets[i].content);

            setTimeout(function(keywordTweets, tweet) {
                return function() {
                    keywordTweets.append(tweet);
                }
            }(keywordTweets, tweet), 150 * i);
        }

        setTimeout(function() {
            keywordTweets.find('.tweet').removeClass('animated').removeClass('fadeInDown');
        }, 150 * i);
    },

    unloadTweetsByKeyword: function() {
        var keywordTweets = $('#keyword-tweets');
        var tweets = keywordTweets.children('.tweet');

        for(var i = 0; i < tweets.length; i++ ) {
            var tweet = $(tweets[i]);

            setTimeout(function(tweet) {
                return function() {
                    tweet.addClass('animated fadeOutUp');
                }
            }(tweet), 150 * i);
        }
    },

    removeTweetsByKeyword: function() {
        $('#keyword-tweets .tweet').remove();
    }
};