import React, { useState, useEffect } from "react";

import { Pencil } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { updateUser } from "../features/user/userSlice";

function ProfileModel({ setShowEdit }) {
  const user = useSelector((state) => state.user.value);
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const [editForm, setEditForm] = useState({
    username: user.username,
    bio: user.bio || "",
    location: user.location || "",
    profile_picture: null,
    cover_photo: null,
    full_name: user.full_name,
  });

  const [profilePreview, setProfilePreview] = useState(user.profile_picture);
  const [coverPreview, setCoverPreview] = useState(user.cover_photo);

  useEffect(() => {
    if (editForm.profile_picture) {
      const url = URL.createObjectURL(editForm.profile_picture);
      setProfilePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setProfilePreview(user.profile_picture);
    }
  }, [editForm.profile_picture, user.profile_picture]);

  useEffect(() => {
    if (editForm.cover_photo) {
      const url = URL.createObjectURL(editForm.cover_photo);
      setCoverPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCoverPreview(user.cover_photo);
    }
  }, [editForm.cover_photo, user.cover_photo]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const userData = new FormData();
      const {
        full_name,
        username,
        bio,
        profile_picture,
        cover_photo,
        location,
      } = editForm;

      userData.append("username", username);
      userData.append("bio", bio);
      userData.append("location", location);
      userData.append("full_name", full_name);
      profile_picture && userData.append("profile", profile_picture);
      cover_photo && userData.append("cover", cover_photo);

      const token = await getToken();
      dispatch(updateUser({ userData, token }));

      setShowEdit(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-black/50 px-4 py-8">
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <button
              aria-label="Close"
              onClick={() => setShowEdit(false)}
              className="text-gray-500 hover:text-gray-700 rounded-full p-2 transition"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form
            className="px-6 pb-8 pt-4 space-y-6"
            onSubmit={(e) =>
              toast.promise(handleSaveProfile(e), { loading: "Saving..." })
            }
          >
            {/* Cover photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Photo
              </label>
              <div className="relative w-full rounded-xl overflow-hidden group bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
                <img
                  src={coverPreview || ""}
                  alt="cover preview"
                  className="w-full h-40 object-cover"
                  draggable={false}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full">
                    <Pencil className="w-4 h-4 text-gray-700" />
                    <span className="text-xs font-medium text-gray-700">
                      Change Cover
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      cover_photo: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />
              </div>
            </div>

            {/* Profile pic & basic info */}
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                <div className="relative w-24 h-24 mt-1 group">
                  <img
                    src={profilePreview || ""}
                    alt="profile preview"
                    className="w-24 h-24 rounded-full object-cover border ring-2 ring-white shadow-sm"
                    draggable={false}
                  />
                  <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 flex items-center justify-center border border-white group-hover:scale-110 transition">
                    <Pencil className="w-4 h-4 text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        profile_picture: e.target.files
                          ? e.target.files[0]
                          : null,
                      })
                    }
                  />
                </div>
              </div>

              {/* Name & Username */}
              <div className="flex-1 grid grid-cols-1 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-200 bg-white"
                    onChange={(e) =>
                      setEditForm({ ...editForm, full_name: e.target.value })
                    }
                    value={editForm.full_name}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-200 bg-white"
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    value={editForm.username}
                  />
                </div>
              </div>
            </div>

            {/* Bio & Location */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter your bio"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-200 resize-none bg-white"
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  value={editForm.bio}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter your location"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-200 bg-white"
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  value={editForm.location}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileModel;
