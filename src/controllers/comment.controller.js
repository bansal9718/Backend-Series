import { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { page = 1, limit = 10 } = req.query

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId!")
  }

  const aggregate = await Comment.aggregate([
    {
      $match: {
        video: new Types.ObjectId(videoId),
      },
    },
  ])

  Comment.aggregatePaginate(aggregate, { page, limit })
    .then(function (result) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { result },
            "Video Comment fetched successfully",
          ),
        )
    })
    .catch(function (error) {
      throw error
    })
})

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params
  const { content } = req.body

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId!")
  }

  const video = await Video.findById(videoId)
  if (!video) {
    throw new ApiError(401, "Video not found")
  }

  try {
    const comment = await Comment.create({
      video: videoId,
      content: content,
      owner: req.user?._id,
    })

    res
      .status(201)
      .json(new ApiResponse(200, comment, "Comments Added Successfully"))
  } catch (error) {
    throw new ApiError(401, err?.message, "some error Ocuured")
  }
})

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params
  const { content } = req.body
  if (!isValidObjectId(commentId)) {
    throw new ApiError(401, "Pls provide a commentID")
  }

  const existingComment = await Comment.findById(commentId)

  if (!existingComment) {
    throw new ApiError(404, "Comment doesn't exist")
  }

  if (existingComment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(300, "Unuthorized Access")
  }
  const updateCommentDetails = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },

    { new: true },
  )

  if (!updateCommentDetails) {
    throw new ApiError(401, "Comment not Found")
  }
  res
    .status(201)
    .json(
      new ApiResponse(
        200,
        updateCommentDetails,
        "Comments updated Successfully",
      ),
    )
})

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params
  const comment = await Comment.findById(commentId)

  if (!comment) {
    throw new ApiError(401, "Comment not found")
  }

  const existingComment = await Comment.findById(commentId)

  if (!existingComment) {
    throw new ApiError(404, "Comment doesn't exist")
  }

  if (existingComment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(300, "Unuthorized Access")
  }

  const deleteCommentDetails = await Tweet.findByIdAndDelete(commentId)

  res.status(200).json(new ApiResponse(200, {}, "Comment deleted Successfully"))
})

export { getVideoComments, addComment, updateComment, deleteComment }
