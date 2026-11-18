import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotification } from "./NotificationContext";
import { NotificationDropdown } from "./NotificationDropdown";

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotification();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl text-[#64748B] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-all cursor-pointer ${
          isOpen ? "text-[#4F46E5] bg-[#EEF2FF] ring-2 ring-[#C7D2FE]" : ""
        }`}
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5 transition-transform duration-200 active:scale-90" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EF4444] ring-2 ring-white" />
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Container: Căn đều 2 lề trên mobile (inset-x-3), thả xuống gọn gàng từ icon trên desktop */}
          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 z-50 flex justify-center sm:block pointer-events-auto">
            <NotificationDropdown onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};
