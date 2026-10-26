import * as React from "react";
import {
    Divider,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Box,
    Typography,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";

const TeacherSideBar = () => {
    const { currentUser } = useSelector((state) => state.user);
    const sclassName = currentUser.teachSclass;

    const location = useLocation();

    const menuItemStyle = (active) => ({
        mx: 1.5,
        my: 0.5,
        borderRadius: "14px",
        minHeight: 50,
        color: active ? "#FFFFFF" : "#CBD5E1",
        backgroundColor: active ? "#2563EB" : "transparent",
        transition: "all .25s ease",

        "&:hover": {
            backgroundColor: active
                ? "#1D4ED8"
                : "rgba(37,99,235,.10)",
        },

        "& .MuiListItemIcon-root": {
            color: active ? "#FFFFFF" : "#94A3B8",
            minWidth: 42,
        },

        "& .MuiTypography-root": {
            fontWeight: active ? 600 : 500,
        },
    });

    return (
        <>
            <Box
                sx={{
                    px: 3,
                    py: 3,
                    textAlign: "center",
                }}
            >
                <Box
                    sx={{
                        width: 70,
                        height: 70,
                        borderRadius: "18px",
                        bgcolor: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                        boxShadow: "0 10px 25px rgba(37,99,235,.35)",
                    }}
                >
                    <SchoolRoundedIcon
                        sx={{
                            color: "#fff",
                            fontSize: 38,
                        }}
                    />
                </Box>

                <Typography
                    sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "1rem",
                    }}
                >
                    Teacher Panel
                </Typography>

                <Typography
                    sx={{
                        color: "#94A3B8",
                        fontSize: ".85rem",
                        mt: .5,
                    }}
                >
                    {sclassName?.sclassName}
                </Typography>
            </Box>

            <Divider sx={{ borderColor: "#1E293B", mb: 1 }} />

            <ListItemButton
                component={Link}
                to="/"
                sx={menuItemStyle(
                    location.pathname === "/" ||
                    location.pathname === "/Teacher/dashboard"
                )}
            >
                <ListItemIcon>
                    <HomeRoundedIcon />
                </ListItemIcon>

                <ListItemText primary="Dashboard" />
            </ListItemButton>

            <ListItemButton
                component={Link}
                to="/Teacher/class"
                sx={menuItemStyle(
                    location.pathname.startsWith("/Teacher/class")
                )}
            >
                <ListItemIcon>
                    <ClassRoundedIcon />
                </ListItemIcon>

                <ListItemText
                    primary={`Class ${sclassName?.sclassName}`}
                />
            </ListItemButton>

            <ListItemButton
                component={Link}
                to="/Teacher/game-zone"
                sx={menuItemStyle(
                    location.pathname.startsWith("/Teacher/game-zone")
                )}
            >
                <ListItemIcon>
                    <SportsEsportsRoundedIcon />
                </ListItemIcon>

                <ListItemText primary="Game Zone" />
            </ListItemButton>

            <ListItemButton
                component={Link}
                to="/Teacher/complain"
                sx={menuItemStyle(
                    location.pathname.startsWith("/Teacher/complain")
                )}
            >
                <ListItemIcon>
                    <CampaignRoundedIcon />
                </ListItemIcon>

                <ListItemText primary="Complaints" />
            </ListItemButton>

            <Divider
                sx={{
                    borderColor: "#1E293B",
                    my: 2,
                }}
            />

            <ListSubheader
                sx={{
                    bgcolor: "transparent",
                    color: "#64748B",
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontSize: ".72rem",
                }}
            >
                Account
            </ListSubheader>

            <ListItemButton
                component={Link}
                to="/Teacher/profile"
                sx={menuItemStyle(
                    location.pathname.startsWith("/Teacher/profile")
                )}
            >
                <ListItemIcon>
                    <AccountCircleRoundedIcon />
                </ListItemIcon>

                <ListItemText primary="Profile" />
            </ListItemButton>

            <ListItemButton
                component={Link}
                to="/logout"
                sx={menuItemStyle(
                    location.pathname.startsWith("/logout")
                )}
            >
                <ListItemIcon>
                    <ExitToAppRoundedIcon />
                </ListItemIcon>

                <ListItemText primary="Logout" />
            </ListItemButton>
        </>
    );
};

export default TeacherSideBar;