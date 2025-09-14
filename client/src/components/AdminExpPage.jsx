import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AdminExpPage.css";

const DropdownSection = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="dropdown-section">
      <button className="dropdown-header" onClick={() => setOpen(!open)}>
        {title} <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="dropdown-content">{children}</div>}
    </div>
  );
};
const ExpPage = () => {
  const { id } = useParams();
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decision, setDecision] = useState(null);
  const [expUser, setExpUser] = useState(null);
  const navigate = useNavigate();

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/user/${
          exp.user
        }`,
        { credentials: "include" }
      );
      const data = await response.json();
      if (response.ok){
        setExpUser(data.user);
        setLoading(false);
      } else {
        console.error("Error fetching data:", data.message);
        setError("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch user data");
    }
  };

  // Fetch data based on the ID from the URL
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:8000"
        }/api/experiences/specific/${id}`,
        { credentials: "include" }
      );
      const data = await response.json()
      if (response.ok){
        setExp(data);
      } else {
        console.error("Error fetching data:", data.message);
        setError("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data");
    }
  };

  const handleDecision = async (id, d) => {
    try {
      if (d === "rejected") {
        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/experiences/delete/${id}`, {
          method: "DELETE",
        });
        setDecision(<p className="success">Experience deleted</p>);
      } else {
        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/experiences/verify/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: d }),
        });
        setDecision(<p className="success">Experience accepted</p>);
      }
      setTimeout(() => {
        navigate("/admin");
      }, 1000);
    } catch (error) {
      console.error("Error updating experience status:", error);
      setDecision(<p className="error">Error occured. Please try again!</p>);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (exp) {
      fetchUser();
    }
  }, [exp]);

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
    return s;
  }

  return (
    <div className="container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="left-section">
            <div className="details-section">
              <DropdownSection title="Job Description">
                <p>{exp?.jobDescription}</p>
              </DropdownSection>

              <DropdownSection title="Number of Selections">
                <p>{exp?.numberOfSelections}</p>
              </DropdownSection>
              <DropdownSection title="Online Test Description">
                {/* find a better fix*/}
                <div className="round-heading"><h3>Online Test: </h3> {exp?.OT_duration ?<span className="bubble">{printRoundDuration(exp?.OT_duration)}</span> : null}</div> 
                <p>{exp?.OT_description}
               </p>
              </DropdownSection>

              <DropdownSection title="Online Test Questions">
                {exp?.OT_questions?.map((q, i) => (
                  <div key={i} className="question-block">
                    <p>{q}</p>
                  </div>
                ))}
              </DropdownSection>

              <DropdownSection title="Interview Rounds">
                {exp?.interviewRounds?.map((round, i) => (
                  <div key={round._id || i} className="round-block">
                    <h3 className = "round-heading">{round.title} {round.duration ?<span className="bubble">{printRoundDuration(round.duration)}</span> : null}</h3>
                    <p>{round.description}</p>
                  </div>
                ))}
              </DropdownSection>

              <DropdownSection title="Other Comments">
                <p>{exp?.other_comments}</p>
              </DropdownSection>
            </div>
          </div>
          <div className="right-section">
            <div className="user-card">
              <h1 className="user-title">User Details</h1>
              <p>
                <span className="label">Name:</span> {expUser.firstName}{" "}
                {expUser.lastName}
              </p>

              <p>
                <span className="label">Roll No:</span> {expUser.rollNo}
              </p>
              <p>
                <span className="label">Company:</span> {exp.company}
              </p>
              <p>
                <span className="label">Drive:</span> {exp.experienceType}
              </p>
              <p>
                <span className="label">CGPA cutoff:</span> {exp.cgpaCutoff}
              </p>
              <p>
                <span className="label">Eligible Branches:</span>{" "}
                {exp.eligibleBranches.join(", ")}
              </p>
              {expUser.linkedIn === "" || expUser.linkedIn === undefined ? (
                ""
              ) : (
                <p>
                  <span className="label">LinkedIn: </span>{expUser.linkedIn}
                </p>
              )}

              {expUser.github === "" || expUser.linkedIn === undefined ? (
                ""
              ) : (
                <p>
                  <span className="label">GitHub:</span> {expUser.github}
                </p>
              )}
              {expUser.resume === "" || expUser.resume === undefined ? (
                ""
              ) : (
                <p>
                  <span className="label">Resume: </span>{expUser.resume}
                </p>
              )}
            </div>
            <button
              className="read-more-btn"
              onClick={() => handleDecision(exp._id, "accepted")}
            >
              Accept
            </button>
            <button
              className="read-more-btn"
              onClick={() => handleDecision(exp._id, "rejected")}
            >
              Reject
            </button>
            {decision}
          </div>
        </>
      )}
      {error && <p>{error}</p>}
    </div>
  );
};

export default ExpPage;
