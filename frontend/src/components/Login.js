import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthForm.css";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Dummy validation and login simulation
    if (email === "user@example.com" && password === "password123") {
      toast.success("Login successful!");
      navigate("/dashboard");
    } else {
        toast.error("Invalid credentials. Try user@example.com / password123");
    }
  };

  return (
    <div className="auth-bg">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <div className="auth-switch">
          New here? <a href="/register">Register</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
