import axios from 'axios';
import type { SocialMediaData } from '../types/index.js';

// Twitter Bearer Token loaded from environment at runtime
const TWITTER_API_BASE = 'https://api.twitter.com/2';

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id?: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
}

export class SocialMediaService {
  // Rate limiting for Twitter API (free tier: 10 requests per 15 minutes)
  private lastTwitterCall: number = 0;
  private twitterCallCount: number = 0;
  private twitterWindowStart: number = Date.now();
  private readonly TWITTER_RATE_LIMIT = 8; // Use 8 to stay under 10
  private readonly TWITTER_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  /**
   * Analyze social media sentiment and urgency using Twitter/X API
   * Uses NLP sentiment analysis on real tweets
   */
  async analyzeSocialMediaSentiment(regionName: string): Promise<SocialMediaData> {
    // Check if Twitter API is configured (trim to handle whitespace and newlines)
    const bearerToken = (process.env.TWITTER_BEARER_TOKEN || '').trim().replace(/\n/g, '').replace(/\r/g, '');
    
    try {
      if (!bearerToken || bearerToken === '' || bearerToken === 'your_twitter_bearer_token_here') {
        console.log(`[Twitter] ${regionName}: API not configured, using simulated data`);
        return this.getSimulatedSocialData(regionName);
      }
      
      // Check rate limit before making request
      const now = Date.now();
      if (now - this.twitterWindowStart > this.TWITTER_WINDOW_MS) {
        // Reset window
        this.twitterCallCount = 0;
        this.twitterWindowStart = now;
      }

      if (this.twitterCallCount >= this.TWITTER_RATE_LIMIT) {
        const waitTime = Math.ceil((this.TWITTER_WINDOW_MS - (now - this.twitterWindowStart)) / 1000);
        console.log(`[Twitter] ${regionName}: Rate limit reached. Resets in ${waitTime}s - using cached/simulated data`);
        return this.getSimulatedSocialData(regionName);
      }

      // Enforce minimum time between calls (space out requests)
      const timeSinceLastCall = now - this.lastTwitterCall;
      if (this.lastTwitterCall > 0 && timeSinceLastCall < 2000) {
        // Wait at least 2 seconds between calls
        await new Promise(resolve => setTimeout(resolve, 2000 - timeSinceLastCall));
      }

      console.log(`[Twitter] ${regionName}: Fetching real tweets... (${this.twitterCallCount + 1}/${this.TWITTER_RATE_LIMIT})`);

      // Fetch real tweets related to disasters and the region
      this.lastTwitterCall = Date.now();
      this.twitterCallCount++;
      const tweets = await this.fetchTweets(regionName, bearerToken);
      
      if (tweets.length === 0) {
        // No tweets found, return simulated data
        return this.getSimulatedSocialData(regionName);
      }

      // Analyze sentiment from real tweets
      const sentiment = this.analyzeSentiment(tweets);
      const urgencyScore = this.calculateUrgencyScore(tweets, sentiment);
      const hashtags = this.extractHashtags(tweets);

      console.log(`[Twitter] ${regionName}: ✅ Using REAL data - Sentiment: ${sentiment.toFixed(2)}, Urgency: ${urgencyScore}`);

      return {
        sentiment: Math.round(sentiment * 100) / 100, // -1 to 1 scale
        urgencyScore: Math.round(urgencyScore),
        mentions: tweets.length,
        hashtags: hashtags.slice(0, 10), // Top 10 hashtags
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error analyzing social media:', error.message || error);
      // Fallback to simulated data on error
      return this.getSimulatedSocialData(regionName);
    }
  }

  /**
   * Fetch tweets from Twitter/X API v2
   * Searches for disaster-related tweets about the region
   */
  private async fetchTweets(regionName: string, bearerToken: string): Promise<Tweet[]> {
    try {
      // Build search query for disaster-related tweets
      // Search for: region name + disaster keywords + SOS messages
      const disasterKeywords = [
        'flood', 'floods', 'flooding',
        'cyclone', 'storm', 'hurricane',
        'earthquake', 'disaster', 'emergency',
        'SOS', 'help', 'rescue', 'relief',
        'rain', 'heavy rain', 'damage'
      ];
      
      // Create query string
      const queryParts = [
        regionName,
        ...disasterKeywords.slice(0, 5), // Use top 5 keywords to avoid query being too long
      ];
      
      const query = queryParts.join(' OR ');
      
      // Twitter API v2 Search endpoint
      const response = await axios.get(`${TWITTER_API_BASE}/tweets/search/recent`, {
        params: {
          query: `(${query}) -is:retweet lang:en`, // Exclude retweets, English only
          max_results: 50, // Get up to 50 tweets
          'tweet.fields': 'created_at,author_id,public_metrics',
          expansions: 'author_id',
        },
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
        timeout: 10000,
      });

      const tweets = response.data.data || [];
      console.log(`[Twitter] ${regionName}: Found ${tweets.length} real tweets`);
      return tweets;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error(`[Twitter] ${regionName}: Authentication failed - check your Bearer Token`);
      } else if (error.response?.status === 429) {
        // Rate limit exceeded - free tier allows 10 requests per 15 minutes
        // Silently fall back - rate limits are expected on free tier
        // Will retry on next update cycle (30 seconds)
        return [];
      } else {
        console.error(`[Twitter] ${regionName}: Error - ${error.message || error}`);
      }
      return [];
    }
  }

  /**
   * Analyze sentiment from tweet text
   * Uses keyword-based sentiment analysis (can be enhanced with ML models)
   */
  private analyzeSentiment(tweets: Tweet[]): number {
    if (tweets.length === 0) return 0;

    // Sentiment keywords
    const positiveKeywords = ['help', 'rescue', 'safe', 'saved', 'grateful', 'thank', 'good'];
    const negativeKeywords = ['flood', 'damage', 'destroyed', 'stuck', 'trapped', 'emergency', 'SOS', 'danger', 'critical', 'urgent', 'dying', 'death'];
    const urgentKeywords = ['SOS', 'HELP', 'URGENT', 'EMERGENCY', 'CRITICAL', 'TRAPPED', 'RESCUE', 'NOW'];

    let totalSentiment = 0;
    let tweetCount = 0;

    for (const tweet of tweets) {
      const text = tweet.text.toLowerCase();
      let tweetSentiment = 0;

      // Count negative keywords (disaster-related terms are negative sentiment)
      const negativeCount = negativeKeywords.filter(keyword => text.includes(keyword)).length;
      const positiveCount = positiveKeywords.filter(keyword => text.includes(keyword)).length;
      const urgentCount = urgentKeywords.filter(keyword => text.toUpperCase().includes(keyword)).length;

      // Calculate sentiment (-1 to 1 scale)
      // More negative keywords = more negative sentiment
      // More urgent keywords = more negative sentiment
      tweetSentiment = -Math.min(1, (negativeCount * 0.2 + urgentCount * 0.3)) + (positiveCount * 0.1);

      // Weight by engagement (more engagement = stronger signal)
      const engagement = (tweet.public_metrics?.retweet_count || 0) + 
                         (tweet.public_metrics?.like_count || 0) * 0.5;
      const weight = Math.min(2, 1 + (engagement / 100)); // Max weight of 2x

      totalSentiment += tweetSentiment * weight;
      tweetCount += weight;
    }

    // Average sentiment
    const avgSentiment = tweetCount > 0 ? totalSentiment / tweetCount : 0;
    
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, avgSentiment));
  }

  /**
   * Calculate urgency score based on tweet volume and sentiment
   */
  private calculateUrgencyScore(tweets: Tweet[], sentiment: number): number {
    if (tweets.length === 0) return 0;

    // Base urgency from tweet volume
    const volumeScore = Math.min(50, tweets.length * 2); // 1 tweet = 2 points, max 50

    // Urgency from sentiment (more negative = more urgent)
    const sentimentScore = Math.min(30, Math.abs(sentiment) * 60); // Negative sentiment = urgency

    // Urgency from engagement (more retweets/likes = more urgent)
    const totalEngagement = tweets.reduce((sum, tweet) => {
      return sum + (tweet.public_metrics?.retweet_count || 0) + 
                   (tweet.public_metrics?.like_count || 0) * 0.5;
    }, 0);
    const engagementScore = Math.min(20, totalEngagement / 10); // Engagement = urgency

    return Math.min(100, volumeScore + sentimentScore + engagementScore);
  }

  /**
   * Extract hashtags from tweets
   */
  private extractHashtags(tweets: Tweet[]): string[] {
    const hashtagMap = new Map<string, number>();

    for (const tweet of tweets) {
      // Extract hashtags from tweet text
      const hashtags = tweet.text.match(/#\w+/g) || [];
      for (const tag of hashtags) {
        const normalized = tag.toUpperCase();
        hashtagMap.set(normalized, (hashtagMap.get(normalized) || 0) + 1);
      }
    }

    // Sort by frequency and return top hashtags
    return Array.from(hashtagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 10);
  }

  /**
   * Simulated social media data (fallback)
   */
  private getSimulatedSocialData(regionName: string): SocialMediaData {
    // Simulate urgency based on region severity
    const urgencyScore = 30 + Math.random() * 70;
    const sentiment = urgencyScore > 60 ? -0.5 - Math.random() * 0.4 : -0.1 - Math.random() * 0.3;
    
    return {
      sentiment: Math.round(sentiment * 100) / 100, // -1 to 1 scale
      urgencyScore: Math.round(urgencyScore),
      mentions: Math.round(50 + Math.random() * 500),
      hashtags: [
        '#FloodRelief',
        '#SOS',
        '#Emergency',
        `#${regionName.replace(/\s/g, '')}`,
        '#DisasterResponse',
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
