"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { generateTaskDescription } from "@/services/geminiService";
import { logger } from "@/lib/logger";

// ─────────────────────────────────────────────────────────────────────────────
// Theme hook  →  "light" | "dark" | "system"
// Applies/removes the "dark" class on <html> and persists to localStorage.
// ─────────────────────────────────────────────────────────────────────────────
function useTheme() {
  const [mode, setMode] = useState("system"); // "light" | "dark" | "system"

  // On mount, restore saved preference
  useEffect(() => {
    const saved = localStorage.getItem("theme-mode") || "system";
    setMode(saved);
  }, []);

  // Whenever mode changes, apply the class
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDark = mode === "dark" || (mode === "system" && prefersDark);
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  // Also react to OS-level changes while "system" is active
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  return { mode, setMode };
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggle  — three-way pill: System / Light / Dark
// ─────────────────────────────────────────────────────────────────────────────
function ThemeToggle({ mode, setMode }) {
  const options = [
    {
      value: "system",
      label: "System",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
    },
    {
      value: "light",
      label: "Light",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ),
    },
    {
      value: "dark",
      label: "Dark",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08]">
      {options.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          title={label}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono tracking-wide
            transition-all duration-200 select-none
            ${
              mode === value
                ? "bg-white dark:bg-white/15 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            }
          `}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ completed }) {
  return (
    <span
      className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-widest uppercase
      ${
        completed
          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/25"
          : "bg-amber-400/10 text-amber-500 border border-amber-400/25"
      }
    `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${completed ? "bg-emerald-500" : "bg-amber-400"}`}
      />
      {completed ? "Done" : "Pending"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IconBtn
// ─────────────────────────────────────────────────────────────────────────────
function IconBtn({ onClick, title, children, disabled, variant = "default" }) {
  const variantClass = {
    default: "hover:bg-blue-500/10 hover:text-blue-400",
    ai: "hover:bg-violet-500/10 hover:text-violet-400",
    danger: "hover:bg-red-500/10 hover:text-red-400",
  }[variant];

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center w-8 h-8 rounded-lg border-none
        text-slate-400 dark:text-slate-500 transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        ${!disabled ? variantClass + " cursor-pointer" : ""}
      `}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonCard
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 bg-white dark:bg-white/[0.03] animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-white/10 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-md w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-white/[0.06] rounded-md w-1/3" />
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-slate-600">
      <span className="text-5xl opacity-40 select-none">✦</span>
      <p className="text-xs font-mono tracking-widest uppercase">
        No tasks yet — add one above
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TaskCard
// ─────────────────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
  onGenerateAI,
  loadingTaskId,
}) {
  const [localEdit, setLocalEdit] = useState(false);
  const [editText, setEditText] = useState(task.title);
  const inputRef = useRef(null);
  const isGenerating = loadingTaskId === task.id;

  const startEdit = () => {
    setLocalEdit(true);
    setEditText(task.title);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const saveEdit = () => {
    if (editText.trim()) onEdit(task.id, editText.trim());
    setLocalEdit(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setLocalEdit(false);
  };

  return (
    <div
      className="
      group border border-slate-200 dark:border-white/[0.07]
      bg-white dark:bg-white/[0.03]
      hover:bg-slate-50 dark:hover:bg-white/[0.055]
      hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-black/30
      rounded-2xl p-4 sm:p-5 transition-all duration-200
    "
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, task.completed)}
          className={`
            shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 cursor-pointer
            flex items-center justify-center transition-all duration-200
            ${
              task.completed
                ? "border-emerald-500 bg-emerald-500/15"
                : "border-slate-300 dark:border-white/20 hover:border-violet-400 dark:hover:border-violet-500"
            }
          `}
        >
          {task.completed && (
            <svg
              className="w-3 h-3 text-emerald-500"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Title / edit input */}
        <div className="flex-1 min-w-0">
          {localEdit ? (
            <input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              className="
                w-full bg-slate-100 dark:bg-white/[0.06]
                border border-violet-400 dark:border-violet-500
                rounded-lg px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-100
                font-sans outline-none ring-2 ring-violet-400/30 dark:ring-violet-500/25
                transition-all
              "
            />
          ) : (
            <p
              onDoubleClick={startEdit}
              title="Double-click to edit"
              className={`
                text-[15px] font-medium leading-snug break-words cursor-text select-none
                ${
                  task.completed
                    ? "line-through text-slate-400 dark:text-slate-600"
                    : "text-slate-800 dark:text-slate-100"
                }
              `}
            >
              {task.title}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge completed={task.completed} />
            <span className="text-[10px] font-mono tracking-wider text-slate-400 dark:text-slate-600">
              {new Date(task.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
          <IconBtn onClick={startEdit} title="Edit task" variant="default">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </IconBtn>

          <IconBtn
            onClick={() => onGenerateAI(task.id, task.title)}
            title="Generate AI description"
            variant="ai"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <svg
                className="w-3.5 h-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
            )}
          </IconBtn>

          <IconBtn
            onClick={() => onDelete(task.id)}
            title="Delete task"
            variant="danger"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* AI description bubble */}
      {task.description && (
        <div
          className="
          mt-4 flex gap-2.5 items-start
          bg-violet-50 dark:bg-violet-500/[0.08]
          border border-violet-100 dark:border-violet-500/20
          rounded-xl px-3.5 py-3
        "
        >
          <span className="text-violet-400 text-sm shrink-0 mt-0.5 select-none">
            ✦
          </span>
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
            {task.description}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState("all");
  const inputRef = useRef(null);
  const { mode, setMode } = useTheme();

  useEffect(() => {
    fetchTasks();
  }, []);

  // READ
  const fetchTasks = async () => {
    setFetching(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) setTasks(data);
    } finally {
      setFetching(false);
    }
  };

  // CREATE
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login again");
        window.location.href = "/login";
        return;
      }
      const { error } = await supabase
        .from("tasks")
        .insert([{ title: task.trim(), user_id: user.id }]);
      logger.info("Task Created", task);
      if (error) throw error;
      setTask("");
      fetchTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE  (optimistic)
  const handleDelete = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
    logger.warn("Task Deleted", id);
  };

  // TOGGLE  (optimistic)
  const toggleComplete = async (taskId, status) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !status } : t)),
    );
    await supabase
      .from("tasks")
      .update({ completed: !status })
      .eq("id", taskId);
  };

  // UPDATE  (optimistic)
  const handleUpdate = async (id, newTitle) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)),
    );
    await supabase.from("tasks").update({ title: newTitle }).eq("id", id);
  };

  // AI DESCRIPTION
  const handleGenerateAI = async (taskId, title) => {
    try {
      setLoadingTaskId(taskId);
      const description = await generateTaskDescription(title);
      await supabase.from("tasks").update({ description }).eq("id", taskId);
      logger.info("AI Triggered", title);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, description } : t)),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.completed : !t.completed,
  );
  const doneCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - doneCount;

  const FILTERS = ["all", "pending", "done"];

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Page shell */}
      <div
        className="min-h-screen bg-slate-50 dark:bg-[#0d0d10] transition-colors duration-300 font-sans"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {/* Ambient glow — visible only in dark mode */}
        <div
          className="fixed inset-0 pointer-events-none hidden dark:block"
          style={{
            background:
              "radial-gradient(ellipse 80% 45% at 50% -5%, rgba(124,92,252,0.11), transparent)",
          }}
        />

        {/* ── Topbar ── */}
        <header
          className="sticky top-0 z-30 w-full
          bg-white/80 dark:bg-[#0d0d10]/80 backdrop-blur-md
          border-b border-slate-200 dark:border-white/[0.06]
          transition-colors duration-300"
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm
                bg-gradient-to-br from-violet-500 to-violet-400
                shadow-[0_0_16px_rgba(124,92,252,0.5)]"
              >
                ✦
              </div>
              <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100 hidden sm:inline">
                Task Manager
              </span>
            </div>

            {/* Stats pill */}
            <div className="flex-1 flex justify-center">
              <span
                className="text-[10px] font-mono tracking-widest uppercase
                text-slate-400 dark:text-slate-500 px-3 py-1 rounded-full
                bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.07]"
              >
                {pendingCount} pending · {doneCount} done
              </span>
            </div>

            {/* Theme toggle */}
            <ThemeToggle mode={mode} setMode={setMode} />
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-24 relative z-10">
          {/* Add task form */}
          <form
            onSubmit={handleAddTask}
            className="flex gap-2 mb-6 p-2 rounded-2xl
              bg-white dark:bg-white/[0.04]
              border border-slate-200 dark:border-white/[0.08]
              shadow-sm dark:shadow-none
              transition-colors duration-300"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Add a new task…"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
              className="
                flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm
                text-slate-800 dark:text-slate-100
                placeholder-slate-300 dark:placeholder-slate-600
                outline-none rounded-xl
                focus:ring-2 focus:ring-violet-400/30 dark:focus:ring-violet-500/25
                transition-all duration-200
              "
            />
            <button
              type="submit"
              disabled={loading}
              className="
                flex items-center justify-center gap-1.5 shrink-0
                bg-violet-600 hover:bg-violet-500 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                text-white text-sm font-semibold
                px-5 py-2.5 rounded-xl
                shadow-md shadow-violet-500/25 hover:shadow-violet-500/40
                transition-all duration-200 cursor-pointer min-w-[110px]
              "
            >
              {loading ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Task
                </>
              )}
            </button>
          </form>

          {/* Filter tabs */}
          <div className="flex gap-1.5 mb-5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-3.5 py-1.5 rounded-lg text-[11px] font-mono font-medium tracking-widest uppercase
                  border transition-all duration-150 cursor-pointer
                  ${
                    filter === f
                      ? "bg-violet-500/10 dark:bg-violet-500/15 border-violet-400/50 dark:border-violet-500/40 text-violet-600 dark:text-violet-400"
                      : "bg-transparent border-slate-200 dark:border-white/[0.07] text-slate-400 dark:text-slate-600 hover:border-slate-300 dark:hover:border-white/15 hover:text-slate-500 dark:hover:text-slate-400"
                  }
                `}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Task list */}
          <div className="flex flex-col gap-2.5">
            {fetching ? (
              [1, 2, 3].map((i) => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((t, i) => (
                <div
                  key={t.id}
                  className="animate-[fadeUp_0.25s_ease_both]"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <TaskCard
                    task={t}
                    onToggle={toggleComplete}
                    onDelete={handleDelete}
                    onEdit={handleUpdate}
                    onGenerateAI={handleGenerateAI}
                    loadingTaskId={loadingTaskId}
                  />
                </div>
              ))
            )}
          </div>

          {/* Footer count */}
          {tasks.length > 0 && !fetching && (
            <p className="mt-12 text-center text-[10px] font-mono tracking-widest uppercase text-slate-300 dark:text-slate-700">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
            </p>
          )}
        </main>
      </div>

      {/* Keyframe for fadeUp animation — Tailwind can't do arbitrary keyframes without config */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
