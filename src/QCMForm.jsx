import React, { useState, useEffect } from "react";
import "./QCMForm.css";

const QCMForm = ({ addQCM, updateQCM, editingQcm, setEditingQcm }) => {
  const [qcmData, setQcmData] = useState({
    question: "",
    options: "",
    correct: "",
    category: "",
  });

  useEffect(() => {
    if (editingQcm) {
      setQcmData(editingQcm);
    } else {
      setQcmData({ question: "", options: "", correct: "", category: "" });
    }
  }, [editingQcm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedQcm = { ...qcmData, options: qcmData.options.split(",") };
    
    if (editingQcm) {
      updateQCM(formattedQcm);
    } else {
      addQCM(formattedQcm);
    }
    setQcmData({ question: "", options: "", correct: "", category: "" });
    setEditingQcm(null);
  };

  return (
    <div className="qcm-form">
      <h2>{editingQcm ? "Modifier un QCM" : "Ajouter un QCM"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Question"
          value={qcmData.question}
          onChange={(e) => setQcmData({ ...qcmData, question: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Options"
          value={qcmData.options}
          onChange={(e) => setQcmData({ ...qcmData, options: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Réponse correcte"
          value={qcmData.correct}
          onChange={(e) => setQcmData({ ...qcmData, correct: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Catégorie"
          value={qcmData.category}
          onChange={(e) => setQcmData({ ...qcmData, category: e.target.value })}
          required
        />
        <button type="submit">{editingQcm ? "Mettre à jour" : "Ajouter"}</button>
      </form>
    </div>
  );
};

export default QCMForm;
