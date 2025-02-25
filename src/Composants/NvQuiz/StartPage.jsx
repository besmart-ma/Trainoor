import React, { useState } from "react";
import NvQuiz from "./NvQuiz";
import "./NvQuiz.css";
import "./StartPage.css";


const StartPage = () => {
  const [quizStarted, setQuizStarted] = useState(false);

  if (quizStarted) return <NvQuiz />;

  return (
    <div className="start-container">
      <div className="start-box">
        <h2>Bienvenue dans le Quiz !</h2>
        <p>Instructions :</p>
        <ul>
          <li>Vous avez 7 minutes pour terminer le quiz.</li>
          <li>Les questions peuvent être à choix unique, multiple ou textuelles.</li>
          <li>Une bonne réponse augmente votre score.</li>
          <li>Bonne chance !</li>
        </ul>
        <button className="start-btn" onClick={() => setQuizStarted(true)}>Start</button>
      </div>
    </div>
  );
  
};

export default StartPage;
