import { isValidObjectId } from "mongoose"
import { Like } from "../models/likes.model.js"
import { Tweet } from "../models/tweet.model.js"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id")
  }

  const video = await Video.findById(videoId)
  if (!video) {
    throw new ApiError(400, "video not found")
  }

  const videoLike = await Like.findOne({ video: videoId })

  let unlike
  let like

  if (videoLike) {
    unlike = await Like.deleteOne({ video: videoId })
  } else {
    like = await Like.create({ video: videoId, owner: req.user?._id })
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `Video ${unlike ? "unlike" : "like"} successfully`,
      ),
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment id ")
  }

  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new ApiError(400, "comment not found")
  }
  const commentLike = await Like.findOne({ comment: commentId })

  let unlike
  let like

  if (commentLike) {
    unlike = await Like.deleteOne({ comment: commentId })
  } else {
    like = await Like.create({ comment: commentId, owner: req.user?._id })
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `Video ${unlike ? "unlike" : "like"} successfully`,
      ),
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet id ")
  }

  const tweet = await Tweet.findById(tweetId)
  if (!tweet) {
    throw new ApiError(400, "tweet not found")
  }
  const tweetLike = await Like.findOne({ tweet: tweetId })

  let unlike
  let like

  if (tweetLike) {
    unlike = await Like.deleteOne({ tweet: tweetId })
  } else {
    like = await Like.create({ tweet: tweetId, owner: req.user?._id })
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `Video ${unlike ? "unlike" : "like"} successfully`,
      ),
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
  //   //TODO: get all liked videos

  const userId = req.user?._id

  const likes = await Like.aggregate([
    {
      $match: {
        owner: new Types.ObjectID(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ])
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likedVideos: likes[0]?.likedVideos || {} },
        "Liked Videos fetched successfully",
      ),
    )
})

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos }
