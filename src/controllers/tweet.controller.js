import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content) {
    throw new ApiError(401, "Pls provide details for tweet");
  }
  try {
    const tweet = await Tweet.create({
      content: content,
      owner: req.user?._id,
    });

    if (!tweet) {
      throw new ApiError(500, "Unable to create tweet!!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, savedTweet, "Tweet Created Successfully"));
  } catch (error) {
    throw new ApiError(401, error?.message, "Some Error Occured");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  try {
    const { userId } = req.params;
    if (!userId) {
      throw new ApiError(400, "userId is Required!!!");
    }

    const tweet = await Tweet.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: "owner",
          tweets: { $push: "$content" },
        },
      },
      {
        $project: {
          _id: 0,
          tweets: 1,
        },
      },
    ]);
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
    const existingTweet = await Tweet.findById(tweetId);
    if (!existingTweet) {
      throw new ApiError(404, "Tweet doesn't exist");
    }

    //User is owner or not
    if (existingTweet.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(300, "Unuthorized Access");
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

    if (tweet.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(300, "Unuthorized Access");
    }

    const deleteTweetDetails = await Tweet.findByIdAndDelete(tweetId);

    if (!deleteTweetDetails) {
      throw new ApiError(500, "Unable to delete tweet");
    }
    res.status(200).json(new ApiResponse(200, "Tweet deleted Successfully"));
  } catch (error) {
    throw new ApiError(400, error?.message, "Some Error Occured");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
