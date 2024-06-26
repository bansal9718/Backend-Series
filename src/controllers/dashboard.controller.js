import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  try {
    const channelStat = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "Likes",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "owner",
          foreignField: "channel",
          as: "Subscribers",
        },
      },
      {
        $group: {
          _id: null,
          TotalVideos: { $sum: 1 },
          TotalViews: { $sum: "$views" },
          TotalSubscribers: { $first: { $size: "$Subscribers" } },
          TotalLikes: { $first: { $size: "$Likes" } },
        },
      },
      {
        $project: {
          _id: 0,
          TotalSubscribers: 1,
          TotalLikes: 1,
          TotalVideos: 1,
          TotalViews: 1,
        },
      },
    ])

    if (!channelStat) {
      throw new ApiError(500, "Unable to fetch the channel stat!")
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channelStat[0],
          "Channel Stat fetched Successfully",
        ),
      )
  } catch (e) {
    throw new ApiError(500, e?.message || "Unable to fetch the channelm stat!!")
  }
})

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  try {
    const videos = await Video.find({ owner: req.user?._id })
    if (!videos || videos.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, videos, "No video published yet"))
    }

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos feteched successfully"))
  } catch (e) {
    throw new ApiError(200, e?.message || "Unable to fetch the videos!!")
  }
})

export { getChannelStats, getChannelVideos }
