const request = require('request');
const _ = require('lodash');

const consumerKey = 'v7fNtpr254aztvCZpzGulPZX5';
const consumerSecret = 'Ev0IOWHD8UQqzd49hfFBhLtxMgdP4PeSRaINgmASFlb1BHMoou';
const tokenUrl = 'https://api.twitter.com/oauth2/token';
const searchUrl = 'https://api.twitter.com/1.1/search/tweets.json?q=';

const encodedConsumerKey = encodeURIComponent(consumerKey);
const encodedConsumerSecret = encodeURIComponent(consumerSecret);
const bearerToken = `${encodedConsumerKey}:${encodedConsumerSecret}`;
const encodedBearerToken = new Buffer(bearerToken).toString('base64');

function setupRoutes(app) {
    app.use('/tweets/:keyword', getTweetsByKeyword);
}

let tokens = {};
function getTweetsByKeyword(req, res) {
    const keyword = encodeURIComponent(req.params.keyword);

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
        getTweets(url, accessToken, function(tweets) {
            res.status(200).json(tweets);
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
            console.log('Error: ', error);
            cb(error);
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

    function handleTweetResponse(error, results) {
        queryCount++;
        tweets = _.concat(results.tweets);

        if( tweets.length < 3 && queryCount < 10 ) {
            console.log('Not enough original tweets, querying next set');
            getNextSetOfTweets(results.nextUrl, handleTweetResponse);
            return;
        }
        console.log('Done getting original tweets');
        res.status(200).json({ tweets });
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
                res.status(500).json({ error });
                return cb(error);
            }
            console.log('body: ', body);
            if( body.errors && body.errors.length ) {
                res.status(500).json({ errors: body.errors });
                return cb(body.errors);
            }
            
            let originalTweets = _.filter(body.statuses, function(status) {
                return status.metadata.iso_language_code === 'en' &&
                        status.in_reply_to_status_id === null &&
                        status.in_reply_to_user_id === null;
            });

            let resp = {
                tweets: originalTweets,
                nextUrl: body.search_metadata.next_results
            };

            innerCB(null, resp);
        });
    }
}

module.exports = setupRoutes;