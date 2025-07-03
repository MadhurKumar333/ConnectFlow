import React, { useState } from "react";
import "./DashBoard.css";
import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";


const Dashboard = () => {
  // Dummy documents data
  const [documents, setDocuments] = useState([
    { id: 1, title: "Project Plan" },
    { id: 2, title: "Meeting Notes" },
    { id: 3, title: "Design Doc" },
  ]);
    
  const navigate = useNavigate();

  const handleCreate = () => {
    const newDoc = { id: documents.length + 1, title: `Untitled Document ${documents.length + 1}` };
      setDocuments([...documents, newDoc]);
      toast.info("New document created!");
  };

  const handleOpen = (id) => {
    navigate(`/editor/${id}`);
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-header">
        <h2>Your Documents</h2>
        <button className="create-btn" onClick={handleCreate}>+ New Document</button>
      </div>
      <div className="dashboard-cards">
        {documents.map(doc => (
          <div key={doc.id} className="doc-card">
            <div className="doc-title">{doc.title}</div>
            <button className="open-btn" onClick={() => handleOpen(doc.id)}>Open</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
