import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Quiz } from "../../../types/quiz.types";
import { Clock, Play, Users, GraduationCap } from "lucide-react";
import { getMediaUrl } from "../../../utils/media";
import defaultCover from "../../../assets/images/khodethi.png";

interface QuizCardProps {
  quiz: Quiz;
  onSelectMode?: (quizId: string) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleNavigate = () => {
    navigate(`/quiz/${quiz.id}`);
  };

  const questionCount = quiz._count?.questions ?? quiz.questions?.length ?? 0;
  const createdAtFormatted = quiz.createdAt
    ? new Date(quiz.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "15/08/2024";

  const authorName = quiz.author?.name || "Chuyên gia Ôn thi HUBT";
  const authorInitial = authorName.charAt(0).toUpperCase();

  const formattedCoverUrl = getMediaUrl(quiz.coverUrl);
  const displayCoverUrl = !imgError && formattedCoverUrl ? formattedCoverUrl : defaultCover;
  const authorAvatarUrl = getMediaUrl(quiz.author?.avatar);

  return (
    <div
      onClick={handleNavigate}
      className="group flex flex-col justify-between bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div>
        {/* Top: 16:9 Thumbnail Cover */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            src={displayCoverUrl}
            alt={quiz.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Category Badge on Cover */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-950/70 backdrop-blur-md text-white shadow-xs border border-white/20">
              <GraduationCap className="w-3 h-3 text-emerald-400" />
              {quiz.category?.name || "Học phần HUBT"}
            </span>
          </div>

          {quiz.timeLimit && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white">
                <Clock className="w-3 h-3 text-amber-400" />
                {quiz.timeLimit}p
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2.5">
            {quiz.title}
          </h3>

          {/* Date Created (Icon clock + date) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{createdAtFormatted}</span>
          </div>

          {/* Metrics Row: [? Question Count] + [Users Count] */}
          <div className="flex items-center gap-4 text-xs font-bold mb-3.5">
            {/* Question count with orange question icon */}
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[11px] font-black text-amber-700 dark:text-amber-300">
                ?
              </span>
              <span>{questionCount} câu</span>
            </div>

            {/* Participants count with blue icon */}
            <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
              <Users className="w-3.5 h-3.5 text-sky-500" />
              <span>{quiz._count?.attempts ?? 12} lượt</span>
            </div>
          </div>

          {/* Author info with Avatar */}
          <div className="flex items-center gap-2 mb-4">
            {authorAvatarUrl && !avatarError ? (
              <img
                src={authorAvatarUrl}
                alt={authorName}
                onError={() => setAvatarError(true)}
                className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs shrink-0">
                {authorInitial}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {authorName}
            </span>
          </div>
        </div>
      </div>

      {/* Footer CTA Button (EduQuiz Studio Style "Vào ôn thi") */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate();
          }}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/25 group-hover:shadow-indigo-500/40 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Vào ôn thi</span>
        </button>
      </div>
    </div>
  );
};

