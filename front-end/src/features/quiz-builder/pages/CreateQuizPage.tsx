import React from "react";
import DashboardLayout from "../../../layouts/Dashboard";
import { useQuizBuilder } from "../hooks/useQuizBuilder";
import { QuizBuilderHeader } from "../components/QuizBuilderHeader";
import { QuizBasicInfo } from "../components/QuizBasicInfo";
import { QuizSectionList } from "../components/QuizSectionList";
import { QuizPreview } from "../components/QuizPreview";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "../../../components/Notification";
import type { QuizSectionDraft } from "../../../types/quiz-section.types";

export const CreateQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showInfo } = useNotification();
  const hasImportedRef = React.useRef(false);

  const {
    quiz,
    categories,
    categoriesLoading,
    saving,
    publishing,
    validationErrors,
    previewOpen,
    setPreviewOpen,
    setTitle,
    setDescription,
    setCover,
    removeCover,
    setCategoryId,
    setTimeLimit,
    addSection,
    updateSection,
    deleteSection,
    moveSection,
    addQuestionToSection,
    deleteQuestionFromSection,
    moveQuestionInSection,
    updateQuestionInSection,
    changeQuestionTypeInSection,
    addAnswerInSection,
    deleteAnswerInSection,
    updateAnswerInSection,
    setCorrectAnswerInSection,
    moveQuestionAcrossSections,
    importSections,
    importQuestions,
    saveDraft,
    publish,
  } = useQuizBuilder();

  // Tự động nạp các Phần & Câu hỏi từ công cụ Converter (Ưu tiên bộ nhớ in-memory để giữ trọn vẹn ảnh và các phần)
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("imported") === "true") {
      if (hasImportedRef.current) return;
      hasImportedRef.current = true;

      const windowStorage = window as unknown as {
        __importedSections?: QuizSectionDraft[];
        __importedTitle?: string;
      };
      const globalSections = windowStorage.__importedSections;
      const globalTitle = windowStorage.__importedTitle;

      const locationState = location.state as {
        sections?: QuizSectionDraft[];
        title?: string;
      } | null;

      const savedSections = sessionStorage.getItem("imported_sections");
      const savedQuestions = sessionStorage.getItem("imported_questions");
      const savedTitle = sessionStorage.getItem("imported_title");

      // Dọn dẹp bộ nhớ và sessionStorage để tránh dùng lại dữ liệu cũ
      delete windowStorage.__importedSections;
      delete windowStorage.__importedTitle;
      sessionStorage.removeItem("imported_sections");
      sessionStorage.removeItem("imported_questions");
      sessionStorage.removeItem("imported_title");

      let sectionsToImport: QuizSectionDraft[] | null = null;
      let titleToImport: string | null = null;

      if (Array.isArray(globalSections) && globalSections.length > 0) {
        sectionsToImport = globalSections;
      } else if (Array.isArray(locationState?.sections) && locationState.sections.length > 0) {
        sectionsToImport = locationState.sections;
      } else if (savedSections) {
        try {
          const parsed = JSON.parse(savedSections);
          if (Array.isArray(parsed) && parsed.length > 0) {
            sectionsToImport = parsed as QuizSectionDraft[];
          }
        } catch (e) {
          console.error("Lỗi nạp các phần đã import:", e);
        }
      }

      if (globalTitle) {
        titleToImport = globalTitle;
      } else if (locationState?.title) {
        titleToImport = locationState.title;
      } else if (savedTitle) {
        titleToImport = savedTitle;
      }

      if (sectionsToImport && sectionsToImport.length > 0) {
        importSections(sectionsToImport, true);
        const totalQ = sectionsToImport.reduce(
          (acc, s) => acc + (s.questions?.length || 0),
          0,
        );
        showInfo(
          "Đã nạp đề thi từ tệp",
          `Đề thi đã được chuyển vào trình soạn thảo gồm ${sectionsToImport.length} phần (${totalQ} câu hỏi). Các câu hỏi thiếu đáp án đúng được làm nổi bật để bạn hoàn thiện.`,
        );
      } else if (savedQuestions) {
        try {
          const list = JSON.parse(savedQuestions);
          if (Array.isArray(list) && list.length > 0) {
            importQuestions(list, true);
            showInfo(
              "Đã nạp đề thi từ tệp",
              "Đề thi đã được chuyển vào trình soạn thảo. Các câu hỏi thiếu đáp án đúng được làm nổi bật để bạn hoàn thiện.",
            );
          }
        } catch (e) {
          console.error("Lỗi nạp câu hỏi đã import:", e);
        }
      }

      if (titleToImport) {
        setTitle(titleToImport);
      }
    }
  }, [importSections, importQuestions, setTitle, showInfo, location.state]);

  return (
    <DashboardLayout>
      <div className="min-h-screen pb-16">
        {/* Sticky Header */}
        <QuizBuilderHeader
          title={quiz.title}
          status={quiz.status}
          saving={saving}
          publishing={publishing}
          onSaveDraft={saveDraft}
          onPublish={publish}
          onPreview={() => setPreviewOpen(true)}
          isEditMode={false}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Thông tin cơ bản */}
          <QuizBasicInfo
            quizId={quiz.id}
            title={quiz.title}
            description={quiz.description || ""}
            categoryId={quiz.categoryId || ""}
            timeLimit={quiz.timeLimit ?? null}
            coverUrl={quiz.coverUrl}
            categories={categories}
            categoriesLoading={categoriesLoading}
            errors={validationErrors}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onCategoryChange={setCategoryId}
            onTimeLimitChange={setTimeLimit}
            onCoverChange={setCover}
            onCoverRemove={removeCover}
          />

          {/* Danh sách các Phần & Câu hỏi */}
          <QuizSectionList
            sections={quiz.sections || []}
            errors={validationErrors}
            onAddSection={addSection}
            onUpdateSection={updateSection}
            onDeleteSection={deleteSection}
            onMoveSection={moveSection}
            onAddQuestionToSection={addQuestionToSection}
            onDeleteQuestionFromSection={deleteQuestionFromSection}
            onMoveQuestionInSection={moveQuestionInSection}
            onUpdateQuestionInSection={updateQuestionInSection}
            onChangeQuestionTypeInSection={changeQuestionTypeInSection}
            onAddAnswerInSection={addAnswerInSection}
            onDeleteAnswerInSection={deleteAnswerInSection}
            onUpdateAnswerInSection={updateAnswerInSection}
            onSetCorrectAnswerInSection={setCorrectAnswerInSection}
            onMoveQuestionAcrossSections={moveQuestionAcrossSections}
            onOpenImportModal={() => navigate("/converter")}
          />
        </div>

        {/* Modal Xem Trước */}
        <QuizPreview
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          quiz={quiz}
          categories={categories}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreateQuizPage;
