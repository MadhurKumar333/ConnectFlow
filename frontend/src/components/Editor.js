import React, { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import io from "socket.io-client";
import "./Editor.css";
import { useParams, useNavigate } from "react-router-dom";

const SOCKET_SERVER_URL = "http://localhost:5000";

const Editor = () => {
  const textareaRef = useRef(null);
  const [content, setContent] = useState("Loading...");
  const isRemoteUpdate = useRef(false);
  const socketRef = useRef(null);
  const { id: DOCUMENT_ID } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const TOKEN = sessionStorage.getItem("token");
    if (!TOKEN) {
      toast.error("You are not authenticated. Please login.");
      navigate("/");
      return;
    }

    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      autoConnect: false,
    });

    socketRef.current.connect();

    socketRef.current.emit("authenticate", TOKEN);

    socketRef.current.on("authenticated", () => {
      socketRef.current.emit("join-document", DOCUMENT_ID);
    });

    socketRef.current.on("authentication-error", (data) => {
      toast.error(data.message || "Authentication failed");
      socketRef.current.disconnect();
      navigate("/");
    });

    socketRef.current.on("document-updated", (data) => {
      // Only update if content is different
      if (data.content !== content) {
        isRemoteUpdate.current = true;
        setContent(data.content);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line
  }, [DOCUMENT_ID, navigate]);

  // Debounce function to limit the rate of emitting changes



const debounceEmitChange = useCallback(
  (() => {
    let timeout;
    return async (newContent) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        // 1. Emit socket event for real-time update
        if (socketRef.current) {
          socketRef.current.emit("document-change", { content: newContent });
        }

        // 2. Call REST API to persist the change
        const token = sessionStorage.getItem("token");
        try {
          const res = await fetch(`http://localhost:5000/api/documents/${DOCUMENT_ID}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content: newContent })
          });
          if (!res.ok) throw new Error("Failed to update document");
          // Optionally handle response
        } catch (err) {
          // Optionally show a toast or log error
          console.error(err);
        }
      }, 250); // 250ms debounce
    };
  })(),
  [DOCUMENT_ID]
);


  const handleEditorChange = (e) => {
    const newContent = e.target.value;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      setContent(newContent);
      return;
    }
    setContent(newContent);
    debounceEmitChange(newContent); // <-- MAKE SURE THIS IS NOT COMMENTED
  };

  const handleSave = () => {
    toast.success("Document saved!");
    // Optionally emit a save event or call an API here
  };

  // Always keep textarea focused after content update
  useEffect(() => {
    textareaRef.current?.focus();
  }, [content]);

  return (
    <div className="editor-bg">
      <div className="editor-panel">
        <div className="editor-header">
          <h2>Document Editor</h2>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleEditorChange}
          style={{
            width: "100%",
            height: "400px",
            fontSize: "1.1rem",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            resize: "vertical",
            outline: "none",
          }}
        />
      </div>
    </div>
  );
};

export default Editor;
