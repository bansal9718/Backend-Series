import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // TODO: toggle subscription
  const userId = req.user?._id;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelID");
  }

  const channel = await User.findById(userId);
  if (!channel) {
    throw new ApiError(404, "Channel not find!");
  }

  // prevent subscribe to own channel
  if (channelId.toString() === userId) {
    throw new ApiError(400, "You cannot subscribe your own channel!");
  }

  const subscription = await Subscription.findOne({ channel: channelId });

  let unSubscribe;
  let subscribe;

  if (subscription?.subscriber?.toString() === userId) {
    //un-subscribe
    unSubscribe = await Subscription.findOneAndDelete({
      subscriber: userId,
      channel: channelId,
    });
  } else {
    //subscribe
    subscribe = await subscription.create({
      subscriber: userId,
      channel: channelId,
    });
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `${unSubscribe ? "unSubscribe" : "Subscribe"} successfully`,
      ),
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "channelId is Required!!");
  }
  try {
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $group: {
          _id: "channel",
          subscribers: { $push: "$subscriber" },
        },
      },
      {
        $project: {
          _id: 0,
          subscribers: 1,
        },
      },
    ]);

    if (!subscribers || subscribers.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No subscribers found for the channel"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribers,
          "All Subscribers fetched Successfully!!",
        ),
      );
  } catch (e) {
    throw new ApiError(500, e?.message || "Unable te fetch subscribers!");
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "subscriberId is Requitred!!");
  }
  try {
    const subscribedChannels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $group: {
          _id: "subscriber",
          subscribedChannels: { $push: "$channel" },
        },
      },
      {
        $project: {
          _id: 0,
          subscribedChannels: 1,
        },
      },
    ]);

    if (!subscribedChannels || subscribedChannels.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, [], "No subscribedChannel found for the user"),
        );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannels,
          "All SubscribedChannels fetched Successfully!!",
        ),
      );
  } catch (e) {
    throw new ApiError(
      500,
      e?.message || "Unable te fetch subscribedChannels!",
    );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
