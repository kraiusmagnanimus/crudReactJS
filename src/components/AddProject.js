import React, { useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useProjects } from "./ProjectsContext";
import ".././styles/css/style.css";

Modal.setAppElement("#root");
function AddProject() {
  const { fetchProjects } = useProjects();
  const [newProject, setNewProject] = useState({
    ProposedProject: "",
    Author: "",
    Description: "",
    EstimatedTimeline: "",
  });
  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: null,
      key: "selection",
    },
  ]);
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({ ...newProject, [name]: value });
  };
  const addProject = () => {
    const [{ startDate, endDate }] = state;
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = endDate ? formatDate(endDate) : null;
    const timeFrameRange = formattedStartDate + " to " + formattedEndDate;
    const projectWithDateRange = {
      ...newProject,
      EstimatedTimeline: timeFrameRange,
    };
    axios
      .post("https://lagueslo.com:2900/createProjects", projectWithDateRange)
      .then(() => {
        alert("Project added successfully");
        fetchProjects();
        setModalIsOpen(false);
      });
  };

  return (
    <div>
      <h2>Projects</h2>
      <button onClick={() => setModalIsOpen(true)} class="addProjectBtn">
        Add New Project
      </button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="modal-content"
      >
        <h2>Add New Project</h2>
        <input
          type="text"
          name="ProposedProject"
          placeholder="Proposed Project"
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="Author"
          placeholder="Author"
          onChange={handleInputChange}
        />
        <textarea
          className="descriptionTextarea"
          name="Description"
          placeholder="Description"
          onChange={handleInputChange}
        />
        <label>Timeframe</label>
        <DateRange
          className="dateRangePicker"
          editableDateInputs={true}
          onChange={(item) => setState([item.selection])}
          moveRangeOnFirstSelection={false}
          ranges={state}
        />
        <button onClick={addProject}>Add Project</button>
        <button onClick={() => setModalIsOpen(false)}>Close</button>
      </Modal>
    </div>
  );
}

export default AddProject;
