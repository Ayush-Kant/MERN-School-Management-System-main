import * as React from "react";

import {
    Divider,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Typography,
    Box,
} from "@mui/material";

import {
    Link,
    useLocation,
} from "react-router-dom";

import styled from "styled-components";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

const StudentSideBar = () => {

    const location = useLocation();

    const isHome =
        location.pathname === "/" ||
        location.pathname === "/Student/dashboard";

    const isSubjects =
        location.pathname.startsWith(
            "/Student/subjects"
        );

    const isAttendance =
        location.pathname.startsWith(
            "/Student/attendance"
        );

    const isComplaint =
        location.pathname.startsWith(
            "/Student/complain"
        );

    const isProfile =
        location.pathname.startsWith(
            "/Student/profile"
        );

    const isLogout =
        location.pathname.startsWith(
            "/logout"
        );

    // Part 1B starts from return(...)

    return (
    <>
        <NavSection>

            <StyledNavItem
                component={Link}
                to="/"
                selected={isHome}
            >
                <ListItemIcon>
                    <HomeRoundedIcon
                        color={isHome ? "primary" : "inherit"}
                    />
                </ListItemIcon>

                <ListItemText primary="Dashboard" />
            </StyledNavItem>

            <StyledNavItem
                component={Link}
                to="/Student/subjects"
                selected={isSubjects}
            >
                <ListItemIcon>
                    <AssignmentRoundedIcon
                        color={isSubjects ? "primary" : "inherit"}
                    />
                </ListItemIcon>

                <ListItemText primary="Subjects" />
            </StyledNavItem>

            <StyledNavItem
                component={Link}
                to="/Student/attendance"
                selected={isAttendance}
            >
                <ListItemIcon>
                    <FactCheckRoundedIcon
                        color={isAttendance ? "primary" : "inherit"}
                    />
                </ListItemIcon>

                <ListItemText primary="Attendance" />
            </StyledNavItem>

            <StyledNavItem
                component={Link}
                to="/Student/complain"
                selected={isComplaint}
            >
                <ListItemIcon>
                    <CampaignRoundedIcon
                        color={isComplaint ? "primary" : "inherit"}
                    />
                </ListItemIcon>

                <ListItemText primary="Complaint" />
            </StyledNavItem>

        </NavSection>

        <StyledDivider />

        <StyledSubHeader>

            Account

        </StyledSubHeader>

        <NavSection>

            <StyledNavItem
                component={Link}
                to="/Student/profile"
                selected={isProfile}
            >
                <ListItemIcon>
                    <AccountCircleRoundedIcon
                        color={isProfile ? "primary" : "inherit"}
                    />
                </ListItemIcon>

                <ListItemText primary="Profile" />
            </StyledNavItem>

            <StyledNavItem
                component={Link}
                to="/logout"
                selected={isLogout}
            >
                <ListItemIcon>
                    <LogoutRoundedIcon
                        color={isLogout ? "primary" : "inherit"}
                    />
                </ListItemIcon>

                <ListItemText primary="Logout" />
            </StyledNavItem>

        </NavSection>
    </>
);
}
export default StudentSideBar


const NavSection = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const StyledDivider = styled(Divider)`
    margin: 20px 14px !important;
    border-color: #1E293B !important;
`;

const StyledSubHeader = styled(ListSubheader)`
    background: transparent !important;
    color: #64748B !important;
    font-size: .78rem !important;
    font-weight: 700 !important;
    letter-spacing: 1px;
    text-transform: uppercase;
    line-height: 1.5 !important;
`;

const StyledNavItem = styled(ListItemButton)`
    margin: 0 10px !important;
    border-radius: 14px !important;
    min-height: 52px;

    transition: all .25s ease !important;

    color: #CBD5E1 !important;

    .MuiListItemIcon-root{
        color: inherit;
        min-width: 42px;
    }

    .MuiListItemText-primary{
        font-weight: 600 !important;
    }

    &:hover{
        background: rgba(37,99,235,.12) !important;
        color: white !important;
        transform: translateX(4px);
    }

    &.Mui-selected{
        background: linear-gradient(
            90deg,
            rgba(37,99,235,.22),
            rgba(37,99,235,.08)
        ) !important;

        color: #60A5FA !important;

        border-left: 4px solid #2563EB;
    }

    &.Mui-selected:hover{
        background: linear-gradient(
            90deg,
            rgba(37,99,235,.28),
            rgba(37,99,235,.12)
        ) !important;
    }
`;