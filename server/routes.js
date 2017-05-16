const request = require('request');

const consumerKey = 'v7fNtpr254aztvCZpzGulPZX5';
const consumerSecret = 'Ev0IOWHD8UQqzd49hfFBhLtxMgdP4PeSRaINgmASFlb1BHMoou';
const tokenUrl = 'https://api.twitter.com/oauth2/token';
const searchUrl = 'https://api.twitter.com/1.1/search/tweets.json?q=';

const encodedConsumerKey = encodeURIComponent(consumerKey);
const encodedConsumerSecret = encodeURIComponent(consumerSecret);
const bearerToken = `${encodedConsumerKey}:${encodedConsumerSecret}`;
const encodedBearerToken = new Buffer(bearerToken).toString('base64');

function setupRoutes(app) {
    app.use('/tweet/:keyword', getTweetsByKeyword);
};

let tokens = {};
function getTweetsByKeyword(req, res) {
    refreshAccessToken(function(err) {
        if( err ) {
            res.status(500).json({ error: err });
            return;
        }

        let keyword = encodeURIComponent(req.params.keyword);
        request({
            uri: searchUrl + keyword,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokens.accessToken}`
            }
        }, function(error, response, body) {
            if( error ) {
                res.status(500).json({ error });
                return;
            }

            
        });
        console.log('Keyword: ', keyword);

        res.status(200).json({ keyword: keyword });
    });
}

function refreshAccessToken(cb) {
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
        cb();
    });
}

module.exports = setupRoutes;