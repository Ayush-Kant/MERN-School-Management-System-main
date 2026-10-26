import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllNotices } from "../redux/noticeRelated/noticeHandle";

import {
  Paper,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";

import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";

import TableViewTemplate from "./TableViewTemplate";

const SeeNotice = () => {
  const dispatch = useDispatch();

  const { currentUser, currentRole } = useSelector(
    (state) => state.user
  );

  const {
    noticesList,
    loading,
    error,
    response,
  } = useSelector((state) => state.notice);

  useEffect(() => {
    if (currentRole === "Admin") {
      dispatch(getAllNotices(currentUser._id, "Notice"));
    } else {
      dispatch(getAllNotices(currentUser.school._id, "Notice"));
    }
  }, [dispatch, currentRole, currentUser]);

  if (error) {
    console.log(error);
  }

  const noticeColumns = [
    {
      id: "title",
      label: "Title",
      minWidth: 170,
    },
    {
      id: "details",
      label: "Details",
      minWidth: 100,
    },
    {
      id: "date",
      label: "Date",
      minWidth: 170,
    },
  ];

  const noticeRows =
    noticesList &&
    noticesList.map((notice) => {
      const date = new Date(notice.date);

      const dateString =
        date.toString() !== "Invalid Date"
          ? date.toISOString().substring(0, 10)
          : "Invalid Date";

      return {
        title: notice.title,
        details: notice.details,
        date: dateString,
        id: notice._id,
      };
    });

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        bgcolor: "#111827",
        border: "1px solid #1E293B",
        borderRadius: "18px",
        overflow: "hidden",
      }}
    >
      {/* Header */}

      <Box
        sx={{
          px: 3,
          py: 2.2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(90deg,#172554 0%,#111827 100%)",
          borderBottom: "1px solid #1E293B",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <CampaignRoundedIcon
            sx={{
              color: "#FBBF24",
              mr: 1.5,
            }}
          />

          <Box>
            <Typography
              sx={{
                color: "#F8FAFC",
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              Recent Notices
            </Typography>

            <Typography
              sx={{
                color: "#94A3B8",
                fontSize: ".82rem",
              }}
            >
              Latest announcements from administration
            </Typography>
          </Box>
        </Box>

        {!loading && !response && (
          <Typography
            sx={{
              color: "#FBBF24",
              fontWeight: 600,
            }}
          >
            {noticeRows?.length || 0} Notices
          </Typography>
        )}
      </Box>

      {/* Body */}

      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box
            sx={{
              height: 250,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <CircularProgress
              sx={{ color: "#2563EB" }}
            />

            <Typography color="#94A3B8">
              Loading notices...
            </Typography>
          </Box>
        ) : response ? (
          <Box
            sx={{
              height: 220,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <CampaignRoundedIcon
              sx={{
                fontSize: 60,
                color: "#475569",
                mb: 2,
              }}
            />

            <Typography
              sx={{
                color: "#F8FAFC",
                fontWeight: 600,
              }}
            >
              No Notices Available
            </Typography>

            <Typography
              sx={{
                color: "#94A3B8",
                mt: 1,
              }}
            >
              New announcements will appear here.
            </Typography>
          </Box>
        ) : (
          <TableViewTemplate
            columns={noticeColumns}
            rows={noticeRows}
          />
        )}
      </Box>
    </Paper>
  );
};

export default SeeNotice;