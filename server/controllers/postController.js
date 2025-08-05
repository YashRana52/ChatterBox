import imagekit from "../config/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/user.js";
import fs from "fs";

//Add Post

export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files;
    let image_url = [];

    // Upload images if provided
    if (images && images.length) {
      image_url = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = fs.readFileSync(image.path);

          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: image.originalname,
            folder: "posts",
          });

          const url = imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1280" },
            ],
          });

          return url;
        })
      );
    }

    // Create post
    await Post.create({
      user: userId,
      content,
      image_url,
      post_type,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Error in addPost:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get post data
export const getFeedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    // user connection and following

    const userIds = [
      userId,
      ...(user.connections || []),
      ...(user.following || []),
    ];
    const posts = await Post.find({ user: { $in: userIds } })
      .populate("user")
      .sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// like post
export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (post.likes_count.includes(userId)) {
      //post unlike
      post.likes_count = post.likes_count.filter((user) => user !== userId);
      await post.save();

      res.json({
        success: true,
        message: "unlike post",
      });
      //like post
    } else {
      post.likes_count.push(userId);
      post.likes_count = [...new Set(post.likes_count)];
      await post.save();

      res.json({
        success: true,
        message: "like post",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
