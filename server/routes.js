const request = require('request');
const _ = require('lodash');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const watsonCredentials = {
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api',
    username: '6c51d1db-9351-4a9e-8c5e-1aa277485ddd',
    password: 'HaovTwYcWYln'
};

var nlu = new NaturalLanguageUnderstandingV1({
    username: watsonCredentials.username,
    password: watsonCredentials.password,
    version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});


const consumerKey = 'v7fNtpr254aztvCZpzGulPZX5';
const consumerSecret = 'Ev0IOWHD8UQqzd49hfFBhLtxMgdP4PeSRaINgmASFlb1BHMoou';
const tokenUrl = 'https://api.twitter.com/oauth2/token';
const searchUrl = 'https://api.twitter.com/1.1/search/tweets.json?q=';

const encodedConsumerKey = encodeURIComponent(consumerKey);
const encodedConsumerSecret = encodeURIComponent(consumerSecret);
const bearerToken = `${encodedConsumerKey}:${encodedConsumerSecret}`;
const encodedBearerToken = new Buffer(bearerToken).toString('base64');

const profanitySanitizerUrl = 'http://www.purgomalum.com/service/json?text=';

function setupRoutes(app) {
    app.use('/tweets/:keyword', getTweetsByKeyword);
    app.use('/watson/analyze', postWatsonAnalyze);
}

let tokens = {};
function getTweetsByKeyword(req, res) {
    const keyword = encodeURIComponent(req.params.keyword);
    console.log('Searching for tweets with keyword: ', keyword);

    if( !keyword ) {
        res.status(400).json({ error: 'Must provide a keyword to search with' });
        return;
    }

    getAccessToken(function(err, accessToken) {
        if( err ) {
            res.status(500).json({ error: err });
            return;
        }

        let url = searchUrl + keyword;
        getTweets(url, accessToken, function(error, tweets) {
            if( error ) {
                res.status(500).json({ error });
                return;
            }

            console.log('Got tweets: ', tweets.length);
            sanitizeProfanity(tweets.slice(0, 3), function(error, cleanTweets) {
                if( error ) {
                    res.status(500).json({ error });
                    return;
                }

                res.status(200).json({ tweets: cleanTweets });
            });
        });
    });
}

function getAccessToken(cb) {
    request({
        uri: tokenUrl,
        method: 'POST',
        form: {
            'grant_type': 'client_credentials'
        },
        headers: {
            'Authorization': `Basic ${encodedBearerToken}`
        }
    }, function(error, response, body) {
        if( error ) {
            console.log('Error getting access token');
            cb(error);
            return;
        }

        try {
            body = JSON.parse(body);
        } catch(e) {
            cb({
                message: 'Not a valid json response',
                error: e
            });
            return;
        }

        tokens.accessToken = body.access_token;
        cb(null, body.access_token);
    });
}

function getTweets(url, accessToken, cb) {
    let queryCount = 0;
    let tweets = [];

    getNextSetOfTweets(url, handleTweetResponse);

    function handleTweetResponse(error, result) {
        queryCount++;
        tweets = _.concat(result.tweets);

        if( tweets.length < 3 && queryCount < 10 && result.nextUrl ) {
            console.log('Not enough original tweets, querying next set');
            getNextSetOfTweets(result.nextUrl, handleTweetResponse);
            return;
        }

        console.log('Done getting tweets');
        cb(null, tweets);
    }
    
    function getNextSetOfTweets(url, innerCB) {
        request({
            uri: url,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }, function(error, response, body) {
            if( error ) {
                return cb(error);
            }

            try {
                body = JSON.parse(body);
            } catch(e) {
                cb({
                    message: 'Failed to parse tweets search results',
                    error: e
                });
                return;
            }

            if( body.errors && body.errors.length ) {
                return cb(body.errors);
            }

            let originalTweets = _.filter(body.statuses, function(status) {
                return status.metadata.iso_language_code === 'en' &&
                        status.in_reply_to_status_id === null &&
                        status.in_reply_to_user_id === null &&
                        !status.retweeted_status;
            });

            let resp = {
                tweets: originalTweets,
                nextUrl: body.search_metadata.next_results
            };

            innerCB(null, resp);
        });
    }
}

function postWatsonAnalyze(req, res) {
    nlu.analyze({
        'html': decodeURIComponent(req.body.text), // Buffer or String
        'features': {
            'keywords': {
                'emotion': true,
                'sentiment': true
            },
            'emotion': {},
            'entities': {
                'emotion': true,
                'sentiment': true
            },
            'sentiment': {}
        }
    }, function(err, response) {
        if (err) {
            console.log('error:', err);
            res.status(500).json({ error: err });
            return;
        }

        res.status(200).json(response);
    });
}

function sanitizeProfanity(tweets, cb) {
    let cleanTweets = [];
    let i = 0;

    if( !tweets.length ) {
        return cb(null, tweets);
    }

    sanitizeTweet(tweets[i], handleCleanTweet);

    function sanitizeTweet(tweet, innerCB) {
        request({
            uri: profanitySanitizerUrl + encodeURIComponent(tweet.text),
            method: 'GET'
        }, function(err, response, body) {
            if( err ) {
                return innerCB({
                    message: 'Failed to sanitize tweet',
                    error: err
                });
            }

            try {
                body = JSON.parse(body);
            } catch(e) {
                return innerCB({
                    message: 'Failed to parse response json for sanitization',
                    error: e
                });
            }

            tweet.cleanText = body.result;
            innerCB(null, tweet);
        });
    }

    function handleCleanTweet(error, cleanTweet) {
        if( error ) {
            return cb({
                message: 'Failed to clean tweet',
                error: error
            });
        }

        cleanTweets.push(cleanTweet);

        if( cleanTweets.length != tweets.length ) {
            i++;
            sanitizeTweet(tweets[i], handleCleanTweet);
            return;
        }

        cb(null, cleanTweets);
    }
}

module.exports = setupRoutes;