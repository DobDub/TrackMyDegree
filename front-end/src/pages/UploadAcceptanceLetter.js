import '../css/UploadAcceptanceLetter.css';
import React, { useState, useRef, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import { useNavigate, Link } from "react-router-dom";

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const UploadAcceptanceLetterPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [output, setOutput] = useState('');
  const [degrees, setDegrees] = useState([]);
  const [selectedDegreeId, setSelectedDegreeId] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [selectedRadio, setSelectedRadio] = useState({
    coOp: null,
    extendedCredit: null,
    creditDeficiency: null,
  });

  // List of specific programs to check for
  const programNames = [
    'Aerospace Engineering', 'Building Engineering', 'Civil Engineering', 'Computer Engineering',
    'Computer Science', 'Computer Science (Minor)', 'Computer Science - Computation Arts',
    'Data Science', 'Electrical Engineering', 'Health and Life Sciences', 'Indigenous Bridging Program',
    'Industrial Engineering', 'Mechanical Engineering', 'Science and Technology', 'Software Engineering'
  ];

  const generateSemesterOptions = (startYear, endYear) => {
    const terms = ['Summer', 'Fall', 'Winter'];
    const options = [];
    options.push(`Winter ${startYear}`);
    for (let year = startYear; year <= endYear; year++) {
      terms.forEach((term) => {
        options.push(`${term} ${term === 'Winter' ? year + 1 : year}`);
      });
    }
  
    return options;
  };

  // Generate Terms from 2017 to 2030
const startingSemesters = generateSemesterOptions(2017, 2030);

  const handleRadioChange = (group, value) => {
    setSelectedRadio((prev) => ({
      ...prev,
      [group]: prev[group] === value ? null : value, // Toggle selection
    }));
  };

  const handleDegreeChange = (e) => {
    setSelectedDegreeId(e.target.value);
  };

  // 3. Navigate on Next button click, passing selectedDegreeId in the route state
  const handleNextButtonClick = () => {
    // Example check to ensure something is selected:
    if (!selectedDegreeId) {
      alert('Please select a degree before continuing.');
      return;
    }

    // Pass the selectedDegreeId to the timeline page
    navigate("/timeline_change", { state: { degreeId: selectedDegreeId } });
  };

  useEffect(() => {
    // get a list of all degrees by name
    const getDegrees = async () => {
      try {
        const response = await fetch(`http://localhost:8000/degree/getAllDegrees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const jsonData = await response.json();
        console.log(jsonData);
        setDegrees(jsonData.degrees);
      } catch (err) {
        console.error(err.message);
      }


    }
    getDegrees();
  }, []);



  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.target.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.target.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.target.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (file && file.type === 'application/pdf') {
      setFileName(`File Selected: ${file.name}`);
      setSelectedFile(file);
    } else {
      alert('Please select a valid PDF file.');
      setFileName('No file chosen');
      setSelectedFile(null);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      alert('Please choose a file to upload!');
      return;
    }
    processFile(selectedFile);
    alert('File uploaded Successfully!');
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setFileName('No file chosen');
    setOutput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const typedArray = new Uint8Array(e.target.result);
      pdfjs.getDocument(typedArray).promise.then((pdf) => {
        let pagesPromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          pagesPromises.push(
            pdf.getPage(i).then((page) => {
              return page.getTextContent().then((textContentPage) => {
                return {
                  page: i,
                  text: textContentPage.items.map((item) => item.str).join(' '),
                };
              });
            })
          );
        }
        Promise.all(pagesPromises).then((pagesData) => {
          const extractedData = extractAcceptanceDetails(pagesData);
          setOutput(generateOutput(extractedData));
        });
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const extractAcceptanceDetails = (pagesData) => {
    const details = {};

    // List of specific programs to check for
    const programNames = [
      'Aerospace Engineering', 'Building Engineering', 'Civil Engineering', 'Computer Engineering',
      'Computer Science', 'Computer Science (Minor)', 'Computer Science - Computation Arts',
      'Data Science', 'Electrical Engineering', 'Health and Life Sciences', 'Indigenous Bridging Program',
      'Industrial Engineering', 'Mechanical Engineering', 'Science and Technology', 'Software Engineering'
    ];

    pagesData.forEach(({ text }) => {
      // Extract Degree Concentration (everything after Program/Plan(s) and before Academic Load)
      const degreeConcentrationMatch = text.match(/Program\/Plan\(s\):\s*([^\n]+)(?:\n([^\n]+))?[\s\S]*?Academic Load/);

      if (degreeConcentrationMatch) {
        // Combine the two parts (if any) into a single Degree Concentration string
        let degreeConcentration = (degreeConcentrationMatch[1] + (degreeConcentrationMatch[2] || '')).trim();

        // Check if any of the specific program names are present in the extracted Degree Concentration
        programNames.forEach(program => {
          if (degreeConcentration.includes(program)) {
            degreeConcentration = `${program}`; // Add the program name to the Degree Concentration if it matches
          }
        });

        // Assign to details
        details.degreeConcentration = degreeConcentration;
      }


      // Check for "Co-op Recommendation: Congratulations!"
      const coopRecommendationMatch = text.match(/Co-op Recommendation:\s*Congratulations!/);
      if (coopRecommendationMatch) {
        details.coopProgram = 'Yes';
        details.extendedCreditProgram = 'No';
      } else {
        // Extract Extended Credit Program or Co-op Program if not determined by Co-op Recommendation
        const ecpMatch = text.match(/Extended Credit Program/);
        const coopMatch = text.match(/Co-op Program/);
        if (ecpMatch) {
          details.extendedCreditProgram = 'Yes';
          details.coopProgram = 'No';
        } else if (coopMatch) {
          details.coopProgram = 'Yes';
          details.extendedCreditProgram = 'No';
        }
      }

      // Extract Starting Semester (Term)
      const sessionIndex = text.indexOf('Session');
      const minProgramLengthIndex = text.indexOf('Minimum Program Length');

      // Check if both Session and Minimum Program Length are present
      if (sessionIndex !== -1 && minProgramLengthIndex !== -1) {
        // Extract the substring between Session and Minimum Program Length
        const textBetweenSessionAndMinLength = text.substring(sessionIndex, minProgramLengthIndex);

        // Regular expression to match the term (Winter, Summer, Fall, Fall/Winter)
        const termRegex = /(\s*(Winter|Summer|Fall)\s*\d{4}\s*)|(\s*(Fall\/Winter)\s*20(\d{2})-(?!\6)\d{2})/;
        const termMatchstart = textBetweenSessionAndMinLength.match(termRegex);

        if (termMatchstart) {
          // Add the matched term to Starting Term
          details.startingTerm = termMatchstart[0].trim();
        }
      }

      // Extract Credits Required (Digits after "Minimum Program Length")
      const creditsMatch = text.match(/Minimum Program Length.*?(\d+)\s+/);
      if (creditsMatch) details.creditsRequired = creditsMatch[1]?.trim();

      // Extract Expected Graduation Term (Winter 2024, Fall/Winter 2023-2024)
      const expectedGradTermIndex = text.indexOf('Expected Graduation Term');
      const admissionStatusIndex = text.indexOf('Admission Status');

      if (expectedGradTermIndex !== -1 && admissionStatusIndex !== -1) {
        // Extract the substring between Expected Graduation Term and Admission Status
        const textBetweenExpectedGradTermAndStatus = text.substring(expectedGradTermIndex, admissionStatusIndex);

        // Regex for matching terms like Winter 2024, Fall/Winter 2023-2024
        const termRegex = /(\s*(Winter|Summer|Fall)\s*\d{4}\s*)|(\s*(Fall\/Winter)\s*20(\d{2})-(?!\6)\d{2})/;
        const termMatch = textBetweenExpectedGradTermAndStatus.match(termRegex);

        if (termMatch) {
          // Add matched term to Expected Graduation Term
          details.expectedGraduationTerm = termMatch[0].trim();
        }
      }

      // Extract Exemptions Courses (Regex match for courses)
      const exemptionsIndex = text.indexOf('Exemptions');
      const deficienciesIndex = text.indexOf('Deficiencies');

      if (exemptionsIndex !== -1 && deficienciesIndex !== -1) {
        // Extract the substring between Exemptions and Deficiencies
        const textBetweenExemptionsAndDeficiencies = text.substring(exemptionsIndex, deficienciesIndex);

        // Regex for matching course codes (e.g., MATH 101)
        const courseRegex = /([A-Za-z]{3,4})\s+(\d{3})\s+/g;
        let courseMatch;
        const exemptionsCourses = [];

        // Find all course matches
        while ((courseMatch = courseRegex.exec(textBetweenExemptionsAndDeficiencies)) !== null) {
          exemptionsCourses.push(courseMatch[0].trim());
        }

        if (exemptionsCourses.length > 0) {
          // Add matched courses to Exemptions courses
          details.exemptionsCourses = exemptionsCourses;
        }
      }

      // Extract Deficiencies Courses (Regex match for courses)
      const deficienciesMatchIndex = text.indexOf('Deficiencies');
      const transferCreditsIndex = text.indexOf('Transfer Credits');

      if (deficienciesMatchIndex !== -1 && transferCreditsIndex !== -1) {
        // Extract the substring between Deficiencies and Transfer Credits
        const textBetweenDeficienciesAndTransferCredits = text.substring(deficienciesMatchIndex, transferCreditsIndex);

        // Regex for matching course codes (e.g., MATH 101)
        const courseRegex = /([A-Za-z]{3,4})\s+((\d{3})|[A-Z]{1,2})\s+/g;
        let courseMatch;
        const deficienciesCourses = [];

        // Find all course matches
        while ((courseMatch = courseRegex.exec(textBetweenDeficienciesAndTransferCredits)) !== null) {
          deficienciesCourses.push(courseMatch[0].trim());
        }

        if (deficienciesCourses.length > 0) {
          // Add matched courses to Deficiencies courses
          details.deficienciesCourses = deficienciesCourses;
        }
      }

      // Extract Transfer Credits and respective credits
      const noteIndex = text.indexOf('NOTE:');

      if (transferCreditsIndex !== -1 && noteIndex !== -1) {
        const textBetweenTransferAndNote = text.substring(transferCreditsIndex, noteIndex);

        // Regex for matching courses (e.g., COMM A, ECON 201)
        const courseRegex = /(\s+[A-Z]{3,4})\s+((\d{3})|[A-Z]{1,2})\s+/g;
        const creditRegex = /(\d+)\s+crs/; // Regex for matching credits (e.g., "3 crs")

        let courseMatch;
        const transferCredits = [];

        while ((courseMatch = courseRegex.exec(textBetweenTransferAndNote)) !== null) {
          const course = courseMatch[0].trim();
          // Look for the credits on the same line as the course
          const lineContainingCourse = textBetweenTransferAndNote
            .split('\n')
            .find((line) => line.includes(course));

          const creditMatch = lineContainingCourse?.match(creditRegex);
          const credits = creditMatch ? `${creditMatch[1]} crs` : 'Credits not found';

          transferCredits.push({ course, credits });
        }

        if (transferCredits.length > 0) {
          details.transferCredits = transferCredits;
        }
      }
    });

    return details;
  };

  const generateOutput = (data) => {
    if (data) {
      const transferCreditsHtml = data.transferCredits
        ? data.transferCredits
          .map(
            (credit) =>
              `<li>${credit.course} - ${credit.credits}</li>`
          )
          .join('')
        : 'None';
      return `
        <h3>Extracted Details:</h3>
        <ul>
          <li><strong>Degree Concentration:</strong> ${data.degreeConcentration || 'Not found'}</li>
          <li><strong>Starting Term:</strong> ${data.startingTerm || 'Not found'}</li>
          <li><strong>Co-op Program:</strong> ${data.coopProgram || 'Not found'}</li>
          <li><strong>Extended Credit Program:</strong> ${data.extendedCreditProgram || 'Not found'}</li>
          <li><strong>Credits Required:</strong> ${data.creditsRequired || 'Not found'}</li>
          <li><strong>Expected Graduation Term:</strong> ${data.expectedGraduationTerm || 'Not found'}</li>
          <li><strong>Exemptions Courses:</strong> ${data.exemptionsCourses ? data.exemptionsCourses.join(', ') : 'Not found'}</li>
          <li><strong>Deficiencies Courses:</strong> ${data.deficienciesCourses ? data.deficienciesCourses.join(', ') : 'Not found'}</li>
          <li><strong>Transfer Credits:</strong></li>
          <ul>${transferCreditsHtml}</ul>
        </ul>`;
    } else {
      return `<h3>No relevant data found in the acceptance letter.</h3>`;
    }
  };

  return (
    <div className="top-down">
      <div className="g-container">
        <div className="form-container-al">
          <h2>Required Information</h2>
          <p>
            Manually fill out the following information so we can help you create
            the perfect timeline
          </p>
          <form>
            <div>
              <label htmlFor="degree-concentration">Degree Concentration:</label>
              <select id="degree-concentration" className="input-field" onChange={handleDegreeChange}>
              <option value="">-- Select a Degree --</option>
                {degrees.map((degree) => (
                  <option key={degree.id} value={degree.id}>{degree.name}</option>
                ))}

              </select>
            </div>
            <div>
              <label htmlFor="starting-semester">Starting Semester:</label>
              <select id="starting-semester" className="input-field">
                {startingSemesters.map((semester, index) => (
                  <option key={index} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </div>
            <div className="radio-group">
              <span className="cooo">Co-op Program? </span>
              <label>
                <input type="checkbox" name="co-op" value="yes" />
              </label>
            </div>
            <div className="radio-group">
              <span className="cooo">Extended Credit Program? </span>
              <label>
                <input type="checkbox" name="extended-credit" value="yes" />
              </label>
            </div>
            <div className="radio-group">
              <span className="cooo">Credit Deficiency? </span>
              <label>
                <input type="checkbox" name="credit-deficiency" value="yes" />
              </label>
            </div>
          </form>
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button onClick={handleNextButtonClick} className="next-button">Next</button>
        </div>

        <div className="or-divider">OR</div>


        <div className="upload-container-al">
          <h2>Upload Acceptance Letter</h2>
          <p>Upload your acceptance letter to automatically fill out the required information</p>
          <div
            className="upload-box-al"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p>Drag and Drop file</p>
            or
            <label htmlFor="file-upload" className="file-label">Browse</label>
            <input
              type="file"
              id="file-upload"
              accept="application/pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <p className="file-name">{fileName}</p>
          </div>

          <button className="create-button" onClick={handleSubmit}>
            Create Timeline
          </button>
          {output && <div id="output" dangerouslySetInnerHTML={{ __html: output }}></div>}
          <p>
            To upload your unofficial transcript, please click here!
          </p>
          <button
            className="upload-transcript-button"
            onClick={() => navigate('/uploadTranscript')}
          >
            Upload Transcript
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadAcceptanceLetterPage;