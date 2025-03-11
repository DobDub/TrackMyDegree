// src/pages/UserPage.js
import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import moment from "moment";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/UserPage.css";
import { motion } from "framer-motion"


// === Updated imports for your custom modal & trash icon ===
import DeleteModal from "../components/DeleteModal";
import TrashLogo from "../icons/trashlogo"; // Adjust path if needed

const UserPage = ({ onDataProcessed }) => {

  const { user } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUserInfo, setEditedUserInfo] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUserInfo([
        { title: "Full Name", value: user.fullname || "NULL" },
        { title: "Email", value: user.email || "NULL" },
      ]);
    }
  }, [user]);

  useEffect(() => {
    if (userInfo) {
      setEditedUserInfo(userInfo.map((item) => item.value));
    }
  }, [userInfo]);

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedUserInfo(userInfo.map((item) => item.value));
    setIsEditing(false);
  };

  const saveChanges = async () => {
    // add way to save changes here
    const updatedInfo = userInfo.map((item, index) => ({
      ...item,
      value: editedUserInfo[index],
    }));
    try {
      // Construct the payload
      const payload = {
        id: user.id,
        fullname: updatedInfo[0].value,
        email: updatedInfo[1].value,
        type: user.type,
      };

      // Make the POST request to update user info
      const response = await fetch(
        `${process.env.REACT_APP_SERVER}/appUser/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        console.log("User info updated successfully!");
        setUserInfo(updatedInfo);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        console.error("Failed to update user info.", errorData);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating user info:", error);
      setIsEditing(false);
    }
  };

  const handleTimelineClick = (obj) => {
    const transcriptData = [];
    localStorage.setItem('Timeline_Name', JSON.stringify(obj.name));

    const degreeId = obj.degree_id;
    const items = obj.items;
    const creditsRequired = 120;
    const isExtendedCredit = obj.isExtendedCredit;

    items.forEach((item) => {
      const { season, year, courses } = item;
      transcriptData.push({
        term: `${season} ${year}`,
        courses: courses,
        grade: "A",
      });

    });

    console.log("isExtendedCredit user page", isExtendedCredit);

    onDataProcessed({
      transcriptData,
      degreeId,
      creditsRequired,
      isExtendedCredit,
    });
    localStorage.setItem("Timeline_Name", obj.name);
    navigate("/timeline_change");
  };

  const handleInputChange = (e, index) => {
    const updatedValues = [...editedUserInfo];
    updatedValues[index] = e.target.value;
    setEditedUserInfo(updatedValues);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileUpload = (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) handleFileUpload(file);
  };

  useEffect(() => {
    console.log("isOpen state changed:", isOpen);
  }, [isOpen]);

  const [userTimelines, setUserTimelines] = useState([]);

  useEffect(() => {
    if (user) {
      const getTimelines = async () => {
        const user_id = user.id;
        try {
          const response = await fetch(
            `${process.env.REACT_APP_SERVER}/timeline/getAll`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ user_id }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Failed to fetch user timelines."
            );
          }

          const data = await response.json();

          // Sort by modified date in descending order
          const sortedTimelines = data.sort(
            (a, b) => new Date(b.last_modified) - new Date(a.last_modified)
          );

          setUserTimelines(sortedTimelines);
        } catch (e) {
          console.error("Error updating user info:", e);
        }
      };

      getTimelines();
    }
  }, [user]);

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [timelineToDelete, setTimelineToDelete] = useState(null);

  const handleDeleteClick = (timeline) => {
    setTimelineToDelete(timeline);
    setShowModal(true);
  };

  const handleDelete = async (timeline_id) => {
    try {
      // delete timeline
      const response = await fetch(
        `${process.env.REACT_APP_SERVER}/timeline/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ timeline_id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user timeline.");
      }
      // remove from page
      setUserTimelines(userTimelines.filter((obj) => obj.id !== timeline_id));
    } catch (e) {
      console.error("Error deleting user timeline:", e);
    }
  };

  // Redirect to login if no user is found
  useEffect(() => {
    if (!user) {
      navigate("/signin");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      <div className="container-fluid">
        <div className="row vh-100">
          <div className="col-12 col-md-4 d-flex flex-column align-items-center text-center mx-auto">
            <h2 className="mb-4">My Profile</h2>
            <div className="profile-container d-flex">
              <div className="max-w-sm w-full"> {/* Changed from max-w-xs to max-w-sm */}
                <div className="bg-white shadow-xl rounded-lg py-4"> {/* Increased padding */}
                  <div className="photo-wrapper p-3"> {/* Increased padding */}
                    <img
                      className="w-40 h-40 rounded-full mx-auto"
                      src="https://www.svgrepo.com/download/374554/avatar-loading.svg" //replace when upload available
                      alt="Profile Avatar"
                    />
                  </div>
                  <div className="p-3"> {/* Increased padding */}
                    <h3 className="text-center text-2xl text-gray-900 font-medium leading-8"> {/* Increased text size */}
                      {userInfo[0]?.value || "Full Name"}
                    </h3>
                    <div className="text-center text-gray-400 text-sm font-semibold"> {/* Increased text size */}
                      <p>User</p>
                    </div>
                    <table className="text-sm my-4"> {/* Increased text size and margin */}
                      <tbody>
                        <tr>
                          <td className="px-3 py-2 text-gray-500 font-semibold">Full Name</td> {/* Increased padding */}
                          <td className="px-3 py-2">{userInfo[0]?.value || "NULL"}</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-gray-500 font-semibold">Email</td>
                          <td className="px-3 py-2">{userInfo[1]?.value || "NULL"}</td>
                        </tr>
                      </tbody>
                    </table>
                    <button
                      onClick={() => {
                        console.log("Opening Modal...");
                        setIsOpen(true);
                      }}
                        style={{ backgroundColor: "#800020", color: "white" }}
                        className="px-4 py-2 rounded-md"
                    >
                      Change User Avatar
                    </button>
                  </div>
                </div>
              </div>
              {/* Separator Line */}
              <div className="separator-line"></div>
            </div>

          </div>
          {/* Right Side - My Timelines (Unchanged) */}
          <div className="col-12 col-md-6 d-flex flex-column text-center mx-auto mt-3 mt-md-0">
            <h2 className="mb-5">My Timelines</h2>
            {userTimelines.length === 0 ? (
              <Link to="/timeline_initial">
                <p>You haven't saved any timelines yet, click here to start now!</p>
              </Link>
            ) : (
              <div className="list-group">
                {userTimelines.map((obj) => (
                  <div
                    key={obj.id}
                    className="timeline-box d-flex align-items-center justify-content-between"
                  >
                    <span
                      className="timeline-link"
                      onClick={() => handleTimelineClick(obj)}
                    >
                      <span className="timeline-text">{obj.name}</span>
                      <span className="timeline-text">
                        Last Modified: {moment(obj.last_modified).format("MMM DD, YYYY h:mm A")}
                      </span>
                    </span>
                    <button onClick={() => handleDeleteClick(obj)}
                      className="timeline-delete btn btn-lg p-0 border-0 bg-transparent">
                      <TrashLogo size={25} className="me-1 text-danger" /> {/* Added text-danger for red icon */}
                    </button>
                  </div>
                ))}
                {/* Add New Timeline Button */}
                <Link to="/timeline_initial" className="timeline-add">
                  <span className="timeline-text">+</span>
                </Link>
              </div>
            )}
          </div>
        </div>


      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
              <h2>Upload Your Photo</h2>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-400 p-10 text-center cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md"
                />
              ) : (
                <p>Drag & Drop your photo here or click to select</p>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex justify-between mt-4">
              <button
                className="modal-close-btn"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                className="upload-button"
                onClick={() => {
                  alert("Image Uploaded!");
                  setIsOpen(false);
                }}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Delete Confirm Modal */}
        <DeleteModal open={showModal} onClose={() => setShowModal(false)}>
          <div className="tw-text-center tw-w-56">
            <TrashLogo size={56} className="tw-mx-auto tw-text-red-500" />
            <div className="tw-mx-auto tw-my-4 tw-w-48">
              <h3 className="tw-text-lg tw-font-black tw-text-gray-800">
                Confirm Delete
              </h3>
              <p className="tw-text-sm tw-text-gray-500">
                Are you sure you want to delete "{timelineToDelete?.name}"?
              </p>
            </div>
            <div className="tw-flex tw-gap-4">
              <button
                className="btn btn-danger tw-w-full"
                onClick={() => {
                  handleDelete(timelineToDelete?.id);
                  setShowModal(false);
                }}
              >
                Delete
              </button>
              <button
                className="btn btn-light tw-w-full"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </DeleteModal>
      </div>
    </motion.div>
  );
};

export default UserPage;