import React, { useState, useMemo } from "react";
import type { QuestionDraft, QuestionType } from "../../../types/quiz.types";
import type { QuizSectionDraft } from "../../../types/quiz-section.types";
import { checkQuestionIssues, type QuestionIssue } from "../utils/questionValidator";
import { QuestionEditor } from "./QuestionEditor";
import {
  FolderTree,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Check,
  X,
  AlertTriangle,
  Filter,
  CheckCircle2,
  ArrowDown,
  Eye,
} from "lucide-react";

interface QuizSectionListProps {
  sections: QuizSectionDraft[];
  errors: Record<string, string>;
  onAddSection: (title?: string) => void;
  onUpdateSection: (sectionIndex: number, fields: Partial<QuizSectionDraft>) => void;
  onDeleteSection: (sectionIndex: number) => void;
  onMoveSection: (sectionIndex: number, direction: "UP" | "DOWN") => void;
  onAddQuestionToSection: (sectionIndex: number, type?: QuestionType) => void;
  onDeleteQuestionFromSection: (sectionIndex: number, questionIndex: number) => void;
  onMoveQuestionInSection: (
    sectionIndex: number,
    questionIndex: number,
    direction: "UP" | "DOWN"
  ) => void;
  onUpdateQuestionInSection: (
    sectionIndex: number,
    questionIndex: number,
    fields: Partial<QuestionDraft>
  ) => void;
  onChangeQuestionTypeInSection: (
    sectionIndex: number,
    questionIndex: number,
    type: QuestionType
  ) => void;
  onAddAnswerInSection: (sectionIndex: number, questionIndex: number) => void;
  onDeleteAnswerInSection: (
    sectionIndex: number,
    questionIndex: number,
    answerIndex: number
  ) => void;
  onUpdateAnswerInSection: (
    sectionIndex: number,
    questionIndex: number,
    answerIndex: number,
    content: string
  ) => void;
  onSetCorrectAnswerInSection: (
    sectionIndex: number,
    questionIndex: number,
    answerIndex: number
  ) => void;
  onMoveQuestionAcrossSections: (
    sourceSectionIndex: number,
    questionIndex: number,
    targetSectionIndex: number
  ) => void;
  onOpenImportModal?: () => void;
}

export const QuizSectionList: React.FC<QuizSectionListProps> = ({
  sections,
  errors,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onMoveSection,
  onAddQuestionToSection,
  onDeleteQuestionFromSection,
  onMoveQuestionInSection,
  onUpdateQuestionInSection,
  onChangeQuestionTypeInSection,
  onAddAnswerInSection,
  onDeleteAnswerInSection,
  onUpdateAnswerInSection,
  onSetCorrectAnswerInSection,
  onMoveQuestionAcrossSections,
  onOpenImportModal,
}) => {
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});
  const [filterOnlyIssues, setFilterOnlyIssues] = useState(false);
  const [movingQuestionModal, setMovingQuestionModal] = useState<{
    sourceSecIdx: number;
    qIdx: number;
  } | null>(null);

  // Tính toán thời gian thực các issue và thống kê toàn bộ các phần
  const stats = useMemo(() => {
    let totalQuestions = 0;
    let totalIssues = 0;
    let missingCorrectCount = 0;
    let emptyContentCount = 0;
    const issuesMap: Record<string, QuestionIssue[]> = {};
    const secIssuesCount: Record<number, number> = {};

    sections.forEach((sec, sIdx) => {
      let secIssueCount = 0;
      (sec.questions || []).forEach((q, qIdx) => {
        totalQuestions += 1;
        const qIssues = checkQuestionIssues(q);
        const key = `${sIdx}-${qIdx}`;
        issuesMap[key] = qIssues;
        if (qIssues.length > 0) {
          totalIssues += 1;
          secIssueCount += 1;
          if (qIssues.some((i) => i.type === "MISSING_CORRECT")) {
            missingCorrectCount += 1;
          }
          if (qIssues.some((i) => i.type === "EMPTY_CONTENT")) {
            emptyContentCount += 1;
          }
        }
      });
      secIssuesCount[sIdx] = secIssueCount;
    });

    return {
      totalQuestions,
      totalIssues,
      missingCorrectCount,
      emptyContentCount,
      issuesMap,
      secIssuesCount,
    };
  }, [sections]);

  const totalPoints = sections.reduce(
    (sum, s) =>
      sum + (s.questions || []).reduce((qSum, q) => qSum + (Number(q.points) || 1), 0),
    0
  );

  const startEditSectionTitle = (idx: number, currentTitle: string) => {
    setEditingSectionIdx(idx);
    setEditingTitle(currentTitle);
  };

  const saveSectionTitle = (idx: number) => {
    if (editingTitle.trim()) {
      onUpdateSection(idx, { title: editingTitle.trim() });
    }
    setEditingSectionIdx(null);
  };

  const toggleSectionCollapse = (idx: number) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Cuộn mượt đến câu lỗi tiếp theo
  const handleJumpToNextIssue = () => {
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      for (let qIdx = 0; qIdx < (sec.questions || []).length; qIdx++) {
        const issues = stats.issuesMap[`${sIdx}-${qIdx}`];
        if (issues && issues.length > 0) {
          setCollapsedSections((prev) => ({ ...prev, [sIdx]: false }));
          setTimeout(() => {
            const el = document.getElementById(`question-card-${sIdx}-${qIdx}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 80);
          return;
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Danh sách Phần & Đề thi */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              Các phần trong đề thi ({sections.length} phần)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng {stats.totalQuestions} câu hỏi • {totalPoints} điểm
              {stats.totalIssues > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-bold ml-1.5">
                  • ⚠️ {stats.totalIssues} câu cần sửa
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenImportModal && (
            <button
              type="button"
              onClick={onOpenImportModal}
              className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Nhập file tự chia phần</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onAddSection(`PHẦN ${sections.length + 1}: NỘI DUNG MỚI`)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm phần mới</span>
          </button>
        </div>
      </div>

      {/* BANNER THÔNG BÁO VÀ BỘ LỌC CÂU HỎI LỖI / CHỜ SỬA */}
      {stats.totalIssues > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-300/80 dark:border-amber-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-amber-950 dark:text-amber-100">
                  Phát hiện {stats.totalIssues} câu hỏi cần bổ sung thông tin hoặc đáp án
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                  Cần xử lý
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                {stats.missingCorrectCount > 0 && (
                  <span>{stats.missingCorrectCount} câu chưa chọn đáp án đúng • </span>
                )}
                {stats.emptyContentCount > 0 && (
                  <span>{stats.emptyContentCount} câu chưa có nội dung • </span>
                )}
                Bạn có thể sửa nội dung và chỉ định đáp án đúng trực tiếp ngay tại đây.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto sm:ml-0">
            {/* Nút lọc Chỉ xem câu lỗi */}
            <button
              type="button"
              onClick={() => setFilterOnlyIssues(!filterOnlyIssues)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                filterOnlyIssues
                  ? "bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400"
                  : "bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100/50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {filterOnlyIssues
                  ? `Đang lọc: ${stats.totalIssues} câu lỗi (Xem tất cả)`
                  : `Chỉ xem ${stats.totalIssues} câu cần sửa`}
              </span>
            </button>

            {/* Nút Nhảy tới câu lỗi tiếp theo */}
            <button
              type="button"
              onClick={handleJumpToNextIssue}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Cuộn nhanh tới câu hỏi đang có lỗi"
            >
              <span>Đến câu lỗi tiếp theo</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : stats.totalQuestions > 0 ? (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              Tất cả {stats.totalQuestions} câu hỏi đều hợp lệ và đã chọn đáp án đúng đầy đủ.
            </span>
          </div>
          {filterOnlyIssues && (
            <button
              type="button"
              onClick={() => setFilterOnlyIssues(false)}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Hiển thị toàn bộ câu hỏi
            </button>
          )}
        </div>
      ) : null}

      {/* Render từng Section */}
      <div className="space-y-8">
        {sections.map((section, sIndex) => {
          const isCollapsed = Boolean(collapsedSections[sIndex]);
          const isEditing = editingSectionIdx === sIndex;
          const sectionPoints = (section.questions || []).reduce(
            (sum, q) => sum + (Number(q.points) || 1),
            0
          );
          const secIssues = stats.secIssuesCount[sIndex] || 0;

          // Danh sách câu hỏi hiển thị (nếu đang lọc chỉ xem câu lỗi)
          const visibleQuestionsWithIndices = (section.questions || [])
            .map((question, qIndex) => ({
              question,
              qIndex,
              issues: stats.issuesMap[`${sIndex}-${qIndex}`] || [],
            }))
            .filter((item) => !filterOnlyIssues || item.issues.length > 0);

          return (
            <div
              key={section.id || `sec-${sIndex}`}
              className="rounded-3xl border border-indigo-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden"
            >
              {/* Section Header Bar */}
              <div className="p-4 sm:p-5 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {sIndex + 1}
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveSectionTitle(sIndex)}
                        className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Nhập tên phần (ví dụ: PHẦN 1: TRẮC NGHIỆM)..."
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveSectionTitle(sIndex)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        title="Lưu tên"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSectionIdx(null)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <h3
                        onClick={() => startEditSectionTitle(sIndex, section.title)}
                        className="text-sm font-extrabold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2"
                        title="Nhấp để đổi tên phần"
                      >
                        {section.title}
                        <Edit2 className="w-3 h-3 opacity-40 hover:opacity-100" />
                      </h3>

                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                        {section.questions.length} câu • {sectionPoints} điểm
                      </span>

                      {/* Huy hiệu cảnh báo lỗi của Phần */}
                      {secIssues > 0 ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {secIssues} câu cần sửa
                        </span>
                      ) : section.questions.length > 0 ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đầy đủ
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Section Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onMoveSection(sIndex, "UP")}
                    disabled={sIndex === 0}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 cursor-pointer"
                    title="Di chuyển phần lên trên"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onMoveSection(sIndex, "DOWN")}
                    disabled={sIndex === sections.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 cursor-pointer"
                    title="Di chuyển phần xuống dưới"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Bạn có chắc chắn muốn xóa "${section.title}" cùng toàn bộ ${section.questions.length} câu hỏi bên trong?`
                          )
                        ) {
                          onDeleteSection(sIndex);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                      title="Xóa phần này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse(sIndex)}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                    title={isCollapsed ? "Mở rộng phần" : "Thu gọn phần"}
                  >
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Section Questions Body */}
              {!isCollapsed && (
                <div className="p-4 sm:p-6 space-y-6">
                  {section.questions.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <Layers className="w-8 h-8 mx-auto opacity-40 text-indigo-400" />
                      <p className="text-xs font-semibold">Phần này chưa có câu hỏi nào.</p>
                      <button
                        type="button"
                        onClick={() => onAddQuestionToSection(sIndex, "MULTIPLE_CHOICE")}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        + Thêm câu hỏi đầu tiên
                      </button>
                    </div>
                  ) : filterOnlyIssues && visibleQuestionsWithIndices.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 dark:text-slate-400 space-y-2 border border-dashed border-emerald-200 dark:border-emerald-800/60 rounded-2xl bg-emerald-50/20 dark:bg-emerald-950/10">
                      <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Toàn bộ câu hỏi trong phần này đều đã hợp lệ!
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilterOnlyIssues(false)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Xem tất cả câu hỏi của phần này
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {visibleQuestionsWithIndices.map(({ question, qIndex, issues }) => {
                        const qError =
                          errors[`sec_${sIndex}_q_${qIndex}_content`] ||
                          errors[`sec_${sIndex}_q_${qIndex}_answers`] ||
                          errors[`sec_${sIndex}_q_${qIndex}_correct`] ||
                          errors[`sec_${sIndex}_q_${qIndex}_empty_answer`] ||
                          errors[`sec_${sIndex}_q_${qIndex}_answers_count`];

                        return (
                          <div
                            key={question.id || `sec-${sIndex}-q-${qIndex}`}
                            className="relative group"
                          >
                            <QuestionEditor
                              question={question}
                              index={qIndex}
                              sectionIndex={sIndex}
                              totalQuestions={section.questions.length}
                              error={qError}
                              issues={issues}
                              onContentChange={(content) =>
                                onUpdateQuestionInSection(sIndex, qIndex, { content })
                              }
                              onTypeChange={(type) =>
                                onChangeQuestionTypeInSection(sIndex, qIndex, type)
                              }
                              onPointsChange={(points) =>
                                onUpdateQuestionInSection(sIndex, qIndex, { points })
                              }
                              onMoveUp={() => onMoveQuestionInSection(sIndex, qIndex, "UP")}
                              onMoveDown={() => onMoveQuestionInSection(sIndex, qIndex, "DOWN")}
                              onDelete={() => onDeleteQuestionFromSection(sIndex, qIndex)}
                              onAddAnswer={() => onAddAnswerInSection(sIndex, qIndex)}
                              onDeleteAnswer={(aIndex) =>
                                onDeleteAnswerInSection(sIndex, qIndex, aIndex)
                              }
                              onUpdateAnswer={(aIndex, content) =>
                                onUpdateAnswerInSection(sIndex, qIndex, aIndex, content)
                              }
                              onSetCorrectAnswer={(aIndex) =>
                                onSetCorrectAnswerInSection(sIndex, qIndex, aIndex)
                              }
                            />

                            {/* Nút chuyển phần cho câu hỏi */}
                            {sections.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setMovingQuestionModal({
                                    sourceSecIdx: sIndex,
                                    qIdx: qIndex,
                                  })
                                }
                                className="absolute right-24 top-4 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                                title="Di chuyển câu hỏi sang phần khác"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Đổi phần</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Nút thêm câu hỏi vào Section này */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onAddQuestionToSection(sIndex, "MULTIPLE_CHOICE")}
                      className="px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm câu Trắc nghiệm vào {section.title.split(":")[0]}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddQuestionToSection(sIndex, "TRUE_FALSE")}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm câu Đúng / Sai</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Di chuyển câu hỏi sang phần khác */}
      {movingQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
              Di chuyển câu {movingQuestionModal.qIdx + 1} sang phần:
            </h3>

            <div className="space-y-2">
              {sections.map((sec, targetIdx) => {
                const isCurrent = targetIdx === movingQuestionModal.sourceSecIdx;
                return (
                  <button
                    key={targetIdx}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      onMoveQuestionAcrossSections(
                        movingQuestionModal.sourceSecIdx,
                        movingQuestionModal.qIdx,
                        targetIdx
                      );
                      setMovingQuestionModal(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                      isCurrent
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-indigo-300 cursor-pointer"
                    }`}
                  >
                    <span>{sec.title}</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {isCurrent ? "(Hiện tại)" : `${sec.questions.length} câu`}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setMovingQuestionModal(null)}
              className="w-full py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
