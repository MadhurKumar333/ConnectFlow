import React, { useState } from "react";
import "./DashBoard.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [documents, setDocuments] = useState([
    { id: 1, title: "Project Plan" },
    { id: 2, title: "Meeting Notes" },
    { id: 3, title: "Design Doc" },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const navigate = useNavigate();

  const handleCreate = () => {
    setShowModal(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      toast.error("Document name cannot be empty!");
      return;
    }
    const newDoc = { id: Date.now(), title: newDocTitle };
    setDocuments([...documents, newDoc]);
    toast.info(`New document "${newDocTitle}" created!`);
    setShowModal(false);
    setNewDocTitle("");
  };

  const handleOpen = (id) => {
    navigate(`/editor/${id}`);
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-header">
        <h2>Your Documents</h2>
        <button className="create-btn" onClick={handleCreate}>
          + New Document
        </button>
      </div>
      <div className="dashboard-cards">
        {documents.map((doc) => (
          <div key={doc.id} className="doc-card">
            <div className="doc-title">{doc.title}</div>
            <button className="open-btn" onClick={() => handleOpen(doc.id)}>
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
