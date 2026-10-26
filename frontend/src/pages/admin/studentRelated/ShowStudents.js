import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";

import {
    Paper,
    Box,
    IconButton,
    Typography,
    CircularProgress,
    Container,
    Avatar,
    Chip,
    Stack,
    Divider,
} from '@mui/material';

import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Groups2Icon from '@mui/icons-material/Groups2';
import SchoolIcon from '@mui/icons-material/School';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';

import { BlackButton, BlueButton, GreenButton } from '../../../components/buttonStyles';

import TableTemplate from '../../../components/TableTemplate';
import SpeedDialTemplate from '../../../components/SpeedDialTemplate';

import { getAllStudents } from '../../../redux/studentRelated/studentHandle';
import { deleteUser } from '../../../redux/userRelated/userHandle';

import * as React from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';

import Popup from '../../../components/Popup';

import styled from 'styled-components';

const ShowStudents = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        studentsList,
        loading,
        error,
        response
    } = useSelector((state) => state.student);

    const { currentUser } = useSelector(
        state => state.user
    );

    useEffect(() => {
        dispatch(
            getAllStudents(currentUser._id)
        );
    }, [currentUser._id, dispatch]);

    if (error) {
        console.log(error);
    }

    const [showPopup, setShowPopup] =
        React.useState(false);

    const [message, setMessage] =
        React.useState("");

    const deleteHandler = (
        deleteID,
        address
    ) => {

        console.log(deleteID);
        console.log(address);

        setMessage(
            "Sorry the delete function has been disabled for now."
        );

        setShowPopup(true);

        // dispatch(deleteUser(deleteID, address))
        //     .then(() => {
        //         dispatch(getAllStudents(currentUser._id));
        //     })
    };

    const studentColumns = [
        {
            id: 'name',
            label: 'Name',
            minWidth: 170,
        },
        {
            id: 'rollNum',
            label: 'Roll Number',
            minWidth: 100,
        },
        {
            id: 'sclassName',
            label: 'Class',
            minWidth: 170,
        },
    ];

    // Always returns an array
    const studentRows = (studentsList || []).map(
        (student) => ({
            name: student.name,
            rollNum: student.rollNum,
            sclassName:
                student.sclassName.sclassName,
            id: student._id,
        })
    );

    const StudentButtonHaver = ({ row }) => {

        const options = [
            'Take Attendance',
            'Provide Marks'
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
            else {
                handleMarks();
            }
        };

        const handleAttendance = () => {
            navigate(
                "/Admin/students/student/attendance/" +
                row.id
            );
        };

        const handleMarks = () => {
            navigate(
                "/Admin/students/student/marks/" +
                row.id
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
            setOpen(prev => !prev);
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
            <>
                <IconButton
                    onClick={() =>
                        deleteHandler(
                            row.id,
                            "Student"
                        )
                    }
                >
                    <PersonRemoveIcon color="error" />
                </IconButton>

               <BlueButton
    variant="contained"
    sx={{ mx: 1.5 }}
    onClick={() =>
        navigate(
            "/Admin/students/student/" +
            row.id
        )
    }
>
    View
</BlueButton>



                <React.Fragment>

                    <ButtonGroup
                        variant="contained"
                        ref={anchorRef}
                        aria-label="split button"
                    >

                        <Button
                            onClick={handleClick}
                        >
                            {options[selectedIndex]}
                        </Button>

                        <BlackButton
                            size="small"
                            aria-controls={
                                open
                                    ? 'split-button-menu'
                                    : undefined
                            }
                            aria-expanded={
                                open
                                    ? 'true'
                                    : undefined
                            }
                            aria-haspopup="menu"
                            onClick={handleToggle}
                        >
                            {open
                                ? <KeyboardArrowUp />
                                : <KeyboardArrowDown />}
                        </BlackButton>

                    </ButtonGroup>

                    <Popper
                        sx={{ zIndex: 1 }}
                        open={open}
                        anchorEl={anchorRef.current}
                        transition
                        disablePortal
                    >
                        {({
                            TransitionProps,
                            placement,
                        }) => (

                            <Grow
                                {...TransitionProps}
                                style={{
                                    transformOrigin:
                                        placement === "bottom"
                                            ? "center top"
                                            : "center bottom",
                                }}
                            >

                                <Paper>

                                    <ClickAwayListener
                                        onClickAway={handleClose}
                                    >

                                        <MenuList autoFocusItem>

                                            {options.map(
                                                (
                                                    option,
                                                    index
                                                ) => (

                                                    <MenuItem
                                                        key={option}
                                                        selected={
                                                            index === selectedIndex
                                                        }
                                                        onClick={(event) =>
                                                            handleMenuItemClick(
                                                                event,
                                                                index
                                                            )
                                                        }
                                                    >
                                                        {option}
                                                    </MenuItem>

                                                )
                                            )}

                                        </MenuList>

                                    </ClickAwayListener>

                                </Paper>

                            </Grow>

                        )}
                    </Popper>

                </React.Fragment>

            </>
        );

    };

    const actions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />,
            name: "Add New Student",
            action: () =>
                navigate("/Admin/addstudents"),
        },
        {
            icon: <PersonRemoveIcon color="error" />,
            name: "Delete All Students",
            action: () =>
                deleteHandler(
                    currentUser._id,
                    "Students"
                ),
        },
    ];

    // PART 1B STARTS FROM return(...)

    return (
    <>
        {loading ? (
            <LoadingContainer>
                <CircularProgress
                    size={55}
                    sx={{ color: "#2563EB" }}
                />
            </LoadingContainer>
        ) : (
            <PageWrapper maxWidth="xl">

                {/* Hero Section */}

                <HeroCard elevation={0}>

                    <HeroLeft>

                        <AvatarCircle>
                            <Groups2Icon sx={{ fontSize: 42 }} />
                        </AvatarCircle>

                        <Box>

                            <PageTitle>
                                Students Management
                            </PageTitle>

                            <PageSubtitle>
                                Manage students, attendance, marks and academic records from one centralized dashboard.
                            </PageSubtitle>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                mt={3}
                                flexWrap="wrap"
                            >

                                <Chip
                                    color="primary"
                                    label={`${studentsList?.length || 0} Students`}
                                />

                                <Chip
                                
                                    color="primary"
                                    label="Academic Records"
                                />

                            </Stack>

                        </Box>

                    </HeroLeft>

                    <HeroRight>

                        <DashboardCard>

                            <Groups2Icon />

                            <DashboardValue>
                                {studentsList?.length || 0}
                            </DashboardValue>

                            <DashboardLabel>
                                Total Students
                            </DashboardLabel>

                        </DashboardCard>

                        <DashboardCard>

                            <SchoolIcon />

                            <DashboardValue>
                                {studentsList?.length || 0}
                            </DashboardValue>

                            <DashboardLabel>
                                Active
                            </DashboardLabel>

                        </DashboardCard>

                        <DashboardCard>

                            <ChecklistRoundedIcon />

                            <DashboardValue>
                                Ready
                            </DashboardValue>

                            <DashboardLabel>
                                Records
                            </DashboardLabel>

                        </DashboardCard>

                    </HeroRight>

                </HeroCard>

                {response ? (

                    <EmptyCard>

                        <Groups2Icon
                            sx={{
                                fontSize: 90,
                                color: "#2563EB",
                                mb: 2,
                            }}
                        />

                        <Typography
                            variant="h4"
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
                                maxWidth: 450,
                                textAlign: "center",
                            }}
                        >
                            Start building your classroom by adding your first student.
                        </Typography>

                        <GreenButton
                            variant="contained"
                            onClick={() => navigate("/Admin/addstudents")}
                        >
                            Add Student
                        </GreenButton>

                    </EmptyCard>

                ) : (

                    <TableCard>

                        <TableHeader>

                            <Box>

                                <SectionTitle>
                                    Student Directory
                                </SectionTitle>

                                <SectionSubtitle>
                                    View, manage and perform actions on every student.
                                </SectionSubtitle>

                            </Box>

                        </TableHeader>

                        <Divider
                            sx={{
                                borderColor: "#1E293B",
                                mb: 3,
                            }}
                        />

                        {Array.isArray(studentsList) &&
                            studentsList.length > 0 && (

                                <TableTemplate
                                    buttonHaver={StudentButtonHaver}
                                    columns={studentColumns}
                                    rows={studentRows}
                                />

                            )}

                        <SpeedDialTemplate
                            actions={actions}
                        />

                    </TableCard>

                )}

            </PageWrapper>
        )}

        <Popup
            message={message}
            setShowPopup={setShowPopup}
            showPopup={showPopup}
        />
    </>
);
}

export default ShowStudents;

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
    background: linear-gradient(135deg, #111827, #0F172A) !important;
    border: 1px solid #1E293B;
    border-radius: 28px !important;
    padding: 38px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 30px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 25px 60px rgba(0,0,0,.35);

    &::before{
        content:"";
        position:absolute;
        width:280px;
        height:280px;
        border-radius:50%;
        background:rgba(37,99,235,.08);
        right:-120px;
        top:-120px;
    }

    @media(max-width:1100px){
        flex-direction:column;
        align-items:flex-start;
    }
`;

const HeroLeft = styled(Box)`
    display:flex;
    align-items:center;
    gap:28px;
    flex:1;
`;

const HeroRight = styled(Box)`
    display:flex;
    gap:18px;
    flex-wrap:wrap;

    @media(max-width:700px){
        width:100%;
    }
`;

const AvatarCircle = styled(Avatar)`
    width:95px !important;
    height:95px !important;
    background:linear-gradient(135deg,#2563EB,#1D4ED8)!important;
    box-shadow:0 15px 35px rgba(37,99,235,.35);
`;

const PageTitle = styled(Typography)`
    color:white;
    font-size:2.2rem !important;
    font-weight:800 !important;
`;

const PageSubtitle = styled(Typography)`
    color:#94A3B8;
    margin-top:12px !important;
    line-height:1.8;
    max-width:620px;
`;

const DashboardCard = styled(Box)`
    min-width:160px;
    background:#111827;
    border:1px solid #1E293B;
    border-radius:22px;
    padding:24px;
    text-align:center;
    transition:.3s;
    cursor:default;

    svg{
        color:#2563EB;
        font-size:34px;
        margin-bottom:14px;
    }

    &:hover{
        transform:translateY(-6px);
        border-color:#2563EB;
        box-shadow:0 20px 35px rgba(37,99,235,.15);
    }
`;

const DashboardValue = styled(Typography)`
    color:white;
    font-size:1.9rem !important;
    font-weight:800 !important;
`;

const DashboardLabel = styled(Typography)`
    color:#94A3B8;
    margin-top:6px !important;
`;

const TableCard = styled(Paper)`
    background:#111827 !important;
    border:1px solid #1E293B;
    border-radius:24px !important;
    padding:30px;
    overflow:hidden;
    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const TableHeader = styled(Box)`
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:10px;

    @media(max-width:700px){
        flex-direction:column;
        align-items:flex-start;
        gap:18px;
    }
`;

const SectionTitle = styled(Typography)`
    color:white;
    font-size:1.45rem !important;
    font-weight:700 !important;
`;

const SectionSubtitle = styled(Typography)`
    color:#94A3B8;
    margin-top:8px !important;
`;

const EmptyCard = styled(Paper)`
    background:#111827 !important;
    border:1px solid #1E293B;
    border-radius:28px !important;
    min-height:500px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    text-align:center;
    padding:40px;
    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;