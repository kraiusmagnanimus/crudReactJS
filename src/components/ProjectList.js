import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useProjects } from './ProjectsContext';
import FilesReader from './FilesReader';


function ProjectList() {
  const [selectedProjects, setSelectedProjects] = useState([]);
  const {projects, fetchProjects } = useProjects();
  const [editingProject, setEditingProject] = useState(null);
  const [setProjects] = useState([]);
  const [isMasterCheckboxChecked, setMasterCheckboxChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState({ type: '', ID: null });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [filesModalIsOpen, setFilesModalIsOpen] = useState(false);
  const [currentProjectID, setCurrentProjectID] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState(null);

  const openFilesModal = (projectID) => {
    setCurrentProjectID(projectID);
    setFilesModalIsOpen(true);
  };
  
  
  const handleDeleteConfirmation = (ID) => {
    setConfirmationData({ type: 'delete', ID });
    setIsConfirmationModalOpen(true);
  };
  
  const handleEditConfirmation = () => {
    setConfirmationData({ type: 'update', ID: editingProject.ID });
    setIsConfirmationModalOpen(true);
  };

  const executeConfirmedAction = () => {
    if (confirmationData.type === 'delete') {
      deleteProject(confirmationData.ID);
    } else if (confirmationData.type === 'update') {
      editProject();
    } else if (confirmationData.type === 'bulkDelete') {
      // Make an API call to bulk delete the selected projects
      axios.post('https://lagueslo.com:3001/bulkDeleteProjects', { ids: confirmationData.IDs })
        .then(response => {
          if (response.data.success) {
            fetchProjects();
            setSelectedProjects([]);  // Clear selection
          } else {
            alert('Failed to delete projects');
          }
        })
        .catch(error => {
          alert('An error occurred while deleting the projects');
          console.error(error);
        });
    }
    // Close the confirmation modal
    setIsConfirmationModalOpen(false);
  };


  const filteredProjects = projects.filter(project => 
    project.ProposedProject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (project) => {
    setEditingProject(project);
  };

  const toggleProjectSelection = (id) => {
    setSelectedProjects({
      ...selectedProjects,
      [id]: !selectedProjects[id]
    });
  };

  const toggleMasterCheckbox = () => {
    if (Object.values(selectedProjects).every(Boolean)) {
      setSelectedProjects({});
    } else {
      const newSelectedProjects = {};
      projects.forEach(project => {
        newSelectedProjects[project.ID] = true;
      });
      setSelectedProjects(newSelectedProjects);
    }
  };

  const handleMasterCheckboxChange = () => {
    if (isMasterCheckboxChecked) {
      // If currently checked, uncheck all
      setSelectedProjects([]);
    } else {
      // If currently unchecked, select all project IDs
      const allProjectIds = projects.map(p => p.ID);
      setSelectedProjects(allProjectIds);
    }
    setMasterCheckboxChecked(!isMasterCheckboxChecked);
  };

  const handleIndividualCheckboxChange = (projectId) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    } else {
      setSelectedProjects([...selectedProjects, projectId]);
    }
  };

  useEffect(() => {
    // Automatically check or uncheck the master checkbox
    if (projects.length > 0 && Object.values(selectedProjects).every(Boolean)) {
      // Code to check the master checkbox
    } else {
      // Code to uncheck the master checkbox
    }
  }, [projects, selectedProjects]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const deleteProject = (ID) => {
      axios.delete(`https://lagueslo.com:3001/deleteProject?id=${ID}`)
        .then(response => {
          if (response.data.success) {
            fetchProjects();
          } else {
            alert('Failed to delete project');
          }
        })
        .catch(error => {
          alert('An error occurred while deleting the project');
          console.error(error);
        });
    
  };
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };


  
  const handleDateChange = (item) => {
    const { startDate, endDate } = item.selection;
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const timeFrameRange = formattedStartDate + " to " + formattedEndDate;
    setEditingProject({ ...editingProject, EstimatedTimeline: timeFrameRange });
  };
  
  const handleBulkDeleteConfirmation = () => {
    setConfirmationData({ type: 'bulkDelete', IDs: selectedProjects });
    setIsConfirmationModalOpen(true);
  };



  const editProject = () => {
    const formData = new FormData();
    formData.append('ID', editingProject.ID);
    formData.append('ProposedProject', editingProject.ProposedProject);
    formData.append('Author', editingProject.Author);
    formData.append('Description', editingProject.Description);
    formData.append('EstimatedTimeline', editingProject.EstimatedTimeline);
  
    // Add the uploaded files to the FormData object
    uploadedFiles.forEach((file, index) => {
      formData.append(`files`, file, file.name);
    });
  
    // Use 'Content-Type': 'multipart/form-data' for file uploading
    axios.put('https://lagueslo.com:3001/updateProject', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      if (response.data && response.data.message === 'Project updated successfully') {
        alert('Project updated successfully');
        fetchProjects();
        setEditingProject(null); // Close the modal
        setUploadedFiles([]); // Clear the uploaded files
      } else {
        alert('Failed to update project');
      }
    })
    .catch(error => {
      console.error('An error occurred while updating the project:', error);
      alert('An error occurred. Please try again.');
    });
  };
  
  


  return (
    <div>
      <h2>Project List</h2>
      <input
        className="searchBar"
        type="text"
        placeholder="Search Proposed Project"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <br></br>
      <button onClick={handleBulkDeleteConfirmation} className="bulkDeleteBtn" disabled={!selectedProjects.length}>Bulk Delete</button>
      {/* Dropdown for suggestions */}
      {Array.isArray(projects) ? (
        <table>
          <thead>
            <tr>
            <th>
            <input
              type="checkbox"
              checked={isMasterCheckboxChecked}
              onChange={handleMasterCheckboxChange}
            />
              </th>
              <th>Proposed Project</th>
              <th>Date Added</th>
              <th>Author</th>
              <th>Description Excerpt</th>
              <th>Estimated Timeline</th>
              <th>Actions</th>
              <th>Files</th>
            </tr>
          </thead>
          <tbody>
          {filteredProjects.map((project) => (
              <tr key={project.ID}>
                        <td>
                        <input
                            type="checkbox"
                            checked={selectedProjects.includes(project.ID)}
                            onChange={() => handleIndividualCheckboxChange(project.ID)}
                          />
                          </td>
                          <td onClick={() => openEditModal(project)}>{project.ProposedProject}</td>
                          <td onClick={() => openEditModal(project)}>{project.DateAdded}</td>
                          <td onClick={() => openEditModal(project)}>{project.Author}</td>
                          <td onClick={() => openEditModal(project)}>
                            {
                              // Split by spaces, take the first 10 words, and join them back together
                              project.Description.split(" ").slice(0, 10).join(" ") + 
                              (project.Description.split(" ").length > 10 ? "..." : "")
                            }
                          </td>
                          <td onClick={() => openEditModal(project)}>{project.EstimatedTimeline}</td>
                          <td>
                            <button onClick={() => openEditModal(project)}>Edit</button>
                            <button onClick={() => handleDeleteConfirmation(project.ID)}>Delete</button>
                          </td>
                          <td>
                          <button onClick={() => openFilesModal(project.ID)}>Files</button>
                          </td>
                </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No projects to display.</p>
      )}
     <Modal isOpen={!!editingProject} onRequestClose={() => setEditingProject(null)} className="modal-content">
        <h2>Edit Project</h2>
        {editingProject && (
          <>
             <input
              type="text"
              name="ProposedProject"
              value={editingProject.ProposedProject}
              placeholder="Proposed Project"
              onChange={(e) => setEditingProject({ ...editingProject, ProposedProject: e.target.value })}
            />
            <input
              type="text"
              name="Author"
              value={editingProject.Author}
              placeholder="Author"
              onChange={(e) => setEditingProject({ ...editingProject, Author: e.target.value })}
            />
            <textarea
              className="descriptionTextarea"
              name="Description"
              value={editingProject.Description}
              placeholder="Description"
              onChange={(e) => setEditingProject({ ...editingProject, Description: e.target.value })}
            />
            <label>Timeframe</label>
            {(() => {
              const [startDateStr, endDateStr] = editingProject.EstimatedTimeline.split(' to ');
              const startDate = new Date(startDateStr);
              const endDate = new Date(endDateStr);
              return (
                <DateRange
                  className="dateRangePicker"
                  editableDateInputs={true}
                  onChange={handleDateChange}
                  moveRangeOnFirstSelection={false}
                  ranges={[
                    {
                      startDate: startDate,
                      endDate: endDate,
                      key: 'selection'
                    }
                  ]}
                />
              );
            })()}
            <input
              className="fileReaderUploader"
              type="file"
              multiple
              onChange={(e) => setUploadedFiles(Array.from(e.target.files))}
            />
          </>
        )}
        <button onClick={handleEditConfirmation}>Update Project</button>
        <button onClick={() => setEditingProject(null)}>Close</button>
      </Modal>

    <Modal isOpen={isConfirmationModalOpen} onRequestClose={() => setIsConfirmationModalOpen(false)} className="modal-content">
      <h2>Confirmation</h2>
      <p>
        {confirmationData.type === 'bulkDelete' ? 
          'Are you sure you want to delete the selected projects?' : 
          `Are you sure you want to ${confirmationData.type} this project?`
        }
      </p>
      <button onClick={executeConfirmedAction}>Yes</button>
      <button onClick={() => setIsConfirmationModalOpen(false)}>No</button>
    </Modal>
    <Modal className="fileReaderModal" isOpen={filesModalIsOpen} onRequestClose={() => setFilesModalIsOpen(false)}>
      {currentProjectID && <FilesReader projectID={currentProjectID} />}
      <button onClick={() => setFilesModalIsOpen(false)}>Close</button>
    </Modal>

    </div>
    
  );
}

export default ProjectList;
