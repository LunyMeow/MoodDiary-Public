import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewDiary from "./pages/NewDiary";
import EditDiary from "./pages/EditDiary";
import Profile from "./pages/Profile";
import ThemeToggle from "./components/ThemeToggle";
import UserProfile from "./pages/UserProfile";
import UserRelations from "./pages/UserRelationships";
import UserSearch from "./pages/UserSearch";
import Index from "./pages/Index";
import MyInterests from "./pages/MyInterests";
import CommunityStories from "./pages/CommunityStories";

import { initializeFirebase } from "./services/firebase";

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeFirebase().then(() => setReady(true));
  }, []);

  if (!ready) return <div>Firebase yükleniyor...</div>;

  return (
    <Router>
      <div className="relative min-h-screen">
        <div className="fixed bottom-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Routes>
          <Route path="/" element={<Index/>}/>
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/NewDiary" element={<NewDiary />} />
          <Route path="/edit/:id" element={<EditDiary />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/User/:username" element={<UserProfile />} />
          <Route path="/UserRelations" element={<UserRelations/>} />
          <Route path="/UserSearch" element={<UserSearch />} />
          <Route path="/MyInterests" element={<MyInterests/>}></Route>
          <Route path="/CommunityStories" element={<CommunityStories/>}></Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
