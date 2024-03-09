import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  //finding video by the ID
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(401, "Video not found");
  }

  //Query Comments
  const comments = await Comment.find({ video: videoId })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalComments = await Comment.countDocuments({ video: videoId });
  const results = {
    totalComments: totalComments,
    page: page,
    totalPages: Math.ceil(totalComments / limit),
    comments: comments,
  };

  res
    .status(201)
    .json(new ApiResponse(200, results, "Comments fetched Successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  const { content, ownerId } = req.body;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(401, "Video not found");
  }

  try {
    const comment = new Comment({
      video: videoId,
      content: content,
      owner: ownerId,
    });

    await comment.save();

    res
      .status(201)
      .json(new ApiResponse(200, comment, "Comments Added Successfully"));
  } catch (error) {
    throw new ApiError(401, err?.message, "some error Ocuured");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;
  if (!commentId) {
    throw new ApiError(401, "Pls provide a commentID");
  }
  const updateCommentDetails = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },

    { new: true },
  );

  if (!updateCommentDetails) {
    throw new ApiError(401, "Comment not Found");
  }
  res
    .status(201)
    .json(
      new ApiResponse(
        200,
        updateCommentDetails,
        "Comments updated Successfully",
      ),
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(401, "Comment not found");
  }

  const deleteCommentDetails = await Tweet.findByIdAndDelete(CommentId);

  res.status(200).json(new ApiResponse(200, "Comment deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
