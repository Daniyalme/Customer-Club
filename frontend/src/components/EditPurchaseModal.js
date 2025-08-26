import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  DialogActions,
  Paper,
} from "@mui/material";
import styled from "@emotion/styled";

const CustomPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "12px",
}));
const CustomButton = styled(Button)(() => ({
  borderRadius: "8px",
}));

export default function EditPurchaseModal({ purchase, open, onClose, onSave }) {
  const [newAmount, setNewAmount] = useState(purchase?.amount || "");
  const [newProfit, setNewProfit] = useState(purchase?.profit || "");

  const handleSubmit = () => {
    onSave(purchase.id, parseFloat(newAmount), parseFloat(newProfit));
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperComponent={CustomPaper}>
      <DialogTitle>Edit Purchase</DialogTitle>
      <DialogContent>
        <TextField
          label="New Amount"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          sx={{ marginTop: "20px" }}
          fullWidth
          onKeyDown={handleKeyDown}
        />
        <TextField
          label="New Profit"
          value={newProfit}
          onChange={(e) => setNewProfit(e.target.value)}
          sx={{ marginTop: "20px" }}
          fullWidth
          onKeyDown={handleKeyDown}
        />
      </DialogContent>
      <DialogActions sx={{ padding: "12px" }}>
        <CustomButton onClick={onClose}>Cancel</CustomButton>
        <CustomButton onClick={handleSubmit} variant="contained">
          Save
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
