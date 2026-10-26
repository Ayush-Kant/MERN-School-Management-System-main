import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Collapse,
    Table,
    TableBody,
    TableHead,
    Typography,
    Grid,
    Paper,
    Avatar,
    Chip,
} from "@mui/material";
import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    PersonRounded,
    SchoolRounded,
    ClassRounded,
    BadgeRounded,
} from "@mui/icons-material";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
    calculateOverallAttendancePercentage,
    calculateSubjectAttendancePercentage,
    groupAttendanceBySubject,
} from "../../components/attendanceCalculator";

import CustomPieChart from "../../components/CustomPieChart";
import { PurpleButton } from "../../components/buttonStyles";
import {
    StyledTableCell,
    StyledTableRow,
} from "../../components/styles";

import { getUserDetails } from "../../redux/userRelated/userHandle";

const TeacherViewStudent = () => {

    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useDispatch();

    const {
        currentUser,
        userDetails,
        response,
        loading,
        error,
    } = useSelector((state) => state.user);

    const address = "Student";

    const studentID = params.id;

    const teachSubject =
        currentUser.teachSubject?.subName;

    const teachSubjectID =
        currentUser.teachSubject?._id;

    useEffect(() => {

        dispatch(
            getUserDetails(
                studentID,
                address
            )
        );

    }, [
        dispatch,
        studentID,
    ]);

    if (response) {
        console.log(response);
    } else if (error) {
        console.log(error);
    }

    const [sclassName, setSclassName] = useState("");
    const [studentSchool, setStudentSchool] = useState("");
    const [subjectMarks, setSubjectMarks] = useState([]);
    const [subjectAttendance, setSubjectAttendance] = useState([]);

    const [openStates, setOpenStates] = useState({});

    const handleOpen = (subId) => {
        setOpenStates((prev) => ({
            ...prev,
            [subId]: !prev[subId],
        }));
    };

    useEffect(() => {

        if (userDetails) {

            setSclassName(
                userDetails.sclassName || ""
            );

            setStudentSchool(
                userDetails.school || ""
            );

            setSubjectMarks(
                userDetails.examResult || []
            );

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
        100 - overallAttendancePercentage;

    const chartData = [
        {
            name: "Present",
            value: overallAttendancePercentage,
        },
        {
            name: "Absent",
            value: overallAbsentPercentage,
        },
    ];

    // Part 2 starts from:
    // return (

    return (
    <>
        {loading ? (

            <Box
                sx={{
                    minHeight: "80vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#CBD5E1",
                    fontSize: "1.2rem",
                }}
            >
                Loading...
            </Box>

        ) : (

            <Box
                sx={{
                    p: {
                        xs: 2,
                        md: 4,
                    },
                    background: "#070B14",
                    minHeight: "100vh",
                }}
            >

                {/* Header */}

                <Paper
                    elevation={0}
                    sx={{
                        background: "#111827",
                        border: "1px solid #1E293B",
                        borderRadius: 4,
                        p: 4,
                        mb: 4,
                    }}
                >

                    <Grid
                        container
                        spacing={4}
                        alignItems="center"
                    >

                        <Grid
                            item
                            xs={12}
                            md={8}
                        >

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    flexWrap: "wrap",
                                }}
                            >

                                <Avatar
                                    sx={{
                                        width: 90,
                                        height: 90,
                                        bgcolor: "#2563EB",
                                        fontSize: 34,
                                        fontWeight: 700,
                                    }}
                                >
                                    {userDetails?.name
                                        ?.charAt(0)
                                        ?.toUpperCase()}
                                </Avatar>

                                <Box>

                                    <Typography
                                        variant="h4"
                                        sx={{
                                            color: "#FFFFFF",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {userDetails?.name}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color: "#94A3B8",
                                            mt: .5,
                                        }}
                                    >
                                        Student Profile
                                    </Typography>

                                    <Box
                                        sx={{
                                            mt: 2,
                                            display: "flex",
                                            gap: 1,
                                            flexWrap: "wrap",
                                        }}
                                    >

                                        <Chip
                                            icon={<BadgeRounded />}
                                            label={`Roll : ${userDetails?.rollNum}`}
                                            sx={{
                                                bgcolor: "#0F172A",
                                                color: "#CBD5E1",
                                                border: "1px solid #1E293B",
                                            }}
                                        />

                                        <Chip
                                            icon={<ClassRounded />}
                                            label={
                                                sclassName?.sclassName
                                            }
                                            sx={{
                                                bgcolor: "#0F172A",
                                                color: "#CBD5E1",
                                                border: "1px solid #1E293B",
                                            }}
                                        />

                                    </Box>

                                </Box>

                            </Box>

                        </Grid>

                        <Grid
                            item
                            xs={12}
                            md={4}
                        >

                            <Paper
                                elevation={0}
                                sx={{
                                    background: "#0F172A",
                                    border: "1px solid #1E293B",
                                    borderRadius: 3,
                                    p: 3,
                                }}
                            >

                                <Typography
                                    sx={{
                                        color: "#94A3B8",
                                        mb: 2,
                                    }}
                                >
                                    School
                                </Typography>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: "#FFFFFF",
                                        fontWeight: 700,
                                    }}
                                >
                                    {studentSchool?.schoolName}
                                </Typography>

                                <Typography
                                    sx={{
                                        color: "#64748B",
                                        mt: 1,
                                    }}
                                >
                                    Subject :
                                    {" "}
                                    {teachSubject}
                                </Typography>

                            </Paper>

                        </Grid>

                    </Grid>

                </Paper>

                {/* Attendance Summary */}

                <Grid
                    container
                    spacing={3}
                    sx={{
                        mb: 4,
                    }}
                >

                    <Grid
                        item
                        xs={12}
                        md={8}
                    >

                        <Paper
                            elevation={0}
                            sx={{
                                background: "#111827",
                                border: "1px solid #1E293B",
                                borderRadius: 4,
                                p: 4,
                                height: "100%",
                            }}
                        >

                            <Typography
                                variant="h5"
                                sx={{
                                    color: "#FFFFFF",
                                    fontWeight: 700,
                                    mb: 3,
                                }}
                            >
                                Attendance Overview
                            </Typography>

                            <Typography
                                sx={{
                                    color: "#CBD5E1",
                                    fontSize: "1.05rem",
                                }}
                            >
                                Overall Attendance
                            </Typography>

                            <Typography
                                sx={{
                                    color: "#FBBF24",
                                    fontSize: "3rem",
                                    fontWeight: 700,
                                    mt: 1,
                                }}
                            >
                                {overallAttendancePercentage.toFixed(2)}%
                            </Typography>

                        </Paper>

                    </Grid>

                    <Grid
                        item
                        xs={12}
                        md={4}
                    >

                        <Paper
                            elevation={0}
                            sx={{
                                background: "#111827",
                                border: "1px solid #1E293B",
                                borderRadius: 4,
                                p: 3,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "100%",
                            }}
                        >

                            <CustomPieChart
                                data={chartData}
                            />

                        </Paper>

                    </Grid>

                </Grid>

                {/* Part 3 starts here */}

                {subjectAttendance &&
Array.isArray(subjectAttendance) &&
subjectAttendance.length > 0 && (

    <>
        {Object.entries(
            groupAttendanceBySubject(subjectAttendance)
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

                if (subName !== teachSubject)
                    return null;

                const subjectAttendancePercentage =
                    calculateSubjectAttendancePercentage(
                        present,
                        sessions
                    );

                return (

                    <Paper
                        key={index}
                        elevation={0}
                        sx={{
                            background: "#111827",
                            border: "1px solid #1E293B",
                            borderRadius: 4,
                            mb: 4,
                            overflow: "hidden",
                        }}
                    >

                        <Box
                            sx={{
                                p: 3,
                                borderBottom:
                                    "1px solid #1E293B",
                            }}
                        >

                            <Typography
                                variant="h5"
                                sx={{
                                    color: "#FFFFFF",
                                    fontWeight: 700,
                                }}
                            >
                                Subject Attendance
                            </Typography>

                        </Box>

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
                                        Sessions
                                    </StyledTableCell>

                                    <StyledTableCell>
                                        Percentage
                                    </StyledTableCell>

                                    <StyledTableCell align="center">
                                        Details
                                    </StyledTableCell>

                                </StyledTableRow>

                            </TableHead>

                            <TableBody>

                                <StyledTableRow>

                                    <StyledTableCell>
                                        {subName}
                                    </StyledTableCell>

                                    <StyledTableCell>

                                        <Chip
                                            label={present}
                                            sx={{
                                                bgcolor:
                                                    "rgba(16,185,129,.15)",
                                                color: "#10B981",
                                                fontWeight: 600,
                                            }}
                                        />

                                    </StyledTableCell>

                                    <StyledTableCell>
                                        {sessions}
                                    </StyledTableCell>

                                    <StyledTableCell>

                                        <Chip
                                            label={`${subjectAttendancePercentage}%`}
                                            sx={{
                                                bgcolor:
                                                    "rgba(37,99,235,.15)",
                                                color: "#60A5FA",
                                                fontWeight: 600,
                                            }}
                                        />

                                    </StyledTableCell>

                                    <StyledTableCell align="center">

                                        <Button
                                            variant="contained"
                                            onClick={() =>
                                                handleOpen(subId)
                                            }
                                            sx={{
                                                bgcolor:
                                                    "#2563EB",
                                                borderRadius:
                                                    "10px",

                                                "&:hover": {
                                                    bgcolor:
                                                        "#1D4ED8",
                                                },
                                            }}
                                            endIcon={
                                                openStates[subId]
                                                    ? (
                                                        <KeyboardArrowUp />
                                                    )
                                                    : (
                                                        <KeyboardArrowDown />
                                                    )
                                            }
                                        >
                                            Details
                                        </Button>

                                    </StyledTableCell>

                                </StyledTableRow>

                                <StyledTableRow>

                                    <StyledTableCell
                                        colSpan={6}
                                        sx={{
                                            p: 0,
                                            borderBottom: 0,
                                        }}
                                    >

                                        <Collapse
                                            in={
                                                openStates[subId]
                                            }
                                            timeout="auto"
                                            unmountOnExit
                                        >

                                            <Box
                                                sx={{
                                                    p: 3,
                                                    background:
                                                        "#0F172A",
                                                }}
                                            >

                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color:
                                                            "#FFFFFF",
                                                        mb: 2,
                                                    }}
                                                >
                                                    Attendance History
                                                </Typography>

                                                <Table
                                                    size="small"
                                                >

                                                    <TableHead>

                                                        <StyledTableRow>

                                                            <StyledTableCell>
                                                                Date
                                                            </StyledTableCell>

                                                            <StyledTableCell align="center">
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
                                                                    date.toString() !==
                                                                    "Invalid Date"
                                                                        ? date
                                                                              .toISOString()
                                                                              .substring(
                                                                                  0,
                                                                                  10
                                                                              )
                                                                        : "Invalid Date";

                                                                return (

                                                                    <StyledTableRow
                                                                        key={
                                                                            index
                                                                        }
                                                                    >

                                                                        <StyledTableCell>
                                                                            {
                                                                                dateString
                                                                            }
                                                                        </StyledTableCell>

                                                                        <StyledTableCell align="center">

                                                                            <Chip
                                                                                label={
                                                                                    data.status
                                                                                }
                                                                                sx={{
                                                                                    bgcolor:
                                                                                        data.status ===
                                                                                        "Present"
                                                                                            ? "rgba(16,185,129,.15)"
                                                                                            : "rgba(239,68,68,.15)",

                                                                                    color:
                                                                                        data.status ===
                                                                                        "Present"
                                                                                            ? "#10B981"
                                                                                            : "#EF4444",

                                                                                    fontWeight: 600,
                                                                                }}
                                                                            />

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

                        </Table>

                    </Paper>

                );
            }
        )}

        <Button
            variant="contained"
            sx={{
                bgcolor: "#2563EB",
                px: 4,
                py: 1.3,
                borderRadius: "12px",
                mb: 5,

                "&:hover": {
                    bgcolor: "#1D4ED8",
                },
            }}
            onClick={() =>
                navigate(
                    `/Teacher/class/student/attendance/${studentID}/${teachSubjectID}`
                )
            }
        >
            Add Attendance
        </Button>
    </>
)}

                <Paper
                    elevation={0}
                    sx={{
                        background: "#111827",
                        border: "1px solid #1E293B",
                        borderRadius: 4,
                        overflow: "hidden",
                        mb: 4,
                    }}
                >

                    <Box
                        sx={{
                            p: 3,
                            borderBottom: "1px solid #1E293B",
                        }}
                    >

                        <Typography
                            variant="h5"
                            sx={{
                                color: "#FFFFFF",
                                fontWeight: 700,
                            }}
                        >
                            Subject Marks
                        </Typography>

                    </Box>

                    {subjectMarks &&
                        Array.isArray(subjectMarks) &&
                        subjectMarks.length > 0 && (

                            <Table>

                                <TableHead>

                                    <StyledTableRow>

                                        <StyledTableCell>
                                            Subject
                                        </StyledTableCell>

                                        <StyledTableCell align="center">
                                            Marks Obtained
                                        </StyledTableCell>

                                    </StyledTableRow>

                                </TableHead>

                                <TableBody>

                                    {subjectMarks.map(
                                        (result, index) => {

                                            if (
                                                result.subName?.subName !==
                                                teachSubject
                                            ) {
                                                return null;
                                            }

                                            return (

                                                <StyledTableRow
                                                    key={index}
                                                >

                                                    <StyledTableCell>
                                                        {
                                                            result.subName
                                                                .subName
                                                        }
                                                    </StyledTableCell>

                                                    <StyledTableCell
                                                        align="center"
                                                    >

                                                        <Chip
                                                            label={
                                                                result.marksObtained
                                                            }
                                                            sx={{
                                                                bgcolor:
                                                                    "rgba(251,191,36,.15)",
                                                                color:
                                                                    "#FBBF24",
                                                                fontWeight: 700,
                                                                minWidth: 70,
                                                            }}
                                                        />

                                                    </StyledTableCell>

                                                </StyledTableRow>

                                            );
                                        }
                                    )}

                                </TableBody>

                            </Table>

                        )}

                    <Box
                        sx={{
                            p: 3,
                            display: "flex",
                            justifyContent: "flex-end",
                        }}
                    >

                        <PurpleButton
                            variant="contained"
                            onClick={() =>
                                navigate(
                                    `/Teacher/class/student/marks/${studentID}/${teachSubjectID}`
                                )
                            }
                            sx={{
                                borderRadius: "12px",
                                px: 4,
                                py: 1.2,
                            }}
                        >
                            Add Marks
                        </PurpleButton>

                    </Box>

                </Paper>

            </Box>

        )}

    </>
);
}

export default TeacherViewStudent;