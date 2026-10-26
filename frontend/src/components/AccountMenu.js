import React, { useState } from "react";
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Settings,
  Logout,
  Person,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const AccountMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const { currentRole, currentUser } = useSelector(
    (state) => state.user
  );

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip title="Account">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{
              ml: 2,
              transition: ".25s",

              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: "#2563EB",
                color: "#fff",
                fontWeight: 700,
                border: "2px solid #FBBF24",
                boxShadow: "0 0 18px rgba(37,99,235,.35)",
              }}
            >
              {String(currentUser.name).charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        PaperProps={{
          elevation: 0,
          sx: styles.menuPaper,
        }}
      >
        <Box sx={styles.header}>
          <Avatar sx={styles.bigAvatar}>
            {String(currentUser.name).charAt(0).toUpperCase()}
          </Avatar>

          <Typography
            sx={{
              color: "#F8FAFC",
              fontWeight: 700,
              mt: 1,
            }}
          >
            {currentUser.name}
          </Typography>

          <Typography
            sx={{
              color: "#94A3B8",
              fontSize: ".82rem",
            }}
          >
            {currentRole}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "#1E293B" }} />

        <MenuItem
          component={Link}
          to={`/${currentRole}/profile`}
          sx={styles.menuItem}
        >
          <ListItemIcon>
            <Person sx={{ color: "#FBBF24" }} />
          </ListItemIcon>

          Profile
        </MenuItem>

        <MenuItem sx={styles.menuItem}>
          <ListItemIcon>
            <Settings sx={{ color: "#2563EB" }} />
          </ListItemIcon>

          Settings
        </MenuItem>

        <Divider sx={{ borderColor: "#1E293B" }} />

        <MenuItem
          component={Link}
          to="/logout"
          sx={styles.logout}
        >
          <ListItemIcon>
            <Logout sx={{ color: "#EF4444" }} />
          </ListItemIcon>

          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default AccountMenu;

const styles = {
  menuPaper: {
    mt: 1.8,
    minWidth: 250,

    borderRadius: "18px",

    overflow: "hidden",

    background: "#111827",

    border: "1px solid #1E293B",

    boxShadow: "0 25px 60px rgba(0,0,0,.45)",

    "&:before": {
      content: '""',

      position: "absolute",

      top: 0,

      right: 20,

      width: 14,

      height: 14,

      background: "#111827",

      transform: "translateY(-50%) rotate(45deg)",

      borderTop: "1px solid #1E293B",

      borderLeft: "1px solid #1E293B",

      zIndex: 0,
    },
  },

  header: {
    py: 3,

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    background:
      "linear-gradient(180deg,#172554 0%,#111827 100%)",
  },

  bigAvatar: {
    width: 70,

    height: 70,

    bgcolor: "#2563EB",

    color: "#fff",

    border: "3px solid #FBBF24",

    fontWeight: 700,

    fontSize: "1.7rem",
  },

  menuItem: {
    py: 1.6,

    color: "#F8FAFC",

    fontWeight: 500,

    "&:hover": {
      background: "#172033",
    },
  },

  logout: {
    py: 1.6,

    color: "#F87171",

    fontWeight: 600,

    "&:hover": {
      background: "rgba(127,29,29,.25)",
    },
  },
};