import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthForm.css";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Login successful.`);
          sessionStorage.setItem("token", data.token);
          navigate("/dashboard");
        } else {
          toast.error(data.message || "Login failed");
        }
      } catch (err) {
        console.log(err)
        toast.error("Server error. Try again.");
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
