"use client";

import { CheckCircle2, RotateCcw, Volume2 } from "lucide-react";
import { usePracticeStore } from "@/stores/practice-store";

const choices = [
  { id: "A", text: "The woman is reviewing a report." },
  { id: "B", text: "The woman is watering a plant." },
  { id: "C", text: "The woman is booking a flight." },
  { id: "D", text: "The woman is opening a window." }
] as const;

export function PracticeDemo() {
  const selectedChoice = usePracticeStore((state) => state.selectedChoice);
  const isSubmitted = usePracticeStore((state) => state.isSubmitted);
  const selectChoice = usePracticeStore((state) => state.selectChoice);
  const submit = usePracticeStore((state) => state.submit);
  const reset = usePracticeStore((state) => state.reset);

  return (
    <article className="practice-panel">
      <div className="practice-header">
        <div>
          <span className="practice-label">Part 2 demo</span>
          <h3>Question response</h3>
        </div>
        <button className="icon-button" type="button" onClick={reset} title="Làm lại">
          <RotateCcw size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="audio-bar" aria-label="Audio preview placeholder">
        <button className="audio-button" type="button" title="Play audio">
          <Volume2 size={20} aria-hidden="true" />
        </button>
        <div className="waveform" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, index) => (
            <span key={index} style={{ height: `${18 + (index % 5) * 9}px` }} />
          ))}
        </div>
        <span className="audio-time">00:24</span>
      </div>

      <p className="question-text">
        Choose the best response to the question you hear.
      </p>

      <div className="choice-list">
        {choices.map((choice) => {
          const isSelected = selectedChoice === choice.id;
          const isCorrect = isSubmitted && choice.id === "A";

          return (
            <button
              className={`choice-button ${isSelected ? "selected" : ""} ${
                isCorrect ? "correct" : ""
              }`}
              key={choice.id}
              type="button"
              onClick={() => selectChoice(choice.id)}
            >
              <span>{choice.id}</span>
              {choice.text}
            </button>
          );
        })}
      </div>

      {isSubmitted ? (
        <div className="answer-state">
          <CheckCircle2 size={18} aria-hidden="true" />
          Đáp án đúng là A. Sau này phần này sẽ lấy explanation từ API.
        </div>
      ) : null}

      <button
        className="submit-button"
        type="button"
        disabled={!selectedChoice}
        onClick={submit}
      >
        Kiểm tra đáp án
      </button>
    </article>
  );
}
