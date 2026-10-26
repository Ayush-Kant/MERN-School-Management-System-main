import React, { useEffect } from 'react';
import { getTeacherDetails } from '../../../redux/teacherRelated/teacherHandle';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
    Button,
    Container,
    Typography,
    Box,
    Paper,
    Avatar,
    Chip,
    Stack,
    CircularProgress,
    Divider,
} from '@mui/material';

import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import Groups2Icon from '@mui/icons-material/Groups2';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';

import styled from 'styled-components';

const TeacherDetails = () => {

    const navigate = useNavigate();

    const params = useParams();

    const dispatch = useDispatch();

    const {
        loading,
        teacherDetails,
        error,
    } = useSelector(
        (state) => state.teacher
    );

    const teacherID = params.id;

    useEffect(() => {

        dispatch(
            getTeacherDetails(teacherID)
        );

    }, [dispatch, teacherID]);

    if (error) {
        console.log(error);
    }

    const isSubjectNamePresent =
        teacherDetails?.teachSubject?.subName;

    const handleAddSubject = () => {

        navigate(
            `/Admin/teachers/choosesubject/${teacherDetails?.teachSclass?._id}/${teacherDetails?._id}`
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
        ) : (
            <PageWrapper maxWidth="lg">

                {/* Hero Section */}

                <HeroCard elevation={0}>

                    <HeroLeft>

                        <AvatarCircle>

                            <SchoolIcon sx={{ fontSize: 42 }} />

                        </AvatarCircle>

                        <Box>

                            <PageTitle>
                                Teacher Details
                            </PageTitle>

                            <PageSubtitle>
                                Faculty profile, classroom assignment and subject information.
                            </PageSubtitle>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                mt={3}
                                flexWrap="wrap"
                            >

                                <Chip
                                    color="primary"
                                    label="Faculty Profile"
                                />

                                <Chip
                                color="primary"
                                    label={teacherDetails?.teachSclass?.sclassName || "No Class"}
                                />

                            </Stack>

                        </Box>

                    </HeroLeft>

                    <HeroRight>

                        <DashboardCard>

                            <PersonIcon />

                            <DashboardValue>
                                1
                            </DashboardValue>

                            <DashboardLabel>
                                Teacher
                            </DashboardLabel>

                        </DashboardCard>

                        <DashboardCard>

                            <Groups2Icon />

                            <DashboardValue>
                                {teacherDetails?.teachSclass?.sclassName || "--"}
                            </DashboardValue>

                            <DashboardLabel>
                                Assigned Class
                            </DashboardLabel>

                        </DashboardCard>

                    </HeroRight>

                </HeroCard>

                <ContentCard>

                    <SectionHeading>
                        Faculty Information
                    </SectionHeading>

                    <Divider
                        sx={{
                            borderColor: "#1E293B",
                            mb: 4,
                        }}
                    />

                    <InfoGrid>

                        <InfoCard>

                            <PersonIcon
                                sx={{
                                    color: "#2563EB",
                                    fontSize: 35,
                                    mb: 2,
                                }}
                            />

                            <InfoTitle>
                                Teacher Name
                            </InfoTitle>

                            <InfoValue>
                                {teacherDetails?.name}
                            </InfoValue>

                        </InfoCard>

                        <InfoCard>

                            <Groups2Icon
                                sx={{
                                    color: "#2563EB",
                                    fontSize: 35,
                                    mb: 2,
                                }}
                            />

                            <InfoTitle>
                                Assigned Class
                            </InfoTitle>

                            <InfoValue>
                                {teacherDetails?.teachSclass?.sclassName}
                            </InfoValue>

                        </InfoCard>

                        {isSubjectNamePresent ? (

                            <>

                                <InfoCard>

                                    <MenuBookRoundedIcon
                                        sx={{
                                            color: "#2563EB",
                                            fontSize: 35,
                                            mb: 2,
                                        }}
                                    />

                                    <InfoTitle>
                                        Subject
                                    </InfoTitle>

                                    <InfoValue>
                                        {teacherDetails?.teachSubject?.subName}
                                    </InfoValue>

                                </InfoCard>

                                <InfoCard>

                                    <AccessTimeFilledRoundedIcon
                                        sx={{
                                            color: "#2563EB",
                                            fontSize: 35,
                                            mb: 2,
                                        }}
                                    />

                                    <InfoTitle>
                                        Sessions
                                    </InfoTitle>

                                    <InfoValue>
                                        {teacherDetails?.teachSubject?.sessions}
                                    </InfoValue>

                                </InfoCard>

                            </>

                        ) : (

                            <AssignSubjectCard>

                                <AddCircleOutlineRoundedIcon
                                    sx={{
                                        fontSize: 60,
                                        color: "#2563EB",
                                        mb: 2,
                                    }}
                                />

                                <Typography
                                    variant="h6"
                                    color="white"
                                    fontWeight={700}
                                >
                                    Subject Not Assigned
                                </Typography>

                                <Typography
                                    sx={{
                                        color: "#94A3B8",
                                        mt: 1,
                                        mb: 3,
                                        textAlign: "center",
                                    }}
                                >
                                    This teacher has not been assigned a subject yet.
                                </Typography>

                                <Button
                                    variant="contained"
                                    onClick={handleAddSubject}
                                    sx={{
                                        px: 4,
                                        py: 1.2,
                                        borderRadius: 3,
                                        textTransform: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    Assign Subject
                                </Button>

                            </AssignSubjectCard>

                        )}

                    </InfoGrid>

                </ContentCard>

            </PageWrapper>
        )}
    </>
);

}
export default TeacherDetails


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

    @media(max-width:1000px){
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

const ContentCard = styled(Paper)`
    background:#111827 !important;
    border:1px solid #1E293B;
    border-radius:24px !important;
    padding:35px;
    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const SectionHeading = styled(Typography)`
    color:white;
    font-size:1.5rem !important;
    font-weight:700 !important;
`;

const InfoGrid = styled(Box)`
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
    gap:24px;
`;

const InfoCard = styled(Box)`
    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:20px;
    padding:28px;
    transition:.3s;

    &:hover{
        transform:translateY(-6px);
        border-color:#2563EB;
        box-shadow:0 20px 35px rgba(37,99,235,.12);
    }
`;

const InfoTitle = styled(Typography)`
    color:#94A3B8;
    font-size:.95rem !important;
    margin-bottom:12px !important;
`;

const InfoValue = styled(Typography)`
    color:white;
    font-size:1.25rem !important;
    font-weight:700 !important;
    word-break:break-word;
`;

const AssignSubjectCard = styled(Box)`
    grid-column:1/-1;
    background:#0F172A;
    border:2px dashed #2563EB;
    border-radius:24px;
    padding:50px 30px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    text-align:center;
`;