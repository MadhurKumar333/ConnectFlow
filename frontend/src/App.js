import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Editor from "./components/Editor";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ProtectedRoute component
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("token") !== null;
  // return isAuthenticated ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <Navbar />
      <ToastContainer position="top-center" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <Dashboard />
          }
        />
        <Route
          path="/editor/:id"
          element={
              <Editor />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
