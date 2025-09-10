import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { NAMES } from "../constants/companies";
import "./AddExperience.css";
import Slider from "@mui/material/Slider";

const BRANCHES = [
  "CSE", "ECE", "EEE", "MECH", "CHEM", "CIVIL", "MME", "BIOTECH",
];
const BATCHES = [
  "2017-21", "2018-22", "2019-23", "2020-24", "2021-25", "2022-26", "2023-27", "2024-28", "2025-29", "2026-30",
];
const REQUIRED_FIELDS = [
  "batch", "company", "cgpaCutoff", "jobDescription", "numberOfSelections", "OT_description", "other_comments",
];

function autoGrow(e) {
  e.target.style.height = "auto";
  e.target.style.height = e.target.scrollHeight + "px";
}

const DEFAULT_EXPERIENCE = {
  company: "",
  batch: "",
  cgpaCutoff: "",
  experienceType: "Intern",
  eligibleBranches: [],
  OT_description: "",
  OT_duration: "60",
  OT_questions: [],
  interviewRounds: [{ title: "Round 1", description: "" , duration: "60"}],
  other_comments: "",
  jobDescription: "",
  numberOfSelections: "",
};

const AddExperience = ({ initialExperience, editMode, experienceId }) => {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [experience, setExperience] = useState(DEFAULT_EXPERIENCE);
  const [dontRememberSelections, setDontRememberSelections] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Autofill if editing
  useEffect(() => {
    if (initialExperience) {
      setExperience({
        ...DEFAULT_EXPERIENCE,
        ...initialExperience,
      });
      setDontRememberSelections(initialExperience.numberOfSelections === -1);
    }
  }, [initialExperience]);

  // Validation helpers
  const isFieldValid = (name, value) => {
    if (name === "cgpaCutoff") {
      const num = parseFloat(value);
      return value !== "" && !isNaN(num) && num >= 0 && num <= 10;
    }
    if (name === "numberOfSelections") {
      if (dontRememberSelections) return true;
      const num = parseInt(value, 10);
      return value !== "" && !isNaN(num) && num >= 0;
    }
    if (REQUIRED_FIELDS.includes(name)) {
      return value && value.trim() !== "";
    }
    return true;
  };

  const getInputClass = (name, value) => {
    if (!submitAttempted) return "add-exp-grid-input";
    if (isFieldValid(name, value)) return "add-exp-grid-input valid";
    return "add-exp-grid-input invalid";
  };

  const getTextareaClass = (name, value) => {
    if (!submitAttempted) return "add-exp-grid-textarea";
    if (isFieldValid(name, value)) return "add-exp-grid-textarea valid";
    return "add-exp-grid-textarea invalid";
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "eligibleBranches") {
      setExperience((prev) => ({
        ...prev,
        eligibleBranches: checked
          ? [...prev.eligibleBranches, value]
          : prev.eligibleBranches.filter((b) => b !== value),
      }));
    } else if (name === "dontRememberSelections") {
      setDontRememberSelections(checked);
      setExperience((prev) => ({
        ...prev,
        numberOfSelections: checked ? "-1" : "",
      }));
    } else {
      setExperience((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // OT Questions
  const handleOTQuestionChange = (idx, value) => {
    setExperience((prev) => {
      const updated = [...prev.OT_questions];
      updated[idx] = value;
      return { ...prev, OT_questions: updated };
    });
  };
  const addOTQuestion = () => {
    setExperience((prev) => ({
      ...prev,
      OT_questions: [...prev.OT_questions, ""],
    }));
  };
  const removeOTQuestion = (idx) => {
    setExperience((prev) => ({
      ...prev,
      OT_questions: prev.OT_questions.filter((_, i) => i !== idx),
    }));
  };

  // Interview Rounds
  const handleRoundChange = (idx, field, value) => {
    setExperience((prev) => {
      const updated = prev.interviewRounds.map((round, i) =>
        i === idx ? { ...round, [field]: value } : round
      );
      return { ...prev, interviewRounds: updated };
    });
  };
  const addRound = () => {
    setExperience((prev) => ({
      ...prev,
      interviewRounds: [
        ...prev.interviewRounds,
        { title: `Round ${prev.interviewRounds.length + 1}`, description: "", duration: "60" },
      ],
    }));
  };
  const removeRound = (idx) => {
    setExperience((prev) => ({
      ...prev,
      interviewRounds: prev.interviewRounds.filter((_, i) => i !== idx),
    }));
  };

  // Validation for OT Questions and Interview Rounds
  const isOTQuestionsValid =
    experience.OT_questions.length === 0 ||
    experience.OT_questions.every((q) => q.trim() !== "");
  const areRoundsValid = experience.interviewRounds.every(
    (r) => r.title.trim() !== "" && r.description.trim() !== ""
  );

  const printRoundDuration = (a) => {
    let s = "";
    if(Math.trunc(a/60)> 0) {
      s += (Math.trunc(a/60) + "h");
    }
    if(a%60 > 0) {
      if (s !== "") {
        s += " ";
      }
      s += (Math.trunc(a%60) + "m");
    }
    if(a == 0) {
      s = "0m"
    }
    return s;
  }

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setSubmitAttempted(true);
    setLoading(true);

    // Validate all fields
    let valid = true;
    REQUIRED_FIELDS.forEach((field) => {
      if (!isFieldValid(field, experience[field])) valid = false;
    });
    // Validate OT Questions and Interview Rounds
    if (!isOTQuestionsValid) valid = false;
    if (!areRoundsValid) valid = false;

    if (!valid) {
      setErrorMessage("Please fill all required fields.");
      setLoading(false);
      return;
    }

    // Prepare data for backend
    const payload = {
      ...experience,
      numberOfSelections: dontRememberSelections
        ? -1
        : experience.numberOfSelections,
    };

    try {
      let response, data;
      if (editMode && experienceId) {
        response = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/experiences/edit/${experienceId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        data = await response.json();
        if (response.ok) {
          setSuccessMessage("Experience updated successfully!");
        } else {
          setErrorMessage(data.message || "Update failed.");
        }
      } else {
        response = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/experiences/addExperience`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        data = await response.json();
        if (response.ok) {
          setSuccessMessage("Thank you! Experience submitted for review.");
          setExperience(DEFAULT_EXPERIENCE);
          setDontRememberSelections(false);
          setSubmitAttempted(false);
        } else {
          setErrorMessage(data.message || "Submission failed.");
        }
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again later.");
    }
    setLoading(false);
  };


  return (
    <div className="add-exp-form-bg">
      <h2 className="add-exp-title">
        {editMode ? (
          <>Edit <span className="add-exp-title-green">Experience</span></>
        ) : (
          <>Fill out the form below to add a{" "}
            <span className="add-exp-title-green">new experience</span>
          </>
        )}
      </h2>
      <form className="add-exp-form" onSubmit={handleSubmit}>
        <div className="about-highlight">
          Keep your experiences relevant and avoid overly negative rants.
        </div>
        <div className="add-exp-grid">
          <label>Batch</label>
          <select
            name="batch"
            value={experience.batch}
            onChange={handleChange}
            className={getInputClass("batch", experience.batch)}
          >
            <option value="">Select Batch</option>
            {BATCHES.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>

          <label>Company Name</label>
          <select
            name="company"
            value={experience.company}
            onChange={handleChange}
            className={getInputClass("company", experience.company)}
          >
            <option value="">Company Name</option>
            {NAMES.map((name, idx) => (
              <option key={idx} value={name}>
                {name}
              </option>
            ))}
          </select>

          <label>CGPA Cutoff</label>
          <input
            type="number"
            name="cgpaCutoff"
            value={experience.cgpaCutoff}
            onChange={handleChange}
            placeholder="CGPA"
            min="0"
            max="10"
            step="0.01"
            className={getInputClass("cgpaCutoff", experience.cgpaCutoff)}
          />

          <label>Experience Type</label>
          <select
            name="experienceType"
            value={experience.experienceType}
            onChange={handleChange}
            className="add-exp-grid-input"
          >
            <option value="Intern">Intern</option>
            <option value="Placement">Placement</option>
          </select>

          <label>Eligible Branches</label>
          <div className="branches-list">
            {BRANCHES.map((branch) => (
              <label key={branch} className="modern-checkbox-label">
                <input
                  type="checkbox"
                  name="eligibleBranches"
                  value={branch}
                  checked={experience.eligibleBranches.includes(branch)}
                  onChange={handleChange}
                  className="modern-checkbox"
                />
                <span className="modern-checkbox-custom" />
                <span className="modern-checkbox-text">{branch}</span>
              </label>
            ))}
          </div>
          <label>Job Description</label>
          <input
            type="text"
            name="jobDescription"
            value={experience.jobDescription}
            onChange={handleChange}
            placeholder="Job Description"
            className={getInputClass(
              "jobDescription",
              experience.jobDescription
            )}
            style={{ width: "100%" }}
          />

          <label>Number of Selections</label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="number"
              name="numberOfSelections"
              value={
                dontRememberSelections ? "" : experience.numberOfSelections
              }
              onChange={handleChange}
              placeholder="Number of Selections"
              min="0"
              className={getInputClass(
                "numberOfSelections",
                experience.numberOfSelections
              )}
              disabled={dontRememberSelections}
              style={{ flex: 1 }}
            />
            <label className="modern-checkbox-label" style={{ margin: 0 }}>
              <input
                type="checkbox"
                name="dontRememberSelections"
                checked={dontRememberSelections}
                onChange={handleChange}
                className="modern-checkbox"
              />
              <span className="modern-checkbox-custom" />
              <span className="modern-checkbox-text">Don't Remember</span>
            </label>
          </div>
        </div>

        <div className="add-exp-round">
          <label>Online Test Description</label>
          <textarea
            name="OT_description"
            value={experience.OT_description}
            onChange={handleChange}
            placeholder="Describe the Online Test (pattern, difficulty, etc.)"
            className={getTextareaClass(
              "OT_description",
              experience.OT_description
            )}
            onInput={autoGrow}
            rows={4}
            style={{ width: "100%", minHeight: 150 }}
          />
          <label>OT Duration:</label>
					<Slider 
							value={experience.OT_duration}
							onChange={(e, newValue) =>
								handleChange({
									target: { name: "OT_duration", value: newValue },
								})
							}
							min={0}
							max={180}
							step={10}
							sx={{
								width: "50%",
								"& .MuiSlider-track": {
									backgroundColor: "#76b852",
									border: "none",
								},
								"& .MuiSlider-rail": {
									backgroundColor: "#76b852",
								},
								"& .MuiSlider-thumb": {
									backgroundColor: "#76b852",
									"&:hover, &.Mui-focusVisible, &.Mui-active": {
										boxShadow: "0 0 0 8px rgba(118, 184, 82, 0.3)",
									},
								},
							}}
						/>
          {printRoundDuration(experience.OT_duration)}
          
        </div>

        <div className="add-exp-section">
          <label>Online Test Questions</label>
          {experience.OT_questions.length > 0 && (
            <div className="add-exp-ot-questions-list">
              {experience.OT_questions.map((q, idx) => {
                const isValid = q.trim() !== "";
                return (
                  <div
                    key={idx}
                    className={
                      "add-exp-ot-question-card" +
                      (submitAttempted ? (isValid ? " valid" : " invalid") : "")
                    }
                  >
                    <input
                      type="text"
                      value={q}
                      onChange={(e) =>
                        handleOTQuestionChange(idx, e.target.value)
                      }
                      placeholder={`Question ${idx + 1} of OT`}
                      className="plain-input"
                    />
                    <button
                      type="button"
                      className="add-exp-remove-btn"
                      onClick={() => removeOTQuestion(idx)}
                      aria-label="Remove question"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <button
            type="button"
            className="add-exp-add-btn"
            onClick={addOTQuestion}
            style={{ marginTop: 8 }}
          >
            + Add OT Question
          </button>
        </div>

        <div className="add-exp-section">
          <label>Interview Rounds</label>
          {experience.interviewRounds.map((round, idx) => {
            const titleValid = round.title.trim() !== "";
            const descValid = round.description.trim() !== "";
            return (
              <div
                key={idx}
                className={
                  "add-exp-round" +
                  (submitAttempted
                    ? titleValid && descValid
                      ? " valid"
                      : " invalid"
                    : "")
                }
                tabIndex={-1}
              >
                <input
                  type="text"
                  value={round.title}
                  onChange={(e) =>
                    handleRoundChange(idx, "title", e.target.value)
                  }
                  placeholder={`Round ${idx + 1} Title`}
                  className="plain-input"
                  style={{ width: "100%" }}
                />
                <hr className="add-exp-round-divider" />
                <textarea
                  value={round.description}
                  onChange={(e) =>
                    handleRoundChange(idx, "description", e.target.value)
                  }
                  placeholder={`Describe ${round.title || `Round ${idx + 1}`}`}
                  className="plain-textarea"
                  onInput={autoGrow}
                  rows={4}
                  style={{ width: "100%", minHeight: 150 }}
                />
                
                <label>Round Duration:</label>
                <Slider
									value={round.duration}
									onChange={(e, newValue) => handleRoundChange(idx, "duration", newValue)}
									min={0}
									max={180}
									step={10}
									sx={{
										width: "50%",
										"& .MuiSlider-track": {
											backgroundColor: "#76b852",
											border: "none",
										},
										"& .MuiSlider-rail": {
											backgroundColor: "#76b852",
										},
										"& .MuiSlider-thumb": {
											backgroundColor: "#76b852",
											"&:hover, &.Mui-focusVisible, &.Mui-active": {
												boxShadow: "0 0 0 8px rgba(118, 184, 82, 0.3)",
											},
										},
									}}
								/>
                {printRoundDuration(round.duration)}
                {experience.interviewRounds.length > 1 && (
                  <button
                    type="button"
                    className="add-exp-remove-btn"
                    onClick={() => removeRound(idx)}
                    aria-label="Remove round"
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          <button type="button" className="add-exp-add-btn" onClick={addRound}>
            + Add Interview Round
          </button>
        </div>

        <div className="add-exp-section">
          <label>Other Remarks/Comments</label>
          <textarea
            name="other_comments"
            value={experience.other_comments}
            onChange={handleChange}
            placeholder="Final Comments"
            className={getTextareaClass(
              "other_comments",
              experience.other_comments
            )}
            onInput={autoGrow}
            rows={4}
            style={{ width: "100%", minHeight: 130 }}
          />
        </div>
        <button type="submit" className="add-exp-submit-btn" disabled={loading}>
          {loading
            ? editMode
              ? "Saving..."
              : "Submitting..."
            : editMode
            ? "Save Changes"
            : "Submit"}
        </button>
        {loading && (
          <div
            className="feedback-loading"
            style={{ textAlign: "center", marginTop: 8 }}
          >
            <span
              className="spinner"
              style={{
                display: "inline-block",
                width: 22,
                height: 22,
                border: "3px solid #76b852",
                borderTop: "3px solid #eafbe7",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}
        {(errorMessage || successMessage) && (
          <div
            className={`feedback-status ${
              successMessage ? "success" : "error"
            }`}
            style={{ marginTop: 10 }}
          >
            {successMessage || errorMessage}
          </div>
        )}
      </form>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  );
};

export default AddExperience;