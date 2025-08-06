import { BadgeCheck, Heart, MessageCircle, Share2 } from "lucide-react";
import React, { useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";

function PostCard({ post }) {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const postWithHashtags = post.content.replace(
    /(#\w+)/g,
    '<span class="text-indigo-600">$1</span>'
  );

  const [likes, setLikes] = useState(post.likes_count || []);
  const currentUser = useSelector((state) => state.user.value);

  const handleLike = async () => {
    try {
      const { data } = await api.post(
        `/api/post/like`,
        { postId: post._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setLikes((prev) => {
          if (prev.includes(currentUser._id)) {
            return prev.filter((id) => id !== currentUser._id);
          } else {
            return [...prev, currentUser._id];
          }
        });
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl mx-auto">
      {/* user info */}
      <div
        onClick={() => navigate("/profile/" + post.user._id)}
        className="inline-flex items-center gap-3 cursor-pointer"
      >
        <img
          src={post.user.profile_picture}
          alt={post.user.full_name}
          className="w-10 h-10 rounded-full shadow object-cover"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-900">
              {post.user.full_name}
            </span>
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-gray-400 text-sm flex items-center gap-1">
            <span>@{post.user.user_name}</span>
            <span className="text-xs">•</span>
            <span>{moment(post.createdAt).fromNow()}</span>
          </div>
        </div>
      </div>

      {/* content */}
      {post.content && (
        <div
          className="text-gray-800 text-sm whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: postWithHashtags }}
        />
      )}

      {/* images */}
      {post?.image_url?.length > 0 && (
        <div
          className={`grid gap-2 ${
            post.image_url.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {post.image_url.map((img, index) => (
            <img
              key={index}
              src={img}
              alt="post"
              className={`w-full ${
                post.image_url.length === 1 ? "h-auto" : "h-60"
              } object-cover rounded-lg`}
            />
          ))}
        </div>
      )}

      {/* actions */}
      <div className="flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300">
        <div className="flex items-center gap-1">
          <Heart
            onClick={handleLike}
            className={`w-4 h-4 cursor-pointer ${
              likes.includes(currentUser._id) && "text-red-500 fill-red-500"
            }`}
          />
          <span>{likes.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4 cursor-pointer" />
          <span>{post.comments?.length || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <Share2 className="w-4 h-4 cursor-pointer" />
          <span>5</span>
        </div>
      </div>
    </div>
  );
}

export default PostCard;
