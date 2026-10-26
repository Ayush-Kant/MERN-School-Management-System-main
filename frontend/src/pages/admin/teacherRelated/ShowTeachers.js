import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
    Paper,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TablePagination,
    Button,
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
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';

import {
    StyledTableCell,
    StyledTableRow
} from '../../../components/styles';

import {
    BlueButton,
    GreenButton
} from '../../../components/buttonStyles';

import SpeedDialTemplate from '../../../components/SpeedDialTemplate';
import Popup from '../../../components/Popup';

import {
    getAllTeachers
} from '../../../redux/teacherRelated/teacherHandle';

import {
    deleteUser
} from '../../../redux/userRelated/userHandle';

import styled from "styled-components";

const ShowTeachers = () => {

    const [page, setPage] = useState(0);

    const [rowsPerPage, setRowsPerPage] =
        useState(5);

    const navigate = useNavigate();

    const dispatch = useDispatch();

    const {
        teachersList,
        loading,
        error,
        response,
    } = useSelector(
        (state) => state.teacher
    );

    const { currentUser } =
        useSelector(
            (state) => state.user
        );

    useEffect(() => {

        dispatch(
            getAllTeachers(currentUser._id)
        );

    }, [currentUser._id, dispatch]);

    const [showPopup, setShowPopup] =
        useState(false);

    const [message, setMessage] =
        useState("");

    if (error) {
        console.log(error);
    }

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
        // .then(() => {
        //     dispatch(getAllTeachers(currentUser._id));
        // });

    };

    const columns = [

        {
            id: "name",
            label: "Name",
            minWidth: 170,
        },

        {
            id: "teachSubject",
            label: "Subject",
            minWidth: 100,
        },

        {
            id: "teachSclass",
            label: "Class",
            minWidth: 170,
        },

    ];

    // Always return an array
    const rows = (teachersList || []).map(
        (teacher) => ({
            name: teacher.name,
            teachSubject:
                teacher.teachSubject?.subName || null,
            teachSclass:
                teacher.teachSclass.sclassName,
            teachSclassID:
                teacher.teachSclass._id,
            id: teacher._id,
        })
    );

    const actions = [

        {
            icon: (
                <PersonAddAlt1Icon
                    color="primary"
                />
            ),

            name: "Add New Teacher",

            action: () =>
                navigate(
                    "/Admin/teachers/chooseclass"
                ),
        },

        {
            icon: (
                <PersonRemoveIcon
                    color="error"
                />
            ),

            name: "Delete All Teachers",

            action: () =>
                deleteHandler(
                    currentUser._id,
                    "Teachers"
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

                            <SchoolIcon sx={{ fontSize: 42 }} />

                        </AvatarCircle>

                        <Box>

                            <PageTitle>
                                Teachers Management
                            </PageTitle>

                            <PageSubtitle>
                                Manage teachers, subjects and classroom assignments from one centralized dashboard.
                            </PageSubtitle>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                mt={3}
                                flexWrap="wrap"
                            >

                                <Chip
                                    color="primary"
                                    label={`${teachersList?.length || 0} Teachers`}
                                />

                                <Chip
                                    label="Faculty Records"
                                />

                            </Stack>

                        </Box>

                    </HeroLeft>

                    <HeroRight>

                        <DashboardCard>

                            <Groups2Icon />

                            <DashboardValue>
                                {teachersList?.length || 0}
                            </DashboardValue>

                            <DashboardLabel>
                                Total Teachers
                            </DashboardLabel>

                        </DashboardCard>

                        <DashboardCard>

                            <SchoolIcon />

                            <DashboardValue>
                                {teachersList?.length || 0}
                            </DashboardValue>

                            <DashboardLabel>
                                Active Faculty
                            </DashboardLabel>

                        </DashboardCard>

                        <DashboardCard>

                            <MenuBookRoundedIcon />

                            <DashboardValue>
                                Ready
                            </DashboardValue>

                            <DashboardLabel>
                                Assignments
                            </DashboardLabel>

                        </DashboardCard>

                    </HeroRight>

                </HeroCard>

                {response ? (

                    <EmptyCard>

                        <SchoolIcon
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
                            No Teachers Found
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
                            Start by adding your first teacher to build your faculty.
                        </Typography>

                        <GreenButton
                            variant="contained"
                            onClick={() =>
                                navigate("/Admin/teachers/chooseclass")
                            }
                        >
                            Add Teacher
                        </GreenButton>

                    </EmptyCard>

                ) : (

                    <TableCard>

                        <TableHeader>

                            <Box>

                                <SectionTitle>
                                    Faculty Directory
                                </SectionTitle>

                                <SectionSubtitle>
                                    View, manage and organize all teachers from one place.
                                </SectionSubtitle>

                            </Box>

                        </TableHeader>

                        <Divider
                            sx={{
                                borderColor: "#1E293B",
                                mb: 3,
                            }}
                        />

                        <TableContainer>

                            <Table
                                stickyHeader
                                aria-label="sticky table"
                            >

                                <TableHead>

                                    <StyledTableRow>

                                        {columns.map((column) => (

                                            <StyledTableCell
                                                key={column.id}
                                                align={column.align}
                                                style={{
                                                    minWidth:
                                                        column.minWidth,
                                                }}
                                            >
                                                {column.label}
                                            </StyledTableCell>

                                        ))}

                                        <StyledTableCell align="center">
                                            Actions
                                        </StyledTableCell>

                                    </StyledTableRow>

                                </TableHead>

                                <TableBody>

                                    {rows
                                        .slice(
                                            page * rowsPerPage,
                                            page * rowsPerPage +
                                                rowsPerPage
                                        )
                                        .map((row) => (

                                            <StyledTableRow
                                                hover
                                                role="checkbox"
                                                tabIndex={-1}
                                                key={row.id}
                                            >

                                                {columns.map(
                                                    (column) => {

                                                        const value =
                                                            row[column.id];

                                                        if (
                                                            column.id ===
                                                            "teachSubject"
                                                        ) {
                                                            return (

                                                                <StyledTableCell
                                                                    key={
                                                                        column.id
                                                                    }
                                                                    align={
                                                                        column.align
                                                                    }
                                                                >

                                                                    {value ? (
                                                                        value
                                                                    ) : (
                                                                        <Button
                                                                            variant="contained"
                                                                            onClick={() =>
                                                                                navigate(
                                                                                    `/Admin/teachers/choosesubject/${row.teachSclassID}/${row.id}`
                                                                                )
                                                                            }
                                                                        >
                                                                            Add Subject
                                                                        </Button>
                                                                    )}

                                                                </StyledTableCell>

                                                            );
                                                        }

                                                        return (

                                                            <StyledTableCell
                                                                key={
                                                                    column.id
                                                                }
                                                                align={
                                                                    column.align
                                                                }
                                                            >
                                                                {value}
                                                            </StyledTableCell>

                                                        );
                                                    }
                                                )}

                                                <StyledTableCell align="center">

                                                    <Box
                                                        sx={{
                                                            display:
                                                                "flex",
                                                            justifyContent:
                                                                "center",
                                                            alignItems:
                                                                "center",
                                                            gap: 1.5,
                                                            flexWrap:
                                                                "wrap",
                                                        }}
                                                    >

                                                        <IconButton
                                                            onClick={() =>
                                                                deleteHandler(
                                                                    row.id,
                                                                    "Teacher"
                                                                )
                                                            }
                                                        >
                                                            <PersonRemoveIcon color="error" />
                                                        </IconButton>

                                                        <BlueButton
                                                            variant="contained"
                                                            onClick={() =>
                                                                navigate(
                                                                    "/Admin/teachers/teacher/" +
                                                                        row.id
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </BlueButton>

                                                    </Box>

                                                </StyledTableCell>

                                            </StyledTableRow>

                                        ))}

                                </TableBody>

                            </Table>

                        </TableContainer>

                      <TablePagination
    rowsPerPageOptions={[5, 10, 25, 100]}
    component="div"
    count={rows.length}
    rowsPerPage={rowsPerPage}
    page={page}
    onPageChange={(event, newPage) =>
        setPage(newPage)
    }
    onRowsPerPageChange={(event) => {
        setRowsPerPage(
            parseInt(event.target.value, 5)
        );
        setPage(0);
    }}
    sx={{
        color: "#E2E8F0",
        borderTop: "1px solid #1E293B",
        mt: 2,

        "& .MuiTablePagination-selectLabel": {
            color: "#CBD5E1",
            fontWeight: 500,
        },

        "& .MuiTablePagination-displayedRows": {
            color: "#CBD5E1",
            fontWeight: 500,
        },

        "& .MuiTablePagination-select": {
            color: "#FFFFFF",
            fontWeight: 600,
        },

        "& .MuiSelect-icon": {
            color: "#94A3B8",
        },

        "& .MuiIconButton-root": {
            color: "#CBD5E1",
        },

        "& .MuiIconButton-root:hover": {
            backgroundColor: "rgba(37,99,235,.12)",
        },

        "& .Mui-disabled": {
            color: "#475569",
        },

        "& .MuiToolbar-root": {
            paddingLeft: 0,
            paddingRight: 0,
        },
    }}
/>
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
export default ShowTeachers

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

    &::before {
        content: "";
        position: absolute;
        width: 280px;
        height: 280px;
        border-radius: 50%;
        background: rgba(37,99,235,.08);
        right: -120px;
        top: -120px;
    }

    @media (max-width:1100px) {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const HeroLeft = styled(Box)`
    display: flex;
    align-items: center;
    gap: 28px;
    flex: 1;
`;

const HeroRight = styled(Box)`
    display: flex;
    gap: 18px;
    flex-wrap: wrap;

    @media (max-width:700px) {
        width: 100%;
    }
`;

const AvatarCircle = styled(Avatar)`
    width: 95px !important;
    height: 95px !important;
    background: linear-gradient(135deg,#2563EB,#1D4ED8) !important;
    box-shadow: 0 15px 35px rgba(37,99,235,.35);
`;

const PageTitle = styled(Typography)`
    color: white;
    font-size: 2.2rem !important;
    font-weight: 800 !important;
`;

const PageSubtitle = styled(Typography)`
    color: #94A3B8;
    margin-top: 12px !important;
    line-height: 1.8;
    max-width: 620px;
`;

const DashboardCard = styled(Box)`
    min-width: 160px;
    background: #111827;
    border: 1px solid #1E293B;
    border-radius: 22px;
    padding: 24px;
    text-align: center;
    transition: .3s;
    cursor: default;

    svg {
        color: #2563EB;
        font-size: 34px;
        margin-bottom: 14px;
    }

    &:hover {
        transform: translateY(-6px);
        border-color: #2563EB;
        box-shadow: 0 20px 35px rgba(37,99,235,.15);
    }
`;

const DashboardValue = styled(Typography)`
    color: white;
    font-size: 1.9rem !important;
    font-weight: 800 !important;
`;

const DashboardLabel = styled(Typography)`
    color: #94A3B8;
    margin-top: 6px !important;
`;

const TableCard = styled(Paper)`
    background: #111827 !important;
    border: 1px solid #1E293B;
    border-radius: 24px !important;
    padding: 30px;
    overflow: hidden;
    box-shadow: 0 20px 45px rgba(0,0,0,.25);
`;

const TableHeader = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    @media (max-width:700px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 18px;
    }
`;

const SectionTitle = styled(Typography)`
    color: white;
    font-size: 1.45rem !important;
    font-weight: 700 !important;
`;

const SectionSubtitle = styled(Typography)`
    color: #94A3B8;
    margin-top: 8px !important;
`;

const EmptyCard = styled(Paper)`
    background: #111827 !important;
    border: 1px solid #1E293B;
    border-radius: 28px !important;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
    box-shadow: 0 20px 45px rgba(0,0,0,.25);
`;