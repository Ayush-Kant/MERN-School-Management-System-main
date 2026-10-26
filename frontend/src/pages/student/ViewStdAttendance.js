import React, { useEffect, useState } from "react";

import {
    BottomNavigation,
    BottomNavigationAction,
    Box,
    Button,
    Collapse,
    Paper,
    Table,
    TableBody,
    TableHead,
    Typography,
    Avatar,
    Container,
} from "@mui/material";

import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    InsertChart,
    InsertChartOutlined,
    TableChart,
    TableChartOutlined,
    FactCheckRounded,
} from "@mui/icons-material";

import styled from "styled-components";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import {
    getUserDetails,
} from "../../redux/userRelated/userHandle";

import {
    calculateOverallAttendancePercentage,
    calculateSubjectAttendancePercentage,
    groupAttendanceBySubject,
} from "../../components/attendanceCalculator";

import CustomBarChart from "../../components/CustomBarChart";

import {
    StyledTableCell,
    StyledTableRow,
} from "../../components/styles";

const ViewStdAttendance = () => {

    const dispatch = useDispatch();

    const [openStates, setOpenStates] =
        useState({});

    const handleOpen = (subId) => {

        setOpenStates((prevState) => ({
            ...prevState,
            [subId]: !prevState[subId],
        }));

    };

    const {
        userDetails,
        currentUser,
        loading,
        response,
        error,
    } = useSelector(
        (state) => state.user
    );

    useEffect(() => {

        dispatch(
            getUserDetails(
                currentUser._id,
                "Student"
            )
        );

    }, [
        dispatch,
        currentUser._id,
    ]);

    if (response) {
        console.log(response);
    }
    else if (error) {
        console.log(error);
    }

    const [
        subjectAttendance,
        setSubjectAttendance,
    ] = useState([]);

    const [
        selectedSection,
        setSelectedSection,
    ] = useState("table");

    useEffect(() => {

        if (userDetails) {

            setSubjectAttendance(
                userDetails.attendance || []
            );

        }

    }, [userDetails]);

    const attendanceBySubject =
        groupAttendanceBySubject(
            subjectAttendance
        );

    const overallAttendancePercentage =
        calculateOverallAttendancePercentage(
            subjectAttendance
        );

    const subjectData =
        Object.entries(attendanceBySubject).map(
            ([
                subName,
                {
                    present,
                    sessions,
                },
            ]) => {

                return {

                    subject: subName,

                    attendancePercentage:
                        calculateSubjectAttendancePercentage(
                            present,
                            sessions
                        ),

                    totalClasses: sessions,

                    attendedClasses: present,

                };

            }
        );

    const handleSectionChange = (
        event,
        newSection
    ) => {

        setSelectedSection(
            newSection
        );

    };

    const renderTableSection = () => {

        return (

            <>

                <SectionHeading>

                    Attendance Report

                </SectionHeading>

                <Table>

                    <TableHead>

                        <StyledTableRow>

                            <StyledTableCell>

                                Subject

                            </StyledTableCell>

                            <StyledTableCell>

                                Present

                            </StyledTableCell>

                            <StyledTableCell>

                                Total

                            </StyledTableCell>

                            <StyledTableCell>

                                Attendance

                            </StyledTableCell>

                            <StyledTableCell
                                align="center"
                            >

                                Details

                            </StyledTableCell>

                        </StyledTableRow>

                    </TableHead>

                    {Object.entries(
                        attendanceBySubject
                    ).map(

                        (
                            [
                                subName,
                                {
                                    present,
                                    allData,
                                    subId,
                                    sessions,
                                },
                            ],
                            index
                        ) => {

                            const subjectAttendancePercentage =
                                calculateSubjectAttendancePercentage(
                                    present,
                                    sessions
                                );

                            return (

                                <TableBody
                                    key={index}
                                >

                                    <StyledTableRow>

                                        <StyledTableCell>

                                            {subName}

                                        </StyledTableCell>

                                        <StyledTableCell>

                                            {present}

                                        </StyledTableCell>

                                        <StyledTableCell>

                                            {sessions}

                                        </StyledTableCell>

                                        <StyledTableCell>

                                            {

                                                subjectAttendancePercentage

                                            }%

                                        </StyledTableCell>

                                        <StyledTableCell
                                            align="center"
                                        >

                                            <Button
                                                variant="contained"
                                                sx={{
                                                    bgcolor:"#2563EB",
                                                    textTransform:"none",
                                                    borderRadius:3,
                                                }}
                                                onClick={() =>
                                                    handleOpen(subId)
                                                }
                                            >

                                                {

                                                    openStates[subId]
                                                        ? <KeyboardArrowUp/>
                                                        : <KeyboardArrowDown/>

                                                }

                                                Details

                                            </Button>

                                        </StyledTableCell>

                                    </StyledTableRow>

                                    <StyledTableRow>

                                        <StyledTableCell
                                            colSpan={6}
                                            sx={{
                                                p:0,
                                            }}
                                        >

                                            <Collapse
                                                in={openStates[subId]}
                                                timeout="auto"
                                                unmountOnExit
                                            >

                                                <Box
                                                    sx={{
                                                        p:3,
                                                        bgcolor:"#0F172A",
                                                    }}
                                                >

                                                    <Typography
                                                        sx={{
                                                            color:"white",
                                                            fontWeight:700,
                                                            mb:2,
                                                        }}
                                                    >

                                                        Attendance Details

                                                    </Typography>

                                                    <Table
                                                        size="small"
                                                    >

                                                        <TableHead>

                                                            <StyledTableRow>

                                                                <StyledTableCell>

                                                                    Date

                                                                </StyledTableCell>

                                                                <StyledTableCell>

                                                                    Status

                                                                </StyledTableCell>

                                                            </StyledTableRow>

                                                        </TableHead>

                                                        <TableBody>

                                                            {allData.map(

                                                                (
                                                                    data,
                                                                    index
                                                                ) => {

                                                                    const date =
                                                                        new Date(
                                                                            data.date
                                                                        );

                                                                    const dateString =
                                                                        date.toString() !== "Invalid Date"
                                                                            ? date.toISOString().substring(0,10)
                                                                            : "Invalid Date";

                                                                    return (

                                                                        <StyledTableRow
                                                                            key={index}
                                                                        >

                                                                            <StyledTableCell>

                                                                                {dateString}

                                                                            </StyledTableCell>

                                                                            <StyledTableCell>

                                                                                {data.status}

                                                                            </StyledTableCell>

                                                                        </StyledTableRow>

                                                                    );

                                                                }

                                                            )}

                                                        </TableBody>

                                                    </Table>

                                                </Box>

                                            </Collapse>

                                        </StyledTableCell>

                                    </StyledTableRow>

                                </TableBody>

                            );

                        }

                    )}

                </Table>

                <AttendanceSummary>

                    Overall Attendance

                    <AttendanceValue>

                        {overallAttendancePercentage.toFixed(2)}%

                    </AttendanceValue>

                </AttendanceSummary>

            </>

        );

    };

    const renderChartSection = () => {

        return (

            <ChartWrapper>

                <CustomBarChart
                    chartData={subjectData}
                    dataKey="attendancePercentage"
                />

            </ChartWrapper>

        );

    };

    // Part 1B starts from return(...)

    return (
    <>
        {
            loading ? (

                <LoadingContainer>

                    <Typography
                        sx={{
                            color: "#CBD5E1",
                        }}
                    >
                        Loading...
                    </Typography>

                </LoadingContainer>

            ) : (

                <PageWrapper maxWidth="xl">

                    <HeroCard>

                        <HeroLeft>

                            <AvatarCircle>

                                <FactCheckRounded
                                    sx={{
                                        fontSize: 42,
                                    }}
                                />

                            </AvatarCircle>

                            <Box>

                                <PageTitle>

                                    Attendance

                                </PageTitle>

                                <PageSubtitle>

                                    Track your attendance across all subjects
                                    and monitor your academic consistency.

                                </PageSubtitle>

                            </Box>

                        </HeroLeft>

                    </HeroCard>

                    {

                        subjectAttendance &&
                        Array.isArray(subjectAttendance) &&
                        subjectAttendance.length > 0 ?

                            <>

                                <StatsCard>

                                    <Typography
                                        sx={{
                                            color: "#94A3B8",
                                            fontSize: ".95rem",
                                        }}
                                    >

                                        Overall Attendance

                                    </Typography>

                                    <AttendanceValue>

                                        {overallAttendancePercentage.toFixed(2)}%

                                    </AttendanceValue>

                                </StatsCard>

                                <ContentCard>

                                    {

                                        selectedSection === "table"

                                            ? renderTableSection()

                                            : (

                                                <>

                                                    <SectionHeading>

                                                        Attendance Analytics

                                                    </SectionHeading>

                                                    {renderChartSection()}

                                                </>

                                            )

                                    }

                                </ContentCard>

                                <StyledBottomNavigation
                                    elevation={0}
                                >

                                    <BottomNavigation
                                        value={selectedSection}
                                        onChange={handleSectionChange}
                                        showLabels
                                        sx={{
                                            bgcolor: "transparent",
                                        }}
                                    >

                                        <BottomNavigationAction
                                            label="Table"
                                            value="table"
                                            icon={
                                                selectedSection === "table"
                                                    ? <TableChart />
                                                    : <TableChartOutlined />
                                            }
                                        />

                                        <BottomNavigationAction
                                            label="Chart"
                                            value="chart"
                                            icon={
                                                selectedSection === "chart"
                                                    ? <InsertChart />
                                                    : <InsertChartOutlined />
                                            }
                                        />

                                    </BottomNavigation>

                                </StyledBottomNavigation>

                            </>

                            :

                            <EmptyStateCard>

                                <FactCheckRounded
                                    sx={{
                                        fontSize: 70,
                                        color: "#2563EB",
                                        mb: 2,
                                    }}
                                />

                                <Typography
                                    variant="h5"
                                    sx={{
                                        color: "white",
                                        fontWeight: 700,
                                        mb: 1,
                                    }}
                                >

                                    No Attendance Available

                                </Typography>

                                <Typography
                                    sx={{
                                        color: "#94A3B8",
                                        maxWidth: 420,
                                        textAlign: "center",
                                    }}
                                >

                                    Your attendance records haven't been
                                    uploaded yet. They will appear here once
                                    your teacher marks attendance.

                                </Typography>

                            </EmptyStateCard>

                    }

                </PageWrapper>

            )
        }
    </>
);
}
export default ViewStdAttendance

const PageWrapper = styled(Container)`
    padding-top: 35px;
    padding-bottom: 110px;
`;

const LoadingContainer = styled(Box)`
    min-height: 70vh;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const HeroCard = styled(Box)`
    background: linear-gradient(135deg,#111827,#0F172A);
    border:1px solid #1E293B;
    border-radius:28px;
    padding:36px;
    margin-bottom:30px;
    box-shadow:0 25px 60px rgba(0,0,0,.35);
    position:relative;
    overflow:hidden;

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

    background:linear-gradient(
        135deg,
        #2563EB,
        #1D4ED8
    ) !important;

    box-shadow:0 18px 40px rgba(37,99,235,.35);
`;

const PageTitle = styled(Typography)`
    color:white;
    font-size:2.1rem !important;
    font-weight:800 !important;
`;

const PageSubtitle = styled(Typography)`
    color:#94A3B8;
    margin-top:10px !important;
    line-height:1.8;
`;

const StatsCard = styled(Box)`
    background:#111827;
    border:1px solid #1E293B;
    border-radius:20px;
    padding:24px;
    margin-bottom:24px;

    box-shadow:0 18px 40px rgba(0,0,0,.22);
`;

const ContentCard = styled(Box)`
    background:#111827;
    border:1px solid #1E293B;
    border-radius:22px;
    padding:30px;

    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const SectionHeading = styled(Typography)`
    color:white;
    font-size:1.35rem !important;
    font-weight:700 !important;
    margin-bottom:24px !important;
`;

const AttendanceSummary = styled(Box)`
    margin-top:28px;

    display:flex;
    justify-content:space-between;
    align-items:center;

    padding:20px 24px;

    border-radius:18px;

    background:#0F172A;
    border:1px solid #1E293B;

    color:white;
    font-weight:600;

    @media(max-width:600px){
        flex-direction:column;
        gap:12px;
    }
`;

const AttendanceValue = styled(Typography)`
    color:#FBBF24;
    font-size:2rem !important;
    font-weight:800 !important;
`;

const ChartWrapper = styled(Box)`
    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:18px;
    padding:24px;
`;

const EmptyStateCard = styled(Box)`
    background:#111827;
    border:1px solid #1E293B;

    border-radius:24px;

    padding:60px 30px;

    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;

    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const StyledBottomNavigation = styled(Paper)`
    position:fixed;

    left:50%;
    bottom:22px;

    transform:translateX(-50%);

    width:fit-content;

    background:rgba(17,24,39,.95) !important;

    backdrop-filter:blur(18px);

    border:1px solid #1E293B;

    border-radius:20px !important;

    overflow:hidden;

    box-shadow:0 18px 40px rgba(0,0,0,.35);

    .MuiBottomNavigation-root{
        background:transparent;
    }

    .MuiBottomNavigationAction-root{
        color:#94A3B8;
        min-width:140px;
        transition:.3s;
    }

    .Mui-selected{
        color:#60A5FA !important;
    }

    .MuiSvgIcon-root{
        font-size:1.55rem;
    }
`;