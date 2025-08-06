import React, { useEffect, useRef, useState } from "react";

import { ImageIcon, SendHorizonal } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import {
  addMessage,
  fetchMessages,
  resetMessages,
} from "../features/messages/messagesSlice";
import toast from "react-hot-toast";

function ChatBox() {
  const { messages } = useSelector((state) => state.messages);
  const { userId } = useParams();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const [text, setText] = useState(null);
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);

  const connections = useSelector((state) => state.connections.connections);

  const messageEndRef = useRef(null);

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async () => {
    try {
      if (!text && !image) return;

      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text);
      image && formData.append("image", image);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setText("");
        setImage(null);
        dispatch(addMessage(data.message));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  useEffect(() => {
    if (messages.length === 0) {
      fetchUserMessages();
    }
    return () => {
      dispatch(resetMessages());
    };
  }, [userId]);

  useEffect(() => {
    if (connections.length > 0) {
      const user = connections.find((connection) => connection._id === userId);
      setUser(user);
    }
  }, [connections, userId]);
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
          <div className="flex items-center gap-4 px-4 py-3 bg-white w-full max-w-2xl mx-auto border border-gray-300 shadow-md rounded-2xl">
            {/* Image Preview / Upload */}
            <label htmlFor="image" className="cursor-pointer relative">
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  className="h-10 w-10 rounded-md object-cover border border-gray-300"
                  alt="preview"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-500 hover:text-indigo-600 transition" />
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>

            {/* Message Input */}
            <input
              type="text"
              className="flex-1 outline-none text-slate-700 placeholder-gray-400 bg-transparent text-sm sm:text-base"
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onChange={(e) => setText(e.target.value)}
              value={text}
            />

            {/* Send Button */}
            <button
              onClick={sendMessage}
              className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 transition shadow-sm"
            >
              <SendHorizonal size={20} className="text-indigo-600" />
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export default ChatBox;
