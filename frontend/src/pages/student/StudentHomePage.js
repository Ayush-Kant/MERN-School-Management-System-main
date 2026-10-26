import React, { useEffect, useState } from "react";

import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Avatar,
    Stack,
} from "@mui/material";

import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

import { useDispatch, useSelector } from "react-redux";

import styled from "styled-components";

import CountUp from "react-countup";

import CustomPieChart from "../../components/CustomPieChart";
import SeeNotice from "../../components/SeeNotice";

import Subject from "../../assets/subjects.svg";
import Assignment from "../../assets/assignment.svg";

import { calculateOverallAttendancePercentage } from "../../components/attendanceCalculator";

import { getUserDetails } from "../../redux/userRelated/userHandle";

import { getSubjectList } from "../../redux/sclassRelated/sclassHandle";

const StudentHomePage = () => {

    const dispatch = useDispatch();

    const {
        userDetails,
        currentUser,
        loading,
        response,
    } = useSelector(
        (state) => state.user
    );

    const {
        subjectsList,
    } = useSelector(
        (state) => state.sclass
    );

    const [
        subjectAttendance,
        setSubjectAttendance,
    ] = useState([]);

    const classID =
        currentUser.sclassName._id;

    useEffect(() => {

        dispatch(
            getUserDetails(
                currentUser._id,
                "Student"
            )
        );

        dispatch(
            getSubjectList(
                classID,
                "ClassSubjects"
            )
        );

    }, [
        dispatch,
        currentUser._id,
        classID,
    ]);

    const numberOfSubjects =
        subjectsList &&
        subjectsList.length;

    useEffect(() => {

        if (userDetails) {

            setSubjectAttendance(
                userDetails.attendance || []
            );

        }

    }, [userDetails]);

    const overallAttendancePercentage =
        calculateOverallAttendancePercentage(
            subjectAttendance
        );

    const overallAbsentPercentage =
        100 -
        overallAttendancePercentage;

    const chartData = [

        {
            name: "Present",
            value:
                overallAttendancePercentage,
        },

        {
            name: "Absent",
            value:
                overallAbsentPercentage,
        },

    ];

    // Part 1B starts from return(...)

    return (
    <PageWrapper maxWidth="xl">

        {/* Hero */}

        <HeroCard>

            <HeroLeft>

                <AvatarCircle>

                    <SchoolRoundedIcon
                        sx={{ fontSize: 42 }}
                    />

                </AvatarCircle>

                <Box>

                    <PageTitle>

                        Welcome Back

                    </PageTitle>

                    <PageSubtitle>

                        Student Dashboard • Academic Overview

                    </PageSubtitle>

                </Box>

            </HeroLeft>

        </HeroCard>

        {/* Dashboard Cards */}

        <Grid
            container
            spacing={3}
            sx={{ mb: 3 }}
        >

            <Grid
                item
                xs={12}
                md={4}
            >

                <DashboardCard>

                    <CardTop>

                        <AvatarIcon>

                            <MenuBookRoundedIcon />

                        </AvatarIcon>

                        <img
                            src={Subject}
                            alt="Subjects"
                            width={65}
                        />

                    </CardTop>

                    <CardTitle>

                        Total Subjects

                    </CardTitle>

                    <CardValue
                        start={0}
                        end={numberOfSubjects || 0}
                        duration={2}
                    />

                </DashboardCard>

            </Grid>

            <Grid
                item
                xs={12}
                md={4}
            >

                <DashboardCard>

                    <CardTop>

                        <AvatarIcon>

                            <AssignmentRoundedIcon />

                        </AvatarIcon>

                        <img
                            src={Assignment}
                            alt="Assignment"
                            width={65}
                        />

                    </CardTop>

                    <CardTitle>

                        Assignments

                    </CardTitle>

                    <CardValue
                        start={0}
                        end={15}
                        duration={2}
                    />

                </DashboardCard>

            </Grid>

            <Grid
                item
                xs={12}
                md={4}
            >

                <DashboardCard>

                    <CardTop>

                        <AvatarIcon>

                            <PieChartRoundedIcon />

                        </AvatarIcon>

                    </CardTop>

                    <CardTitle>

                        Attendance

                    </CardTitle>

                    <AttendanceValue>

                        {overallAttendancePercentage.toFixed(1)}%

                    </AttendanceValue>

                </DashboardCard>

            </Grid>

        </Grid>

        {/* Attendance */}

        <Grid
            container
            spacing={3}
        >

            <Grid
                item
                xs={12}
                lg={5}
            >

                <ContentCard>

                    <SectionHeading>

                        Attendance Overview

                    </SectionHeading>

                    <ChartContainer>

                        {
                            response ? (

                                <Typography color="#94A3B8">

                                    No Attendance Found

                                </Typography>

                            ) : loading ? (

                                <Typography color="#94A3B8">

                                    Loading...

                                </Typography>

                            ) : (

                                subjectAttendance &&
                                subjectAttendance.length > 0 ? (

                                    <CustomPieChart
                                        data={chartData}
                                    />

                                ) : (

                                    <Typography color="#94A3B8">

                                        No Attendance Found

                                    </Typography>

                                )

                            )
                        }

                    </ChartContainer>

                </ContentCard>

            </Grid>

            <Grid
                item
                xs={12}
                lg={7}
            >

                <ContentCard>

                    <SectionHeading>

                        Latest Notices

                    </SectionHeading>

                    <SeeNotice />

                </ContentCard>

            </Grid>

        </Grid>

    </PageWrapper>
);
}
export default StudentHomePage

const PageWrapper = styled(Container)`
    padding-top: 35px;
    padding-bottom: 60px;
`;

const HeroCard = styled(Box)`
    background: linear-gradient(135deg, #111827, #0F172A);
    border: 1px solid #1E293B;
    border-radius: 28px;
    padding: 36px;
    margin-bottom: 30px;
    box-shadow: 0 25px 60px rgba(0,0,0,.35);
    position: relative;
    overflow: hidden;

    &::before{
        content:"";
        position:absolute;
        width:260px;
        height:260px;
        border-radius:50%;
        background:rgba(37,99,235,.08);
        top:-120px;
        right:-120px;
    }
`;

const HeroLeft = styled(Box)`
    display:flex;
    align-items:center;
    gap:24px;

    @media(max-width:700px){
        flex-direction:column;
        align-items:flex-start;
    }
`;

const AvatarCircle = styled(Avatar)`
    width:90px !important;
    height:90px !important;
    background:linear-gradient(135deg,#2563EB,#1D4ED8) !important;
    box-shadow:0 15px 35px rgba(37,99,235,.35);
`;

const PageTitle = styled(Typography)`
    color:white;
    font-size:2.2rem !important;
    font-weight:800 !important;
`;

const PageSubtitle = styled(Typography)`
    color:#94A3B8;
    margin-top:10px !important;
    line-height:1.8;
`;

const DashboardCard = styled(Paper)`
    background:#111827 !important;
    border:1px solid #1E293B;
    border-radius:22px !important;
    padding:26px;
    height:220px;

    display:flex;
    flex-direction:column;
    justify-content:space-between;

    transition:.3s;

    &:hover{
        transform:translateY(-6px);
        border-color:#2563EB;
        box-shadow:0 20px 40px rgba(37,99,235,.18);
    }
`;

const CardTop = styled(Box)`
    display:flex;
    justify-content:space-between;
    align-items:center;
`;

const AvatarIcon = styled(Avatar)`
    background:rgba(37,99,235,.12) !important;
    color:#60A5FA !important;

    width:58px !important;
    height:58px !important;
`;

const CardTitle = styled(Typography)`
    color:#94A3B8;
    font-size:1rem !important;
    font-weight:600 !important;
`;

const CardValue = styled(CountUp)`
    color:white;
    font-size:2.5rem;
    font-weight:800;
`;

const AttendanceValue = styled(Typography)`
    color:#22C55E;
    font-size:2.5rem !important;
    font-weight:800 !important;
`;

const ContentCard = styled(Paper)`
    background:#111827 !important;
    border:1px solid #1E293B;
    border-radius:22px !important;
    padding:28px;
    min-height:420px;
`;

const SectionHeading = styled(Typography)`
    color:white;
    font-size:1.4rem !important;
    font-weight:700 !important;
    margin-bottom:22px !important;
`;

const ChartContainer = styled(Box)`
    display:flex;
    align-items:center;
    justify-content:center;
    min-height:320px;
`;