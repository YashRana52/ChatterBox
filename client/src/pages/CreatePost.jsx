import React, { useState } from "react";
import { dummyUserData } from "../assets/assets";
import { Image, X } from "lucide-react";

function CreatePost() {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = dummyUserData;

  const handleImageRemove = (idx) => {
    setImages((prev) => prev.filter((_, index) => index !== idx));
  };

  const handleSubmit = () => {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10">
      <div className="max-w-3xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-slate-900 mb-1 text-3xl font-bold">
            Create Post
          </h1>
          <p className="text-slate-600">Share your thoughts with the world</p>
        </div>

        {/* form */}
        <div className="w-full bg-white p-6 rounded-2xl shadow-lg space-y-6">
          {/* header */}
          <div className="flex items-center gap-4">
            <img
              src={user.profile_picture}
              alt={`${user.full_name}'s avatar`}
              className="w-12 h-12 rounded-full shadow"
            />
            <div>
              <h2 className="font-semibold text-slate-800">{user.full_name}</h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>

          {/* textarea */}
          <div>
            <textarea
              className="w-full resize-none min-h-[100px] max-h-60 mt-2 px-4 py-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-400"
              placeholder="What's happening?"
              onChange={(e) => setContent(e.target.value)}
              value={content}
              aria-label="Post content"
            />
          </div>

          {/* image previews */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {Array.from(images).map((image, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    className="h-24 w-24 object-cover rounded-md shadow-sm"
                    alt={`preview ${i + 1}`}
                  />
                  <div
                    onClick={() => handleImageRemove(i)}
                    className="absolute inset-0 bg-black/40 flex justify-center items-center rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    aria-label="Remove image"
                  >
                    <X className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* bottom bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label
              htmlFor="images"
              className="flex items-center gap-2 cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <Image className="w-5 h-5" aria-hidden="true" />
              Add Images
            </label>
            <input
              type="file"
              id="images"
              accept="image/*"
              hidden
              multiple
              onChange={(e) =>
                setImages((prev) => [...prev, ...Array.from(e.target.files)])
              }
            />

            <div className="flex-1" />

            <button
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && images.length === 0)}
              className="ml-auto inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Publish post"
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
