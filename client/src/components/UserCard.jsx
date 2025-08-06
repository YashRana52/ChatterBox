import React from "react";
import { MapPin, MessageCircle, Plus, UserPlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchUser } from "../features/user/userSlice";
import api from "../api/axios";

function UserCard({ user }) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.value);
  const handleFollow = async () => {
    try {
      const { data } = await api.post(
        "/api/user/follow",
        { id: user._id },

        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchUser(await getToken()));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  const handleConnectionRequest = async () => {
    if (currentUser.connections.includes(user._id)) {
      return navigate("/messages/" + user._id);
    }
    try {
      const { data } = await api.post(
        "/api/user/connect",
        { id: user._id },

        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const isFollowing = currentUser.following?.includes(user._id);
  const isConnected = currentUser.connections?.includes(user._id);

  return (
    <div
      className="w-full max-w-xs bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden flex flex-col justify-between"
      aria-label={`User card for ${user.full_name || "Unnamed user"}`}
    >
      <div className="p-5 flex flex-col items-center text-center gap-2">
        <div className="relative">
          <img
            src={user.profile_picture}
            alt={
              user.full_name ? `${user.full_name}'s profile` : "Profile picture"
            }
            className="rounded-full w-20 h-20 shadow-md object-cover"
          />
        </div>
        <div className="mt-1">
          <p className="text-lg font-semibold text-slate-800">
            {user.full_name || "Unnamed User"}
          </p>
          {user.username && (
            <p className="text-sm text-slate-500">@{user.username}</p>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-2 line-clamp-3">
          {user.bio || "No bio provided."}
        </p>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          {user.location && (
            <div className="flex items-center gap-1 overflow-hidden">
              <MapPin aria-hidden="true" className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{user.location}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            <span className="font-medium text-slate-800">
              {user.followers?.length || 0}
            </span>
            <span className="text-slate-600">
              follower{(user.followers?.length || 0) === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleFollow}
            aria-label={
              isFollowing
                ? `Unfollow ${user.full_name || user.username || "user"}`
                : `Follow ${user.full_name || user.username || "user"}`
            }
            disabled={isFollowing}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition active:scale-95 focus:outline-none focus:ring-2 ${
              isFollowing
                ? "bg-indigo-200 text-white cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            {isFollowing ? "Following" : "Follow"}
          </button>

          <button
            onClick={handleConnectionRequest}
            aria-label={
              isConnected
                ? `Message ${user.full_name || user.username || "user"}`
                : `Connect with ${user.full_name || user.username || "user"}`
            }
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 text-slate-700 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {isConnected ? (
              <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-105" />
            ) : (
              <Plus className="w-5 h-5 transition-transform group-hover:scale-105" />
            )}
            {isConnected ? "Message" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserCard;
