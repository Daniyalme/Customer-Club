import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
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

export default function ConfirmDeleteModal({
  purchase,
  open,
  onClose,
  onConfirm,
}) {
  const handleConfirm = () => {
    onConfirm(purchase.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperComponent={CustomPaper}
      onKeyDown={handleKeyDown}
    >
      <DialogTitle>Delete Purchase</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the purchase dated {purchase?.date}{" "}
          with amount {purchase?.amount}?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ padding: "12px" }}>
        <CustomButton onClick={onClose}>Cancel</CustomButton>
        <CustomButton onClick={handleConfirm} variant="contained" color="error">
          Delete
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
