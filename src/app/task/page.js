"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateTaskDescription } from "@/services/geminiService";
import { logger } from "@/lib/logger";

export default function TasksPage() {
  const [task, setTask] = useState("");

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(false);

  const [loadingTaskId, setLoadingTaskId] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [editText, setEditText] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  // READ
  const fetchTasks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setTasks(data);
    }
  };

  // CREATE
  const handleAddTask = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("tasks").insert([
        {
          title: task,
          user_id: user.id,
        },
      ]);
      logger.info("Task Created", task);
      if (error) throw error;

      setTask("");

      fetchTasks();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    logger.warn("Task Deleted", id);
    fetchTasks();
  };

  // DONE / UNDO
  const toggleComplete = async (taskId, status) => {
    await supabase
      .from("tasks")
      .update({
        completed: !status,
      })
      .eq("id", taskId);

    fetchTasks();
  };

  // UPDATE
  const handleUpdate = async (id) => {
    await supabase
      .from("tasks")
      .update({
        title: editText,
      })
      .eq("id", id);

    setEditingId(null);
    setEditText("");

    fetchTasks();
  };

  // AI DESCRIPTION
  const handleGenerateAI = async (taskId, title) => {
    try {
      setLoadingTaskId(taskId);

      const description = await generateTaskDescription(title);

      await supabase
        .from("tasks")
        .update({
          description,
        })
        .eq("id", taskId);
      logger.info("AI Triggered", title);
      fetchTasks();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingTaskId(null);
    }
  };
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-6">AI Task Manager 🚀</h1>

      <form onSubmit={handleAddTask} className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Enter Task"
          className="border p-3 rounded w-96"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 rounded"
        >
          {loading ? "Adding..." : "Add Task"}
        </button>
      </form>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="border p-4 rounded shadow">
            <div className="flex justify-between items-center">
              {editingId === task.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="border p-2 rounded"
                />
              ) : (
                <h2
                  className={
                    task.completed
                      ? "line-through text-gray-500 text-xl"
                      : "text-xl"
                  }
                >
                  {task.title}
                </h2>
              )}

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => toggleComplete(task.id, task.completed)}
                  className="bg-green-500 text-white px-3 py-2 rounded"
                >
                  {task.completed ? "Undo" : "Done"}
                </button>

                {editingId === task.id ? (
                  <button
                    onClick={() => handleUpdate(task.id)}
                    className="bg-blue-500 text-white px-3 py-2 rounded"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(task.id);
                      setEditText(task.title);
                    }}
                    className="bg-yellow-500 text-white px-3 py-2 rounded"
                  >
                    Edit
                  </button>
                )}

                <button
                  onClick={() => handleDelete(task.id)}
                  className="bg-red-500 text-white px-3 py-2 rounded"
                >
                  Delete
                </button>

                <button
                  onClick={() => handleGenerateAI(task.id, task.title)}
                  className="bg-purple-600 text-white px-3 py-2 rounded"
                >
                  {loadingTaskId === task.id ? "Generating..." : "Generate AI"}
                </button>
              </div>
            </div>

            {task.description && (
              <p className="mt-4 text-gray-600 bg-gray-100 p-3 rounded">
                🤖 {task.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
