import { BadgeCheck, X } from "lucide-react";
import React, { useEffect, useState } from "react";

function StoryViewer({ viewStory, setViewStory }) {
  const handleClose = () => {
    setViewStory(null);
  };

  const [progress, setProgress] = useState(0);
  if (!viewStory) {
    return null;
  }

  const renderContent = () => {
    switch (viewStory.media_type) {
      case "image":
        return (
          <img
            src={viewStory.media_url}
            alt=""
            className="max-w-full max-h-screen object-contain"
          />
        );
      case "video":
        return (
          <video
            onEnded={() => setViewStory(null)}
            src={viewStory.media_url}
            className=" max-h-screen "
            controls
            autoPlay
          />
        );
      case "text":
        return (
          <div className="w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center">
            {viewStory.content}
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    let timer, progressInterval;
    if (viewStory && viewStory.media_type !== "vedio") {
      setProgress(0);

      const duration = 10000;
      const setTime = 100;
      let nikalgyatime = 0;
      progressInterval = setInterval(() => {
        nikalgyatime += setTime;
        setProgress((nikalgyatime / duration) * 100);
      }, setTime);
      //close story after timeout
      timer = setTimeout(() => {
        setViewStory(null);
      }, duration);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [viewStory, setViewStory]);
  return (
    <div
      className="fixed inset-0 h-screen bg-black bg-opacity-90 z-110 flex items-center justify-center"
      style={{
        backgroundColor:
          viewStory.media_type === "text"
            ? viewStory.background_color
            : "#000000",
      }}
    >
      {/* progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
        <div
          className="h-full bg-white transition-all duration-100 linear "
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {/* user info -top left */}
      <div className="absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop:blur-2xl rounded bg-black/50">
        <img
          src={viewStory.user?.profile_picture}
          alt=""
          className="size-7 sm:size-8 rounded-full object-cover border border-white"
        />
        <div className="text-white font-medium flex items-center gap-1.5">
          <span>{viewStory.user?.full_name}</span>
          <BadgeCheck size={18} />
        </div>
      </div>
      {/* close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none"
      >
        <X className="w-8 h-8 hover:scale-110 transition cursor-pointer" />
      </button>
      {/* Content wrapper */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"></div>
      {renderContent()}
    </div>
  );
}

export default StoryViewer;
