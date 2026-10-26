import { useState } from "react";
import {
    CssBaseline,
    Box,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    Chip,
    Badge,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

import { Navigate, Route, Routes } from "react-router-dom";

import TeacherSideBar from "./TeacherSideBar";
import TeacherHomePage from "./TeacherHomePage";
import TeacherProfile from "./TeacherProfile";
import TeacherClassDetails from "./TeacherClassDetails";
import TeacherViewStudent from "./TeacherViewStudent";
import TeacherComplain from "./TeacherComplain";

import Logout from "../Logout";
import StudentAttendance from "../admin/studentRelated/StudentAttendance";
import StudentExamMarks from "../admin/studentRelated/StudentExamMarks";

import AccountMenu from "../../components/AccountMenu";
import { AppBar, Drawer } from "../../components/styles";

const TeacherDashboard = () => {

    const [open, setOpen] = useState(true);

    const toggleDrawer = () => {
        setOpen((prev) => !prev);
    };

    // Part 2 starts from:
    // return (

    return (
    <Box
        sx={{
            display: "flex",
            minHeight: "100vh",
            bgcolor: "#070B14",
        }}
    >
        <CssBaseline />

        <AppBar
            position="fixed"
            open={open}
            sx={{
                background: "#111827",
                backdropFilter: "blur(18px)",
                borderBottom: "1px solid #1E293B",
                boxShadow: "0 8px 30px rgba(0,0,0,.25)",
            }}
        >
            <Toolbar
                sx={{
                    pr: 3,
                    minHeight: "72px !important",
                }}
            >

                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="open drawer"
                    onClick={toggleDrawer}
                    sx={{
                        mr: 3,
                        color: "#E2E8F0",
                        ...(open && {
                            display: "none",
                        }),

                        "&:hover": {
                            bgcolor: "rgba(37,99,235,.12)",
                        },
                    }}
                >
                    <MenuIcon />
                </IconButton>

                <Box
    sx={{
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        gap: 2,
    }}
>
    <Badge
        overlap="circular"
        anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
        }}
        badgeContent={
            <Box
                sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    bgcolor: "#10B981",
                    border: "2px solid #111827",
                }}
            />
        }
    >
        <Box
            sx={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                bgcolor: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 25px rgba(37,99,235,.35)",
            }}
        >
            <SchoolRoundedIcon
                sx={{
                    color: "#fff",
                    fontSize: 30,
                }}
            />
        </Box>
    </Badge>

    <Box>
        <Typography
            variant="h5"
            sx={{
                color: "#FFFFFF",
                fontWeight: 700,
            }}
        >
            Teacher Dashboard
        </Typography>

        <Typography
            sx={{
                color: "#94A3B8",
                fontSize: "0.9rem",
            }}
        >
            Manage classes, attendance and students
        </Typography>
    </Box>
</Box>

                <AccountMenu />

            </Toolbar>
        </AppBar>

        <Drawer
            variant="permanent"
            open={open}
            sx={open ? styles.drawerStyled : styles.hideDrawer}
        >
            <Toolbar sx={styles.toolBarStyled}>

                <IconButton
                    onClick={toggleDrawer}
                    sx={{
                        color: "#CBD5E1",

                        "&:hover": {
                            bgcolor: "rgba(37,99,235,.12)",
                        },
                    }}
                >
                    <ChevronLeftIcon />
                </IconButton>

            </Toolbar>

            <Divider
                sx={{
                    borderColor: "#1E293B",
                }}
            />

            <List component="nav">
                <TeacherSideBar />
            </List>

        </Drawer>

        <Box
            component="main"
            sx={styles.boxStyled}
        >
            <Toolbar />

            <Routes>
                                <Route
                    path="/"
                    element={<TeacherHomePage />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" />}
                />

                <Route
                    path="/Teacher/dashboard"
                    element={<TeacherHomePage />}
                />

                <Route
                    path="/Teacher/profile"
                    element={<TeacherProfile />}
                />

                <Route
                    path="/Teacher/complain"
                    element={<TeacherComplain />}
                />

                <Route
                    path="/Teacher/class"
                    element={<TeacherClassDetails />}
                />

                <Route
                    path="/Teacher/class/student/:id"
                    element={<TeacherViewStudent />}
                />

                <Route
                    path="/Teacher/class/student/attendance/:studentID/:subjectID"
                    element={
                        <StudentAttendance
                            situation="Subject"
                        />
                    }
                />

                <Route
                    path="/Teacher/class/student/marks/:studentID/:subjectID"
                    element={
                        <StudentExamMarks
                            situation="Subject"
                        />
                    }
                />

                <Route
                    path="/logout"
                    element={<Logout />}
                />

            </Routes>

        </Box>

    </Box>
);

};

export default TeacherDashboard;

const styles = {

    boxStyled: {
        flexGrow: 1,
        minHeight: "100vh",
        overflow: "auto",

        backgroundColor: "#070B14",

        padding: {
            xs: 2,
            md: 3,
        },

        color: "#FFFFFF",
    },

    toolBarStyled: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",

        minHeight: "72px",

        px: 2,

        background: "#111827",
    },

    drawerStyled: {

        display: "flex",

        "& .MuiDrawer-paper": {
            width: 260,

            background: "#111827",

            borderRight: "1px solid #1E293B",

            color: "#FFFFFF",

            boxSizing: "border-box",
        },
    },

    hideDrawer: {

        display: "flex",

        "& .MuiDrawer-paper": {
            background: "#111827",
            borderRight: "1px solid #1E293B",
            color: "#FFFFFF",
        },

        "@media (max-width:600px)": {
            display: "none",
        },
    },
};