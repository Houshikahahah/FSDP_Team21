// TimelineView.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { supabase } from "./supabaseClient";
import "./TimelineView.css";

function clamp(d, min, max) {
  if (d.isBefore(min)) return min;
  if (d.isAfter(max)) return max;
  return d;
}

function getRange(task) {
  const s = task.start_date ? dayjs(task.start_date) : null;
  const e = task.end_date ? dayjs(task.end_date) : null;
  if (s && e) return { start: s, end: e };
  if (s && !e) return { start: s, end: s };
  if (!s && e) return { start: e, end: e };
  return null;
}

export default function TimelineView({ user, profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [selectedTask, setSelectedTask] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all"); // all | todo | progress | done
  const [members, setMembers] = useState([]); // [{id, username}]
  const [assigneeFilter, setAssigneeFilter] = useState("all"); // all | unassigned | <uuid>

  // ✅ maps uuid -> username (for modal + labels)
  const [userNameMap, setUserNameMap] = useState({});

  const scrollRef = useRef(null);

  // org mode from localStorage
  const orgId = window.localStorage.getItem("activeOrgId") || null;
  const isOrgMode = Boolean(orgId);

  // -------------------------
  // Load organisation members
  // -------------------------
  useEffect(() => {
    if (!user || !isOrgMode) {
      setMembers([]);
      setAssigneeFilter("all");
      setUserNameMap({});
      return;
    }

    const fetchMembers = async () => {
      const { data: memRows, error: memErr } = await supabase
        .from("organisation_members")
        .select("user_id, owner_id")
        .eq("organisation_id", orgId);

      if (memErr) {
        console.error("organisation_members fetch error:", memErr);
        setMembers([]);
        setUserNameMap({});
        return;
      }

      const ids = Array.from(
        new Set(
          (memRows || [])
            .flatMap((r) => [r.user_id, r.owner_id])
            .filter(Boolean)
        )
      );

      if (ids.length === 0) {
        setMembers([]);
        setUserNameMap({});
        return;
      }

      // get usernames from profiles
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", ids);

      if (profErr) {
        console.error("profiles lookup error (members):", profErr);
        // fallback: no UUID display; just "Unknown user"
        const fallback = ids.map((id) => ({ id, username: "Unknown user" }));
        setMembers(fallback);

        const map = {};
        ids.forEach((id) => (map[id] = "Unknown user"));
        setUserNameMap(map);
        return;
      }

      const map = {};
      (profs || []).forEach((p) => {
        map[p.id] = p.username || "Unknown user";
      });

      // ensure every id has a username (no UUID in UI)
      ids.forEach((id) => {
        if (!map[id]) map[id] = "Unknown user";
      });

      const list = ids
        .map((id) => ({ id, username: map[id] }))
        .sort((a, b) => a.username.localeCompare(b.username));

      setMembers(list);
      setUserNameMap(map);

      setAssigneeFilter((prev) => {
        if (prev === "all" || prev === "unassigned") return prev;
        return list.some((m) => m.id === prev) ? prev : "all";
      });
    };

    fetchMembers();
  }, [user, isOrgMode, orgId]);

  // -------------------------
  // Load tasks
  // -------------------------
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      setLoading(true);

      let q = supabase.from("tasks").select("*");

      if (isOrgMode) {
        q = q.eq("organisation_id", orgId);
      } else {
        q = q.or(
          `and(organisation_id.is.null,user_id.eq.${user.id}),assigned_to.eq.${user.id}`
        );
      }

      const { data, error } = await q.order("created_at", { ascending: false });

      if (error) console.error("timeline fetchTasks error:", error);
      setTasks(Array.isArray(data) ? data : []);
      setLoading(false);
    };

    fetchTasks();

    const channel = supabase
      .channel(`timeline_tasks_${user.id}_${orgId || "noorg"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        fetchTasks
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, isOrgMode, orgId]);

  // -------------------------
  // Timeline range
  // -------------------------
  const range = useMemo(() => {
    const start = month.startOf("month").subtract(7, "day");
    const end = month.endOf("month").add(7, "day");

    const days = [];
    let d = start;

    while (d.isBefore(end) || d.isSame(end, "day")) {
      days.push(d);
      d = d.add(1, "day");
      if (days.length > 90) break;
    }

    return { start, end, days };
  }, [month]);

  // -------------------------
  // Apply filters
  // -------------------------
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const st = t.status || "todo";

      if (statusFilter !== "all" && st !== statusFilter) return false;

      if (isOrgMode) {
        if (assigneeFilter === "all") return true;
        if (assigneeFilter === "unassigned") return !t.assigned_to;
        return t.assigned_to === assigneeFilter;
      }

      return true;
    });
  }, [tasks, statusFilter, assigneeFilter, isOrgMode]);

  const items = useMemo(() => {
    return filteredTasks
      .map((t) => ({ task: t, r: getRange(t) }))
      .filter(({ r }) => r)
      .filter(
        ({ r }) => !(r.end.isBefore(range.start) || r.start.isAfter(range.end))
      )
      .map(({ task, r }) => ({ task, start: r.start, end: r.end }));
  }, [filteredTasks, range.start, range.end]);

  // -------------------------
  // Layout calculations
  // -------------------------
  const today = dayjs().startOf("day");
  const dayWidth = 46;
  const gridWidth = range.days.length * dayWidth;

  const headerH = 64;
  const rowH = 52;
  const rowGap = 10;
  const barH = 30;

  const gridHeight = useMemo(() => {
    const rows = items.length;
    return Math.max(520, headerH + rows * (rowH + rowGap) + 60);
  }, [items.length]);

  const getBarStyle = (start, end) => {
    const s = clamp(
      start.startOf("day"),
      range.start.startOf("day"),
      range.end.startOf("day")
    );
    const e = clamp(
      end.startOf("day"),
      range.start.startOf("day"),
      range.end.startOf("day")
    );

    const leftDays = s.diff(range.start, "day");
    const spanDays = e.diff(s, "day") + 1;

    return { left: leftDays * dayWidth, width: spanDays * dayWidth };
  };

  const prioClass = (p) => `prio-${String(p || "Medium").toLowerCase()}`;

  const todayLeft = useMemo(() => {
    if (today.isBefore(range.start) || today.isAfter(range.end)) return null;
    return today.diff(range.start, "day") * dayWidth + dayWidth / 2;
  }, [today, range.start, range.end]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const firstOfMonth = month.startOf("month");
    const idx = range.days.findIndex((d) => d.isSame(firstOfMonth, "day"));
    scroller.scrollLeft = idx >= 0 ? idx * dayWidth : 0;
  }, [month, range.days]);

  const assignedToName = (uuid) => {
    if (!uuid) return "Unassigned";
    return userNameMap[uuid] || "Unknown user";
  };

  if (loading) return <div style={{ padding: 24 }}>Loading timeline...</div>;

  return (
    <div className="timeline-page">
      <div className="timeline-header">
        <div>
          <h1>Timeline</h1>
          <div className="timeline-sub">
            {isOrgMode ? (
              <>
                Organisation timeline for <strong>{profile?.username}</strong>
              </>
            ) : (
              <>
                Personal timeline for <strong>{profile?.username}</strong>
              </>
            )}
          </div>
        </div>

        <div className="timeline-controls">
          <button onClick={() => setMonth((m) => m.subtract(1, "month"))}>
            ←
          </button>

          <div className="timeline-month">{month.format("MMMM YYYY")}</div>

          <select
            className="timeline-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          {isOrgMode && (
            <select
              className="timeline-filter"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              disabled={members.length === 0}
            >
              <option value="all">All People</option>
              <option value="unassigned">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.username}
                  {m.id === user.id ? " (You)" : ""}
                </option>
              ))}
            </select>
          )}

          <button onClick={() => setMonth((m) => m.add(1, "month"))}>→</button>
        </div>
      </div>

      <div className="jira-timeline">
        <div className="timeline-scroll" ref={scrollRef}>
          <div className="timeline-header-row">
            <div className="jira-days" style={{ width: gridWidth }}>
              {range.days.map((d) => {
                const isNewMonth = d.date() === 1;
                return (
                  <div
                    key={d.toString()}
                    className={`day-cell ${
                      d.isSame(today, "day") ? "today" : ""
                    } ${isNewMonth ? "month-start" : ""}`}
                    style={{ width: dayWidth }}
                    title={d.format("YYYY-MM-DD")}
                  >
                    <div className="day-top">{isNewMonth ? d.format("MMM") : ""}</div>
                    <div className="day-num">{d.format("D")}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="timeline-grid-wrap">
            <div className="timeline-grid" style={{ width: gridWidth, height: gridHeight }}>
              {range.days.map((d) => {
                const isNewMonth = d.date() === 1;
                return (
                  <div
                    key={d.toString()}
                    className={`grid-col ${isNewMonth ? "month-start" : ""}`}
                    style={{ width: dayWidth }}
                  />
                );
              })}

              {todayLeft !== null && <div className="today-line" style={{ left: todayLeft }} />}

              <div className="row-lines">
                {items.map((_, idx) => {
                  const top = headerH + idx * (rowH + rowGap);
                  return (
                    <div
                      key={idx}
                      className="row-line"
                      style={{ top, height: rowH + rowGap }}
                    />
                  );
                })}
              </div>

              <div className="bars-layer">
                {items.map(({ task, start, end }, idx) => {
                  const style = getBarStyle(start, end);
                  const top = headerH + idx * (rowH + rowGap) + (rowH - barH) / 2;

                  return (
                    <div
                      key={task.id}
                      className={`jira-bar ${prioClass(task.priority)}`}
                      style={{ ...style, top, height: barH }}
                      onClick={() => setSelectedTask(task)}
                      title={`${task.title}\n${start.format("YYYY-MM-DD")} → ${end.format(
                        "YYYY-MM-DD"
                      )}`}
                    >
                      <span className="bar-text">{task.title}</span>
                    </div>
                  );
                })}
              </div>

              {items.length === 0 && (
                <div className="timeline-empty">No tasks found for these filters/month.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <div className="task-modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Task Details</h2>
            <p><strong>Title:</strong> {selectedTask.title}</p>
            <p><strong>Status:</strong> {selectedTask.status || "todo"}</p>
            <p><strong>Priority:</strong> {selectedTask.priority || "Medium"}</p>

            {/* ✅ show username instead of uuid */}
            <p><strong>Assigned To:</strong> {assignedToName(selectedTask.assigned_to)}</p>

            <p><strong>Start:</strong> {selectedTask.start_date || "None"}</p>
            <p><strong>End:</strong> {selectedTask.end_date || "None"}</p>

            <button className="btn-primary" onClick={() => setSelectedTask(null)} type="button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
