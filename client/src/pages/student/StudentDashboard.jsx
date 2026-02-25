function StudentDashboard() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Student Dashboard</h1>
      <p>Welcome, Student!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default StudentDashboard;