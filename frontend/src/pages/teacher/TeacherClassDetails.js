import { useEffect } from "react";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
    Paper,
    Box,
    Typography,
    ButtonGroup,
    Button,
    Popper,
    Grow,
    ClickAwayListener,
    MenuList,
    MenuItem,
    CircularProgress,
    Chip,
} from "@mui/material";

import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    SchoolRounded,
} from "@mui/icons-material";

import { BlackButton } from "../../components/buttonStyles";
import TableTemplate from "../../components/TableTemplate";

import { getClassStudents } from "../../redux/sclassRelated/sclassHandle";

const TeacherClassDetails = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        sclassStudents,
        loading,
        error,
        getresponse,
    } = useSelector((state) => state.sclass);

    const { currentUser } = useSelector(
        (state) => state.user
    );

    const classID =
        currentUser.teachSclass?._id;

    const subjectID =
        currentUser.teachSubject?._id;

    useEffect(() => {

        dispatch(
            getClassStudents(classID)
        );

    }, [dispatch, classID]);

    if (error) {
        console.log(error);
    }

    const studentColumns = [
        {
            id: "name",
            label: "Name",
            minWidth: 220,
        },
        {
            id: "rollNum",
            label: "Roll Number",
            minWidth: 140,
        },
    ];

    const studentRows = (sclassStudents || []).map(
        (student) => ({
            name: student.name,
            rollNum: student.rollNum,
            id: student._id,
        })
    );

    // Part 2 starts from:
    // const StudentsButtonHaver = ({ row }) => {

        const StudentsButtonHaver = ({ row }) => {

    const options = [
        "Take Attendance",
        "Provide Marks",
    ];

    const [open, setOpen] =
        React.useState(false);

    const anchorRef =
        React.useRef(null);

    const [selectedIndex, setSelectedIndex] =
        React.useState(0);

    const handleClick = () => {

        if (selectedIndex === 0) {
            handleAttendance();
        }
        else if (selectedIndex === 1) {
            handleMarks();
        }

    };

    const handleAttendance = () => {

        navigate(
            `/Teacher/class/student/attendance/${row.id}/${subjectID}`
        );

    };

    const handleMarks = () => {

        navigate(
            `/Teacher/class/student/marks/${row.id}/${subjectID}`
        );

    };

    const handleMenuItemClick = (
        event,
        index
    ) => {

        setSelectedIndex(index);
        setOpen(false);

    };

    const handleToggle = () => {

        setOpen((prevOpen) => !prevOpen);

    };

    const handleClose = (event) => {

        if (
            anchorRef.current &&
            anchorRef.current.contains(event.target)
        ) {
            return;
        }

        setOpen(false);

    };

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
            }}
        >

            <Button
                variant="contained"
                onClick={() =>
                    navigate(
                        "/Teacher/class/student/" +
                        row.id
                    )
                }
                sx={{
                    bgcolor: "#2563EB",
                    color: "#fff",
                    textTransform: "none",
                    borderRadius: "12px",
                    px: 3,
                    fontWeight: 600,
                    boxShadow:
                        "0 8px 20px rgba(37,99,235,.30)",

                    "&:hover": {
                        bgcolor: "#1D4ED8",
                    },
                }}
            >
                View
            </Button>

            <ButtonGroup
                variant="contained"
                ref={anchorRef}
                sx={{
                    "& .MuiButton-root": {
                        textTransform: "none",
                        fontWeight: 600,
                        bgcolor: "#1E293B",
                        color: "#fff",
                        borderColor: "#334155",

                        "&:hover": {
                            bgcolor: "#2563EB",
                        },
                    },
                }}
            >

                <Button onClick={handleClick}>
                    {options[selectedIndex]}
                </Button>

                <BlackButton
                    size="small"
                    aria-controls={
                        open
                            ? "split-button-menu"
                            : undefined
                    }
                    aria-expanded={
                        open
                            ? "true"
                            : undefined
                    }
                    aria-haspopup="menu"
                    onClick={handleToggle}
                >
                    {open ? (
                        <KeyboardArrowUp />
                    ) : (
                        <KeyboardArrowDown />
                    )}
                </BlackButton>

            </ButtonGroup>

            <Popper
                open={open}
                anchorEl={anchorRef.current}
                transition
                disablePortal
                sx={{
                    zIndex: 1500,
                }}
            >

                {({
                    TransitionProps,
                    placement,
                }) => (

                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement ===
                                "bottom"
                                    ? "center top"
                                    : "center bottom",
                        }}
                    >

                        <Paper
                            sx={{
                                bgcolor: "#111827",
                                color: "#fff",
                                border:
                                    "1px solid #1E293B",
                                borderRadius: "14px",
                                overflow: "hidden",
                            }}
                        >

                            <ClickAwayListener
                                onClickAway={
                                    handleClose
                                }
                            >

                                <MenuList
                                    autoFocusItem
                                >

                                    {options.map(
                                        (
                                            option,
                                            index
                                        ) => (

                                            <MenuItem
                                                key={
                                                    option
                                                }
                                                selected={
                                                    index ===
                                                    selectedIndex
                                                }
                                                onClick={(
                                                    event
                                                ) =>
                                                    handleMenuItemClick(
                                                        event,
                                                        index
                                                    )
                                                }
                                                sx={{
                                                    color:
                                                        "#E2E8F0",

                                                    "&:hover":
                                                        {
                                                            bgcolor:
                                                                "#1E293B",
                                                        },

                                                    "&.Mui-selected":
                                                        {
                                                            bgcolor:
                                                                "rgba(37,99,235,.20)",

                                                            color:
                                                                "#60A5FA",
                                                        },
                                                }}
                                            >
                                                {
                                                    option
                                                }
                                            </MenuItem>

                                        )
                                    )}

                                </MenuList>

                            </ClickAwayListener>

                        </Paper>

                    </Grow>

                )}

            </Popper>

        </Box>
    );

};
return (
    <>
        {loading ? (

            <Box
                sx={{
                    minHeight: "70vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: "#070B14",
                }}
            >
                <CircularProgress
                    size={60}
                    sx={{
                        color: "#2563EB",
                    }}
                />
            </Box>

        ) : (

            <Box
                sx={{
                    p: 3,
                    bgcolor: "#070B14",
                    minHeight: "100vh",
                }}
            >

                <Box
                    sx={{
                        mb: 4,
                        p: 3,
                        borderRadius: "22px",
                        background: "#111827",
                        border: "1px solid #1E293B",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 2,
                    }}
                >

                    <Box>

                        <Typography
                            variant="h4"
                            sx={{
                                color: "#FFFFFF",
                                fontWeight: 700,
                            }}
                        >
                            Class Details
                        </Typography>

                        <Typography
                            sx={{
                                color: "#94A3B8",
                                mt: 0.7,
                            }}
                        >
                            Manage students, attendance
                            and marks from one place.
                        </Typography>

                    </Box>

                    <Chip
                        icon={
                            <SchoolRounded />
                        }
                        label={`${studentRows.length} Students`}
                        sx={{
                            bgcolor:
                                "rgba(37,99,235,.15)",
                            color: "#60A5FA",
                            fontWeight: 600,
                            border:
                                "1px solid rgba(37,99,235,.35)",

                            "& .MuiChip-icon": {
                                color: "#60A5FA",
                            },
                        }}
                    />

                </Box>

                {getresponse ? (

                    <Paper
                        elevation={0}
                        sx={{
                            bgcolor: "#111827",
                            border:
                                "1px solid #1E293B",
                            borderRadius: "22px",
                            p: 8,
                            textAlign: "center",
                        }}
                    >

                        <Typography
                            variant="h5"
                            sx={{
                                color: "#fff",
                                mb: 2,
                                fontWeight: 700,
                            }}
                        >
                            No Students Found
                        </Typography>

                        <Typography
                            sx={{
                                color: "#94A3B8",
                            }}
                        >
                            Students will appear here
                            once they join this class.
                        </Typography>

                    </Paper>

                ) : (

                    <Paper
                        elevation={0}
                        sx={{
                            background: "#111827",
                            border:
                                "1px solid #1E293B",
                            borderRadius: "22px",
                            overflow: "hidden",
                            p: 3,
                        }}
                    >

                        <Typography
                            variant="h5"
                            sx={{
                                color: "#fff",
                                fontWeight: 700,
                                mb: 3,
                            }}
                        >
                            Students List
                        </Typography>
                        {Array.isArray(sclassStudents) &&
                            sclassStudents.length > 0 && (
                                <TableTemplate
                                    buttonHaver={StudentsButtonHaver}
                                    columns={studentColumns}
                                    rows={studentRows}
                                />
                            )}

                    </Paper>

                )}

            </Box>

        )}

    </>
);
};

export default TeacherClassDetails;