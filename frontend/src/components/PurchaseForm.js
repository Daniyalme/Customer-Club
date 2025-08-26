import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Container,
  Chip,
  Alert,
  Link,
} from "@mui/material";
import styled from "@emotion/styled";
import { addPurchase } from "../api";
import PurchasesTableModal from "./PurchaseTable";

const CustomButton = styled(Button)(() => ({
  borderRadius: "8px",
}));

const InfoContainer = styled.div(() => ({
  display: "flex",
  flexDirection: "row",
  padding: "0 20px",
  justifyContent: "space-between",
}));

const InfoSection = styled.div(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
}));

export default function PurchaseForm({ customer, isNew, setIsNew, onDone }) {
  const [name, setName] = useState(customer.name || "");
  const [amount, setAmount] = useState("");
  const [profit, setProfit] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [secondErrorMsg, setSecondErrorMsg] = useState("");
  const [data, setData] = useState(customer);
  const [openModal, setOpenModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // console.log({ customer, isNew, successMsg });
  useEffect(() => {
    setData(customer);
    if (customer.name) setName(customer.name);
  }, [customer]);

  useEffect(() => {
    if (isNew) {
      setSuccessMsg("New User");
    }
  }, [isNew]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };
  const handleSubmit = async () => {
    setErrorMsg("");
    let flag = false;
    const amt = parseFloat(amount);
    const prof = parseFloat(profit);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg("Enter a valid purchase amount.");
      flag = true;
    }
    if (name === "") {
      setSecondErrorMsg("Enter customer name.");
      flag = true;
    }
    if (flag) {
      return;
    }
    try {
      const res = await addPurchase(
        customer.phone,
        amt,
        prof,
        isNew ? name : undefined
      );
      setData(res.data);
      setIsNew(false);
      setName(res.data.name);
      setAmount("");
      setProfit("");
    } catch {
      setErrorMsg("Failed to record purchase.");
    }
  };

  return (
    <>
      <Box display="flex" flexDirection="column" gap={0.5} paddingBottom={1}>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        {secondErrorMsg && <Alert severity="error">{secondErrorMsg}</Alert>}
        {successMsg && (
          <Alert
            severity="success"
            onClose={() => setSuccessMsg("")}
            sx={{ mt: 2 }}
          >
            {successMsg}
          </Alert>
        )}
      </Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <Divider>
          <Chip label="User Info" size="small" />
        </Divider>
        {isNew && (
          <TextField
            label="Customer Name"
            value={name}
            disabled={!isNew}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
        )}

        {!isNew && (
          <>
            <InfoContainer>
              <InfoSection>
                <Typography>
                  🔸Name: <strong>{data?.name}</strong>
                </Typography>
                <Typography>
                  🔸Phone: <strong>{data?.phone}</strong>
                </Typography>
                <Typography>
                  🔸Total Profit:{" "}
                  <strong>
                    €{new Intl.NumberFormat("en-US").format(data?.totalProfit)}
                  </strong>
                </Typography>
              </InfoSection>

              <InfoSection>
                <Typography>
                  🔸Total Spent:{" "}
                  <strong>
                    €{new Intl.NumberFormat("en-US").format(data?.totalValue)}
                  </strong>
                </Typography>
                <Typography>
                  🔸Purchases:{" "}
                  <strong>
                    <Link
                      component="button"
                      underline="hover"
                      onClick={() => setOpenModal(true)}
                    >
                      {data?.numPurchases}
                    </Link>
                  </strong>
                </Typography>
                <Typography>
                  🔸Purchases over €300: <strong>{data?.numOverThresh} </strong>
                </Typography>
              </InfoSection>
            </InfoContainer>
            <Divider />
          </>
        )}
        <Divider>
          <Chip label={"Purchase Info"} size="small" />
        </Divider>
        <TextField
          label="New Purchase (€)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
        />
        <TextField
          label="Profit (€)"
          value={profit}
          onChange={(e) => setProfit(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
        />

        <Box display="flex" gap={2}>
          <CustomButton variant="contained" onClick={handleSubmit}>
            {isNew ? "Add & Save" : "Add Purchase"}
          </CustomButton>
          <CustomButton variant="outlined" onClick={onDone}>
            Back
          </CustomButton>
        </Box>
      </Box>
      {!isNew && (
        <PurchasesTableModal
          purchases={data?.purchases}
          name={name}
          open={openModal}
          onClose={() => setOpenModal(false)}
          updateData={(data) => setData(data)}
        />
      )}
    </>
  );
}
