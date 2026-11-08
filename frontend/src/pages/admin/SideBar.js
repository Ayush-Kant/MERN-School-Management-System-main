import * as React from "react";
import {
    Divider,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";

import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";

import HomeIcon from "@mui/icons-material/Home";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AnnouncementOutlinedIcon from "@mui/icons-material/AnnouncementOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import ReportIcon from "@mui/icons-material/Report";
import AssignmentIcon from "@mui/icons-material/Assignment";

const SideBar = () => {
    const location = useLocation();

    const itemStyle = (active) => ({
        mx: 1.2,
        my: 0.4,
        px: 1,
        py: 0.8,
        borderRadius: "14px",
        minHeight: 48,

        transition: "all .25s ease",

        color: active ? "#FFFFFF" : "#94A3B8",

        background: active
            ? "linear-gradient(90deg,#2563EB,#1D4ED8)"
            : "transparent",

        boxShadow: active
            ? "0 8px 20px rgba(37,99,235,.35)"
            : "none",

        "&:hover": {
            background: active
                ? "linear-gradient(90deg,#2563EB,#1D4ED8)"
                : "#172554",

            transform: "translateX(5px)",

            "& .MuiListItemIcon-root": {
                color: "#FBBF24",
            },

            "& .MuiListItemText-primary": {
                color: "#FFFFFF",
            },
        },
    });

    const iconStyle = (active) => ({
        color: active ? "#FBBF24" : "#94A3B8",
        minWidth: 64,
        transition: ".25s",
    });

    const textStyle = {
        fontWeight: 600,
        fontSize: "0.95rem",
        letterSpacing: ".3px",
    };

    return (
        <>
            <React.Fragment>

                <ListItemButton
                    component={Link}
                    to="/"
                    sx={itemStyle(
                        location.pathname === "/" ||
                        location.pathname === "/Admin/dashboard"
                    )}
                >
                    <ListItemIcon
                        sx={iconStyle(
                            location.pathname === "/" ||
                            location.pathname === "/Admin/dashboard"
                        )}
                    >
                        <HomeIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Home"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>

                <ListItemButton
                    component={Link}
                    to="/Admin/classes"
                    sx={itemStyle(location.pathname.startsWith("/Admin/classes"))}
                >
                    <ListItemIcon
                        sx={iconStyle(location.pathname.startsWith("/Admin/classes"))}
                    >
                        <ClassOutlinedIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Classes"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>

                <ListItemButton
                    component={Link}
                    to="/Admin/subjects"
                    sx={itemStyle(location.pathname.startsWith("/Admin/subjects"))}
                >
                    <ListItemIcon
                        sx={iconStyle(location.pathname.startsWith("/Admin/subjects"))}
                    >
                        <AssignmentIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Subjects"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>

                <ListItemButton
                    component={Link}
                    to="/Admin/teachers"
                    sx={itemStyle(location.pathname.startsWith("/Admin/teachers"))}
                >
                    <ListItemIcon
                        sx={iconStyle(location.pathname.startsWith("/Admin/teachers"))}
                    >
                        <SupervisorAccountOutlinedIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Teachers"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>

                <ListItemButton
                    component={Link}
                    to="/Admin/students"
                    sx={itemStyle(location.pathname.startsWith("/Admin/students"))}
                >
                    <ListItemIcon
                        sx={iconStyle(location.pathname.startsWith("/Admin/students"))}
                    >
                        <PersonOutlineIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Students"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>

                <ListItemButton
                    component={Link}
                    to="/Admin/notices"
                    sx={itemStyle(location.pathname.startsWith("/Admin/notices"))}
                >
                    <ListItemIcon
                        sx={iconStyle(location.pathname.startsWith("/Admin/notices"))}
                    >
                        <AnnouncementOutlinedIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Notices"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>

                <ListItemButton
                    component={Link}
                    to="/Admin/complains"
                    sx={itemStyle(location.pathname.startsWith("/Admin/complains"))}
                >
                    <ListItemIcon
                        sx={iconStyle(location.pathname.startsWith("/Admin/complains"))}
                    >
                        <ReportIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Complaints"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>


                        <ListItemButton
    component={Link}
    to="/Admin/fees"
    sx={itemStyle(location.pathname.startsWith("/Admin/fees"))}
>
    <ListItemIcon
        sx={iconStyle(location.pathname.startsWith("/Admin/fees"))}
    >
        <PaymentsRoundedIcon />
    </ListItemIcon>

    <ListItemText
        primary="Fee Collection"
        primaryTypographyProps={{
            sx: textStyle,
        }}
    />
</ListItemButton>

                <ListItemButton
                    component={Link}
                    to="/Admin/learning-games"
                    sx={itemStyle(location.pathname.startsWith("/Admin/learning-games"))}
                >
                    <ListItemIcon
                        sx={iconStyle(location.pathname.startsWith("/Admin/learning-games"))}
                    >
                        <ExtensionRoundedIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Learning & Games"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>

            </React.Fragment>

            <Divider
                sx={{
                    my: 2,
                    mx: 2,
                    borderColor: "#1E293B",
                }}
            />

            <React.Fragment>

                <ListSubheader
                    sx={{
                        bgcolor: "transparent",
                        color: "#64748B",
                        fontWeight: 700,
                        fontSize: 12,
                        letterSpacing: "1px",
                    }}
                >
                    USER
                </ListSubheader>

                <ListItemButton
                    component={Link}
                    to="/Admin/profile"
                    sx={itemStyle(location.pathname.startsWith("/Admin/profile"))}
                >
                    <ListItemIcon
                        sx={iconStyle(location.pathname.startsWith("/Admin/profile"))}
                    >
                        <AccountCircleOutlinedIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Profile"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>

                <ListItemButton
                    component={Link}
                    to="/logout"
                    sx={itemStyle(location.pathname.startsWith("/logout"))}
                >
                    <ListItemIcon
                        sx={iconStyle(location.pathname.startsWith("/logout"))}
                    >
                        <ExitToAppIcon />
                    </ListItemIcon>

                    <ListItemText
                        primary="Logout"
                        primaryTypographyProps={{ sx: textStyle }}
                    />
                </ListItemButton>

            </React.Fragment>
        </>
    );
};

export default SideBar;