import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { isValidObjectId } from "mongoose"

const isUserOwnerofPlaylist = async (playlistId, userId) => {
  try {
    const playlist = await Playlist.findById(playlistId)

    if (!playlist || playlist?.owner.toString() !== userId.toString()) {
      return false
    }

    return true
  } catch (e) {
    throw new ApiError(400, e.message || "Playlist Not Found")
  }
}

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body

  if (!name || !description) {
    throw new ApiError(400, "Pls Provide full details")
  }
  try {
    const newPlaylist = await Playlist.create({
      name: name,
      description: description,
      owner: req.user?._id,
    })

    if (!newPlaylist) {
      throw new ApiError(400, "Playlist was not created")
    }

    return res
      .status(201)
      .json(new ApiResponse(200, newPlaylist, "Playlist created Successfully"))
  } catch (error) {
    throw new ApiError(400, error?.message, "some error occured")
  }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params
  try {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId!")
    }
    const user = await User.findById(userId)
    if (!user) {
      throw new ApiError(400, "No User Found")
    }

    const userPlaylist = await Playlist.aggregate([
      {
        $match: {
          owner: new Types.ObjectId(userId),
        },
      },

      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videos",
          pipeline: [
            {
              $sort: { createdAt: -1 },
            },
            {
              $limit: 1,
            },
            {
              $project: {
                thumbnail: 1,
              },
            },
          ],
        },
      },

      {
        $addFields: {
          playlistThumbnail: {
            $cond: {
              if: { $gt: [{ $size: "$videos" }, 0] },
              then: { $first: "$videos.thumbnail" },
              else: null,
            },
          },
        },
      },

      {
        $project: {
          name: 1,
          description: 1,
          playlistThumbnail: 1,
        },
      },
    ])

    if (userPlaylist.length == 0) {
      throw new ApiError(400, "No Playlist Found")
    }

    return res
      .status(201)
      .json(
        new ApiResponse(200, { userPlaylist }, "Playlist fetched successfully"),
      )
  } catch (error) {
    res
      .status(400)
      .json(new ApiResponse(400, error?.message, "Some Error Occurred"))
  }
})

// const getPlaylistById = asyncHandler(async (req, res) => {
//   try {
//     const { playlistId } = req.params;
//     //TODO: get playlist by id

//     if (!isValidObjectId(playlistId)) {
//       throw new ApiError(404, "pls provide Playlist Id");
//     }
//     const playlist = await Playlist.findById(playlistId);

//     if (!playlist) {
//       throw new ApiError(404, "No playlists found");
//     }

//     return res
//       .status(201)
//       .json(new ApiResponse(200, playlist, "Playlists fetched successfully"));
//   } catch (error) {
//     throw new ApiError(404, error?.message, "Some Error Occured");
//   }
// });

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Pls Provide a Valid PlaylistId")
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(playlistId),
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
  ])

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist: playlist[0] },
        "Playlist fetched successfully",
      ),
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId!")
  }
  const userOwner = await isUserOwnerofPlaylist(playlistId, req.user?._id)
  if (!userOwner) {
    throw new ApiError(300, "Unauthorized Access")
  }
  const playlist = await Playlist.findById(playlistId)
  if (!playlist) {
    throw new ApiError(404, "Playlist not found!")
  }
  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(401, "No Videos found with this ID")
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already in the playlist!")
  }

  const addedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }, //Returns updated document after the update
  )
  if (!addedPlaylist) {
    throw new ApiError(500, "Unable to add the video to the playlist")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        addedPlaylist,
        "Video Successfully Added To Playlist",
      ),
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params
  // TODO: remove video from playlist
  try {
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid playlistId or videoId!")
    }

    const userOwner = await isUserOwnerofPlaylist(playlistId, req.user?._id)
    if (!userOwner) {
      throw new ApiError(300, "Unauthorized Access")
    }

    const video = await Video.findById(videoId)

    if (!video) {
      throw new ApiError(400, "NO videos Found")
    }

    const deleteVideo = await Playlist.findByIdAndUpdate(
      playlistId,
      { $pull: { videos: videoId } },
      { new: true },
    )

    if (!deleteVideo) {
      throw new ApiError(500, "Unable to delete the video to the playlist")
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Video Successfully Deleted from Playlist"),
      )
  } catch (e) {
    throw new ApiError(404, e?.message, "unable to delte videos from playlist")
  }
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  // TODO: delete playlist

  try {
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlistId!")
    }

    const userOwner = await isUserOwnerofPlaylist(playlistId, req.user?._id)
    if (!userOwner) {
      throw new ApiError(300, "unauthorized access")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if (!playlist) {
      throw new ApiError(400, "Playlist not found")
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Playlist Deleted Successfully"))
  } catch (error) {
    throw new ApiError(400, error?.message, "Unable to delete Playlist")
  }
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body
  //TODO: update playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId!")
  }

  if (!name || !description) {
    throw new ApiError(400, "Pls Provide the details to update")
  }

  const userOwner = await isUserOwnerofPlaylist(playlistId, req.user?._id)
  // console.log(userOwner);

  if (!userOwner) {
    throw new ApiError(300, "unauthorized access")
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true },
  )

  if (!updatedPlaylist) {
    throw new ApiError(500, "Unable to update the Playlist")
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully"),
    )
})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
}
