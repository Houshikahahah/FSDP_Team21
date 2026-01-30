// Dashboard.js
import "./Dashboard.css";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const TIME_RANGES = ["today", "7d", "30d", "all"];

const rangeLabel = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

// Kanban statuses
const STATUS_TODO = "todo";
const STATUS_PROGRESS = "progress";
const STATUS_DONE = "done";

// ----- helpers -----
function getStartDate(range) {
  const now = new Date();
  if (range === "all") return null;

  const start = new Date(now);
  if (range === "today") start.setHours(0, 0, 0, 0);
  if (range === "7d") start.setDate(now.getDate() - 7);
  if (range === "30d") start.setDate(now.getDate() - 30);
  return start;
}

function safeDate(d) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function dayKeyLocal(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildDoneTrendPolyline(tasks, daysCount = 7, width = 480, height = 120) {
  const now = new Date();
  const days = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  const counts = {};
  days.forEach((d) => (counts[dayKeyLocal(d)] = 0));

  tasks.forEach((t) => {
    if (t.status !== STATUS_DONE) return;
    const dt = safeDate(t.updated_at || t.created_at);
    if (!dt) return;
    const k = dayKeyLocal(dt);
    if (k in counts) counts[k] += 1;
  });

  const values = days.map((d) => counts[dayKeyLocal(d)] || 0);

  // IMPORTANT: never let max be 0 (keeps line visible / stable)
  const maxY = Math.max(1, ...values);
  const stepX = width / Math.max(1, days.length - 1);

  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = height - (v / maxY) * (height - 10);
    return `${x},${y}`;
  });

  return pts.join(" ");
}

export default function Dashboard({ user, profile }) {
  const uid = user?.id;

  // ✅ org sync source (set in KanbanBoard.js)
  const activeOrgId = useMemo(() => {
    return localStorage.getItem("activeOrgId") || null;
  }, []);

  const isOrgMode = !!activeOrgId;

  const [timeRange, setTimeRange] = useState("today");
  const [tasks, setTasks] = useState([]);
  const [liveConnected, setLiveConnected] = useState(false);

  // ✅ org name (instead of org id)
  const [orgName, setOrgName] = useState("");

  // ✅ top-right search
  const [searchQuery, setSearchQuery] = useState("");

  // ---------------------------
  // Fetch org name (if org mode)
  // ---------------------------
  useEffect(() => {
    const fetchOrgName = async () => {
      if (!isOrgMode || !activeOrgId) {
        setOrgName("");
        return;
      }

      const { data, error } = await supabase
        .from("organisations")
        .select("name")
        .eq("id", activeOrgId)
        .single();

      if (error) {
        console.error("Dashboard fetchOrgName error:", error);
        setOrgName("Organisation");
        return;
      }

      setOrgName(data?.name || "Organisation");
    };

    fetchOrgName();
  }, [isOrgMode, activeOrgId]);

  // ---------------------------
  // ✅ SAME TASK SCOPE AS KANBAN (org = whole org)
  // ---------------------------
  useEffect(() => {
    if (!uid) return;

    const fetchTasks = async () => {
      let q = supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          description,
          type,
          priority,
          estimation,
          start_date,
          end_date,
          status,
          user_id,
          assigned_to,
          organisation_id,
          is_main_board,
          created_at,
          updated_at,
          ai_output,
          ai_agent,
          ai_status,
          profiles:user_id (username)
        `
        )
        .order("created_at", { ascending: false });

      if (isOrgMode && activeOrgId) {
        // ✅ WHOLE ORG
        q = q.eq("organisation_id", activeOrgId);
      } else {
        // ✅ personal only
        q = q.is("organisation_id", null).eq("user_id", uid);
      }

      const { data, error } = await q;
      if (error) console.error("Dashboard fetchTasks error:", error);
      setTasks(Array.isArray(data) ? data : []);
    };

    fetchTasks();

    const channelName = `dashboard_tasks_${uid}_${isOrgMode ? activeOrgId : "personal"}`;

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchTasks)
      .subscribe((status) => {
        setLiveConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, isOrgMode, activeOrgId]);

  // ----- time range filtering -----
  const rangeTasks = useMemo(() => {
    const start = getStartDate(timeRange);
    if (!start) return tasks;

    return tasks.filter((t) => {
      const dt = safeDate(t.updated_at || t.created_at);
      if (!dt) return false;
      return dt >= start;
    });
  }, [tasks, timeRange]);

  // ✅ Search filtering (tasks + agents)
  const filteredTasks = useMemo(() => {
    const q = String(searchQuery || "").trim().toLowerCase();
    if (!q) return rangeTasks;

    return rangeTasks.filter((t) => {
      const title = String(t.title || "").toLowerCase();
      const desc = String(t.description || "").toLowerCase();
      const agent = String(t.ai_agent || "").toLowerCase();
      const status = String(t.status || "").toLowerCase();
      const type = String(t.type || "").toLowerCase();
      const priority = String(t.priority || "").toLowerCase();
      return (
        title.includes(q) ||
        desc.includes(q) ||
        agent.includes(q) ||
        status.includes(q) ||
        type.includes(q) ||
        priority.includes(q)
      );
    });
  }, [rangeTasks, searchQuery]);

  // ----- KPI metrics (based on filteredTasks) -----
  const metrics = useMemo(() => {
    const total = filteredTasks.length;
    const inProgress = filteredTasks.filter((t) => t.status === STATUS_PROGRESS).length;
    const completed = filteredTasks.filter((t) => t.status === STATUS_DONE).length;

    const now = new Date();
    const overdue = filteredTasks.filter((t) => {
      if (!t.end_date) return false;
      const d = safeDate(t.end_date);
      if (!d) return false;
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return end < today && t.status !== STATUS_DONE;
    }).length;

    return { total, inProgress, completed, overdue };
  }, [filteredTasks]);

  // ----- Agents panel (based on filteredTasks) -----
  const agents = useMemo(() => {
    const map = new Map();

    filteredTasks.forEach((t) => {
      const agentName = t.ai_agent;
      if (!agentName) return;
      if (!map.has(agentName)) map.set(agentName, []);
      map.get(agentName).push(t);
    });

    const list = Array.from(map.entries()).map(([agentName, agentTasks]) => {
      const thinking = agentTasks.find((x) => x.ai_status === "thinking");
      const inProg = agentTasks.find((x) => x.status === STATUS_PROGRESS);
      const latest = [...agentTasks].sort((a, b) => {
        const da = safeDate(a.updated_at || a.created_at)?.getTime() || 0;
        const db = safeDate(b.updated_at || b.created_at)?.getTime() || 0;
        return db - da;
      })[0];

      const current = thinking || inProg || latest;

      const status =
        current?.ai_status === "thinking"
          ? "Running"
          : current?.status === STATUS_PROGRESS
          ? "Active"
          : current?.status === STATUS_DONE
          ? "Completed"
          : "Idle";

      const progress =
        current?.ai_status === "thinking"
          ? 60
          : current?.status === STATUS_PROGRESS
          ? 40
          : current?.status === STATUS_DONE
          ? 100
          : 0;

      return {
        id: agentName,
        name: agentName,
        status,
        task: current?.title || "—",
        progress,
      };
    });

    // ✅ search can also match agent name (even if no tasks matched title/desc)
    const q = String(searchQuery || "").trim().toLowerCase();
    if (!q) return list;

    return list.filter((a) => {
      const name = String(a.name || "").toLowerCase();
      const task = String(a.task || "").toLowerCase();
      const st = String(a.status || "").toLowerCase();
      return name.includes(q) || task.includes(q) || st.includes(q);
    });
  }, [filteredTasks, searchQuery]);

  // ----- Analytics (based on metrics + agents) -----
  const analytics = useMemo(() => {
    const total = metrics.total || 0;
    const completion = total === 0 ? 0 : Math.round((metrics.completed / total) * 100);

    const utilization =
      agents.length === 0
        ? 0
        : agents.filter((a) => a.status === "Running" || a.status === "Active").length / agents.length;

    const rangeDays = timeRange === "today" ? 1 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 30;
    const throughput = Math.min(1, metrics.completed / Math.max(1, rangeDays));
    const efficiency = Math.min(1, (completion / 100) * (0.5 + utilization / 2));

    return { completion, utilization, throughput, efficiency };
  }, [metrics, agents, timeRange]);

  // ----- Feed (based on filteredTasks) -----
  const combinedFeed = useMemo(() => {
    const recent = [...filteredTasks]
      .sort((a, b) => {
        const da = safeDate(a.updated_at || a.created_at)?.getTime() || 0;
        const db = safeDate(b.updated_at || b.created_at)?.getTime() || 0;
        return db - da;
      })
      .slice(0, 8);

    return recent.map((t) => {
      if (t.ai_status === "thinking") return `AI is working on: ${t.title}`;
      if (t.status === STATUS_DONE) return `Task completed: ${t.title}`;
      if (t.status === STATUS_PROGRESS) return `In progress: ${t.title}`;
      return `Task updated: ${t.title}`;
    });
  }, [filteredTasks]);

  // ✅ Trend days: never 1 day (graph disappears). Today shows last 7 days.
  const trendDays = useMemo(() => {
    if (timeRange === "today") return 7;
    if (timeRange === "7d") return 7;
    if (timeRange === "30d") return 30;
    return 30;
  }, [timeRange]);

  // ✅ Polyline uses the FULL tasks list (so trend isn't ruined by search)
  const polyPoints = useMemo(() => {
    // If you want the trend to also respect org/personal, keep tasks (already scoped)
    return buildDoneTrendPolyline(tasks, trendDays, 480, 120);
  }, [tasks, trendDays]);

  return (
    <div className="dashboard-body">
      <header className="dash-header-bar">
        <h1 className="page-title">Dashboard</h1>

        <div className="header-right">
          <input
            className="search-input"
            placeholder="Search tasks or agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="user-chip">{liveConnected ? "ON" : "OFF"}</div>
        </div>
      </header>

      <div style={{ marginBottom: 10, fontSize: 13, color: "#6b7280" }}>
        Mode: <b>{isOrgMode ? "Organisation" : "Personal"}</b>
        {isOrgMode && activeOrgId ? (
          <>
            {" "}
            • Organisation: <b>{orgName || "Loading..."}</b>
          </>
        ) : null}
      </div>

      <div className="stats-row">
        <div className="stats-card">
          <h4>Total Tasks</h4>
          <p>{metrics.total}</p>
          <span className="stat-sub">All tasks in the system</span>
        </div>

        <div className="stats-card">
          <h4>In Progress</h4>
          <p>{metrics.inProgress}</p>
          <span className="stat-sub">Currently being handled</span>
        </div>

        <div className="stats-card">
          <h4>Completed</h4>
          <p>{metrics.completed}</p>
          <span className="stat-sub">Successfully finished</span>
        </div>

        <div className={`stats-card ${metrics.overdue ? "overdue-card" : ""}`}>
          <h4>Overdue</h4>
          <p className="overdue">{metrics.overdue}</p>
          <span className="stat-sub">Require attention</span>
        </div>
      </div>

      <div className="time-filter-row">
        <span className="time-filter-label">Time range:</span>
        <div className="time-filter-pills">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              className={`time-pill ${timeRange === range ? "active" : ""}`}
              onClick={() => setTimeRange(range)}
              type="button"
            >
              {rangeLabel[range]}
            </button>
          ))}
        </div>
      </div>

      <div className="main-grid">
        <div className="grid-top">
          <section className="panel analytics-panel">
            <div className="panel-header">
              <h2>Workflow Analytics</h2>
              {/* ✅ not hardcoded */}
              <span className="panel-tag subtle">{rangeLabel[timeRange]}</span>
            </div>

            <div className="analytics-top">
              <div className="analytics-donut" style={{ "--donut-stop": `${analytics.completion}%` }}>
                <div className="donut-inner">
                  <p>{analytics.completion}%</p>
                  <span>Overall progress</span>
                </div>
              </div>

              <div className="metrics-bars">
                <div className="metric-row">
                  <span>Agent Utilization</span>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${analytics.utilization * 100}%` }} />
                  </div>
                </div>

                <div className="metric-row">
                  <span>Task Throughput</span>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${analytics.throughput * 100}%` }} />
                  </div>
                </div>

                <div className="metric-row">
                  <span>AI Efficiency Score</span>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${analytics.efficiency * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="panel linechart-panel">
            <div className="panel-header">
              <h2>Workflow Efficiency</h2>
              {/* ✅ not hardcoded, and makes sense for today */}
              <span className="panel-tag subtle">
                Done trend ({timeRange === "today" ? "7 days" : rangeLabel[timeRange]})
              </span>
            </div>

            <div className="line-chart">
              <div className="line-chart-header">
                <span>Tasks completed over time</span>
                <span className="chart-period">
                  {timeRange === "today" ? "Last 7 days" : rangeLabel[timeRange]}
                </span>
              </div>

              <svg className="linechart-svg" viewBox="0 0 480 120" preserveAspectRatio="none">
                <polyline
                  className="chart-line"
                  points={polyPoints}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </section>
        </div>

        <div className="grid-bottom">
          <section className="panel feed-panel">
            <div className="panel-header">
              <h2>Live Activity Feed</h2>
              {/* ✅ not hardcoded */}
              <span className="panel-tag subtle">{rangeLabel[timeRange]}</span>
            </div>

            <ul className="feed-list">
              {combinedFeed.length === 0 ? (
                <li className="feed-item">
                  <span className="plane-icon" />
                  <span>No recent activity.</span>
                </li>
              ) : (
                combinedFeed.map((item, index) => (
                  <li key={`${item}-${index}`} className="feed-item">
                    <span className="plane-icon" />
                    <span>{item}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="panel agent-panel">
            <div className="panel-header">
              <h2>Agent Status</h2>
              <span className="panel-tag">{liveConnected ? "Live" : "Offline"}</span>
            </div>

            {agents.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                No agents found yet (assign AI to a task first).
              </div>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="agent-card">
                  <div className="agent-row">
                    <div>
                      <strong>{agent.name}</strong>
                      <p className="agent-task">Task: {agent.task}</p>
                    </div>
                    <span className={`agent-badge ${agent.status.toLowerCase()}`}>{agent.status}</span>
                  </div>

                  <div className="agent-progress">
                    <div className="agent-progress-fill" style={{ width: `${agent.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
