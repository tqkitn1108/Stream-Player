import React from "react";
import { Routes, Route } from "react-router-dom";
import VideoList from "./components/VideoList";
import VideoPlayer from "./components/VideoPlayer";
import VideoUpload from "./components/VideoUpload";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<VideoList />} />
        <Route path="/video/:videoId" element={<VideoPlayer />} /> 
        <Route path="/live/:channelId" element={<VideoPlayer />} />
        <Route path="/upload" element={<VideoUpload />} />
      </Routes>
    </div>
  );
}

export default App;