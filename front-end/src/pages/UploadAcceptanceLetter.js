import '../css/UploadAcceptanceLetter.css';
import React, { useState, useRef, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Sentry from '@sentry/react';

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const UploadAcceptanceLetterPage = ({ onDataProcessed }) => {
  const isFirstRender = useRef(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [output, setOutput] = useState('');
  const [degrees, setDegrees] = useState([]);
  const [selectedDegreeId, setSelectedDegreeId] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(''); // No default value
  const [selectedYear, setSelectedYear] = useState(''); // No default value
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [selectedRadio, setSelectedRadio] = useState({
    coOp: null,
    extendedCredit: null,
    creditDeficiency: null,
  });

  useEffect(() => {
    if (isFirstRender.current) {
      onDataProcessed(); // Clear old timeline data on load
      isFirstRender.current = false;
    }
    
  }, [onDataProcessed]);

  // List of specific programs to check for
  const programNames = [
    'Aerospace Engineering', 'Building Engineering', 'Civil Engineering', 'Computer Engineering',
    'Computer Science', 'Computer Science (Minor)', 'Computer Science - Computation Arts',
    'Data Science', 'Electrical Engineering', 'Health and Life Sciences', 'Indigenous Bridging Program',
    'Industrial Engineering', 'Mechanical Engineering', 'Science and Technology', 'Software Engineering'
  ];

  const handleRadioChange = (group, value) => {
    setSelectedRadio((prev) => ({
      ...prev,
      [group]: prev[group] === value ? null : value, // Toggle selection
    }));
  };

  const handleDegreeChange = (e) => {
    setSelectedDegreeId(e.target.value);
  };

  // Navigate on Next button click, passing the selected degree and combined starting semester
  const handleNextButtonClick = () => {
    // Example check to ensure something is selected:
    if (!selectedDegreeId) {
      alert('Please select a degree before continuing.');
      return;
    }

    if (!selectedTerm || !selectedYear) {
      alert('Please select both a term and a year for your starting semester.');
      return;
    }
    const startingSemester = `${selectedTerm} ${selectedYear}`;

    const matched_degree = degrees.find(d => d.id === selectedDegreeId);
    const credits_Required = matched_degree.totalCredits;

    // Pass the selectedDegreeId, creditsRequired, and startingSemester to the timeline page
    localStorage.setItem('Timeline_Name', null);

    console.log('select: ', selectedRadio.extendedCredit);
    navigate('/timeline_change', {
      state: {
        degree_Id: selectedDegreeId,
        startingSemester: startingSemester,
        coOp: selectedRadio.coOp,
        credits_Required: credits_Required,
        extendedCredit: selectedRadio.extendedCredit,
        creditDeficiency: selectedRadio.creditDeficiency,
      },
    });
  };

  useEffect(() => {
    // get a list of all degrees by name
    const getDegrees = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_SERVER}/degree/getAllDegrees`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        const jsonData = await response.json();
        console.log(jsonData);
        setDegrees(jsonData.degrees);
      } catch (err) {
        Sentry.captureException(err);
        console.error(err.message);
      }
    };
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
            }),
          );
        }
        Promise.all(pagesPromises).then((pagesData) => {
          const extractedData = extractAcceptanceDetails(pagesData);
          const transcriptData = matchTermsWithCourses(extractedData.results);
          //setOutput(generateOutput(extractedData));
          // Extract Degree Info
          //const degreeInfo = extractedData.degree || "Unknown Degree";
          const degreeId = extractedData.degreeId || 'Unknown'; // Map degree to ID
          const matched_degree = degrees.find(d => d.id === degreeId);
          const credits_Required = matched_degree.totalCredits;

          if (transcriptData.length > 0) {
            localStorage.setItem('Timeline_Name', null);
            onDataProcessed({
              transcriptData,
              degreeId,
            }); // Send grouped data to parent
            console.log('select: ', selectedRadio.extendedCredit);
            navigate('/timeline_change', {
              state: {
                coOp: selectedRadio.coOp,
                credits_Required: credits_Required,
                extendedCredit: extractedData.details.extendedCreditProgram,
                creditDeficiency: extractedData.details.creditDeficiency,
              },
            }); // Navigate to TimelinePage
          } else {
            setOutput(`<h3>There are no data to show!</h3>`);
          }
          console.log(degreeId);
        });
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const extractAcceptanceDetails = (pagesData) => {
    const details = {};

    // List of specific programs to check for
    const programNames = [
      'Aerospace Engineering',
      'Aerospace Engineering Option: Aerodynamics and Propulsion',
      'Aerospace Engineering Option B: Aerospace Structures and Materials',
      'Aerospace Engineering Option: Avionics and Aerospace Systems',
      'Building Engineering',
      'Building Engineering Option: Building Energy and Environment',
      'Building Engineering Option: Building Structures and Construction',
      'Civil Engineering',
      'Civil Engineering Option: Civil Infrastructure',
      'Civil Engineering Option: Environmental',
      'Civil Engineering Option: Construction Engineering and Management',
      'Computer Engineering',
      'Computer Science',
      'Electrical Engineering',
      'Industrial Engineering',
      'Mechanical Engineering',
      'Software Engineering',
    ];
    const degreeMapping = {
      'Aerospace Engineering': 'AERO',
      'Aerospace Engineering Option: Aerodynamics and Propulsion': 'AEROA',
      'Aerospace Engineering Option B: Aerospace Structures and Materials': 'AEROB',
      'Aerospace Engineering Option: Avionics and Aerospace Systems': 'AEROC',
      'Building Engineering': 'BCEE',
      'Building Engineering Option: Building Energy and Environment': 'BCEEA',
      'Building Engineering Option: Building Structures and Construction': 'BCEEB',
      'Civil Engineering': 'CIVI',
      'Civil Engineering Option: Civil Infrastructure': 'CIVIA',
      'Civil Engineering Option: Environmental': 'CIVIB',
      'Civil Engineering Option: Construction Engineering and Management': 'CIVIC',
      'Computer Engineering': 'COEN',
      'Computer Science': 'CompSci',
      'Electrical Engineering': 'ELEC',
      'Industrial Engineering': 'INDU',
      'Mechanical Engineering': 'MECH',
      'Software Engineering': 'SOEN',
    };

    const degreeMapping_2 = {
      'Bachelor of Engineering, Aerospace Engineering': 'AERO',
      'Bachelor of Engineering, Aerospace Engineering Option: Aerodynamics and Propulsion': 'AEROA',
      'Bachelor of Engineering, Aerospace Engineering Option B: Aerospace Structures and Materials': 'AEROB',
      'Bachelor of Engineering, Aerospace Engineering Option: Avionics and Aerospace Systems': 'AEROC',
      'Bachelor of Engineering, Building Engineering': 'BCEE',
      'Bachelor of Engineering, Building Engineering Option: Building Energy and Environment': 'BCEEA',
      'Bachelor of Engineering, Building Engineering Option: Building Structures and Construction': 'BCEEB',
      'Bachelor of Engineering, Civil Engineering': 'CIVI',
      'Bachelor of Engineering, Civil Engineering Option: Civil Infrastructure': 'CIVIA',
      'Bachelor of Engineering, Civil Engineering Option: Environmental': 'CIVIB',
      'Bachelor of Engineering, Civil Engineering Option: Construction Engineering and Management': 'CIVIC',
      'Bachelor of Engineering, Computer Engineering': 'COEN',
      'Bachelor of Computer Science, Computer Science': 'CompSci',
      'Bachelor of Engineering, Electrical Engineering': 'ELEC',
      'Bachelor of Engineering, Industrial Engineering': 'INDU',
      'Bachelor of Engineering, Mechanical Engineering': 'MECH',
      'Bachelor of Engineering, Software Engineering': 'SOEN',
    };
    degrees.forEach(({ name, id }) => {
      degreeMapping_2[name] = id;
    });

    console.log("degrees", degrees)

    let degree = null;
    let degreeId = null;

    let results = [];

    let offer_of_Admission = false;
    pagesData.forEach(({ text }) => {
      if (!pagesData || pagesData.length === 0) {
        console.error('No pages data available');
        return { results: [] };
      }  
      // Check if text contains "OFFER OF ADMISSION"
      if (text.toUpperCase().match("OFFER OF ADMISSION")) {
           offer_of_Admission = true;
      }

      // Extract Degree Concentration (everything after Program/Plan(s) and before Academic Load)
      const degreeConcentrationMatch = text.match(
        /Program\/Plan\(s\):\s*([^\n]+)(?:\n([^\n]+))?[\s\S]*?Academic Load/,
      )

      console.log("degree", degreeConcentrationMatch);

      if (degreeConcentrationMatch) {
        // Combine the two parts (if any) into a single Degree Concentration string
        let degreeConcentration = (
          degreeConcentrationMatch[1] + (degreeConcentrationMatch[2] || '')
        ).trim();

        // Check if any of the specific program names are present in the extracted Degree Concentration
        programNames.forEach((program) => {
          if (degreeConcentration.trim().includes(program)) {
            degreeConcentration = `${program}`; // Add the program name to the Degree Concentration if it matches
          }
        });
        degreeId = degreeMapping[degreeConcentration];
        // Assign to details
        details.degreeConcentration = degreeId;
      }
      
      console.log(degreeId);

      // Check for "Co-op Recommendation: Congratulations!"
      const coopRecommendationMatch = text.match(
        /Co-op Recommendation:\s*Congratulations!/,
      );
      if (coopRecommendationMatch) {
        details.coopProgram = 'Yes';
        details.extendedCreditProgram = 'No';
      } else {
        // Extract Extended Credit Program or Co-op Program if not determined by Co-op Recommendation
        const ecpMatch = text.match(/Extended Credit Program/);
        const coopMatch = text.match(/Co-op Program/);
        if (ecpMatch) {
          details.extendedCreditProgram = 'yes';
          details.coopProgram = 'No';
        } else if (coopMatch) {
          details.coopProgram = 'Yes';
          details.extendedCreditProgram = 'No';
          handleRadioChange('extendedCredit', 'No');
        }
      }

      // Extract Starting Semester (Term)
      const sessionIndex = text.indexOf('Session');
      const minProgramLengthIndex = text.indexOf('Minimum Program Length');

      // Check if both Session and Minimum Program Length are present
      if (sessionIndex !== -1 && minProgramLengthIndex !== -1) {
        // Extract the substring between Session and Minimum Program Length
        const textBetweenSessionAndMinLength = text.substring(
          sessionIndex,
          minProgramLengthIndex,
        );

        // Regular expression to match the term (Winter, Summer, Fall, Fall/Winter)
        const termRegex =
          /(\s*(Winter|Summer|Fall)\s*\d{4}\s*)|(\s*(Fall\/Winter)\s*20(\d{2})-(?!\6)\d{2})/;
        const termMatchstart = textBetweenSessionAndMinLength.match(termRegex);

        if (termMatchstart) {
          // Add the matched term to Starting Term
          details.startingTerm = termMatchstart[0].trim();
        }
      }

      // Extract Expected Graduation Term (Winter 2024, Fall/Winter 2023-2024)
      const expectedGradTermIndex = text.indexOf('Expected Graduation Term');
      const admissionStatusIndex = text.indexOf('Admission Status');

      if (expectedGradTermIndex !== -1 && admissionStatusIndex !== -1) {
        // Extract the substring between Expected Graduation Term and Admission Status
        const textBetweenExpectedGradTermAndStatus = text.substring(
          expectedGradTermIndex,
          admissionStatusIndex,
        );

        // Regex for matching terms like Winter 2024, Fall/Winter 2023-2024
        const termRegex =
          /(\s*(Winter|Summer|Fall)\s*\d{4}\s*)|(\s*(Fall\/Winter)\s*20(\d{2})-(?!\6)\d{2})/;
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
        const textBetweenExemptionsAndDeficiencies = text.substring(
          exemptionsIndex,
          deficienciesIndex,
        );

        // Regex for matching course codes (e.g., MATH 101)
        const courseRegex = /([A-Za-z]{3,4})\s+(\d{3})\s+/g;
        let courseMatch;
        const exemptionsCourses = [];

        // Find all course matches
        while (
          (courseMatch = courseRegex.exec(
            textBetweenExemptionsAndDeficiencies,
          )) !== null
        ) {
          results.push({
            name: courseMatch[0].replace(/\s+/g, ''),
            page: 1,
            type: 'Exempted Course',
            position: 0,
          });
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
        const textBetweenDeficienciesAndTransferCredits = text.substring(
          deficienciesMatchIndex,
          transferCreditsIndex,
        );

        // Regex for matching course codes (e.g., MATH 101)
        const courseRegex = /([A-Za-z]{3,4})\s+((\d{3})|[A-Z]{1,2})\s+/g;
        let courseMatch;
        const deficienciesCourses = [];

        // Find all course matches
        while (
          (courseMatch = courseRegex.exec(
            textBetweenDeficienciesAndTransferCredits,
          )) !== null
        ) {
          deficienciesCourses.push(courseMatch[0].trim());
        }

        if (deficienciesCourses.length > 0) {
          // Add matched courses to Deficiencies courses
          details.creditDeficiency = true;
          details.deficienciesCourses = deficienciesCourses;
        }
      }

      // Extract Transfer Credits and respective credits
      const noteIndex = text.indexOf('NOTE:');

      if (transferCreditsIndex !== -1 && noteIndex !== -1) {
        const textBetweenTransferAndNote = text.substring(
          transferCreditsIndex,
          noteIndex,
        );

        // Regex for matching courses (e.g., COMM A, ECON 201)
        const courseRegex = /(\s+[A-Z]{3,4})\s+((\d{3})|[A-Z]{1,2})\s+/g;
        const creditRegex = /(\d+)\s+crs/; // Regex for matching credits (e.g., "3 crs")

        let courseMatch;
        const transferCredits = [];

        while (
          (courseMatch = courseRegex.exec(textBetweenTransferAndNote)) !== null
        ) {
          const course = courseMatch[0].trim();
          // Look for the credits on the same line as the course
          const lineContainingCourse = textBetweenTransferAndNote
            .split('\n')
            .find((line) => line.includes(course));

          const creditMatch = lineContainingCourse?.match(creditRegex);
          const credits = creditMatch
            ? `${creditMatch[1]} crs`
            : 'Credits not found';
          results.push({
            name: course.replace(/\s+/g, ''),
            page: 1,
            type: 'Transfered Course',
            position: 0,
          });
          transferCredits.push({ course, credits });
        }

        if (transferCredits.length > 0) {
          details.transferCredits = transferCredits;
        }
      }
    }); // pages end

    if(!offer_of_Admission){
      alert("Please choose Offer of Admission");     
      return { results: [] };
    }

    const start = details.startingTerm;
    const end = details.expectedGraduationTerm;

    // Function to generate all terms from startTerm to endTerm
    const generateTerms = (startTerm, endTerm) => {
      const terms = ['Winter', 'Summer', 'Fall'];
      const startYear = parseInt(startTerm.split(' ')[1]); // Extracting the year
      const startSeason = startTerm.split(' ')[0]; // Extracting the season
      let endYear,endSeason;
      if (!endTerm || typeof endTerm !== 'string') {
        endYear = startYear + 2;
        endSeason = startSeason;
       }
      else{
        endYear = parseInt(endTerm.split(' ')[1]); // Extracting the year
        endSeason = endTerm.split(' ')[0]; // Extracting the season
      }

      const resultTerms = [];

      let currentYear = startYear;
      let currentSeasonIndex = terms.indexOf(startSeason); // Find index of start season in the list

      // Loop to generate all terms from start to end
      while (
        currentYear < endYear ||
        (currentYear === endYear &&
          currentSeasonIndex <= terms.indexOf(endSeason))
      ) {
        const term = `${terms[currentSeasonIndex]} ${currentYear}`;
        resultTerms.push(term);

        // Move to the next season
        currentSeasonIndex++;

        if (currentSeasonIndex === terms.length) {
          currentSeasonIndex = 0;
          currentYear++;
        }
      }
      // console.log("terms:", resultTerms)
      return resultTerms;
    };

    // Function to process and push results into the results array
    const processTerms = (startTerm, endTerm, results) => {
      const terms = generateTerms(startTerm, endTerm);

      terms.forEach((term, index) => {
        results.push({
          name: term.trim(),
          page: 1,
          type: 'Term',
          position: 0, // Adjust as needed for your specific position logic
        });
      });
      console.log(results);
    };

    processTerms(start, end, results);

    return { results, degree, degreeId, details };
  };

  const matchTermsWithCourses = (data) => {
    let matchedResults = [];
    let currentTerm = data[0]?.name; // Use optional chaining to safely access `name`
    let terms = [];

    data.sort((a, b) =>
      a.page !== b.page ? a.page - b.page : a.position - b.position,
    );

    data.forEach((item) => {
      if (item && item.type === 'Term' && item.name) {
        // Ensure `item` and `item.name` are defined
        matchedResults.push({
          term: item.name,
          course: '',
          grade: 'EX',
        });
      }

      if (item && item.type === 'Exempted Course' && item.name) {
        // Ensure `item` and `item.name` are defined
        matchedResults.push({
          term: 'Exempted',
          course: item.name,
          grade: 'EX',
        });
      }

      if (item && item.type === 'Transfered Course' && item.name) {
        // Ensure `item` and `item.name` are defined
        matchedResults.push({
          term: 'Transfered Courses',
          course: item.name,
          grade: 'EX',
        });
      }

      if (item && item.type === 'Course' && currentTerm && item.name) {
        // Ensure `item` and `currentTerm` and `item.name` are defined
        matchedResults.push({
          term: currentTerm,
          course: item.name,
          grade: item.grade,
        });
      }

      if (item && item.type === 'Separator') {
        currentTerm = terms.shift() || null;
      }
    });

    console.log('Grouped data: ', matchedResults);
    return matchedResults;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="top-down">
        <div className="g-container">
          <div className="form-container-al">
            <h2>Required Information</h2>
            <p>
              Manually fill out the following information so we can help you
              create the perfect timeline
            </p>
            <form>
              <div>
                <label htmlFor="degree-concentration">
                  Degree Concentration:
                </label>
                <select
                  id="degree-concentration"
                  className="input-field"
                  onChange={handleDegreeChange}
                >
                  <option value="">-- Select a Degree --</option>
                  {degrees && degrees.length > 0 ? (
                    degrees
                      .sort((a, b) => a.name.localeCompare(b.name)) // Sort degrees alphabetically by name
                      .map((degree) => (
                        <option key={degree.id} value={degree.id}>
                          {degree.name}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>
                      No degrees available
                    </option>
                  )}
                </select>
              </div>
              <div>
                <div>
                  <label htmlFor="starting-term">Starting Term:</label>
                  <select
                    id="starting-term"
                    className="input-field"
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                  >
                    <option value="">-- Select Term --</option>
                    <option value="Winter">Winter</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="starting-year">Starting Year:</label>
                <select
                  id="starting-year"
                  className="input-field"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">-- Select Year --</option>
                  {Array.from({ length: 2031 - 2017 + 1 }).map((_, index) => {
                    const year = 2017 + index;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="radio-group">
                <span className="cooo">Extended Credit Program? </span>
                <label>
                  <input
                    type="checkbox"
                    name="extended-credit"
                    value="yes"
                    checked={selectedRadio.extendedCredit === true}
                    onChange={() => handleRadioChange('extendedCredit', true)}
                  />
                </label>
              </div>
            </form>
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
            <button onClick={handleNextButtonClick} className="next-button">
              Next
            </button>
          </div>

          <div className="or-divider">OR</div>

          <div className="upload-container-al">
            <h2>Upload Acceptance Letter</h2>
            <p>
              Upload your acceptance letter to automatically fill out the
              required information
            </p>
            <div
              className="upload-box-al"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p>Drag and Drop file</p>
              or
              <label htmlFor="file-upload" className="file-label">
                Browse
              </label>
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
            {output && (
              <div
                id="output"
                dangerouslySetInnerHTML={{ __html: output }}
              ></div>
            )}
            <p>To upload your unofficial transcript, please click here!</p>
            <button
              className="upload-transcript-button"
              onClick={() => navigate('/uploadTranscript')}
            >
              Upload Transcript
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadAcceptanceLetterPage;
