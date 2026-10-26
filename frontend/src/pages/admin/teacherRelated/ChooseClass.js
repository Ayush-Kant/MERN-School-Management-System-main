import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    Box,
    Button,
    Typography,
    Container,
    Paper,
    Avatar,
    Chip,
    Divider,
    Stack,
    CircularProgress,
} from '@mui/material';

import { useNavigate } from 'react-router-dom';

import SchoolIcon from '@mui/icons-material/School';
import ClassRoundedIcon from '@mui/icons-material/ClassRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';

import styled from 'styled-components';

import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';

import { PurpleButton } from '../../../components/buttonStyles';

import TableTemplate from '../../../components/TableTemplate';

const ChooseClass = ({ situation }) => {

    const navigate = useNavigate();

    const dispatch = useDispatch();

    const {
        sclassesList,
        loading,
        error,
        getresponse,
    } = useSelector(
        (state) => state.sclass
    );

    const {
        currentUser,
    } = useSelector(
        (state) => state.user
    );

    useEffect(() => {

        dispatch(
            getAllSclasses(
                currentUser._id,
                "Sclass"
            )
        );

    }, [currentUser._id, dispatch]);

    if (error) {
        console.log(error);
    }

    const navigateHandler = (classID) => {

        if (situation === "Teacher") {

            navigate(
                "/Admin/teachers/choosesubject/" + classID
            );

        }
        else if (situation === "Subject") {

            navigate(
                "/Admin/addsubject/" + classID
            );

        }

    };

    const sclassColumns = [
        {
            id: "name",
            label: "Class Name",
            minWidth: 170,
        },
    ];

    const sclassRows =
        (sclassesList || []).map((sclass) => ({
            name: sclass.sclassName,
            id: sclass._id,
        }));

    const SclassButtonHaver = ({ row }) => {

        return (

            <PurpleButton
                variant="contained"
                onClick={() =>
                    navigateHandler(row.id)
                }
            >
                Choose
            </PurpleButton>

        );

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

        ) : getresponse ? (

            <PageWrapper maxWidth="lg">

                <HeroCard elevation={0}>

                    <HeroLeft>

                        <AvatarCircle>

                            <SchoolIcon sx={{ fontSize: 40 }} />

                        </AvatarCircle>

                        <Box>

                            <PageTitle>
                                No Classes Found
                            </PageTitle>

                            <PageSubtitle>
                                Create a class before assigning teachers or subjects.
                            </PageSubtitle>

                        </Box>

                    </HeroLeft>

                </HeroCard>

                <ContentCard>

                    <EmptyState>

                        <ClassRoundedIcon
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
                            No Classes Available
                        </Typography>

                        <Typography
                            sx={{
                                color: "#94A3B8",
                                mt: 2,
                                mb: 4,
                                textAlign: "center",
                                maxWidth: 520,
                            }}
                        >
                            Start by creating a class to continue assigning
                            teachers or adding subjects.
                        </Typography>

                        <Button
                            variant="contained"
                            onClick={() =>
                                navigate("/Admin/addclass")
                            }
                            sx={{
                                borderRadius: 3,
                                px: 4,
                                py: 1.2,
                                textTransform: "none",
                                fontWeight: 600,
                            }}
                        >
                            Add Class
                        </Button>

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

                                Choose Class

                            </PageTitle>

                            <PageSubtitle>

                                Select a class to continue the teacher or subject assignment process.

                            </PageSubtitle>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                mt={3}
                                flexWrap="wrap"
                            >

                                <Chip
                                    color="primary"
                                    label={`${sclassesList?.length || 0} Classes`}
                                />

                                <Chip
                                    label={
                                        situation === "Teacher"
                                            ? "Assign Teacher"
                                            : "Assign Subject"
                                    }
                                />

                            </Stack>

                        </Box>

                    </HeroLeft>

                    <HeroRight>

                        <DashboardCard>

                            <ClassRoundedIcon />

                            <DashboardValue>

                                {sclassesList?.length || 0}

                            </DashboardValue>

                            <DashboardLabel>

                                Total Classes

                            </DashboardLabel>

                        </DashboardCard>

                    </HeroRight>

                </HeroCard>

                {/* Table */}

                <ContentCard>

                    <SectionHeading>

                        Available Classes

                    </SectionHeading>

                    <Divider
                        sx={{
                            borderColor: "#1E293B",
                            mb: 3,
                        }}
                    />

                    <TableTemplate
                        buttonHaver={SclassButtonHaver}
                        columns={sclassColumns}
                        rows={sclassRows}
                    />

                </ContentCard>

            </PageWrapper>

        )}
    </>
);
} 
export default ChooseClass

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
    background: linear-gradient(135deg, #2563EB, #1D4ED8) !important;
    box-shadow: 0 15px 35px rgba(37, 99, 235, .35);
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
        box-shadow: 0 20px 35px rgba(37, 99, 235, .15);
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
    box-shadow: 0 20px 45px rgba(0, 0, 0, .25);
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