import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MapView from "./components/MapView";
import AdminPanel from "./components/AdminPanel";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import IncidentsPanel from "./pages/IncidentsPanel";
import UsersPanel from "./pages/UsersPanel";
import './components/Navbar.css';
import './pages/Auth.css';

export default function AppRouter() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/incidents" element={<IncidentsPanel />} />
        <Route path="/users" element={<UsersPanel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}
