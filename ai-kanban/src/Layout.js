import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: "230px", width: "100%" }}>
        {children}
      </div>
    </div>
  );
}
