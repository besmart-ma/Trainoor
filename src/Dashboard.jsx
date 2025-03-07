import React, { useState } from "react";
import QCMList from "./QCMList";
import QCMForm from "./QCMForm";
import "./Dashboard.css";

const Dashboard = () => {
  const [qcms, setQcms] = useState([
    { id: 1, question: "Quelle est la capitale du maroc ?", options: ["Alger", "Casablanca", "Rabat"], correct: "Rabat", category: "Géographie" },
    { id: 2, question: "En quelle année le maroc a été créé ?", options: ["1920", "1956", "788"], correct: "788", category: "Histoire" }
  ]);
  const [editingQcm, setEditingQcm] = useState(null);

  const addQCM = (newQCM) => {
    setQcms([...qcms, { ...newQCM, id: Date.now() }]);
  };

  const updateQCM = (updatedQCM) => {
    setQcms(qcms.map(qcm => qcm.id === updatedQCM.id ? updatedQCM : qcm));
  };

  const deleteQCM = (id) => {
    setQcms(qcms.filter(qcm => qcm.id !== id));
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">QCM Dashboard</h1>
      <QCMForm addQCM={addQCM} updateQCM={updateQCM} editingQcm={editingQcm} setEditingQcm={setEditingQcm} />
      <QCMList qcms={qcms} setEditingQcm={setEditingQcm} deleteQCM={deleteQCM} />
    </div>
  );
};

export default Dashboard;
