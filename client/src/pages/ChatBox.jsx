import React, { useEffect, useRef, useState } from "react";
import { dummyMessagesData, dummyUserData } from "../assets/assets";
import { ImageIcon, SendHorizonal } from "lucide-react";

function ChatBox() {
  const messages = dummyMessagesData;
  const [text, setText] = useState(null);
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(dummyUserData);

  const messageEndRef = useRef(null);

  const sendMessage = async () => {};
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    user && (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300 shadow sticky top-0 z-10">
          <img
            src={user.profile_picture}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <p className="font-medium text-gray-800">{user.full_name}</p>
            <p className="text-xs text-gray-500 -mt-0.5">@{user.username}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-5 md:px-10 flex-1 overflow-y-auto">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages
              .toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    message.to_user_id !== user._id
                      ? "items-start"
                      : "items-end"
                  }`}
                >
                  <div
                    className={`p-3 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow-md relative ${
                      message.to_user_id !== user._id
                        ? "rounded-bl-none self-start"
                        : "rounded-br-none self-end"
                    }`}
                  >
                    {message.message_type === "image" && (
                      <img
                        src={message.media_url}
                        alt="media"
                        className="w-full rounded-md mb-2 object-cover"
                      />
                    )}
                    <p>{message.text}</p>
                    <div className="text-[10px] text-gray-400 mt-1 text-right">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-4 pb-6">
          <div className="flex items-center gap-3 pl-5 p-2 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">
            <input
              type="text"
              className="flex-1 outline-none text-slate-700 bg-transparent placeholder-gray-400 text-sm"
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onChange={(e) => setText(e.target.value)}
              value={text}
            />
            <label htmlFor="image" className="flex items-center">
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  className="h-8 w-8 rounded object-cover border"
                  alt="preview"
                />
              ) : (
                <ImageIcon className="w-7 h-7 text-gray-400 cursor-pointer" />
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>
            <button className="p-2 rounded-full hover:bg-indigo-100 transition">
              <SendHorizonal size={18} className="text-indigo-600" />
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export default ChatBox;
