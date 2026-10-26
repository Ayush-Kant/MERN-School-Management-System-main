import React, { useEffect, useState } from "react";
import {
    Box,
    Container,
    Typography,
    CircularProgress,
    Avatar,
    Chip,
    Stack,
    Divider,
    Paper,
    Tab,
} from "@mui/material";

import {
    BottomNavigation,
    BottomNavigationAction,
} from "@mui/material";

import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import styled from "styled-components";

import {
    getClassStudents,
    getSubjectDetails,
} from "../../../redux/sclassRelated/sclassHandle";

import {
    BlueButton,
    GreenButton,
    PurpleButton,
} from "../../../components/buttonStyles";

import TableTemplate from "../../../components/TableTemplate";

import InsertChartIcon from "@mui/icons-material/InsertChart";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import TableChartIcon from "@mui/icons-material/TableChart";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

const ViewSubject = () => {

    const navigate = useNavigate();

    const params = useParams();

    const dispatch = useDispatch();

    const {
        subloading,
        subjectDetails,
        sclassStudents,
        getresponse,
        error,
    } = useSelector(
        (state) => state.sclass
    );

    const {
        classID,
        subjectID,
    } = params;

    useEffect(() => {

        dispatch(
            getSubjectDetails(
                subjectID,
                "Subject"
            )
        );

        dispatch(
            getClassStudents(
                classID
            )
        );

    }, [
        dispatch,
        subjectID,
        classID,
    ]);

    if (error) {
        console.log(error);
    }

    const [value, setValue] =
        useState("1");

    const handleChange = (
        event,
        newValue
    ) => {
        setValue(newValue);
    };

    const [
        selectedSection,
        setSelectedSection,
    ] = useState("attendance");

    const handleSectionChange = (
        event,
        newSection
    ) => {

        setSelectedSection(
            newSection
        );

    };

    const studentColumns = [
        {
            id: "rollNum",
            label: "Roll No.",
            minWidth: 100,
        },
        {
            id: "name",
            label: "Name",
            minWidth: 170,
        },
    ];

    const studentRows =
        (sclassStudents || []).map(
            (student) => ({
                rollNum: student.rollNum,
                name: student.name,
                id: student._id,
            })
        );

    const StudentsAttendanceButtonHaver = ({
        row,
    }) => {

        return (

            <Box
                sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >

                <BlueButton
                    variant="contained"
                    onClick={() =>
                        navigate(
                            "/Admin/students/student/" +
                                row.id
                        )
                    }
                >
                    View
                </BlueButton>

                <PurpleButton
                    variant="contained"
                    onClick={() =>
                        navigate(
                            `/Admin/subject/student/attendance/${row.id}/${subjectID}`
                        )
                    }
                >
                    Take Attendance
                </PurpleButton>

            </Box>

        );

    };

    const StudentsMarksButtonHaver = ({
        row,
    }) => {

        return (

            <Box
                sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >

                <BlueButton
                    variant="contained"
                    onClick={() =>
                        navigate(
                            "/Admin/students/student/" +
                                row.id
                        )
                    }
                >
                    View
                </BlueButton>

                <PurpleButton
                    variant="contained"
                    onClick={() =>
                        navigate(
                            `/Admin/subject/student/marks/${row.id}/${subjectID}`
                        )
                    }
                >
                    Provide Marks
                </PurpleButton>

            </Box>

        );

    };

    const numberOfStudents =
        sclassStudents?.length || 0;

    const SubjectStudentsSection = () => {

        return (
            <>
                {getresponse ? (

                    <EmptyState>

                        <GroupsRoundedIcon
                            sx={{
                                fontSize: 70,
                                color: "#2563EB",
                                mb: 2,
                            }}
                        />

                        <Typography
                            variant="h5"
                            fontWeight={700}
                            color="white"
                        >
                            No Students Found
                        </Typography>

                        <Typography
                            sx={{
                                color: "#94A3B8",
                                mt: 2,
                                mb: 4,
                                textAlign: "center",
                                maxWidth: 500,
                            }}
                        >
                            Add students before taking attendance
                            or entering marks.
                        </Typography>

                        <GreenButton
                            variant="contained"
                            onClick={() =>
                                navigate(
                                    "/Admin/class/addstudents/" +
                                        classID
                                )
                            }
                        >
                            Add Students
                        </GreenButton>

                    </EmptyState>

                ) : null}
            </>
        );

    };

    const SubjectDetailsSection = () => {

        return null;

    };

    // PART 1B STARTS FROM return(...)

    return (
    <>
        {subloading ? (

            <LoadingContainer>

                <CircularProgress
                    size={55}
                    sx={{ color: "#2563EB" }}
                />

            </LoadingContainer>

        ) : (

            <PageWrapper maxWidth="xl">

                {/* Hero */}

                <HeroCard elevation={0}>

                    <HeroLeft>

                        <AvatarCircle>

                            <MenuBookRoundedIcon
                                sx={{ fontSize: 42 }}
                            />

                        </AvatarCircle>

                        <Box>

                            <PageTitle>

                                {subjectDetails?.subName || "Subject"}

                            </PageTitle>

                            <PageSubtitle>

                                Manage subject details, attendance,
                                marks and assigned teacher from one
                                centralized dashboard.

                            </PageSubtitle>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                mt={3}
                                flexWrap="wrap"
                            >

                                <Chip
                                    color="primary"
                                    label={`${numberOfStudents} Students`}
                                />

                                <Chip
                                    label={`${subjectDetails?.sessions || 0} Sessions`}
                                />

                                <Chip
                                    label={
                                        subjectDetails?.teacher
                                            ? "Teacher Assigned"
                                            : "Teacher Pending"
                                    }
                                />

                            </Stack>

                        </Box>

                    </HeroLeft>

                    <HeroRight>

                        <DashboardCard>

                            <GroupsRoundedIcon />

                            <DashboardValue>

                                {numberOfStudents}

                            </DashboardValue>

                            <DashboardLabel>

                                Students

                            </DashboardLabel>

                        </DashboardCard>

                        <DashboardCard>

                            <AccessTimeRoundedIcon />

                            <DashboardValue>

                                {subjectDetails?.sessions || 0}

                            </DashboardValue>

                            <DashboardLabel>

                                Sessions

                            </DashboardLabel>

                        </DashboardCard>

                    </HeroRight>

                </HeroCard>

                {/* Main Tabs */}

                <ContentCard>

                    <TabContext value={value}>

                        <StyledTabList
                            onChange={handleChange}
                            variant="fullWidth"
                        >

                            <Tab
                                label="Subject Details"
                                value="1"
                            />

                            <Tab
                                label="Students"
                                value="2"
                            />

                        </StyledTabList>

                        {/* DETAILS */}

                        <TabPanel
                            value="1"
                            sx={{ px: 0, pt: 4 }}
                        >

                            <SectionHeading>

                                Subject Information

                            </SectionHeading>

                            <Divider
                                sx={{
                                    borderColor: "#1E293B",
                                    mb: 4,
                                }}
                            />

                            <InfoGrid>

                                <InfoCard>

                                    <MenuBookRoundedIcon />

                                    <InfoTitle>

                                        Subject Name

                                    </InfoTitle>

                                    <InfoValue>

                                        {subjectDetails?.subName}

                                    </InfoValue>

                                </InfoCard>

                                <InfoCard>

                                    <SchoolRoundedIcon />

                                    <InfoTitle>

                                        Subject Code

                                    </InfoTitle>

                                    <InfoValue>

                                        {subjectDetails?.subCode}

                                    </InfoValue>

                                </InfoCard>

                                <InfoCard>

                                    <AccessTimeRoundedIcon />

                                    <InfoTitle>

                                        Weekly Sessions

                                    </InfoTitle>

                                    <InfoValue>

                                        {subjectDetails?.sessions}

                                    </InfoValue>

                                </InfoCard>

                                <InfoCard>

                                    <GroupsRoundedIcon />

                                    <InfoTitle>

                                        Students

                                    </InfoTitle>

                                    <InfoValue>

                                        {numberOfStudents}

                                    </InfoValue>

                                </InfoCard>

                            </InfoGrid>

                            <TeacherCard>

                                <PersonRoundedIcon
                                    sx={{
                                        fontSize: 42,
                                        color: "#2563EB",
                                    }}
                                />

                                <Box flex={1}>

                                    <Typography
                                        color="white"
                                        fontWeight={700}
                                        fontSize="1.2rem"
                                    >
                                        Subject Teacher
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color: "#94A3B8",
                                            mt: 1,
                                        }}
                                    >

                                        {subjectDetails?.teacher
                                            ? subjectDetails.teacher.name
                                            : "No teacher assigned yet"}

                                    </Typography>

                                </Box>

                                {!subjectDetails?.teacher && (

                                    <GreenButton
                                        variant="contained"
                                        onClick={() =>
                                            navigate(
                                                "/Admin/teachers/addteacher/" +
                                                    subjectDetails._id
                                            )
                                        }
                                    >
                                        Assign Teacher
                                    </GreenButton>

                                )}

                            </TeacherCard>

                        </TabPanel>

                        {/* STUDENTS */}

                        <TabPanel
                            value="2"
                            sx={{ px: 0, pt: 4 }}
                        >

                            {getresponse ? (

                                <SubjectStudentsSection />

                            ) : (

                                <>

                                    <SectionHeading>

                                        Student Management

                                    </SectionHeading>

                                    <Divider
                                        sx={{
                                            borderColor: "#1E293B",
                                            mb: 3,
                                        }}
                                    />

                                    <Paper
                                        sx={{
                                            bgcolor: "#0F172A",
                                            border: "1px solid #1E293B",
                                            borderRadius: 3,
                                            mb: 3,
                                        }}
                                    >

                                        <BottomNavigation
                                            value={selectedSection}
                                            onChange={handleSectionChange}
                                            showLabels
                                            sx={{
                                                bgcolor: "transparent",
                                                "& .MuiBottomNavigationAction-root": {
                                                    color: "#94A3B8",
                                                },
                                                "& .Mui-selected": {
                                                    color: "#2563EB",
                                                },
                                            }}
                                        >

                                            <BottomNavigationAction
                                                label="Attendance"
                                                value="attendance"
                                                icon={
                                                    selectedSection === "attendance"
                                                        ? <TableChartIcon />
                                                        : <TableChartOutlinedIcon />
                                                }
                                            />

                                            <BottomNavigationAction
                                                label="Marks"
                                                value="marks"
                                                icon={
                                                    selectedSection === "marks"
                                                        ? <InsertChartIcon />
                                                        : <InsertChartOutlinedIcon />
                                                }
                                            />

                                        </BottomNavigation>

                                    </Paper>

                                    {selectedSection === "attendance" && (

                                        <TableTemplate
                                            buttonHaver={StudentsAttendanceButtonHaver}
                                            columns={studentColumns}
                                            rows={studentRows}
                                        />

                                    )}

                                    {selectedSection === "marks" && (

                                        <TableTemplate
                                            buttonHaver={StudentsMarksButtonHaver}
                                            columns={studentColumns}
                                            rows={studentRows}
                                        />

                                    )}

                                </>

                            )}

                        </TabPanel>

                    </TabContext>

                </ContentCard>

            </PageWrapper>

        )}

    </>
);
}
export default ViewSubject

const LoadingContainer = styled(Box)`
    min-height: calc(100vh - 70px);
    display: flex;
    justify-content: center;
    align-items: center;
    background: #070B14;
`;

const PageWrapper = styled(Container)`
    padding-top: 35px;
    padding-bottom: 60px;
`;

const HeroCard = styled(Paper)`
    background: linear-gradient(135deg,#111827,#0F172A) !important;
    border:1px solid #1E293B;
    border-radius:28px !important;
    padding:36px;
    margin-bottom:30px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:30px;
    overflow:hidden;
    position:relative;
    box-shadow:0 25px 60px rgba(0,0,0,.35);

    &::before{
        content:"";
        position:absolute;
        width:280px;
        height:280px;
        border-radius:50%;
        background:rgba(37,99,235,.08);
        top:-120px;
        right:-120px;
    }

    @media(max-width:900px){
        flex-direction:column;
        align-items:flex-start;
    }
`;

const HeroLeft = styled(Box)`
    display:flex;
    align-items:center;
    gap:24px;
    flex:1;
`;

const HeroRight = styled(Box)`
    display:flex;
    gap:18px;
    flex-wrap:wrap;
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
    max-width:650px;
`;

const DashboardCard = styled(Box)`
    min-width:170px;
    background:#111827;
    border:1px solid #1E293B;
    border-radius:22px;
    padding:22px;
    text-align:center;
    transition:.3s;

    svg{
        color:#2563EB;
        font-size:34px;
        margin-bottom:14px;
    }

    &:hover{
        transform:translateY(-6px);
        border-color:#2563EB;
        box-shadow:0 20px 35px rgba(37,99,235,.18);
    }
`;

const DashboardValue = styled(Typography)`
    color:white;
    font-size:1.8rem !important;
    font-weight:800 !important;
`;

const DashboardLabel = styled(Typography)`
    color:#94A3B8;
    margin-top:6px !important;
`;

const ContentCard = styled(Paper)`
    background:#111827 !important;
    border:1px solid #1E293B;
    border-radius:24px !important;
    padding:32px;
    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const StyledTabList = styled(TabList)`
    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:18px;

    .MuiTabs-indicator{
        display:none;
    }

    .MuiTab-root{
        color:#94A3B8;
        text-transform:none;
        font-weight:700;
        min-height:60px;
        transition:.3s;
    }

    .Mui-selected{
        color:white !important;
        background:#2563EB;
        border-radius:14px;
        margin:8px;
    }
`;

const SectionHeading = styled(Typography)`
    color:white;
    font-size:1.45rem !important;
    font-weight:700 !important;
`;

const InfoGrid = styled(Box)`
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:24px;
    margin-bottom:35px;
`;

const InfoCard = styled(Box)`
    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:20px;
    padding:28px;
    transition:.3s;

    svg{
        color:#2563EB;
        font-size:34px;
        margin-bottom:18px;
    }

    &:hover{
        transform:translateY(-6px);
        border-color:#2563EB;
        box-shadow:0 18px 35px rgba(37,99,235,.15);
    }
`;

const InfoTitle = styled(Typography)`
    color:#94A3B8;
    font-size:.95rem !important;
    margin-bottom:10px !important;
`;

const InfoValue = styled(Typography)`
    color:white;
    font-size:1.35rem !important;
    font-weight:700 !important;
`;

const TeacherCard = styled(Box)`
    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:20px;
    padding:28px;

    display:flex;
    align-items:center;
    gap:24px;

    margin-top:20px;

    @media(max-width:900px){
        flex-direction:column;
        align-items:flex-start;
    }
`;

const EmptyState = styled(Box)`
    min-height:420px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    text-align:center;
    padding:40px;
`;