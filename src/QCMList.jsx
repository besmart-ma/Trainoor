import React from "react";
import "./QCMList.css";

const QCMList = ({ qcms, setEditingQcm, deleteQCM }) => {
  return (
    <div className="qcm-list">
      <h2>Liste des QCM</h2>
      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Catégorie</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {qcms.map((qcm) => (
            <tr key={qcm.id}>
              <td>{qcm.question}</td>
              <td>{qcm.category}</td>
              <td>
                <button onClick={() => setEditingQcm(qcm)}>Modifier</button>
                <button onClick={() => deleteQCM(qcm.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QCMList;
