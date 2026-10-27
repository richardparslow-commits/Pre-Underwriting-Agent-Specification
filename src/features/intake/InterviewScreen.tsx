import { useEffect, useRef } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Progress } from "@/components/ui/surface";
import { SECTIONS } from "@/features/interview/sections";
import { visibleQuestions } from "@/features/interview/engine";
import type { AnswerRecord, Answers, Question } from "@/features/interview/types";
import { cn } from "@/lib/utils";
import { CrisisPanel } from "./CrisisPanel";
import { QuestionCard } from "./QuestionCard";

interface InterviewScreenProps {
  answers: Answers;
  current: Question;
  crisis: boolean;
  prefilled?: boolean;
  onAnswer: (questionId: string, patch: Partial<AnswerRecord>) => void;
  onBack: () => void;
  onNext: () => void;
  onReview: () => void;
}

export function InterviewScreen({
  answers,
  current,
  crisis,
  prefilled,
  onAnswer,
  onBack,
  onNext,
  onReview,
}: InterviewScreenProps) {
  const headingRef = useRef<HTMLDivElement>(null);
  const questions = visibleQuestions(answers);
  const position = Math.max(1, questions.findIndex((question) => question.id === current.id) + 1);
  const total = questions.length;
  const answeredInSection = questions.filter(
    (question) =>
      question.section === current.section &&
      (answers[question.id]?.state !== undefined ||
        answers[question.id]?.value !== undefined ||
        (answers[question.id]?.values?.length ?? 0) > 0 ||
        Object.keys(answers[question.id]?.fields ?? {}).length > 0),
  ).length;
  const sectionQuestions = questions.filter((question) => question.section === current.section).length;
  const percent = total === 0 ? 0 : (position / total) * 100;

  // Move focus to the new question heading so screen-reader users hear it.
  useEffect(() => {
    headingRef.current?.focus();
  }, [current.id]);

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-5">
          <div>
            <p className="eyebrow">Sections</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {answeredInSection} of {sectionQuestions} in this section
            </p>
          </div>
          <ol className="space-y-1">
            {SECTIONS.map((section) => {
              const sectionQuestionsForId = questions.filter(
                (question) => question.section === section.id,
              );
              if (sectionQuestionsForId.length === 0) return null;
              const isCurrent = section.id === current.section;
              const done = sectionQuestionsForId.every(
                (question) =>
                  (answers[question.id]?.state !== undefined ||
                    answers[question.id]?.value !== undefined ||
                    (answers[question.id]?.values?.length ?? 0) > 0 ||
                    Object.keys(answers[question.id]?.fields ?? {}).length > 0),
              );

              return (
                <li key={section.id}>
                  <div
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "flex items-start gap-2.5 rounded-md px-2.5 py-2 text-sm",
                      isCurrent ? "bg-secondary font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[0.6rem]",
                        done
                          ? "border-ok/40 bg-ok/10 text-ok"
                          : isCurrent
                            ? "border-primary/40 text-foreground"
                            : "border-border",
                      )}
                      aria-hidden
                    >
                      {done ? "✓" : ""}
                    </span>
                    {section.shortTitle}
                  </div>
                </li>
              );
            })}
          </ol>
          <Button type="button" variant="outline" size="sm" onClick={onReview} className="w-full">
            <ClipboardCheck aria-hidden />
            Review my answers
          </Button>
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
            Your answers are held in this tab only. Closing it discards the interview.
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 space-y-2 lg:hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{SECTIONS.find((section) => section.id === current.section)?.title}</span>
            <span>
              {position} / {total}
            </span>
          </div>
          <Progress value={percent} label={`Question ${position} of ${total}`} />
        </div>

        <div className="mb-6 hidden items-center gap-3 lg:flex">
          <Progress value={percent} label={`Question ${position} of ${total}`} className="max-w-xs" />
          <span className="text-xs text-muted-foreground">
            {position} of {total}
          </span>
          {current.status === "core" ? <Badge tone="outline">Source questionnaire</Badge> : null}
        </div>

        <div className="space-y-6">
          {crisis ? <CrisisPanel onPause={onReview} /> : null}

          <div ref={headingRef} tabIndex={-1} className="outline-none">
            <QuestionCard
              question={current}
              answer={answers[current.id]}
              prefilled={prefilled}
              position={position}
              total={total}
              onChange={(patch) => onAnswer(current.id, patch)}
              onBack={onBack}
              onNext={position === total ? onReview : onNext}
              isLast={position === total}
              disableBack={position === 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
