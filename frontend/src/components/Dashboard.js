import React, { useEffect, useState } from "react";
import "./DashBoard.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const navigate = useNavigate();


  const handleCreate = () => {
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      toast.error("Document name cannot be empty!");
      return;
    }
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newDocTitle, content: "" })
      });
      console.log(res)
      const newDoc = await res.json();
      setDocuments([...documents, newDoc]);
      toast.success(`New document created!`);
      setShowModal(false);
      setNewDocTitle("");
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleOpen = (id) => {
    navigate(`/editor/${id}`);
  };

  useEffect(() => {
    const fetchAllDocuments = async () => {
      const token = sessionStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/documents", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch documents");
        }

        const data = await res.json();
        console.log(data);
        setDocuments(data);
      } catch (err) {
        toast.error(err.message);
      }
    };

    fetchAllDocuments(); // Call the function here
  }, []); // Empty dependency array: runs only once on mount

  return (
    <div className="dashboard-bg">
      <div className="dashboard-header">
        <h2>Your Documents</h2>
        <button className="create-btn" onClick={handleCreate}>
          + New Document
        </button>
      </div>
      <div className="dashboard-cards">
        {documents?.map((doc) => (
          <div key={doc._id} className="doc-card">
            <div className="doc-title">{doc.title}</div>
            <button className="open-btn" onClick={() => handleOpen(doc._id)}>
              Open
            </button>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="modal-bg">
          <form className="modal" onSubmit={handleModalSubmit}>
            <h3>Name your document</h3>
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Enter document name"
              autoFocus
              required
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
