import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { getUserDetails } from '../../../redux/userRelated/userHandle';
import { getSubjectList } from '../../../redux/sclassRelated/sclassHandle';
import { updateStudentFields } from '../../../redux/studentRelated/studentHandle';

import {
    Box,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    Stack,
    TextField,
    CircularProgress,
    FormControl,
} from '@mui/material';

import { PurpleButton } from '../../../components/buttonStyles';
import Popup from '../../../components/Popup';

const StudentAttendance = ({ situation }) => {
    const dispatch = useDispatch();

    const { currentUser, userDetails, loading } = useSelector(
        (state) => state.user
    );

    const { subjectsList } = useSelector(
        (state) => state.sclass
    );

    const { response, error, statestatus } = useSelector(
        (state) => state.student
    );

    const params = useParams();

    const [studentID, setStudentID] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [chosenSubName, setChosenSubName] = useState("");
    const [status, setStatus] = useState('');
    const [date, setDate] = useState('');

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [loader, setLoader] = useState(false);

    useEffect(() => {
        if (situation === "Student") {
            setStudentID(params.id);
            const stdID = params.id;
            dispatch(getUserDetails(stdID, "Student"));
        }
        else if (situation === "Subject") {
            const { studentID, subjectID } = params;
            setStudentID(studentID);
            dispatch(getUserDetails(studentID, "Student"));
            setChosenSubName(subjectID);
        }
    }, [situation]);

    useEffect(() => {
        if (
            userDetails &&
            userDetails.sclassName &&
            situation === "Student"
        ) {
            dispatch(
                getSubjectList(
                    userDetails.sclassName._id,
                    "ClassSubjects"
                )
            );
        }
    }, [dispatch, userDetails]);

    const changeHandler = (event) => {
        const selectedSubject = subjectsList.find(
            (subject) => subject.subName === event.target.value
        );

        setSubjectName(selectedSubject.subName);
        setChosenSubName(selectedSubject._id);
    };

    const fields = {
        subName: chosenSubName,
        status,
        date,
    };

    const submitHandler = (event) => {
        event.preventDefault();
        setLoader(true);

        dispatch(
            updateStudentFields(
                studentID,
                fields,
                "StudentAttendance"
            )
        );
    };

    useEffect(() => {
        if (response) {
            setLoader(false);
            setShowPopup(true);
            setMessage(response);
        }
        else if (error) {
            setLoader(false);
            setShowPopup(true);
            setMessage("error");
        }
        else if (statestatus === "added") {
            setLoader(false);
            setShowPopup(true);
            setMessage("Done Successfully");
        }
    }, [response, statestatus, error]);

    // PART 2 STARTS FROM return(...)

    return (
    <>
        {loading ? (
            <>
                <div>Loading...</div>
            </>
        ) : (
            <>
                <Box
                    sx={{
                        minHeight: "100vh",
                        background: "#070B14",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        px: 3,
                        py: 6,
                    }}
                >
                    <Box
                        sx={{
                            width: "100%",
                            maxWidth: 650,
                            background: "#111827",
                            border: "1px solid #1E293B",
                            borderRadius: "20px",
                            overflow: "hidden",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                        }}
                    >
                        {/* Header */}

                        <Box
                            sx={{
                                background:
                                    "linear-gradient(135deg,#2563EB,#1D4ED8)",
                                px: 4,
                                py: 4,
                                color: "#fff",
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    mb: 1,
                                }}
                            >
                                Student Attendance
                            </Typography>

                            <Typography
                                sx={{
                                    color: "rgba(255,255,255,.9)",
                                }}
                            >
                                Mark daily attendance quickly and accurately.
                            </Typography>
                        </Box>

                        {/* Body */}

                        <Box sx={{ p: 4 }}>
                            <Stack spacing={3}>

                                <Box
                                    sx={{
                                        p: 2.5,
                                        borderRadius: "16px",
                                        background: "#0F172A",
                                        border: "1px solid #1E293B",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            color: "#94A3B8",
                                            fontSize: 13,
                                            mb: 0.5,
                                        }}
                                    >
                                        Student Name
                                    </Typography>

                                    <Typography
                                        variant="h5"
                                        sx={{
                                            color: "#fff",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {userDetails.name}
                                    </Typography>

                                    {currentUser.teachSubject && (
                                        <>
                                            <Typography
                                                sx={{
                                                    color: "#94A3B8",
                                                    fontSize: 13,
                                                    mt: 2,
                                                    mb: 0.5,
                                                }}
                                            >
                                                Subject
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    color: "#FBBF24",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {
                                                    currentUser
                                                        .teachSubject?.subName
                                                }
                                            </Typography>
                                        </>
                                    )}
                                </Box>

                                <form onSubmit={submitHandler}>
                                    <Stack spacing={3}>

                                        {situation === "Student" && (
                                            <FormControl
                                                fullWidth
                                                sx={{
                                                    "& .MuiOutlinedInput-root":
                                                        {
                                                            background:
                                                                "#0F172A",
                                                            color: "#fff",
                                                            borderRadius:
                                                                "12px",

                                                            "& fieldset": {
                                                                borderColor:
                                                                    "#334155",
                                                            },

                                                            "&:hover fieldset":
                                                                {
                                                                    borderColor:
                                                                        "#2563EB",
                                                                },

                                                            "&.Mui-focused fieldset":
                                                                {
                                                                    borderColor:
                                                                        "#2563EB",
                                                                },
                                                        },

                                                    "& .MuiInputLabel-root": {
                                                        color: "#94A3B8",
                                                    },

                                                    "& .MuiSvgIcon-root": {
                                                        color: "#fff",
                                                    },
                                                }}
                                            >
                                                <InputLabel id="demo-simple-select-label">
                                                    Select Subject
                                                </InputLabel>

                                                <Select
                                                    labelId="demo-simple-select-label"
                                                    id="demo-simple-select"
                                                    value={subjectName}
                                                    label="Choose an option"
                                                    onChange={changeHandler}
                                                    required
                                                >
                                                    {subjectsList ? (
                                                        subjectsList.map(
                                                            (
                                                                subject,
                                                                index
                                                            ) => (
                                                                <MenuItem
                                                                    key={index}
                                                                    value={
                                                                        subject.subName
                                                                    }
                                                                >
                                                                    {
                                                                        subject.subName
                                                                    }
                                                                </MenuItem>
                                                            )
                                                        )
                                                    ) : (
                                                        <MenuItem value="Select Subject">
                                                            Add Subjects For Attendance
                                                        </MenuItem>
                                                    )}
                                                </Select>
                                            </FormControl>
                                        )}

                                        <FormControl
                                            fullWidth
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    background: "#0F172A",
                                                    color: "#fff",
                                                    borderRadius: "12px",

                                                    "& fieldset": {
                                                        borderColor: "#334155",
                                                    },

                                                    "&:hover fieldset": {
                                                        borderColor: "#2563EB",
                                                    },

                                                    "&.Mui-focused fieldset": {
                                                        borderColor: "#2563EB",
                                                    },
                                                },

                                                "& .MuiInputLabel-root": {
                                                    color: "#94A3B8",
                                                },

                                                "& .MuiSvgIcon-root": {
                                                    color: "#fff",
                                                },
                                            }}
                                        >
                                            <InputLabel id="demo-simple-select-label">
                                                Attendance Status
                                            </InputLabel>

                                            <Select
                                                labelId="demo-simple-select-label"
                                                id="demo-simple-select"
                                                value={status}
                                                label="Choose an option"
                                                onChange={(event) =>
                                                    setStatus(
                                                        event.target.value
                                                    )
                                                }
                                                required
                                            >
                                                <MenuItem value="Present">
                                                    Present
                                                </MenuItem>

                                                <MenuItem value="Absent">
                                                    Absent
                                                </MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    background: "#0F172A",
                                                    color: "#fff",
                                                    borderRadius: "12px",

                                                    "& fieldset": {
                                                        borderColor: "#334155",
                                                    },

                                                    "&:hover fieldset": {
                                                        borderColor: "#2563EB",
                                                    },

                                                    "&.Mui-focused fieldset": {
                                                        borderColor: "#2563EB",
                                                    },
                                                },

                                                "& .MuiInputLabel-root": {
                                                    color: "#94A3B8",
                                                },
                                            }}
                                        >
                                            <TextField
                                                label="Select Date"
                                                type="date"
                                                value={date}
                                                onChange={(event) =>
                                                    setDate(event.target.value)
                                                }
                                                required
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        </FormControl>
                                    </Stack>

                                    <PurpleButton
                                        fullWidth
                                        size="large"
                                        sx={{
                                            mt: 4,
                                            py: 1.5,
                                            borderRadius: "12px",
                                            fontWeight: 700,
                                            fontSize: "15px",
                                            textTransform: "none",
                                        }}
                                        variant="contained"
                                        type="submit"
                                        disabled={loader}
                                    >
                                        {loader ? (
                                            <CircularProgress
                                                size={24}
                                                color="inherit"
                                            />
                                        ) : (
                                            "Submit Attendance"
                                        )}
                                    </PurpleButton>
                                </form>
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                <Popup
                    message={message}
                    setShowPopup={setShowPopup}
                    showPopup={showPopup}
                />
            </>
        )}
    </>
);

}

export default StudentAttendance;