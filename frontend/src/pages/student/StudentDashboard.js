import { useState } from "react";
import {
    CssBaseline,
    Box,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    Avatar,
    Stack,
    Chip,
    Container,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WavingHandRoundedIcon from "@mui/icons-material/WavingHandRounded";

import { Navigate, Route, Routes } from "react-router-dom";

import styled from "styled-components";

import StudentSideBar from "./StudentSideBar";
import StudentHomePage from "./StudentHomePage";
import StudentProfile from "./StudentProfile";
import StudentSubjects from "./StudentSubjects";
import ViewStdAttendance from "./ViewStdAttendance";
import StudentComplain from "./StudentComplain";
import StudentGameZone from "./StudentGameZone";

import Logout from "../Logout";

import AccountMenu from "../../components/AccountMenu";
import {
    AppBar,
    Drawer,
} from "../../components/styles";

const StudentDashboard = () => {

    const [open, setOpen] =
        useState(true);

    const toggleDrawer = () => {

        setOpen((prev) => !prev);

    };

    // PART 1B STARTS FROM return(...)

    return (
    <DashboardWrapper>

        <CssBaseline />

        {/* Top Navbar */}

        <StyledAppBar
            open={open}
            position="fixed"
            elevation={0}
        >

            <Toolbar
                sx={{
                    px: { xs: 2, md: 4 },
                    minHeight: 80,
                }}
            >

                {!open && (

                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={toggleDrawer}
                        sx={{ mr: 2 }}
                    >

                        <MenuIcon />

                    </IconButton>

                )}

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flex={1}
                >

                    <AvatarCircle>

                        <SchoolRoundedIcon />

                    </AvatarCircle>

                    <Box>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >

                            


                        </Stack>

                        <PageTitle>

                            Student Dashboard

                        </PageTitle>

                    </Box>

                </Stack>

                <Chip
                    label="Student Portal"
                    sx={{
                        mr: 3,
                        bgcolor: "rgba(37,99,235,.12)",
                        color: "#60A5FA",
                        border: "1px solid rgba(37,99,235,.35)",
                        display: {
                            xs: "none",
                            md: "flex",
                        },
                    }}
                />

                <AccountMenu />

            </Toolbar>

        </StyledAppBar>

        {/* Sidebar */}

        <StyledDrawer
            variant="permanent"
            open={open}
            sx={open ? styles.drawerStyled : styles.hideDrawer}
        >

            <Toolbar
                sx={{
                    minHeight: 80,
                    justifyContent: "flex-end",
                }}
            >

                <IconButton
                    onClick={toggleDrawer}
                    sx={{
                        color: "#CBD5E1",
                    }}
                >

                    <ChevronLeftRoundedIcon />

                </IconButton>

            </Toolbar>

            <Divider
                sx={{
                    borderColor: "#1E293B",
                }}
            />

            <List
                component="nav"
                sx={{
                    px: 1.5,
                    py: 2,
                    flex: 1,
                }}
            >

                <StudentSideBar />

            </List>

            <Divider
                sx={{
                    borderColor: "#1E293B",
                }}
            />

            <Box
                sx={{
                    p: 3,
                    textAlign: "center",
                }}
            >

                <Typography
                    sx={{
                        color: "#F8FAFC",
                        fontWeight: 700,
                    }}
                >
                    Student Portal
                </Typography>

                <Typography
                    sx={{
                        color: "#64748B",
                        fontSize: ".82rem",
                        mt: .5,
                    }}
                >
                    Academic Management System
                </Typography>

            </Box>

        </StyledDrawer>

        {/* Main */}

        <MainContent>

            <Toolbar
                sx={{
                    minHeight: 90,
                }}
            />

          <Container
    maxWidth={false}
    sx={{
        py: 4,
        px: { xs: 2, md: 4 },
    }}
>

                <Routes>

                    <Route
                        path="/"
                        element={<StudentHomePage />}
                    />

                    <Route
                        path="*"
                        element={<Navigate to="/" />}
                    />

                    <Route
                        path="/Student/dashboard"
                        element={<StudentHomePage />}
                    />

                    <Route
                        path="/Student/profile"
                        element={<StudentProfile />}
                    />

                    <Route
                        path="/Student/subjects"
                        element={<StudentSubjects />}
                    />

                    <Route
                        path="/Student/game-zone"
                        element={<StudentGameZone />}
                    />

                    <Route
                        path="/Student/attendance"
                        element={<ViewStdAttendance />}
                    />

                    <Route
                        path="/Student/complain"
                        element={<StudentComplain />}
                    />

                    <Route
                        path="/logout"
                        element={<Logout />}
                    />

                </Routes>

            </Container>

        </MainContent>

    </DashboardWrapper>
);
}
export default StudentDashboard

const DashboardWrapper = styled(Box)`
    display: flex;
    min-height: 100vh;
    background: linear-gradient(180deg, #070B14 0%, #0B1220 100%);
`;

const StyledAppBar = styled(AppBar)`
    background: rgba(17, 24, 39, 0.88) !important;
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);

    border-bottom: 1px solid #1E293B;

    box-shadow: 0 10px 35px rgba(0, 0, 0, .35);
`;

const StyledDrawer = styled(Drawer)`
    .MuiDrawer-paper {
        background: #111827;
        color: #F8FAFC;

        border-right: 1px solid #1E293B;

        transition: all .35s ease;

        display: flex;
        flex-direction: column;
    }

    .MuiListItemButton-root {
        border-radius: 14px;
        margin: 6px 12px;
        transition: .25s;
    }

    .MuiListItemButton-root:hover {
        background: rgba(37, 99, 235, .12);
    }

    .Mui-selected {
        background: linear-gradient(
            90deg,
            rgba(37,99,235,.25),
            rgba(37,99,235,.12)
        ) !important;

        color: #60A5FA;

        border-left: 4px solid #2563EB;
    }

    .MuiSvgIcon-root {
        color: inherit;
    }
`;

const MainContent = styled(Box)`
    flex-grow: 1;

    min-height: 100vh;

    overflow: auto;

    background:
        radial-gradient(
            circle at top right,
            rgba(37,99,235,.08),
            transparent 30%
        ),
        linear-gradient(
            180deg,
            #070B14,
            #0B1220
        );
`;

const AvatarCircle = styled(Avatar)`
    width: 40px !important;
    height: 40px !important;

    background: linear-gradient(
        135deg,
        #2563EB,
        #1D4ED8
    ) !important;

    box-shadow: 0 12px 28px rgba(37,99,235,.35);
`;

const PageTitle = styled(Typography)`
    color: #F8FAFC;

    font-size: 1.7rem !important;

    font-weight: 800 !important;

    letter-spacing: .3px;
`;

const styles = {
    drawerStyled: {
        display: "flex",
    },

    hideDrawer: {
        display: "flex",

        "@media (max-width:600px)": {
            display: "none",
        },
    },
};