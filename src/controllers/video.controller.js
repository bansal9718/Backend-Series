import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const pipeline = [];
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId!");
  }
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(400, "Invalid User");
  }

  if (userId) {
    pipeline.push({
      $match: {
        owner: new Types.ObjecId(userId),
      },
    });
  }

  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }

  if (sortBy && sortType) {
    const sortTypeValue = sortType === "desc" ? -1 : 1;
    pipeline.push({
      $sort: { [sortBy]: sortTypeValue },
    });
  }

  //populate the owner

  pipeline.push({
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
  });
  pipeline.push({
    $addFields: {
      owner: {
        $first: "$owner",
      },
    },
  });

  const aggregate = Video.aggregate(pipeline);

  Video.aggregatePaginate(aggregate, { page, limit })
    .then(function (result) {
      return res
        .status(200)
        .json(new ApiResponse(200, { result }, "Fetched videos successfully"));
    })

    .catch(function (error) {
      throw error;
    });
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished = true } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (![title, description].every(Boolean)) {
    throw new ApiError(400, "All fields are required!");
  }

  //upload video and thumbnail on cloudinary
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video is missing!");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is missing!");
  }

  const videoFile = await uploadonCloudinary(videoFileLocalPath);
  const thumbnail = await uploadonCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "Failed to upload video!, try again");
  }

  if (!thumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail!, try again");
  }

  //save the video details in DB
  const video = await Video.create({
    videoFile: { key: videoFile?.public_id, url: videoFile?.url },
    thumbnail: { key: thumbnail?.public_id, url: thumbnail?.url },
    title,
    description,
    duration: videoFile?.duration,
    owner: req.user?._id,
    isPublished,
  });

  if (!video) {
    throw new ApiError(
      500,
      "Something went wrong while uploading video, try again",
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { video }, "Video uploaded successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new Types.ObjecID(videoId),
      },
    },

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
              email: 1,
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
  ]);

  if (!video) {
    throw new ApiError(404, "Video not find!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { video: video[0] }, "Video fetched successfully"),
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const thumbnailLocalPath = req.files?.path;

  const oldVideoDetails = await Video.findOne({ _id: videoId });

  if (!oldVideoDetails) {
    throw new ApiError(404, "Video not found!");
  }

  if (oldVideoDetails.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(300, "Unauthorized Access");
  }
  if (thumbnailLocalPath) {
    await deleteOnCloudinary(oldVideoDetails.thumbnail?.key);
  }

  //upload new thumbnail if it exists
  let thumbnail;
  if (thumbnailLocalPath) {
    thumbnail = await uploadonCloudinary(thumbnailLocalPath);
  }
  if (!thumbnail && thumbnailLocalPath) {
    throw new ApiError(500, "Failed to upload thumbnail!, please try again");
  }

  const updateFields = {
    $set: {
      title,
      description,
    },
  };

  if (thumbnail) {
    updateFields.$set.thumbnail = {
      key: thumbnail.public_id,
      url: thumbnail.url,
    };
  }
  const updatedVideo = await Video.findByIdAndUpdate(videoId, updateFields, {
    new: true,
  });

  if (!updatedVideo) {
    throw new ApiError(
      500,
      "Something went wrong while updating video details, try again",
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { updatedVideo }, "Video updated successfully!"),
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const existingVideo = await Video.findById(videoId);

  if (!existingVideo) {
    throw new ApiError(400, "No Video Found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(300, "Unauthorized Access");
  }
  // Delete video & thumbnail from cloudinary
  if (video.videoFile) {
    await deleteOnCloudinary(video.videoFile.key, "video");
  }

  if (video.thumbnail) {
    await deleteOnCloudinary(video.thumbnail.key);
  }
  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(400, "Video Deletion unsucessfull");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Deleted Succesfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "No video found");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Toggle public status successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
