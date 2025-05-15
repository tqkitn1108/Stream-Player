import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import VideoPlayer from "./components/VideoPlayer";
import VideoUpload from "./components/VideoUpload";
import Schedule from "./components/Schedule"; // Thêm import

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video/:videoId" element={<VideoPlayer />} />
        <Route path="/live/:channelId" element={<VideoPlayer />} />
        <Route path="/upload" element={<VideoUpload />} />
        <Route path="/schedule" element={<Schedule />} /> {/* Thêm route mới */}
      </Routes>
    </div>
  );
}

export default App;
