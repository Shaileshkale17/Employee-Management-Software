import React, { useState } from "react";
import axios from "axios";

const EmployeeRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "",
    salary: {
      ctc: 0,
      basic: 0,
      hra: 0,
      allowances: 0,
      tax: 0,
      pf: 0,
      otherDeductions: 0,
      netSalary: 0,
    },
    currency: "INR",
    paymentFrequency: "monthly",
    joiningDate: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For nested salary fields
    if (name in formData.salary) {
      setFormData((prev) => ({
        ...prev,
        salary: {
          ...prev.salary,
          [name]: Number(value),
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const isEmailValid = (email) => {
    const forbiddenDomain = "deecast";
    return !email.includes(forbiddenDomain);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailValid(formData.email)) {
      setError("⚠️ Not allowed to use origin email with domain 'deecast'");
      return;
    }

    setError("");

    try {
      const response = await axios.post(
        "https://your-api-endpoint.com/api/employees",
        formData
      );
      console.log("Employee registered:", response.data);
      alert("Employee registered successfully!");
    } catch (err) {
      console.error("Error registering employee:", err);
      setError("Failed to register employee.");
    }
  };

  return (
    <div className="h-screen" style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>Employee Registration</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="text"
          name="department"
          placeholder="Department ID"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="text"
          name="role"
          placeholder="Role"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="number"
          name="ctc"
          placeholder="CTC"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          name="basic"
          placeholder="Basic Salary"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          name="hra"
          placeholder="HRA"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          name="allowances"
          placeholder="Allowances"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          name="tax"
          placeholder="Tax"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          name="pf"
          placeholder="PF"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          name="otherDeductions"
          placeholder="Other Deductions"
          onChange={handleChange}
        />
        <br />
        <input
          type="number"
          name="netSalary"
          placeholder="Net Salary"
          onChange={handleChange}
        />
        <br />
        <input type="text" name="currency" value="INR" disabled />
        <br />
        <select name="paymentFrequency" onChange={handleChange}>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
        </select>
        <br />
        <input
          type="date"
          name="joiningDate"
          onChange={handleChange}
          required
        />
        <br />
        <button type="submit">Register Employee</button>
      </form>
    </div>
  );
};

export default EmployeeRegistration;
