import React from "react";
import ProjectList from "./components/ProjectList.js";
import AddProject from "./components/AddProject.js";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "./styles/css/style.css";
import { ProjectsProvider } from "./components/ProjectsContext";

function App({ children }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {children}
      <div className="App">
        <h1>Project Dashboard</h1>
        <ProjectsProvider>
          <AddProject />
          <ProjectList />
        </ProjectsProvider>
      </div>
    </LocalizationProvider>
  );
}

export default App;
