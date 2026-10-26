import React from "react";

import {
    Container,
    Grid,
    Typography,
    Box,
    Avatar,
    Chip,
} from "@mui/material";

import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

import styled from "styled-components";

import { useSelector } from "react-redux";

const StudentProfile = () => {

    const {
        currentUser,
        response,
        error,
    } = useSelector(
        (state) => state.user
    );

    if (response) {
        console.log(response);
    }
    else if (error) {
        console.log(error);
    }

    const sclassName =
        currentUser.sclassName;

    const studentSchool =
        currentUser.school;

    // Part 1B starts from return(...)

    return (
    <PageWrapper maxWidth="xl">

        <HeroCard>

            <HeroLeft>

                <AvatarCircle>

                    {String(currentUser.name).charAt(0)}

                </AvatarCircle>

                <Box>

                    <PageTitle>

                        {currentUser.name}

                    </PageTitle>

                    <PageSubtitle>

                        Student Profile • Academic Information

                    </PageSubtitle>

                    <Chip
                        label="Student"
                        sx={{
                            mt: 2,
                            bgcolor: "rgba(37,99,235,.12)",
                            color: "#60A5FA",
                            border: "1px solid rgba(37,99,235,.35)",
                        }}
                    />

                </Box>

            </HeroLeft>

        </HeroCard>

        <Grid
            container
            spacing={3}
        >

            <Grid
                item
                xs={12}
                lg={4}
            >

                <DashboardCard>

                    <SectionHeading>

                        Profile

                    </SectionHeading>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            mb: 3,
                        }}
                    >

                        <LargeAvatar>

                            {String(currentUser.name).charAt(0)}

                        </LargeAvatar>

                    </Box>

                    <InfoRow>

                        <BadgeRoundedIcon />

                        <InfoContent>

                            <InfoLabel>

                                Roll Number

                            </InfoLabel>

                            <InfoValue>

                                {currentUser.rollNum}

                            </InfoValue>

                        </InfoContent>

                    </InfoRow>

                    <InfoRow>

                        <ClassRoundedIcon />

                        <InfoContent>

                            <InfoLabel>

                                Class

                            </InfoLabel>

                            <InfoValue>

                                {sclassName.sclassName}

                            </InfoValue>

                        </InfoContent>

                    </InfoRow>

                    <InfoRow>

                        <SchoolRoundedIcon />

                        <InfoContent>

                            <InfoLabel>

                                School

                            </InfoLabel>

                            <InfoValue>

                                {studentSchool.schoolName}

                            </InfoValue>

                        </InfoContent>

                    </InfoRow>

                </DashboardCard>

            </Grid>

            <Grid
                item
                xs={12}
                lg={8}
            >

                <ContentCard>

                    <SectionHeading>

                        Personal Information

                    </SectionHeading>

                    <Grid
                        container
                        spacing={3}
                    >

                        <Grid item xs={12} md={6}>

                            <InfoCard>

                                <InfoTitle>

                                    Date of Birth

                                </InfoTitle>

                                <InfoText>

                                    January 1, 2000

                                </InfoText>

                            </InfoCard>

                        </Grid>

                        <Grid item xs={12} md={6}>

                            <InfoCard>

                                <InfoTitle>

                                    Gender

                                </InfoTitle>

                                <InfoText>

                                    Male

                                </InfoText>

                            </InfoCard>

                        </Grid>

                        <Grid item xs={12} md={6}>

                            <InfoCard>

                                <InfoTitle>

                                    Email

                                </InfoTitle>

                                <InfoText>

                                    john.doe@example.com

                                </InfoText>

                            </InfoCard>

                        </Grid>

                        <Grid item xs={12} md={6}>

                            <InfoCard>

                                <InfoTitle>

                                    Phone

                                </InfoTitle>

                                <InfoText>

                                    (123) 456-7890

                                </InfoText>

                            </InfoCard>

                        </Grid>

                        <Grid item xs={12}>

                            <InfoCard>

                                <InfoTitle>

                                    Address

                                </InfoTitle>

                                <InfoText>

                                    123 Main Street, City, Country

                                </InfoText>

                            </InfoCard>

                        </Grid>

                        <Grid item xs={12}>

                            <InfoCard>

                                <InfoTitle>

                                    Emergency Contact

                                </InfoTitle>

                                <InfoText>

                                    (987) 654-3210

                                </InfoText>

                            </InfoCard>

                        </Grid>

                    </Grid>

                </ContentCard>

            </Grid>

        </Grid>

    </PageWrapper>
);
}
export default StudentProfile

const PageWrapper = styled(Container)`
    padding-top: 35px;
    padding-bottom: 60px;
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
    font-size:2.5rem !important;
    font-weight:700 !important;

    background:linear-gradient(
        135deg,
        #2563EB,
        #1D4ED8
    ) !important;

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
`;

const DashboardCard = styled(Box)`
    background:#111827;
    border:1px solid #1E293B;
    border-radius:22px;
    padding:30px;
    height:100%;
    box-shadow:0 20px 40px rgba(0,0,0,.25);
`;

const ContentCard = styled(Box)`
    background:#111827;
    border:1px solid #1E293B;
    border-radius:22px;
    padding:30px;
    box-shadow:0 20px 40px rgba(0,0,0,.25);
`;

const SectionHeading = styled(Typography)`
    color:white;
    font-size:1.35rem !important;
    font-weight:700 !important;
    margin-bottom:28px !important;
`;

const LargeAvatar = styled(Avatar)`
    width:150px !important;
    height:150px !important;

    font-size:3.5rem !important;
    font-weight:700 !important;

    background:linear-gradient(
        135deg,
        #2563EB,
        #1D4ED8
    ) !important;

    box-shadow:0 20px 40px rgba(37,99,235,.35);
`;

const InfoRow = styled(Box)`
    display:flex;
    align-items:center;
    gap:16px;
    margin-bottom:26px;

    svg{
        color:#60A5FA;
        font-size:28px;
    }

    &:last-child{
        margin-bottom:0;
    }
`;

const InfoContent = styled(Box)`
    display:flex;
    flex-direction:column;
`;

const InfoLabel = styled(Typography)`
    color:#94A3B8;
    font-size:.9rem !important;
`;

const InfoValue = styled(Typography)`
    color:white;
    font-size:1.1rem !important;
    font-weight:700 !important;
`;

const InfoCard = styled(Box)`
    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:18px;
    padding:22px;
    height:100%;

    transition:.3s;

    &:hover{
        border-color:#2563EB;
        transform:translateY(-4px);
        box-shadow:0 15px 35px rgba(37,99,235,.15);
    }
`;

const InfoTitle = styled(Typography)`
    color:#94A3B8;
    font-size:.9rem !important;
    margin-bottom:8px !important;
`;

const InfoText = styled(Typography)`
    color:white;
    font-size:1rem !important;
    font-weight:600 !important;
`;