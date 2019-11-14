const Twit = require('twit');
const Dotenv = require('dotenv');
Dotenv.config();

/**
 * Create the Twit instance.
 *
 * @type {Twitter|*}
 */
const godBlessBot = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000,
    strictSSL: true,
});

/**
 * Returns a random string from the dictionary array of strings.
 *
 * @returns {string} - a random string from the dictionary array.
 */
function getRandomString() {
    //TODO: import strings from external datasource?
    let dictionary = [
        'magic mushrooms',
        'sneezes',
        'san pellegrino',
        'tommy shlug',
        'you',
        'tayto sandwiches',
        'us and save us',
        'fizzy cola bottles',
        'ghosts',
        'beetlejuice',
        'firelighters',
        'vidya gaemz',
        'baileys',
        'creamy mashed potatoes',
        'the rains down in africa'
    ];
    return dictionary[Math.floor(Math.random() * dictionary.length)];
}

/**
 * Posts tweet with randomly chosen string if postTweetTime equals the current time.
 * If the time condition is not met, the function will repeat base on timeout in the callback.
 *
 * @param callback is the {@link waitAndExecute} callback.
 * @param message is the string returned from the dictionary in {@link getRandomString}.
 */
function postTweet(callback, message) {
    let postTweetTime = '22:00:00';
    if (getTimeAndDate() == postTweetTime) {
        try {
            console.log('[' + getTimeAndDate() + ']:', 'Posting tweet as time is now', getTimeAndDate());
            godBlessBot.post('statuses/update', {
                status: 'God bless ' + message + '\n\n—godblessbot'
            }, function (err, data, response) {
                console.log(data);
            });
            getPreviousTweets();
        } catch (e) {
            //TODO: implement error handling
            console.log(e);
        }
    } else {
        console.log('[' + getTimeAndDate() + ']:', 'Time is not', postTweetTime);
        callback(message);
    }
}

/**
 * Returns the current time in 24hr format with hours, minutes and seconds.
 */
function getTimeAndDate() {
    const date = new Date();
    let hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    let minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    let seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();

    let dateFormatted = `${hours}:${minutes}:${seconds}`;
    return dateFormatted;
}

/**
 * Retrieves past tweets from the specified username.
 * Tweets will be returned based on the query parameter with a phrase and date passed in.
 *
 * Executes {@link filterTweets} with the found tweets passed as a parameter.
 */
function getPreviousTweets() {
    let previousTweets = [];
    godBlessBot.get('search/tweets', {
        screen_name: process.env.TWITTER_USERNAME,
        q: '—godblessbot since:2019-10-01'
    }).then(function (result) {
        Object.values(result.data)[0].forEach(function (tweet) {
            previousTweets.push(tweet.text);
        });
        return previousTweets;
    }).then(function (previousTweets) {
        filterTweets(previousTweets, getRandomString());
    }).catch(function (err) {
        //TODO: implement error handling
        console.log('caught error', err);
    });
}

/**
 * Filters through tweets to see if a string was already used. If a string has
 * not been used, the function will prepare to post and call {@link postTweet}.
 *
 * @param previousTweets an array of tweets retrieved from {@link getPreviousTweets}.
 * @param randomString a random string returned from the function {@link getRandomString}.
 */
function filterTweets(previousTweets, randomString) {
    let storePreviousTweets = previousTweets;
    let filterResult = [];
    for (let tweet of previousTweets) {
        filterResult.push(tweet.includes(randomString));
    }

    if (filterResult.length !== 0) {
        if (filterResult.includes(true)) {
            console.log(`one or more tweets already contain the string "${randomString}". Choosing new string...`);
            filterTweets(storePreviousTweets, getRandomString());
        } else {
            console.log(`the string "${randomString}" was not found in any tweets. Preparing to post...`);
            waitAndExecute(randomString);
        }
    }
}

/**
 * Serves as a callback, executes {@link postTweet} once every second.
 */
function waitAndExecute(message) {
    setTimeout(function () {
        try {
            postTweet(waitAndExecute, message);
        } catch (e) {
            console.log(e);
        }
    }, 1000);
}

/**
 * Execute script.
 */
getPreviousTweets();
