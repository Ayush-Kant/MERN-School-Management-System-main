import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const TeacherComplain = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#070B14",
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: "#111827",
          border: "1px solid #1E293B",
          borderRadius: "20px",
          p: 3,
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Complaints
          </Typography>

          <Typography
            sx={{
              color: "#94A3B8",
              mt: 1,
            }}
          >
            View and manage complaints submitted by students.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{
            bgcolor: "#2563EB",
            textTransform: "none",
            borderRadius: "12px",
            px: 3,
            py: 1.2,
            fontWeight: 600,

            "&:hover": {
              bgcolor: "#1D4ED8",
            },
          }}
        >
          New Complaint
        </Button>
      </Paper>

      {/* Empty State */}
      <Paper
        elevation={0}
        sx={{
          background: "#111827",
          border: "1px solid #1E293B",
          borderRadius: "20px",
          minHeight: "420px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          p: 5,
        }}
      >
        <ReportProblemOutlinedIcon
          sx={{
            fontSize: 80,
            color: "#FBBF24",
            mb: 3,
          }}
        />

        <Typography
          variant="h5"
          sx={{
            color: "#fff",
            fontWeight: 700,
            mb: 2,
          }}
        >
          No Complaints Available
        </Typography>

        <Typography
          sx={{
            color: "#94A3B8",
            maxWidth: 500,
            lineHeight: 1.8,
          }}
        >
          There are currently no complaints assigned to you.
          Any future complaints submitted by students will appear
          here for review and action.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TeacherComplain;