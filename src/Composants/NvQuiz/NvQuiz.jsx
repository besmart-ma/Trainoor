import React, { useState, useEffect } from "react";
import "./NvQuiz.css";

const questions = [
  {
    type: "text",
    question: "Citez un seul pillier de SCRUM .",
    answer: ["Transparence" , "Inspection","Adaptation"],
  },
  {
    type: "single",
    question: "Quel est le pays le plus riche du monde ?",
    options: ["Etats unis", "Russie", "Chine", "France"],
    answer: ["Etats unis"],
  },
  {
    type: "multiple",
    question: "Quels sont des langages de programmation ?",
    options: ["JavaScript", "HTML", "Python", "CSS"],
    answer: ["JavaScript", "Python"],
  },
  {
    type: "text",
    question: "Quel est le pays Arabe le plus petit  ?",
    answer: ["Bahrein"],
  },
  {
    type: "single",
    question: "Quelle est la ville la plus populée du Maroc ?",
    options: ["Rabat", "Marrakech", "Fes", "Casablanca"],
    answer: ["Casablanca"],},
  { 
    type: "text",
    question: "Quel est le plus grand pays du monde ?",
    answer: ["Russie"],  },
{
    type: "multiple",
    question: "Quels sont les villes Maroccaines ici ?",
    options: ["Salé", "Tifflet", "Telmcen","Sanaa","Idleb","Oued Zem","Mossoul","Al Ramla","Temara"],
    answer: ["Tifflet", "Salé","Oued Zem","Temara"],
    },
];

const NvQuiz = () => {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState([]);
  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(420);

  const current = questions[index];

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const checkAnswer = () => {
    let isCorrect = false;

    if (current.type === "single") {
      isCorrect = selected[0] === current.answer[0];
    }
    if (current.type === "multiple") {
      const sortedSelected = selected.sort().join(",");
      const sortedAnswer = current.answer.sort().join(",");
      isCorrect = sortedSelected === sortedAnswer;
    }
    if (current.type === "text") {
      isCorrect = current.answer.some(ans => ans.toLowerCase() === text.toLowerCase().trim());
    }

    if (isCorrect) setScore(score + 1);
    nextQuestion();
  };

  const nextQuestion = () => {
    setIndex(index + 1);
    setSelected([]);
    setText("");
  };

  if (index >= questions.length || timeLeft <= 0) return (
    <div className="quiz-container">
      <h2 className="score">Quiz terminé ! </h2>
      <p>Score : {score} / {questions.length}</p>
      <button className="retry-btn" onClick={() => { 
        setIndex(0); 
        setScore(0); 
        setTimeLeft(420);
      }}>
        Rejouer
      </button>
    </div>
  );

  return (
    <div className="quiz-container">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${(index / questions.length) * 100}%` }}></div>
      </div>
      <h3 className="timer"> Temps restant : {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</h3>
      <h3 className="question">{current.question}</h3>

      {current.type === "single" && current.options.map(opt => (
        <button key={opt} className={`answer-btn ${selected.includes(opt) ? "selected" : ""}`} onClick={() => setSelected([opt])}>
          {opt}
        </button>
      ))}

      {current.type === "multiple" && current.options.map(opt => (
        <label key={opt} className="checkbox-container">
          <input type="checkbox" checked={selected.includes(opt)} onChange={() =>
            setSelected(prev => prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt])
          } />
          {opt}
        </label>
      ))}

      {current.type === "text" && (
        <input type="text" placeholder="Votre réponse..." value={text} onChange={(e) => setText(e.target.value)} className="text-input" />
      )}

      <button className="next-btn" onClick={checkAnswer}>Valider</button>
    </div>
  );
};

export default NvQuiz;

