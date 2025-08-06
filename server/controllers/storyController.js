import fs from "fs";
import imagekit from "../config/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/user.js";
import { inngest } from "../inngest/index.js";

// add user story

export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();

    const { content, media_type, background_color } = req.body;

    const media = req.file;
    let media_url = "";

    //upload media to imagket

    if (media_type === "image" || media_type === "video") {
      const fileBuffer = fs.readFileSync(media.path);

      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: media.originalname,
      });
      media_url = response.url;
    }
    //create story

    const story = await Story.create({
      user: userId,
      content,
      media_url,
      background_color,
    });
    // schedule story deletion after 24 hours

    await inngest.send({
      name: "app/story.delete",
      data: { storyId: story._id },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//get user story

export const getUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    // user connection and following

    const userIds = [...userId, ...user.connections, ...user.following];

    const stories = await Story.find({
      user: { $in: userIds },
    })
      .populate("user")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      stories,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};
