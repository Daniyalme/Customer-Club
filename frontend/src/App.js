import React, { useState } from "react";
import { Container, Card, CardContent, Typography, Box } from "@mui/material";
import LookupForm from "./components/LookupForm";
import PurchaseForm from "./components/PurchaseForm";
import styled from "@emotion/styled";

import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: '"Lexend", "Dosis", "Segoe UI", sans-serif',
    fontWeight: 600, // Optional: set default weight
    // borderRadius: "12px",
  },
});

const CustomContainer = styled(Container)(() => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "98vh",
  flexGrow: "1",
  paddingTop: "80px",
  paddingBottom: "80px",
  animation: "fade-in",
}));

const CustomCard = styled(Card)(() => ({
  // height: "100%",
  // flexGrow: "1",
  display: "flex",
  width: "min(400px, 40vw)",
  flexDirection: "column",
  padding: "20px",
  border: "2px solid #e0e0e2",
  borderRadius: "12px",
}));
export default function App() {
  const [custData, setCustData] = useState(null);
  const [isNew, setIsNew] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CustomContainer maxWidth="lg">
        <CustomCard elevation={0}>
          <Typography variant="h5" align="center" gutterBottom>
            🐶 Customer Club 🐶
          </Typography>
          <CardContent>
            {!custData ? (
              <LookupForm
                onFound={(data) => {
                  setCustData(data);
                  setIsNew(false);
                }}
                onNotFound={(phone) => {
                  setCustData({ phone });
                  setIsNew(true);
                }}
              />
            ) : (
              <Box>
                <PurchaseForm
                  style={{ animation: "fade-in" }}
                  customer={custData}
                  isNew={isNew}
                  setIsNew={setIsNew}
                  onDone={() => {
                    setCustData(null);
                    setIsNew(false);
                  }}
                />
              </Box>
            )}
          </CardContent>
        </CustomCard>
      </CustomContainer>
    </ThemeProvider>
  );
}
