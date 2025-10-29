import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { supabase } from "./supabaseClient"; // ✅ Make sure this path is correct

function KanbanBoard() {
  const [columns, setColumns] = useState({
    todo: [],
    progress: [],
    done: []
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // ✅ Fetch tasks and enable real-time updates
  useEffect(() => {
    fetchTasks();

    // ✅ Real-time listener: listens to INSERT & UPDATE in Supabase
    const channel = supabase
      .channel("tasks-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          console.log("🔄 Database changed:", payload);
          fetchTasks(); // Refresh tasks on any database update
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Load tasks into columns
  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*");
    if (error) {
      console.error("❌ Error fetching tasks:", error);
    } else {
      setColumns({
        todo: data.filter((task) => task.status === "todo"),
        progress: data.filter((task) => task.status === "progress"),
        done: data.filter((task) => task.status === "done"),
      });
    }
  };

  // ✅ Add new task to Supabase
  const addTask = async () => {
    if (newTaskTitle.trim() === "") return;
    const { error } = await supabase.from("tasks").insert([{ title: newTaskTitle, status: "todo" }]);
    if (error) console.error("❌ Error adding task:", error);
    setNewTaskTitle("");
  };

  // ✅ Drag and drop handler (updates status in Supabase)
  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const task = columns[sourceCol][source.index];

    const { error } = await supabase
      .from("tasks")
      .update({ status: destCol })
      .eq("id", task.id);

    if (error) console.error("❌ Error updating task:", error);
  };

  return (
    <div>
      {/* ✅ Add Task Input */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Enter new task title"
          style={{ padding: "8px", width: "250px", marginRight: "10px" }}
        />
        <button onClick={addTask} style={{ padding: "8px 15px", cursor: "pointer" }}>
          Add Task
        </button>
      </div>

      {/* ✅ Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
          {Object.entries(columns).map(([colId, tasks]) => (
            <Droppable droppableId={colId} key={colId}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{
                    backgroundColor: "#f4f4f4",
                    padding: "10px",
                    borderRadius: "10px",
                    width: "250px",
                    minHeight: "400px"
                  }}
                >
                  <h3 style={{ textAlign: "center" }}>
                    {colId === "todo" ? "To Do"
                      : colId === "progress" ? "In Progress"
                      : "Done"}
                  </h3>

                  {tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            padding: "10px",
                            marginBottom: "10px",
                            backgroundColor: "white",
                            borderRadius: "5px",
                            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                            ...provided.draggableProps.style,
                          }}
                        >
                          <strong>{task.title}</strong>
                          {task.ai_output && (
                            <div style={{ marginTop: "5px", fontSize: "12px", color: "#555" }}>
                              <em>AI: {task.ai_output}</em>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default KanbanBoard;
