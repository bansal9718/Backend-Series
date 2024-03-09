import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content, ownerId } = req.body;
  if (!content || !ownerId) {
    throw new ApiError(401, "Pls provide details for tweet");
  }
  try {
    const user = await User.findById(ownerId);

    if (!user) {
      throw new ApiError(400, "user does not exists");
    }

    const tweet = new Tweet({
      content: content,
      owner: user?._id,
    });

    const savedTweet = await tweet.save();

    return res
      .status(201)
      .json(new ApiResponse(200, savedTweet, "Tweet Created Successfully"));
  } catch (error) {
    throw new ApiError(401, error?.message, "Some Error Occured");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(400, "User does not Exist");
    }

    const tweet = await Tweet.find({ owner: userId });
    console.log(tweet);

    if (!tweet) {
      throw new ApiError(400, "No Tweets Exists");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, tweet, "Tweets Fetched Successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message, "Some Error Occured");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { tweetId } = req.params;
  const { content } = req.body;
  try {
    if (!tweetId) {
      throw new ApiError(400, "Pls Provide Tweet ID");
    }

    const updateTweetDetails = await Tweet.findByIdAndUpdate(
      tweetId,

      {
        $set: {
          content: content,
        },
      },
      { new: true },
    );

    if (!updateTweetDetails) {
      throw new ApiError(400, "No Tweet Exists");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(200, updateTweetDetails, "Tweet Updated Successfully"),
      );
  } catch (error) {
    throw new ApiError(400, error?.message, "Some Error Occured");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  try {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      throw new ApiError(401, "Comment not found");
    }

    const deleteTweetDetails = await Tweet.findByIdAndDelete(tweetId);

    res.status(200).json(new ApiResponse(200, "Tweet deleted Successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message, "Some Error Occured");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
