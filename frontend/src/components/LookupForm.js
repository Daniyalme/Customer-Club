import React, { useState } from "react";
import { TextField, Button, Box, Alert } from "@mui/material";
import { lookupCustomer } from "../api";
import styled from "@emotion/styled";

const isPhoneValid = (phone) => {
  const regex = /^09\d{9}$/;
  return regex.test(phone);
};

export default function LookupForm({ onFound, onNotFound }) {
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSearch = async () => {
    setErrorMsg("");
    if (isPhoneValid(phone)) {
      try {
        const res = await lookupCustomer(phone);
        onFound(res.data);
      } catch (e) {
        if (e.response?.status === 404) {
          onNotFound(phone);
        } else {
          setErrorMsg("Server error, try again.");
        }
      }
    } else {
      setErrorMsg("Invalid Phone Number");
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      <TextField
        label="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onKeyDown={handleKeyDown}
        error={errorMsg}
        fullWidth
      />
      <Button
        sx={{ borderRadius: "8px" }}
        variant="contained"
        onClick={handleSearch}
      >
        Search
      </Button>
    </Box>
  );
}
