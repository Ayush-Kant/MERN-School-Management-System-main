import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    Box,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    Typography,
    Paper,
    Container,
    Avatar,
    Chip,
    Stack,
    Divider,
    CircularProgress,
} from '@mui/material';

import { useNavigate, useParams } from 'react-router-dom';

import SchoolIcon from '@mui/icons-material/School';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';

import {
    getTeacherFreeClassSubjects,
} from '../../../redux/sclassRelated/sclassHandle';

import {
    updateTeachSubject,
} from '../../../redux/teacherRelated/teacherHandle';

import {
    GreenButton,
    PurpleButton,
} from '../../../components/buttonStyles';

import {
    StyledTableCell,
    StyledTableRow,
} from '../../../components/styles';

import styled from "styled-components";

const ChooseSubject = ({ situation }) => {

    const params = useParams();

    const navigate = useNavigate();

    const dispatch = useDispatch();

    const [classID, setClassID] = useState("");

    const [teacherID, setTeacherID] = useState("");

    const [loader, setLoader] =
        useState(false);

    const {
        subjectsList,
        loading,
        error,
        response,
    } = useSelector(
        (state) => state.sclass
    );

    useEffect(() => {

        if (situation === "Norm") {

            setClassID(params.id);

            const classId = params.id;

            dispatch(
                getTeacherFreeClassSubjects(
                    classId
                )
            );

        }
        else if (situation === "Teacher") {

            const {
                classID,
                teacherID,
            } = params;

            setClassID(classID);

            setTeacherID(teacherID);

            dispatch(
                getTeacherFreeClassSubjects(
                    classID
                )
            );

        }

    }, [dispatch, params, situation]);

    if (error) {
        console.log(error);
    }

    const updateSubjectHandler = (
        teacherId,
        teachSubject
    ) => {

        setLoader(true);

        dispatch(
            updateTeachSubject(
                teacherId,
                teachSubject
            )
        );

        navigate("/Admin/teachers");

    };

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
        ) : response ? (

            <PageWrapper maxWidth="lg">

                <HeroCard elevation={0}>

                    <HeroLeft>

                        <AvatarCircle>
                            <AssignmentRoundedIcon sx={{ fontSize: 42 }} />
                        </AvatarCircle>

                        <Box>

                            <PageTitle>
                                No Subjects Available
                            </PageTitle>

                            <PageSubtitle>
                                Every subject in this class already has a teacher assigned.
                            </PageSubtitle>

                        </Box>

                    </HeroLeft>

                </HeroCard>

                <ContentCard>

                    <EmptyState>

                        <MenuBookRoundedIcon
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
                            All Subjects Assigned
                        </Typography>

                        <Typography
                            sx={{
                                color: "#94A3B8",
                                mt: 2,
                                mb: 4,
                                maxWidth: 550,
                                textAlign: "center",
                            }}
                        >
                            There are currently no free subjects available.
                            Add a new subject if you want to assign one to a teacher.
                        </Typography>

                        <PurpleButton
                            variant="contained"
                            onClick={() =>
                                navigate("/Admin/addsubject/" + classID)
                            }
                        >
                            Add Subject
                        </PurpleButton>

                    </EmptyState>

                </ContentCard>

            </PageWrapper>

        ) : (

            <PageWrapper maxWidth="lg">

                {/* Hero */}

                <HeroCard elevation={0}>

                    <HeroLeft>

                        <AvatarCircle>

                            <SchoolIcon sx={{ fontSize: 40 }} />

                        </AvatarCircle>

                        <Box>

                            <PageTitle>

                                Choose Subject

                            </PageTitle>

                            <PageSubtitle>

                                Select an available subject for teacher assignment.

                            </PageSubtitle>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                mt={3}
                                flexWrap="wrap"
                            >

                                <Chip
                                    color="primary"
                                    label={`${subjectsList?.length || 0} Subjects`}
                                />

                                <Chip
                                    label={
                                        situation === "Teacher"
                                            ? "Assign Subject"
                                            : "Create Teacher"
                                    }
                                />

                            </Stack>

                        </Box>

                    </HeroLeft>

                    <HeroRight>

                        <DashboardCard>

                            <MenuBookRoundedIcon />

                            <DashboardValue>

                                {subjectsList?.length || 0}

                            </DashboardValue>

                            <DashboardLabel>

                                Available Subjects

                            </DashboardLabel>

                        </DashboardCard>

                    </HeroRight>

                </HeroCard>

                {/* Table */}

                <ContentCard>

                    <SectionHeading>

                        Available Subjects

                    </SectionHeading>

                    <Divider
                        sx={{
                            borderColor: "#1E293B",
                            mb: 3,
                        }}
                    />

                    <TableContainer>

                        <Table>

                            <TableHead>

                                <StyledTableRow>

                                    <StyledTableCell>#</StyledTableCell>

                                    <StyledTableCell align="center">
                                        Subject
                                    </StyledTableCell>

                                    <StyledTableCell align="center">
                                        Code
                                    </StyledTableCell>

                                    <StyledTableCell align="center">
                                        Action
                                    </StyledTableCell>

                                </StyledTableRow>

                            </TableHead>

                            <TableBody>

                                {(subjectsList || []).map((subject, index) => (

                                    <StyledTableRow key={subject._id}>

                                        <StyledTableCell
                                            sx={{ color: "white" }}
                                        >
                                            {index + 1}
                                        </StyledTableCell>

                                        <StyledTableCell align="center">
                                            {subject.subName}
                                        </StyledTableCell>

                                        <StyledTableCell align="center">
                                            {subject.subCode}
                                        </StyledTableCell>

                                        <StyledTableCell align="center">

                                            {situation === "Norm" ? (

                                                <GreenButton
                                                    variant="contained"
                                                    onClick={() =>
                                                        navigate(
                                                            "/Admin/teachers/addteacher/" +
                                                            subject._id
                                                        )
                                                    }
                                                >
                                                    Choose
                                                </GreenButton>

                                            ) : (

                                                <GreenButton
                                                    variant="contained"
                                                    disabled={loader}
                                                    onClick={() =>
                                                        updateSubjectHandler(
                                                            teacherID,
                                                            subject._id
                                                        )
                                                    }
                                                >
                                                    {loader ? (
                                                        <div className="load"></div>
                                                    ) : (
                                                        "Assign"
                                                    )}
                                                </GreenButton>

                                            )}

                                        </StyledTableCell>

                                    </StyledTableRow>

                                ))}

                            </TableBody>

                        </Table>

                    </TableContainer>

                </ContentCard>

            </PageWrapper>

        )}
    </>
);
}
export default ChooseSubject;

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
    padding: 36px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 30px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 25px 60px rgba(0, 0, 0, .35);

    &::before {
        content: "";
        position: absolute;
        width: 280px;
        height: 280px;
        border-radius: 50%;
        background: rgba(37, 99, 235, .08);
        top: -120px;
        right: -120px;
    }

    @media (max-width: 900px) {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const HeroLeft = styled(Box)`
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;
`;

const HeroRight = styled(Box)`
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
`;

const AvatarCircle = styled(Avatar)`
    width: 90px !important;
    height: 90px !important;
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
    margin-top: 10px !important;
    line-height: 1.8;
    max-width: 650px;
`;

const DashboardCard = styled(Box)`
    min-width: 170px;
    background: #111827;
    border: 1px solid #1E293B;
    border-radius: 22px;
    padding: 22px;
    text-align: center;
    transition: .3s;

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
    font-size: 1.8rem !important;
    font-weight: 800 !important;
`;

const DashboardLabel = styled(Typography)`
    color: #94A3B8;
    margin-top: 6px !important;
`;

const ContentCard = styled(Paper)`
    background: #111827 !important;
    border: 1px solid #1E293B;
    border-radius: 24px !important;
    padding: 32px;
    box-shadow: 0 20px 45px rgba(0,0,0,.25);
`;

const SectionHeading = styled(Typography)`
    color: white;
    font-size: 1.45rem !important;
    font-weight: 700 !important;
`;

const EmptyState = styled(Box)`
    min-height: 420px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
`;