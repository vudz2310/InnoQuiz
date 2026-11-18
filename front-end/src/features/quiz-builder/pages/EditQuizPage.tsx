import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";
import { useQuizBuilder } from "../hooks/useQuizBuilder";
import { QuizBuilderHeader } from "../components/QuizBuilderHeader";
import { QuizBasicInfo } from "../components/QuizBasicInfo";
import { QuizSectionList } from "../components/QuizSectionList";
import { QuizPreview } from "../components/QuizPreview";
import { Loader2 } from "lucide-react";

export const EditQuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    quiz,
    categories,
    categoriesLoading,
    initialLoading,
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
    saveDraft,
    publish,
  } = useQuizBuilder(id);

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
          <p className="text-sm font-semibold text-[#64748B]">
            Đang tải dữ liệu bài thi...
          </p>
        </div>
      </DashboardLayout>
    );
  }

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
          isEditMode={true}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Thông tin cơ bản */}
          <QuizBasicInfo
            quizId={id || quiz.id}
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

export default EditQuizPage;
