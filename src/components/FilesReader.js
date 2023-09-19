import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '.././styles/css/style.css';

const FilesReader = ({ projectID }) => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Fetch files from the server for the specific project
    if (projectID) {
      axios.get(`https://lagueslo.com:3001/getFiles/${projectID}`)
      .then(response => setFiles(response.data))
      .catch(error => console.error('Error fetching files:', error));
    }
  }, [projectID]);

  // Render the list of files in a table
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, index) => (
            <tr key={index}>
              <td class="fileReaderFileName">{file.name}</td>
              <td>
                <a href={file.url} target="_blank" rel="noopener noreferrer"><button>View</button></a> | 
                <a href={file.url} download><button>Download</button></a> | 
                <button onClick={() => {/* logic to delete file */}}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FilesReader;
