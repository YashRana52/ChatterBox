import React, { useEffect, useState } from "react";

import { Plus } from "lucide-react";
import moment from "moment";
import StoryModel from "./StoryModel";
import StoryViewer from "./StoryViewer";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";

function StoriesBar() {
  const { getToken } = useAuth();

  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);

  const fetchStories = async () => {
    try {
      const token = await getToken();

      const { data } = await api.get("/api/story/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setStories(data.stories);
        console.log("Fetched Data:", data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className="w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4">
      <div className="flex gap-4 pb-5">
        {/* Add stories Card */}
        <div
          onClick={() => setShowModal(true)}
          className="
    rounded-lg shadow-sm
    w-[120px] max-w-[120px] aspect-[3/4]
    cursor-pointer
    border-2 border-dashed border-indigo-300
    bg-gradient-to-b from-indigo-50 to-white
    hover:from-indigo-100 hover:scale-105
    transition-transform duration-200 ease-in-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
  "
        >
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="size-10 bg-indigo-500 rounded-full flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-slate-700 text-center">
              Create Stories
            </p>
          </div>
        </div>

        {/* Stories card */}
        {stories.map((story, index) => {
          const key = story.id ?? index;
          return (
            <div
              onClick={() => setViewStory(story)}
              key={key}
              className={`
                relative rounded-lg shadow min-w-30 max-w-30 max-h-40 cursor-pointer
                hover:shadow-lg transition-all duration-200
                bg-gradient-to-b from-indigo-500 to-purple-600
                hover:from-indigo-700 hover:to-purple-800 active:scale-95
                overflow-hidden
              `}
            >
              {/* User image */}
              <img
                src={story.user.profile_picture}
                alt={`${story.user.name || "User"} profile`}
                className="absolute size-8 top-3 left-3 z-10 rounded-full ring ring-gray-100 shadow"
              />

              {/*  text */}
              <p className="absolute top-18 left-3 text-white/60 text-sm truncate max-w-24">
                {story.content}
              </p>

              {story.media_type !== "text" && (
                <>
                  <div className="absolute inset-0 z-0 bg-black/30 rounded-lg" />

                  {/* Media */}
                  {story.media_type === "image" ? (
                    <img
                      src={story.media_url}
                      alt="story media"
                      className="relative h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80"
                    />
                  ) : (
                    <video
                      src={story.media_url}
                      className="relative h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80"
                      muted
                      playsInline
                      loop
                    />
                  )}

                  {/* Timestamp */}
                  <p className="text-white absolute bottom-1 right-2 z-10 text-xs">
                    {moment(story.createdAt).fromNow()}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
      {/* Add Story model */}
      {showModal && (
        <StoryModel setShowModal={setShowModal} fetchStories={fetchStories} />
      )}

      {/* view story */}
      {viewStory && (
        <StoryViewer viewStory={viewStory} setViewStory={setViewStory} />
      )}
    </div>
  );
}

export default StoriesBar;
