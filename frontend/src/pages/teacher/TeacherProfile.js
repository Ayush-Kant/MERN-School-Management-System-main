import React from "react";
import styled from "styled-components";
import {
    Card,
    CardContent,
    Typography,
    Avatar,
    Box,
    Grid,
    Divider,
} from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

import { useSelector } from "react-redux";

const TeacherProfile = () => {

    const { currentUser, response, error } = useSelector(
        (state) => state.user
    );

    if (response) console.log(response);
    else if (error) console.log(error);

    const teachSclass = currentUser.teachSclass;
    const teachSubject = currentUser.teachSubject;
    const teachSchool = currentUser.school;

    return (
        <PageContainer>

            <ProfileCard elevation={0}>

                <CardContent sx={{ p: 4 }}>

                    <TopSection>

                        <Avatar
                            sx={{
                                width: 90,
                                height: 90,
                                bgcolor: "#2563EB",
                                fontSize: "2.2rem",
                                fontWeight: 700,
                                boxShadow:
                                    "0 10px 30px rgba(37,99,235,.35)",
                            }}
                        >
                            {currentUser?.name?.charAt(0).toUpperCase()}
                        </Avatar>

                        <Box>

                            <Typography
                                variant="h4"
                                sx={{
                                    color: "#FFFFFF",
                                    fontWeight: 700,
                                }}
                            >
                                {currentUser?.name}
                            </Typography>

                            <Typography
                                sx={{
                                    color: "#94A3B8",
                                    mt: .5,
                                }}
                            >
                                Teacher Profile
                            </Typography>

                        </Box>

                    </TopSection>

                    <Divider
                        sx={{
                            borderColor: "#1E293B",
                            my: 4,
                        }}
                    />

                    <Grid container spacing={3}>

                        <Grid item xs={12} md={6}>
                            <InfoCard>

                                <PersonRoundedIcon
                                    sx={{
                                        color: "#60A5FA",
                                    }}
                                />

                                <Info>

                                    <Label>Name</Label>

                                    <Value>
                                        {currentUser?.name}
                                    </Value>

                                </Info>

                            </InfoCard>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <InfoCard>

                                <EmailRoundedIcon
                                    sx={{
                                        color: "#60A5FA",
                                    }}
                                />

                                <Info>

                                    <Label>Email</Label>

                                    <Value>
                                        {currentUser?.email}
                                    </Value>

                                </Info>

                            </InfoCard>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <InfoCard>

                                <ClassRoundedIcon
                                    sx={{
                                        color: "#60A5FA",
                                    }}
                                />

                                <Info>

                                    <Label>Class</Label>

                                    <Value>
                                        {teachSclass?.sclassName}
                                    </Value>

                                </Info>

                            </InfoCard>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <InfoCard>

                                <MenuBookRoundedIcon
                                    sx={{
                                        color: "#60A5FA",
                                    }}
                                />

                                <Info>

                                    <Label>Subject</Label>

                                    <Value>
                                        {teachSubject?.subName}
                                    </Value>

                                </Info>

                            </InfoCard>
                        </Grid>

                        <Grid item xs={12}>
                            <InfoCard>

                                <SchoolRoundedIcon
                                    sx={{
                                        color: "#60A5FA",
                                    }}
                                />

                                <Info>

                                    <Label>School</Label>

                                    <Value>
                                        {teachSchool?.schoolName}
                                    </Value>

                                </Info>

                            </InfoCard>
                        </Grid>

                    </Grid>

                </CardContent>

            </ProfileCard>

        </PageContainer>
    );
};

export default TeacherProfile;

const PageContainer = styled.div`
    min-height:100vh;

    display:flex;
    justify-content:center;
    align-items:flex-start;

    padding:40px 20px;
`;

const ProfileCard = styled(Card)`
    width:100%;
    max-width:950px;

    background:#111827 !important;

    border:1px solid #1E293B;

    border-radius:22px !important;

    color:white;

    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const TopSection = styled.div`
    display:flex;
    align-items:center;
    gap:24px;

    flex-wrap:wrap;
`;

const InfoCard = styled.div`
    background:#0F172A;

    border:1px solid #1E293B;

    border-radius:16px;

    padding:20px;

    display:flex;
    align-items:center;
    gap:18px;

    transition:.3s;

    &:hover{
        border-color:#2563EB;
        transform:translateY(-4px);
    }
`;

const Info = styled.div`
    display:flex;
    flex-direction:column;
`;

const Label = styled.span`
    color:#94A3B8;

    font-size:.85rem;

    margin-bottom:4px;
`;

const Value = styled.span`
    color:#FFFFFF;

    font-size:1rem;

    font-weight:600;
`;