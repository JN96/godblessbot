import { TwitterApi } from 'twitter-api-v2';
import schedule from 'node-schedule';
import fetch from 'node-fetch';
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

const user = await client.v1.userTimelineByUsername(process.env.SCREEN_NAME);

const postTweet = async (word) => {
    const tweet = `God bless ${word}. \n\n-godblessbot`

    try {
        logger('Attempting to post tweet...');
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

const getRandomWordFromDictionary = async () => {
    logger('Retrieving new word from dictionary.');
    let url = process.env.WORDNIK_RANDOM_WORD_API_URL + process.env.WORDNIK_API_KEY;
    return await fetch(url, {method: 'GET'})
      .then(response => {
          if (response.ok) {
              return response.json();
          }
      })
      .catch((error) => {
          logger(`Something went wrong: ${error}`);
      }) ;
}

const isWordUsed = (word, userTweets) => {
    let isUsed = false;

    userTweets.forEach(tweet => {
        let found = new RegExp('\\b' + word + '\\b', 'm').test(tweet.full_text); // \b - whole word entry only, m - multiline flag
        if (found) {
            logger(`${word} was found in a previous tweet.`);
            isUsed = true;
        }
    });

    if (!isUsed) {
        logger(`${word} was not found in a previous tweet.`);
    }

    return isUsed;
}

const getDateAndTime = () => {
    const time = Date.now();
    return new Date(time).toLocaleTimeString('en-IE', {timeZone: 'Europe/Dublin'});
}

const logger = (text) => {
    console.log(`[${getDateAndTime()}] ${text}`);
}

logger(`Script was started. Job scheduled with cron time ${process.env.CRON_TIME}.`);

schedule.scheduleJob(process.env.CRON_TIME, async function() {
    logger('Starting scheduled job.');

    let word = '';
    let isWordInTweet = true;

    while (isWordInTweet) {
        let userTweets = getUserTweets();
        word = await getRandomWordFromDictionary()
          .then(data => {
              logger(`New word is ${data.word}.`);
              return data.word;
          });
        isWordInTweet = isWordUsed(word, userTweets);
    }

    if (!isWordInTweet) {
        postTweet(word);
    }
});
