import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MapView from "./components/MapView";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import IncidentReport from "./pages/IncidentReport";
import './components/Navbar.css';
import './pages/Auth.css';

export default function AppRouter() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/report" element={<IncidentReport />} />
      </Routes>
    </Router>
  );
}
