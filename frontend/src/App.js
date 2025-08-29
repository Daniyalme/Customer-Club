// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Import MUI Components
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from "@mui/material"; // Add IconButton

// Import MUI Icons for the pin button
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";

// Import your page components
import Dashboard from "./pages/Dashboard";
import CustomerClub from "./pages/CustomerClub";

import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: '"Lexend", "Dosis", "Segoe UI", sans-serif',
    fontWeight: 600, // Optional: set default weight
    // borderRadius: "12px",
  },
});

function App() {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isPinned, setIsPinned] = useState(false); // NEW: State to track if navbar is pinned

  // NEW: Handler for the pin button
  const handlePinClick = () => {
    setIsPinned((prevState) => !prevState);
  };

  return (
    <Router>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "relative",
        }}
      >
        <Box
          onMouseEnter={() => setIsNavbarVisible(true)}
          // MODIFIED: Navbar only hides if it's not pinned
          onMouseLeave={() => {
            if (!isPinned) {
              setIsNavbarVisible(false);
            }
          }}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 1200,
          }}
        >
          <AppBar
            position="absolute"
            elevation={0}
            sx={{
              transition: "transform 0.3s ease-in-out",
              transform: isNavbarVisible
                ? "translateY(0)"
                : "translateY(-100%)",
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              borderRadius: "8px",
            }}
          >
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Pet Shop
              </Typography>
              <Button color="inherit" component={Link} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/customer-club">
                Customer Club
              </Button>

              {/* NEW: Pin Button */}
              <IconButton
                color="inherit"
                onClick={handlePinClick}
                sx={{ ml: 1 }}
              >
                {isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
              </IconButton>
            </Toolbar>
          </AppBar>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customer-club" element={<CustomerClub />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
