// TimelinePage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Accordion from 'react-bootstrap/Accordion';
import Container from 'react-bootstrap/Container';
import warningIcon from '../icons/warning.png'; // Import warning icon
import '../css/TimelinePage.css';
import { groupPrerequisites } from '../utils/groupPrerequisites'; // Adjust the path as necessary
import { useLocation } from 'react-router-dom';
// DraggableCourse component for course list items
const DraggableCourse = ({
  id,
  title,
  disabled,
  isReturning,
  isSelected,
  onSelect,
  containerId,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
    data: {
      type: 'course',
      courseCode: id,
      containerId,
    },
  });

  const className = `course-item${disabled ? ' disabled' : ''}${isDragging ? ' dragging' : ''
    }${isSelected && !isDragging && !disabled ? ' selected' : ''}`;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {id}
    </div>
  );
};

// SortableCourse component for semester items
const SortableCourse = ({
  id,
  title,
  disabled,
  isSelected,
  isDraggingFromSemester,
  onSelect,
  containerId,
  prerequisitesMet, // New prop
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'course',
      courseCode: id,
      containerId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const className = `course-item${disabled ? ' disabled' : ''}${isDragging ? ' dragging' : ''
    }${isDraggingFromSemester ? ' dragging-from-semester' : ''}${isSelected ? ' selected' : ''
    }`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {id}
      {!prerequisitesMet && (
        <img
          src={warningIcon}
          alt="Warning: prerequisites not met"
          className="warning-icon"
        />
      )}
    </div>
  );
};

// Droppable component
const Droppable = ({ id, children, className = 'semester-spot' }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'semester',
      containerId: id,
    },
  });

  return (
    <div ref={setNodeRef} className={className} data-semester-id={id} data-testid={id}>
      {children}
    </div>
  );
};

// Main component
const TimelinePage = ({ timelineData }) => {
  const [showCourseList, setShowCourseList] = useState(true);
  const [showCourseDescription, setShowCourseDescription] = useState(true);

  const [semesters, setSemesters] = useState([]);
  const [semesterCourses, setSemesterCourses] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const location = useLocation();
  const { degreeId } = location.state || {};

  // Data
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 767);
  const [addButtonText, setAddButtonText] = useState('+ Add Semester');

  const [activeId, setActiveId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [returning, setReturning] = useState(false);
  const [hasUnmetPrerequisites, setHasUnmetPrerequisites] = useState(false);
  const [totalCredits, setTotalCredits] = useState(0);

  // Add semester form state
  const [selectedSeason, setSelectedSeason] = useState('Fall');
  const [selectedYear, setSelectedYear] = useState('2025');
  // Fetching state
  const [coursePools, setCoursePools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toggleCourseList = () => setShowCourseList((prev) => !prev);
  const toggleCourseDescription = () => setShowCourseDescription((prev) => !prev);

  // Sensors with activation constraints
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor);

  // Fetch courses by degree on component mount
  useEffect(() => {
    const fetchCoursesByDegree = async () => {
      try {
        console.log('Fetching courses by degree:', degreeId);
        const degree = degreeId; // The value to pass
        const response = await fetch(`http://localhost:8000/courses/getByDegreeGrouped`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ degree }),
        });

        if (!response.ok) {
          // Enhanced Error Handling
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // Array of CoursePoolInfo
        setCoursePools(data); // Assuming data is an array of CoursePoolInfo
        setLoading(false);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCoursesByDegree();
  }, []);

  // Process timelineData and generate semesters and courses
  useEffect(() => {
    if (coursePools.length === 0) return; // Wait until coursePools are fetched

    const semesterMap = {};
    const semesterNames = new Set();

    // Group courses by semester
    timelineData.forEach((data) => {
      const { term, course } = data;

      if (!semesterMap[term]) {
        semesterMap[term] = [];
      }
      semesterMap[term].push(course.code); // Assuming course.code is the unique identifier
      semesterNames.add(term);
    });

    // Create an array of semesters sorted by term order
    const sortedSemesters = Array.from(semesterNames).sort((a, b) => {
      const order = { Winter: 1, Summer: 2, Fall: 3 };
      const [seasonA, yearA] = a.split(' ');
      const [seasonB, yearB] = b.split(' ');

      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }

      return order[seasonA] - order[seasonB];
    });

    // Set state for semesters and courses
    setSemesters(
      sortedSemesters.map((term) => ({
        id: term,
        name: term,
      }))
    );

    setSemesterCourses(
      Object.fromEntries(
        sortedSemesters.map((term) => [term, semesterMap[term] || []])
      )
    );
  }, [timelineData, coursePools]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 767);
      if (window.innerWidth > 999) {
        setAddButtonText('+ Add Semester');
      }
      else {
        setAddButtonText('+');
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setShowCourseList(false);
      setShowCourseDescription(false);
    }
  }, [isDesktop]);

  const [shakingSemesterId, setShakingSemesterId] = useState(null);

  // ---------------- ADD / REMOVE Semesters ----------------
  const SEASON_ORDER = {
    Winter: 1,
    Summer: 2,
    Fall: 3,
  };

  function compareSemesters(a, b) {
    // a.name might be "Fall 2026" => [ "Fall", "2026" ]
    const [seasonA, yearA] = a.name.split(' ');
    const [seasonB, yearB] = b.name.split(' ');

    // Convert year from string to number
    const yearNumA = parseInt(yearA, 10);
    const yearNumB = parseInt(yearB, 10);

    // First compare the numeric year
    if (yearNumA !== yearNumB) {
      return yearNumA - yearNumB;
    }
    // If same year, compare season order
    return SEASON_ORDER[seasonA] - SEASON_ORDER[seasonB];
  }

  const handleAddSemester = () => {
    const id = `${selectedSeason} ${selectedYear}`;
    const name = `${selectedSeason} ${selectedYear}`;

    // Prevent duplicates
    if (semesters.some((sem) => sem.id === id)) {
      alert(`Semester ${name} is already added.`);
      return;
    }

    // 1) Add the new semester to the "semesters" array, then sort
    setSemesters((prev) => {
      const newSemesters = [...prev, { id, name }];
      newSemesters.sort(compareSemesters);
      return newSemesters;
    });

    setSemesterCourses((prev) => {
      if (!prev[id]) {
        return { ...prev, [id]: [] };
      }
      return prev;
    });

    setIsModalOpen(false);
  };

  const handleRemoveSemester = (semesterId) => {
    setSemesters((prev) => prev.filter((s) => s.id !== semesterId));
    setSemesterCourses((prev) => {
      const updated = { ...prev };
      delete updated[semesterId];
      return updated;
    });
  };
  // ----------------------------------------------------------------------
  const isCourseAssigned = (courseCode) => {
    for (const semesterId in semesterCourses) {
      if (semesterId === "courseList") continue;
      if (semesterCourses[semesterId].includes(courseCode)) {
        return true;
      }
    }
    return false;
  };

  const handleDragStart = (event) => {
    setReturning(false);
    const id = String(event.active.id);

    const course = coursePools
      .flatMap((pool) => pool.courses)
      .find((c) => c.code === id);

    if (course) {
      setSelectedCourse(course);
    }

    document.querySelector('.semesters')?.classList.add('no-scroll');

    setActiveId(id);
  };

  const findSemesterIdByCourseCode = (courseCode, semesters) => {
    for (const semesterId in semesters) {
      if (semesters[semesterId].includes(courseCode)) {
        return semesterId;
      }
    }
    return null;
  };

  const shakeSemester = (semId) => {
    setShakingSemesterId(semId);
    setTimeout(() => {
      setShakingSemesterId(null);
    }, 2000);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const id = String(active.id); // courseCode

    if (over) {
      if (over.id === 'courseList') {
        // Course is being returned to the course list
        handleReturn(id);
      } else {
        setSemesterCourses((prevSemesters) => {
          const updatedSemesters = { ...prevSemesters };
          const activeSemesterId = findSemesterIdByCourseCode(
            id,
            prevSemesters
          );
          let overSemesterId;
          let overIndex;

          if (over.data.current?.type === 'semester') {
            // Dropped over a semester (empty space)
            overSemesterId = over.data.current.containerId;
            overIndex = updatedSemesters[overSemesterId].length;
          } else if (over.data.current?.type === 'course') {
            // Dropped over a course in a semester
            overSemesterId = over.data.current.containerId;
            overIndex = updatedSemesters[overSemesterId].indexOf(over.id);

            if (id === over.id) {
              // Dropped back onto itself; do nothing
              return prevSemesters;
            }
          } else {
            // Fallback
            overSemesterId = findSemesterIdByCourseCode(over.id, prevSemesters);
            overIndex = updatedSemesters[overSemesterId]?.indexOf(over.id);
          }

          if (activeSemesterId) {
            // Remove from old semester
            updatedSemesters[activeSemesterId] = updatedSemesters[
              activeSemesterId
            ].filter((courseCode) => courseCode !== id);
          }

          if (overSemesterId) {
            // Insert into new semester
            updatedSemesters[overSemesterId].splice(overIndex, 0, id);
          }

          // Check if we exceed the limit
          const overSemesterObj = semesters.find((s) => s.id === overSemesterId);
          if (!overSemesterObj) return prevSemesters; // safety check

          // Sum up the credits in the new semester
          const thisSemesterCourses = updatedSemesters[overSemesterId];
          let sumCredits = 0;
          for (let cCode of thisSemesterCourses) {
            const course = coursePools
              .flatMap((pool) => pool.courses)
              .find((c) => c.code === cCode);
            if (course?.credits) {
              sumCredits += course.credits;
            }
          }

          // Compare with max
          const maxAllowed = getMaxCreditsForSemesterName(overSemesterObj.name);

          if (sumCredits > maxAllowed) {
            // Optional: keep a visual shake
            shakeSemester(overSemesterId);
            // Alert the user
            alert("You exceeded the limit of 15 credits per semester allowed in Gina Cody School of Engineering and Computer Science!");
          }
          return updatedSemesters;
        });
      }
    }

    setActiveId(null);
    document.querySelector('.semesters')?.classList.remove('no-scroll');
  };

  const handleDragCancel = () => {
    setActiveId(null);
    document.querySelector('.semesters')?.classList.remove('no-scroll');
  };

  const handleReturn = (courseCode) => {
    setReturning(true);

    setSemesterCourses((prevSemesters) => {
      const updatedSemesters = { ...prevSemesters };
      for (const semesterId in updatedSemesters) {
        updatedSemesters[semesterId] = updatedSemesters[semesterId].filter(
          (code) => code !== courseCode
        );
      }
      return updatedSemesters;
    });
  };

  const handleCourseSelect = (code) => {
    const course = coursePools
      .flatMap((pool) => pool.courses)
      .find((c) => c.code === code);
    if (course) {
      setSelectedCourse(course);
    }
  };

  // Calculate total credits whenever semesterCourses changes
  useEffect(() => {
    const calculateTotalCredits = () => {
      let total = 0;
      let unmetPrereqFound = false;

      for (const semesterId in semesterCourses) {
        if (semesterId === 'courseList') continue;
        const courseCodes = semesterCourses[semesterId];
        const currentSemesterIndex = semesters.findIndex(
          (s) => s.id === semesterId
        );

        courseCodes.forEach((courseCode) => {
          const course = coursePools
            .flatMap((pool) => pool.courses)
            .find((c) => c.code === courseCode);

          if (course && course.credits) {
            const prerequisitesMet = arePrerequisitesMet(
              courseCode,
              currentSemesterIndex
            );

            if (prerequisitesMet) {
              total += course.credits;
            } else {
              unmetPrereqFound = true;
            }
          }
        });
      }

      setTotalCredits(total);
      setHasUnmetPrerequisites(unmetPrereqFound);
    };

    calculateTotalCredits();
  }, [semesterCourses, semesters, coursePools]);


  // Function to check if prerequisites and corequisites are met
  const arePrerequisitesMet = (courseCode, currentSemesterIndex) => {
    const course = coursePools
      .flatMap((pool) => pool.courses)
      .find((c) => c.code === courseCode);

    console.log(`Checking prerequisites for course ${courseCode} in semester index ${currentSemesterIndex}`);

    if (!course || !course.requisites || course.requisites.length === 0) {
      console.log(`Course ${courseCode} has no requisites.`);
      return true;
    }

    // Separate prerequisites and corequisites
    const prerequisites = course.requisites.filter(r => r.type.toLowerCase() === 'pre');
    const corequisites = course.requisites.filter(r => r.type.toLowerCase() === 'co');

    console.log(`Course ${courseCode} prerequisites:`, prerequisites);
    console.log(`Course ${courseCode} corequisites:`, corequisites);

    // Collect all courses scheduled in semesters before the current one
    const completedCourses = [];
    for (let i = 0; i < currentSemesterIndex; i++) {
      const semesterId = semesters[i]?.id;
      if (semesterId) {
        completedCourses.push(...semesterCourses[semesterId]);
      }
    }

    console.log(`Completed courses before current semester:`, completedCourses);

    // Check prerequisites
    const prerequisitesMet = prerequisites.every((prereq) => {
      if (prereq.group_id) {
        // For grouped prerequisites, at least one in the group must be completed
        const group = prerequisites.filter(p => p.group_id === prereq.group_id);
        const result = group.some(p => completedCourses.includes(p.code2));
        console.log(`Group ${prereq.group_id} met:`, result);
        return result;
      } else {
        // Single prerequisite
        const result = completedCourses.includes(prereq.code2);
        console.log(`Prerequisite ${prereq.code2} met:`, result);
        return result;
      }
    });

    console.log(`Prerequisites met for course ${courseCode}:`, prerequisitesMet);

    // Collect courses scheduled in the current semester for corequisites
    const currentSemesterCourses = semesterCourses[semesters[currentSemesterIndex]?.id] || [];
    console.log(`Current semester courses for corequisites:`, currentSemesterCourses);

    // Check corequisites
    const corequisitesMet = corequisites.every((coreq) => {
      if (coreq.group_id) {
        // If corequisites can also be grouped, handle similarly
        const group = corequisites.filter(c => c.group_id === coreq.group_id);
        const result = group.some(c => currentSemesterCourses.includes(c.code2));
        console.log(`Corequisite group ${coreq.group_id} met:`, result);
        return result;
      } else {
        // Single corequisite
        const result = currentSemesterCourses.includes(coreq.code1);
        console.log(`Corequisite ${coreq.code2} met:`, result);
        return result;
      }
    });

    console.log(`Corequisites met for course ${courseCode}:`, corequisitesMet);

    const finalResult = prerequisitesMet && corequisitesMet;
    console.log(`Prerequisites and Corequisites met for course ${courseCode}:`, finalResult);

    return finalResult;
  };


  // The Gina Cody School of Engineering and Computer Science at Concordia University has the following credit limits for full-time students:
  // limit is 14 summer; Fall Winter 15.
  function getMaxCreditsForSemesterName(semesterName) {
    if (semesterName.toLowerCase().includes("summer")) {
      return 14;
    }
    return 15;
  }

  //method to get courses by id while taking into account nested coruse lists
  // const getCourseById = (id, courses) => {
  //   for (const courseSection of courses) {
  //     if (courseSection.courseList) {
  //       for (const course of courseSection.courseList) {
  //         if (course.id === id) {
  //           return course;
  //         }
  //       }
  //     }
  //     // Check for any nested subcourses and recursively search through them
  //     if (courseSection.subcourses) {
  //       const found = getCourseById(id, courseSection.subcourses);
  //       if (found) return found;
  //     }
  //   }
  //   return null;
  // };

  // ----------------------------------------------------------------------------------------------------------------------
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >

      {/* We blur the background content when modal is open */}
      <div className={`timeline-container ${isModalOpen ? 'blurred' : ''}`}>

        {/* Loading and Error States */}
        {loading && (
          <div className="loading-container">
            <p>Loading courses...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Total Credits Display */}
            <div className="credits-display">
              <h4>
                Total Credits Earned: {totalCredits} / 120
              </h4>
            </div>

            <div className="timeline-page">

              <div className='courses-with-button'>
                <div className={`timeline-left-bar ${showCourseList ? '' : 'hidden'}`}>
                  {showCourseList && (
                    <div>
                      <h4>Course List</h4>
                      <Droppable id="courseList" className="course-list">
                        <Accordion>
                          {coursePools.map((coursePool) => (
                            <Accordion.Item
                              eventKey={coursePool.poolName}
                              key={coursePool.poolId}
                            >
                              <Accordion.Header>{coursePool.poolName}</Accordion.Header>
                              <Accordion.Body>
                                <Container>
                                  {coursePool.courses.map((course) => {
                                    const assigned = isCourseAssigned(course.code);
                                    const isSelected = selectedCourse?.code === course.code;

                                    return (
                                      <DraggableCourse
                                        key={`${course.code}-${assigned}`} // Include assigned in key
                                        id={course.code}
                                        title={course.code}
                                        disabled={assigned}
                                        isReturning={returning}
                                        isSelected={isSelected}
                                        onSelect={handleCourseSelect}
                                        containerId="courseList"
                                      />
                                    );
                                  })}
                                </Container>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      </Droppable>
                    </div>
                  )}
                </div>

                <button className="left-toggle-button" onClick={toggleCourseList}>
                  {showCourseList ? '◀' : '▶'}
                </button>
              </div>

              <div className="timeline-middle-section">
                <div className='timeline-header'>
                  <div className='timeline-title'>
                    Timeline
                  </div>
                  <button
                    className="add-semester-button"
                    onClick={() => setIsModalOpen(true)}
                  >
                    {addButtonText}
                  </button>
                </div>

                <div className="semesters">
                  {semesters.map((semester, index) => {
                    // 1) Calculate total credits for this semester
                    const sumCredits = semesterCourses[semester.id]
                      .map((cCode) =>
                        coursePools
                          .flatMap((pool) => pool.courses)
                          .find((c) => c.code === cCode)?.credits || 0
                      )
                      .reduce((sum, c) => sum + c, 0);

                    // 2) Compare to max limit
                    const maxAllowed = getMaxCreditsForSemesterName(semester.name);
                    const isOver = sumCredits > maxAllowed;

                    // 3) “semester-credit” + conditionally add “over-limit-warning”
                    const creditClass = isOver
                      ? "semester-credit over-limit-warning"
                      : "semester-credit";

                    return (
                      <div key={semester.id} className={`semester ${shakingSemesterId === semester.id ? 'exceeding-credit-limit' : ''
                        }`}>
                        <Droppable id={semester.id} color="pink">
                          <h3>{semester.name}</h3>
                          <SortableContext
                            items={semesterCourses[semester.id]}
                            strategy={verticalListSortingStrategy}
                          >
                            {semesterCourses[semester.id].map((courseCode) => {
                              const course = coursePools
                                .flatMap((pool) => pool.courses)
                                .find((c) => c.code === courseCode);
                              if (!course) return null;
                              const isSelected = selectedCourse?.code === course.code;
                              const isDraggingFromSemester = activeId === course.code;

                              // Check if prerequisites are met
                              const prerequisitesMet = arePrerequisitesMet(course.code, index);

                              return (
                                <SortableCourse
                                  key={course.code}
                                  id={course.code}
                                  title={course.code}
                                  disabled={false}
                                  isSelected={isSelected}
                                  isDraggingFromSemester={isDraggingFromSemester}
                                  onSelect={handleCourseSelect}
                                  containerId={semester.id}
                                  prerequisitesMet={prerequisitesMet} // Pass the prop
                                />
                              );
                            })}
                          </SortableContext>

                          <div className="semester-footer">
                            <div className={creditClass}>
                              Total Credit: {sumCredits}
                              {" "}
                              {isOver && (
                                <span>
                                  <br /> Over the credit limit {maxAllowed}
                                </span>
                              )}
                            </div>

                            <button
                              className="remove-semester-btn"
                              onClick={() => handleRemoveSemester(semester.id)}
                            >
                              <svg
                                width="1.2em"
                                height="1.2em"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1.21 14.06A2 2 0 0 1 15.8 22H8.2a2 2 0 0 1-1.99-1.94L5 6m3 0V4a2 2 0 0 1 2-2h2
                                 a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className='description-and-button'>
                <button className="right-toggle-button" onClick={toggleCourseDescription}>
                  {showCourseDescription ? '▶' : '◀'}
                </button>
                <div className={`description-section ${showCourseDescription ? '' : 'hidden'}`}>
                  {selectedCourse ? (
                    <div>
                      <h5>{selectedCourse.code}</h5>
                      <p data-testid='course-description'>{selectedCourse.description}</p>

                      {selectedCourse.requisites && selectedCourse.requisites.length > 0 && (
                        <div>
                          <h5>Prerequisites/Corequisites:</h5>
                          <ul>
                            {groupPrerequisites(selectedCourse.requisites).map((group, index) => (
                              <li key={index}>
                                {group.type.toLowerCase() === 'pre' ? 'Prerequisite: ' : 'Corequisite: '}
                                {group.codes.join(' or ')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p data-testid='course-description'>Drag or click on a course to see its description here.</p>
                  )}
                </div>

              </div>
              <DragOverlay dropAnimation={returning ? null : undefined}>
                {activeId ? (
                  <div className="course-item-overlay selected">
                    {coursePools
                      .flatMap((pool) => pool.courses)
                      .find((course) => course.code === activeId)?.code}
                  </div>
                ) : null}
              </DragOverlay>
            </div>
          </>
        )}

      </div>

      {/* ---------- Modal for Add Semester ---------- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-button"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>

            <p>Add a semester</p>
            <hr style={{ marginBottom: '1rem' }} />

            {/* Container for the two selects */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              {/* Term Select */}
              <div className="select-container">
                <label className="select-label">Term</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                >
                  <option>Winter</option>
                  <option>Summer</option>
                  <option>Fall</option>
                </select>
              </div>

              {/* Year Select */}
              <div className="select-container">
                <label className="select-label">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {Array.from({ length: 10 }).map((_, i) => {
                    const year = 2020 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <button className="TL-button" onClick={handleAddSemester}>
              Add new semester
            </button>
          </div>
        </div>
      )}
    </DndContext>
  );
};

export default TimelinePage;
