import imagekit from "../config/imageKit.js";
import { inngest } from "../inngest/index.js";
import Connection from "../models/Connections.js";
import Post from "../models/Post.js";
import User from "../models/user.js";
import fs from "fs";

// get user data using userId
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "user not found",
      });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

// update user data
export const updateUserData = async (req, res) => {
  try {
    const { userId } = req.auth();

    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId);
    if (!tempUser) {
      return res.json({
        success: false,
        message: "user not found",
      });
    }

    // if username not provided
    if (!username) {
      username = tempUser.username;
    } else if (username !== tempUser.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        // agar username already liya hua hai to purana hi rakho
        username = tempUser.username;
      }
    }

    const updatedData = {
      username,
      bio: bio !== undefined ? bio : tempUser.bio,
      location: location !== undefined ? location : tempUser.location,
      full_name: full_name !== undefined ? full_name : tempUser.full_name,
    };

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          {
            quality: "auto",
          },
          {
            format: "webp",
          },
          {
            width: "512",
          },
        ],
      });
      updatedData.profile_picture = url;
    }

    // cover photo upload
    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          {
            quality: "auto",
          },
          {
            format: "webp",
          },
          {
            width: "1280",
          },
        ],
      });
      updatedData.cover_photo = url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    res.json({
      success: true,
      user,
      message: "profile updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//find users using username email password
export const DiscoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth();

    const { input } = req.body;

    // regex banate hain case-insensitive search ke liye
    const regex = new RegExp(input, "i");

    const allUsers = await User.find({
      $or: [
        { username: regex },
        { email: regex },
        { full_name: regex },
        { location: regex },
      ],
    });

    // khud ke user ko hata dena result se
    const filteredUsers = allUsers.filter(
      (user) => user._id.toString() !== userId.toString()
    );

    res.json({
      success: true,
      users: filteredUsers,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//follow user

export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth();

    const { id } = req.body; //jis ko follow krna uski id
    if (userId === id) {
      return res.json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const user = await User.findById(userId);
    if (user.following.includes(id)) {
      return res.json({
        success: false,
        message: "you are already following this user",
      });
    }
    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    if (!toUser) {
      return res.json({ success: false, message: "User to follow not found" });
    }
    toUser.followers.push(userId); //jisko follow kiya uske followres mai id dal di apni
    await toUser.save();

    res.json({ success: true, message: "Now you are folllwing this user" });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//unfollow user
export const unFollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();

    const { id } = req.body; //jis ko follow krna uski id
    if (userId === id) {
      return res.json({
        success: false,
        message: "You cannot unfollow yourself",
      });
    }

    const user = await User.findById(userId);
    user.following = user.following.filter((user) => user !== id);

    await user.save();

    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter((user) => user !== userId);

    await toUser.save();

    res.json({ success: true, message: "Now you are unfolllwing this user" });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//send connection request

export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    if (id === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send connection request to yourself.",
      });
    }

    // check kro  ki user ne last 24 hour mai 20+ connection request to nhi bhej di

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const connectionRequest = await Connection.find({
      from_user_id: userId,
      created_at: { $gt: last24Hours },
    });

    if (connectionRequest.length >= 20) {
      return res.json({
        success: false,
        message:
          "You have send more then 20 connection request in last 24 hours",
      });
    }
    //check user are already connected

    const connection = await Connection.findOne({
      $or: [
        {
          from_user_id: userId,
          to_user_id: id,
        },
        {
          from_user_id: id,
          to_user_id: userId,
        },
      ],
    });

    if (!connection) {
      const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      });

      // trigger inngest
      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });
      return res.json({
        success: true,
        message: "Connection request send successfully",
      });
    } else if (connection && connection.status === "accepted") {
      return res.json({
        success: false,
        message: "you are already connected with this user",
      });
    }
    return res.json({
      success: false,
      message: "connection request pending",
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//get user connections

export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate(
      "connections followers following"
    );

    const connections = user.connections;
    const followers = user.followers;
    const following = user.following;

    const pendingConnections = (
      await Connection.find({ to_user_id: userId, status: "pending" }).populate(
        "from_user_id"
      )
    ).map((connection) => connection.from_user_id);

    res.json({
      success: true,
      connections,
      followers,
      following,
      pendingConnections,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//accept connections request

export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
    });
    if (!connection) {
      return res.json({
        success: false,
        message: "Connection not found",
      });
    }
    const user = await User.findById(userId);
    user.connections.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.connections.push(userId);
    await toUser.save();

    connection.status = "accepted";
    await connection.save();
    res.json({
      success: true,
      message: "Connection accepted successfully",
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//get user profile

export const getUserProfiles = async (req, res) => {
  try {
    const { profileId } = req.body;

    const profile = await User.findById(profileId);

    if (!profile) {
      return res.json({
        success: false,
        message: "Profile not found",
      });
    }
    const posts = await Post.find({ user: profileId }).populate("user");
    res.json({
      success: true,
      profile,
      posts,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};
