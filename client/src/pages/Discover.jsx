import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import UserCard from "../components/UserCard";
import Loading from "../components/Loading";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "../features/user/userSlice";

function Discover() {
  const [input, setInput] = useState("");
  const [searched, setSearched] = useState(false);
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      setSearched(true);
      try {
        setUsers([]);
        setLoading(true);
        const { data } = await api.post(
          "/api/user/discover",
          { input },
          {
            headers: { Authorization: `Bearer ${await getToken()}` },
          }
        );
        data.success ? setUsers(data.users) : toast.error(data.message);
        setLoading(false);
      } catch (error) {
        toast.error(error.message);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    getToken().then((token) => dispatch(fetchUser(token)));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
            Discover People
          </h1>
          <p className="text-base text-slate-600">
            Connect with amazing people and grow your network
          </p>
        </div>

        {/* Search */}
        <div className="mb-10">
          <div className="relative max-w-xl mx-auto">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="text-slate-400 w-5 h-5" />
            </div>
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyUp={handleSearch}
              type="text"
              placeholder="Search by name, username, bio, or location..."
              aria-label="Search people"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      {/* User grid */}
      <div className="max-w-6xl mx-auto px-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-full max-w-xs bg-white rounded-xl shadow-md p-6 animate-pulse"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-slate-200 w-20 h-20" />
                  <div className="h-4 bg-slate-200 w-3/4 rounded" />
                  <div className="h-3 bg-slate-200 w-1/2 rounded mt-1" />
                  <div className="h-3 bg-slate-200 w-full rounded mt-2" />
                  <div className="flex gap-2 w-full mt-4">
                    <div className="flex-1 h-10 bg-slate-200 rounded" />
                    <div className="flex-1 h-10 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center">
            {searched ? (
              users.length > 0 ? (
                users.map((user) => <UserCard user={user} key={user._id} />)
              ) : (
                <p className="text-center w-full text-slate-600">
                  No results found for "{input}"
                </p>
              )
            ) : (
              <p className="text-center w-full text-slate-500">
                Please enter a search to find users.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Extra loading placeholder */}
      {loading && !users.length && <Loading height="40vh" />}
    </div>
  );
}

export default Discover;
