import "./KanbanBoard.css";
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

function KanbanBoard() {
  const [columns, setColumns] = useState({
    todo: [],
    progress: [],
    done: [],
  });
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [copied, setCopied] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    socket.on("loadTasks", updateColumns);
    socket.on("updateTasks", updateColumns);
    return () => {
      socket.off("loadTasks");
      socket.off("updateTasks");
    };
  }, []);

  const updateColumns = (tasks) => {
    setColumns({
      todo: tasks.filter((task) => task.status === "todo"),
      progress: tasks.filter((task) => task.status === "progress"),
      done: tasks.filter((task) => task.status === "done"),
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return alert("Please enter a task title!");
    socket.emit("addTask", { title: newTaskTitle });
    setNewTaskTitle("");
    setShowAddPopup(false);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    if (sourceCol === destCol) return;

    const movedTask = columns[sourceCol][source.index];
    const updatedCols = { ...columns };
    updatedCols[sourceCol].splice(source.index, 1);
    updatedCols[destCol].splice(destination.index, 0, {
      ...movedTask,
      status: destCol,
    });
    setColumns(updatedCols);

    setTimeout(() => {
      socket.emit("taskMoved", {
        taskId: movedTask.id,
        newStatus: destCol,
      });
    }, 400);
  };

  const copyOutput = () => {
    if (selectedTask && selectedTask.ai_output) {
      navigator.clipboard.writeText(selectedTask.ai_output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleTaskClick = (task) => {
    if (task.status === "done") setSelectedTask(task);
  };

  const startEditing = (task) => {
    if (task.status !== "todo") return;
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = (taskId) => {
    if (!editingTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    socket.emit("renameTask", { taskId, newTitle: editingTitle });
    setEditingTaskId(null);
    setEditingTitle("");
  };

  const deleteTask = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      socket.emit("deleteTask", { taskId });
    }
  };

  return (
    <div className="kanban-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-placeholder"></div>
        </div>

        <div className="tasks-section">
          <div className="tasks-header">
            <span>Tasks</span>
            <span className="task-count">
              {columns.todo.length +
                columns.progress.length +
                columns.done.length}
            </span>
          </div>
        </div>

        <div className="main-section">
          <div className="main-label">MAIN</div>
          <div className="page-item">Dashboard</div>
          <div className="page-item">Reports</div>
          <div className="page-item">Settings</div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="header">
          <div className="welcome">Welcome Back</div>
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="header-icons">
            <div className="icon-circle"></div>
            <div className="icon-circle"></div>
          </div>
        </div>

        {/* Board */}
        <div className="board">
          <DragDropContext onDragEnd={onDragEnd}>
            {Object.entries(columns).map(([colId, tasks]) => (
              <Droppable droppableId={colId} key={colId}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="column"
                  >
                    <div className="column-header">
                      <div className="column-title">{colId.toUpperCase()}</div>
                    </div>

                    <div className="tasks-list">
                      {tasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="task-card"
                              onClick={() => handleTaskClick(task)}
                              onDoubleClick={() => startEditing(task)}
                            >
                              <div className="task-header">
                                <div className="task-title-bar"></div>
                                <button
                                  className="task-menu"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                  }}
                                >
                                  ✕
                                </button>
                              </div>

                              {editingTaskId === task.id ? (
                                <input
                                  value={editingTitle}
                                  onChange={(e) =>
                                    setEditingTitle(e.target.value)
                                  }
                                  onBlur={() => saveEdit(task.id)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && saveEdit(task.id)
                                  }
                                  autoFocus
                                />
                              ) : (
                                <div className="task-title">{task.title}</div>
                              )}

                              <div className="task-description">
                                {task.status.toUpperCase()}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      <button
                        className="add-task-btn"
                        onClick={() => setShowAddPopup(true)}
                      >
                        Add Task <span className="plus-icon">+</span>
                      </button>
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </DragDropContext>
        </div>
      </div>

      {/* View Task Popup */}
      {selectedTask && (
        <div className="popup-overlay" onClick={() => setSelectedTask(null)}>
          <div
            className="popup-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="popup-close" onClick={() => setSelectedTask(null)}>
              ✕
            </button>
            <h2>{selectedTask.title}</h2>
            <p>
              <strong>Status:</strong> {selectedTask.status}
            </p>
            <div className="popup-content">
              {selectedTask.ai_output || "No AI output available."}
            </div>
            <div className="popup-footer">
              <button
                className={`copy-btn ${copied ? "copied" : ""}`}
                onClick={copyOutput}
              >
                {copied ? "Copied!" : "Copy Output"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Popup */}
      {showAddPopup && (
        <div className="popup-overlay" onClick={() => setShowAddPopup(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Task</h3>
            <input
              type="text"
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <div className="popup-actions">
              <button className="cancel-btn" onClick={() => setShowAddPopup(false)}>
                Cancel
              </button>
              <button className="add-btn" onClick={handleAddTask}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KanbanBoard;
