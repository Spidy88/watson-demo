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

    getTweetsByKeyword: function() {
        var keyword = $('#analyze-tweet #keyword').val();

        if( !keyword ) {
            return;
        }

        watson.loadTweetsByKeyword(debugTweets);
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
            tweet.find('.tweet-content').text(tweets[i].content);

            setTimeout(function(keywordTweets, tweet) {
                return function() {
                    keywordTweets.append(tweet);
                }
            }(keywordTweets, tweet), 150 * i);
        }
    },

    unloadTweetsByKeyword: function() {
        var keywordTweets = $('#keyword-tweets');
        var tweets = keywordTweets.children('.tweet');

        for(var i = 0; i < tweets.length; i++ ) {
            var tweet = $(tweets[i]);
            tweet.removeClass('fadeInDown');

            setTimeout(function(tweet) {
                return function() {
                    tweet.addClass('fadeOutUp');
                }
            }(tweet), 150 * i);
        }
    },

    removeTweetsByKeyword: function() {
        $('#keyword-tweets .tweet').remove();
    }
};