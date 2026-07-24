"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  VocabularyLearnSession,
  VocabularyMatchLeaderboard,
  VocabularyProgressStatus,
  VocabularyTerm,
  VocabularyTermProgress,
} from "@/lib/vocabulary";
import {
  clearVocabularyLearnSession,
  recordVocabularyTermAnswer,
  saveVocabularyLearnSession,
} from "@/lib/vocabulary-progress-client";
import {
  getAudioPreferences,
  playVocabularyAudio,
} from "@/lib/user-preferences";
import { MatchingSession } from "./learn-matching-session";
import {
  adaptiveModes,
  buildMeaningOptions,
  type LearnFeedback,
  nextProgressStatus,
  normalizeAnswer,
  progressRank,
  type QuestionMode,
  type SaveState,
  shuffle,
  studyModeMeta,
  type StudyMode,
} from "./learn-player-model";
import { LearnResult, LearnSessionView } from "./learn-session-view";
import { LearnSetup } from "./learn-setup";

type LearnPlayerProps = {
  terms: VocabularyTerm[];
  setSlug: string;
  initialProgress: VocabularyTermProgress[];
  initialLearnSession: VocabularyLearnSession | null;
  initialMatchLeaderboard: VocabularyMatchLeaderboard | null;
  progressPersistenceEnabled: boolean;
};

export function LearnPlayer({
  terms,
  setSlug,
  initialProgress,
  initialLearnSession,
  initialMatchLeaderboard,
  progressPersistenceEnabled,
}: LearnPlayerProps) {
  const orderedTerms = useMemo(
    () => [...terms].sort((first, second) => first.order - second.order),
    [terms],
  );
  const [progressByTerm, setProgressByTerm] = useState(
    () =>
      new Map<string, VocabularyProgressStatus>(
        initialProgress.map((item) => [item.termId, item.status]),
      ),
  );
  const [resumeCheckpoint, setResumeCheckpoint] =
    useState<VocabularyLearnSession | null>(() =>
      getValidResumeCheckpoint(initialLearnSession, orderedTerms),
    );
  const targetOptions = useMemo(
    () =>
      Array.from(new Set([10, 20, orderedTerms.length])).filter(
        (value) => value > 0 && value <= orderedTerms.length,
      ),
    [orderedTerms.length],
  );
  const [targetCount, setTargetCount] = useState(
    targetOptions[0] ?? orderedTerms.length,
  );
  const [studyMode, setStudyMode] = useState<StudyMode>("mixed");
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<VocabularyTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<LearnFeedback | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [correction, setCorrection] = useState("");
  const [correctionAccepted, setCorrectionAccepted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongTermIds, setWrongTermIds] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [checkpointState, setCheckpointState] = useState<SaveState>(() =>
    resumeCheckpoint ? "saved" : "idle",
  );
  const [announcement, setAnnouncement] = useState("");
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingSaves = useRef(0);
  const saveFailed = useRef(false);
  const checkpointQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingCheckpointSaves = useRef(0);
  const checkpointFailed = useRef(false);

  const currentTerm = queue[currentIndex];
  const completed = started && currentIndex >= queue.length;
  const combinedSaveState = combineSaveStates(saveState, checkpointState);
  const currentProgressStatus = currentTerm
    ? (progressByTerm.get(currentTerm.id) ?? "NEW")
    : "NEW";
  const mode = selectQuestionMode({
    feedback,
    studyMode,
    progressStatus: currentProgressStatus,
    currentIndex,
  });
  const options = useMemo(
    () => (currentTerm ? buildMeaningOptions(orderedTerms, currentTerm) : []),
    [currentTerm, orderedTerms],
  );
  const statementTerm = useMemo(
    () =>
      selectTrueFalseStatement(currentTerm, orderedTerms, mode, currentIndex),
    [currentIndex, currentTerm, mode, orderedTerms],
  );
  const statementIsTrue = statementTerm?.id === currentTerm?.id;

  const enqueueProgressSave = useCallback(
    (
      termId: string,
      correct: boolean,
      statusAfter: VocabularyProgressStatus,
    ) => {
      setProgressByTerm((current) => {
        const next = new Map(current);
        next.set(termId, statusAfter);
        return next;
      });
      if (!progressPersistenceEnabled) return;
      if (pendingSaves.current === 0) saveFailed.current = false;
      pendingSaves.current += 1;
      setSaveState("saving");

      const task = saveQueue.current.then(() =>
        recordVocabularyTermAnswer(setSlug, termId, correct),
      );
      saveQueue.current = task.then(
        () => undefined,
        () => undefined,
      );

      void task
        .then((savedProgress) => {
          setProgressByTerm((current) => {
            const next = new Map(current);
            next.set(termId, savedProgress.status);
            return next;
          });
          if (!savedProgress.reviewAccepted) {
            setAnnouncement(
              "Từ này đã có lịch ôn. Kết quả vẫn tính trong phiên Learn nhưng không cộng thêm tiến độ SRS.",
            );
          }
        })
        .catch(() => {
          saveFailed.current = true;
          setAnnouncement(
            "Chưa thể đồng bộ kết quả. Bạn vẫn có thể tiếp tục phiên Learn.",
          );
        })
        .finally(() => {
          pendingSaves.current -= 1;
          if (pendingSaves.current === 0) {
            setSaveState(saveFailed.current ? "error" : "saved");
          }
        });
    },
    [progressPersistenceEnabled, setSlug],
  );

  const enqueueCheckpointOperation = useCallback(
    (operation: () => Promise<unknown>, failureMessage: string) => {
      if (pendingCheckpointSaves.current === 0) {
        checkpointFailed.current = false;
      }
      pendingCheckpointSaves.current += 1;
      setCheckpointState("saving");

      const task = checkpointQueue.current.then(operation);
      checkpointQueue.current = task.then(
        () => undefined,
        () => undefined,
      );

      void task
        .catch(() => {
          checkpointFailed.current = true;
          setAnnouncement(failureMessage);
        })
        .finally(() => {
          pendingCheckpointSaves.current -= 1;
          if (pendingCheckpointSaves.current === 0) {
            setCheckpointState(checkpointFailed.current ? "error" : "saved");
          }
        });
    },
    [],
  );

  useEffect(() => {
    if (
      !progressPersistenceEnabled ||
      !started ||
      studyMode === "match" ||
      queue.length === 0
    ) {
      return;
    }

    const checkpointIndex =
      feedback && (feedback.correct || correctionAccepted)
        ? currentIndex + 1
        : currentIndex;
    const timeoutId = window.setTimeout(() => {
      if (checkpointIndex >= queue.length) {
        enqueueCheckpointOperation(
          () => clearVocabularyLearnSession(setSlug),
          "Chưa thể đóng checkpoint đã hoàn thành.",
        );
        return;
      }

      enqueueCheckpointOperation(
        () =>
          saveVocabularyLearnSession(setSlug, {
            studyMode,
            targetCount,
            queueTermIds: queue.map((term) => term.id),
            currentIndex: checkpointIndex,
            correctCount,
            wrongCount,
            wrongTermIds: [...wrongTermIds],
          }),
        "Chưa thể lưu checkpoint Learn. Tiến độ trả lời vẫn được giữ.",
      );
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [
    correctCount,
    correctionAccepted,
    currentIndex,
    enqueueCheckpointOperation,
    feedback,
    progressPersistenceEnabled,
    queue,
    setSlug,
    started,
    studyMode,
    targetCount,
    wrongCount,
    wrongTermIds,
  ]);

  const resumeLearnCheckpoint = useCallback(() => {
    if (!resumeCheckpoint) return;
    const termsById = new Map(orderedTerms.map((term) => [term.id, term]));
    const restoredQueue = resumeCheckpoint.queueTermIds
      .map((termId) => termsById.get(termId))
      .filter((term): term is VocabularyTerm => Boolean(term));
    if (
      restoredQueue.length !== resumeCheckpoint.queueTermIds.length ||
      resumeCheckpoint.currentIndex >= restoredQueue.length
    ) {
      setResumeCheckpoint(null);
      setAnnouncement("Checkpoint cũ không còn hợp lệ và đã được bỏ qua.");
      return;
    }

    setStudyMode(resumeCheckpoint.studyMode);
    setTargetCount(resumeCheckpoint.targetCount);
    setQueue(restoredQueue);
    setCurrentIndex(resumeCheckpoint.currentIndex);
    setCorrectCount(resumeCheckpoint.correctCount);
    setWrongCount(resumeCheckpoint.wrongCount);
    setWrongTermIds(new Set(resumeCheckpoint.wrongTermIds));
    resetAnswerState();
    setResumeCheckpoint(null);
    setStarted(true);
    setAnnouncement(
      `Đã tiếp tục từ câu ${resumeCheckpoint.currentIndex + 1} trên ${restoredQueue.length}.`,
    );
  }, [orderedTerms, resumeCheckpoint]);

  const discardLearnCheckpoint = useCallback(() => {
    setResumeCheckpoint(null);
    if (!progressPersistenceEnabled) return;
    enqueueCheckpointOperation(
      () => clearVocabularyLearnSession(setSlug),
      "Chưa thể xóa checkpoint Learn cũ.",
    );
  }, [enqueueCheckpointOperation, progressPersistenceEnabled, setSlug]);

  const startSession = useCallback(() => {
    const prioritizedTerms = shuffle(orderedTerms).sort(
      (first, second) =>
        progressRank[progressByTerm.get(first.id) ?? "NEW"] -
        progressRank[progressByTerm.get(second.id) ?? "NEW"],
    );
    setQueue(prioritizedTerms.slice(0, targetCount));
    setCurrentIndex(0);
    resetAnswerState();
    setCorrectCount(0);
    setWrongCount(0);
    setWrongTermIds(new Set());
    setResumeCheckpoint(null);
    setStarted(true);
    setAnnouncement(
      `Đã bắt đầu chế độ ${studyModeMeta[studyMode].label} với ${targetCount} từ.`,
    );
  }, [orderedTerms, progressByTerm, studyMode, targetCount]);

  const finishAnswer = useCallback(
    (correct: boolean, answer: string) => {
      if (!currentTerm || feedback) return;
      const statusAfter = nextProgressStatus(currentProgressStatus, correct);
      setFeedback({ correct, answer, statusAfter, mode });
      setCorrection("");
      setCorrectionAccepted(false);

      if (correct) {
        setCorrectCount((count) => count + 1);
        enqueueProgressSave(currentTerm.id, true, statusAfter);
        setAnnouncement(
          `Chính xác. ${currentTerm.term}: ${currentTerm.meaningVi}`,
        );
        return;
      }

      setWrongCount((count) => count + 1);
      setWrongTermIds((current) => new Set(current).add(currentTerm.id));
      setQueue((currentQueue) => {
        const nextQueue = [...currentQueue];
        const repeatAt = Math.min(currentIndex + 3, nextQueue.length);
        nextQueue.splice(repeatAt, 0, currentTerm);
        return nextQueue;
      });
      enqueueProgressSave(currentTerm.id, false, statusAfter);
      setAnnouncement(
        `Chưa chính xác. Hãy gõ lại từ ${currentTerm.term} để tiếp tục.`,
      );
    },
    [
      currentIndex,
      currentProgressStatus,
      currentTerm,
      enqueueProgressSave,
      feedback,
      mode,
    ],
  );

  function resetAnswerState() {
    setFeedback(null);
    setWrittenAnswer("");
    setCorrection("");
    setCorrectionAccepted(false);
  }

  function submitWrittenAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentTerm || !writtenAnswer.trim()) return;
    finishAnswer(
      normalizeAnswer(writtenAnswer) === normalizeAnswer(currentTerm.term),
      writtenAnswer,
    );
  }

  function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentTerm) return;
    const accepted =
      normalizeAnswer(correction) === normalizeAnswer(currentTerm.term);
    setCorrectionAccepted(accepted);
    setAnnouncement(
      accepted
        ? "Đã gõ đúng đáp án. Bạn có thể tiếp tục."
        : "Chưa khớp với đáp án. Hãy thử lại.",
    );
  }

  function nextQuestion() {
    if (!feedback || (!feedback.correct && !correctionAccepted)) return;
    setCurrentIndex((index) => index + 1);
    resetAnswerState();
  }

  const speakCurrentTerm = useCallback(() => {
    if (!currentTerm) return;
    if (currentTerm.audioUrl) {
      void playVocabularyAudio(currentTerm.audioUrl).catch(() =>
        setAnnouncement("Chưa thể phát audio của từ này."),
      );
      return;
    }
    if (!("speechSynthesis" in window)) {
      setAnnouncement("Trình duyệt chưa hỗ trợ phát âm tự động.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentTerm.term);
    utterance.lang = "en-US";
    const preferences = getAudioPreferences();
    utterance.rate = preferences.playbackRate;
    utterance.volume = preferences.volume;
    window.speechSynthesis.speak(utterance);
  }, [currentTerm]);

  useEffect(() => {
    if (
      !started ||
      !currentTerm ||
      (mode !== "listen" && mode !== "dictation") ||
      !getAudioPreferences().autoplay
    ) {
      return;
    }
    speakCurrentTerm();
  }, [currentIndex, currentTerm, mode, speakCurrentTerm, started]);

  if (!orderedTerms.length) {
    return (
      <div className="glass-card p-8 text-center text-sm text-white/60">
        Bộ từ này chưa có nội dung để tạo phiên Learn.
      </div>
    );
  }

  if (!started) {
    return (
      <LearnSetup
        termCount={orderedTerms.length}
        resumeCheckpoint={resumeCheckpoint}
        studyMode={studyMode}
        targetCount={targetCount}
        targetOptions={targetOptions}
        onStudyModeChange={setStudyMode}
        onTargetCountChange={setTargetCount}
        onResume={resumeLearnCheckpoint}
        onDiscardCheckpoint={discardLearnCheckpoint}
        onStart={startSession}
      />
    );
  }

  if (studyMode === "match") {
    return (
      <MatchingSession
        terms={queue}
        setSlug={setSlug}
        saveState={saveState}
        progressPersistenceEnabled={progressPersistenceEnabled}
        initialMatchLeaderboard={initialMatchLeaderboard}
        onMatch={(termId) => {
          const currentStatus = progressByTerm.get(termId) ?? "NEW";
          enqueueProgressSave(
            termId,
            true,
            nextProgressStatus(currentStatus, true),
          );
        }}
        onExit={() => setStarted(false)}
      />
    );
  }

  if (completed) {
    return (
      <LearnResult
        studyMode={studyMode}
        correctCount={correctCount}
        wrongCount={wrongCount}
        wrongTermCount={wrongTermIds.size}
        onRestart={() => setStarted(false)}
      />
    );
  }

  if (!currentTerm) return null;

  return (
    <LearnSessionView
      studyMode={studyMode}
      currentIndex={currentIndex}
      queueLength={queue.length}
      currentTerm={currentTerm}
      currentProgressStatus={currentProgressStatus}
      correctCount={correctCount}
      wrongCount={wrongCount}
      combinedSaveState={combinedSaveState}
      progressPersistenceEnabled={progressPersistenceEnabled}
      mode={mode}
      statementTerm={statementTerm}
      statementIsTrue={statementIsTrue}
      options={options}
      feedback={feedback}
      writtenAnswer={writtenAnswer}
      correction={correction}
      correctionAccepted={correctionAccepted}
      announcement={announcement}
      onSpeak={speakCurrentTerm}
      onWrittenAnswerChange={setWrittenAnswer}
      onSubmitWrittenAnswer={submitWrittenAnswer}
      onAnswer={finishAnswer}
      onCorrectionChange={setCorrection}
      onSubmitCorrection={submitCorrection}
      onNext={nextQuestion}
    />
  );
}

function getValidResumeCheckpoint(
  initialSession: VocabularyLearnSession | null,
  terms: VocabularyTerm[],
) {
  if (
    !initialSession ||
    initialSession.studyMode === "match" ||
    initialSession.currentIndex >= initialSession.queueTermIds.length
  ) {
    return null;
  }
  const availableTermIds = new Set(terms.map((term) => term.id));
  return initialSession.queueTermIds.every((termId) =>
    availableTermIds.has(termId),
  )
    ? initialSession
    : null;
}

function combineSaveStates(
  progressState: SaveState,
  checkpointState: SaveState,
): SaveState {
  if (progressState === "error" || checkpointState === "error") return "error";
  if (progressState === "saving" || checkpointState === "saving")
    return "saving";
  if (progressState === "saved" || checkpointState === "saved") return "saved";
  return "idle";
}

function selectQuestionMode({
  feedback,
  studyMode,
  progressStatus,
  currentIndex,
}: {
  feedback: LearnFeedback | null;
  studyMode: StudyMode;
  progressStatus: VocabularyProgressStatus;
  currentIndex: number;
}): QuestionMode {
  if (feedback) return feedback.mode;
  const modes =
    studyMode === "mixed"
      ? adaptiveModes[progressStatus]
      : studyMode === "match"
        ? adaptiveModes.NEW
        : [studyMode as QuestionMode];
  return modes[currentIndex % modes.length] ?? "multiple-choice";
}

function selectTrueFalseStatement(
  currentTerm: VocabularyTerm | undefined,
  orderedTerms: VocabularyTerm[],
  mode: QuestionMode,
  currentIndex: number,
) {
  if (!currentTerm || mode !== "true-false") return null;
  if (currentIndex % 2 === 0 || orderedTerms.length < 2) return currentTerm;
  const currentPosition = orderedTerms.findIndex(
    (term) => term.id === currentTerm.id,
  );
  return (
    orderedTerms[(currentPosition + 1) % orderedTerms.length] ?? currentTerm
  );
}
