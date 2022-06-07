import { TwitterApi } from 'twitter-api-v2';
import schedule from 'node-schedule';
import dotenv from 'dotenv';
dotenv.config();

'use strict';

// Create Twitter client
const client = new TwitterApi({
    appKey: process.env.CONSUMER_KEY, // Consumer key
    appSecret: process.env.CONSUMER_KEY_SECRET, // Consumer key secret
    accessToken: process.env.OAUTH_TOKEN, // OAuth
    accessSecret: process.env.OAUTH_TOKEN_SECRET, // OAuth secret
});

// Get Twitter user timeline
const user = await client.v1.userTimelineByUsername(process.env.SCREEN_NAME);

// Post tweet at specific time
const postTweet = async (word) => {
    const tweet = `God bless ${word}. \n\n-godblessbot`

    try {
        await client.v1.tweet(tweet);
        logger(`Tweet was posted with text ${word} at ${getDateAndTime()}.`)
    } catch (error) {
        logger(`Something went wrong: ${error}`);
    }
}

// Get tweets from timeline and remove retweets
const getUserTweets = () => {
    return user.tweets.filter(tweet => {
        return tweet.retweeted === false;
    });
}

// Get random word from Wordnik dictionary API
const getRandomWordFromDictionary = () => {
    logger('Retrieving new word from dictionary.');
    // TODO - implement Wordnik dictionary API to retrieve a random word
}

// Check if word was already used in a tweet
const isWordUsed = (word, userTweets) => {
    let isUsed = false;

    userTweets.forEach(tweet => {
        let found = new RegExp('\\b' + word + '\\b', 'm').test(tweet.full_text); // \b - whole word entry only, m - multiline flag
        if (found) {
            logger(`${word} was found.`);
            isUsed = true;
        }
    });

    return isUsed;
}

// Returns the current time in 24hr format with hours, minutes and seconds.
const getDateAndTime = () => {
    const time = Date.now();
    return new Date(time).toLocaleTimeString('en-IE', {timeZone: 'Europe/Dublin'});
}

// Reusable logger with timestamps
const logger = (text) => {
    console.log(`[${getDateAndTime()}] ${text}`);
}

logger(`Scrip was started. Job scheduled with cron time ${process.env.CRON_TIME}.`);

// every dat at 22:00 - 0 22 * * *
// every dat at 22:10 - 10 22 * * *
// every 1 minute(s) - */1 * * * *
schedule.scheduleJob(process.env.CRON_TIME, function() {
    logger('Starting scheduled job.');

    let word = '';
    let isWordInTweet = true;

    while (isWordInTweet) {
        let userTweets = getUserTweets();
        word = getRandomWordFromDictionary();
        isWordInTweet = isWordUsed('NEWWORD', userTweets);
    }

    if (!isWordInTweet) {
        logger('Job was executed.');
        // postTweet('godblessbot'); // TODO - uncomment after Wordnik API is implemented
    }
});
