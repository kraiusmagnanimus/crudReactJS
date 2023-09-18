import React, { createContext, useState, useContext } from "react";
import axios from "axios";

const ProjectsContext = createContext();

export const useProjects = () => {
  return useContext(ProjectsContext);
};

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);

  const fetchProjects = () => {
    axios
      .get("https://lagueslo.com:2900/readProjects")
      .then((response) => {
        if (Array.isArray(response.data)) {
          setProjects(response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  return (
    <ProjectsContext.Provider value={{ projects, fetchProjects }}>
      {children}
    </ProjectsContext.Provider>
  );
};
