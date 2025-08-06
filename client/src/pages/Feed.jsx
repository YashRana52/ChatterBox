import React, { useEffect, useState } from "react";

import Loading from "../components/Loading";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RecentMessages from "../components/RecentMessages";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { assets } from "../assets/assets";

function Feed() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("api/post/feed", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setFeeds(data.posts);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeeds();
  }, []);
  return !loading ? (
    <div className="h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8">
      {/* storie and post */}

      <div>
        <StoriesBar />
        <div className="p-4 space-y-6">
          {feeds.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
      {/* right sidebar */}
      <div className="max-xl:hidden sticky top-0">
        <div className="max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow">
          <h3 className="text-slate-800 font-semibold">About Me</h3>

          {/* Image properly sized */}
          <img
            className="w-full h-40 object-cover rounded-md"
            src={assets.yash}
            alt="Profile"
          />

          <p className="text-slate-500 font-medium">MERN Developer</p>

          <p className="text-slate-400">
            Hi, I'm Yash Rana – a passionate MERN stack developer. I specialize
            in building modern, fast, and responsive web applications using
            MongoDB, Express, React, and Node.js.
          </p>
        </div>

        <RecentMessages />
      </div>
    </div>
  ) : (
    <Loading />
  );
}

export default Feed;
