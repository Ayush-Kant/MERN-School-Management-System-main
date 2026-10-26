import React from "react";
import { Link } from "react-router-dom";
import {
    Container,
    Grid,
    Box,
    Button,
    Typography,
} from "@mui/material";
import styled from "styled-components";

import Students from "../assets/students.png";
import { LightPurpleButton } from "../components/buttonStyles";

const Homepage = () => {

    return (

        <PageContainer>

            <Container maxWidth="xl">

                <Grid
                    container
                    spacing={6}
                    alignItems="center"
                >

                    <Grid
                        item
                        xs={12}
                        md={6}
                    >

                        <ImageWrapper>

                            <img
                                src={Students}
                                alt="students"
                            />

                        </ImageWrapper>

                    </Grid>

                    <Grid
                        item
                        xs={12}
                        md={6}
                    >

                        <HeroCard>

                            <Typography
                                variant="overline"
                                sx={{
                                    color: "#60A5FA",
                                    letterSpacing: 2,
                                    fontWeight: 700,
                                    
                                }}
                            >
                                SCHOOL MANAGEMENT PLATFORM
                            </Typography>

                            <Title>
                                Smart School
                                <br />
                                Management
                                <br />
                                System
                            </Title>

                            <Description>
                                Streamline administration, manage
                                teachers and students, monitor
                                attendance, evaluate academic
                                performance and simplify school
                                operations from one modern dashboard.
                            </Description>

                            <ButtonContainer>

                                <StyledLink to="/choose">

                                    <LightPurpleButton
                                        variant="contained"
                                        fullWidth
                                        sx={{
                                            py: 1.6,
                                            borderRadius: "12px",
                                            fontSize: "1rem",
                                        }}
                                    >
                                        Login
                                    </LightPurpleButton>

                                </StyledLink>

                                <StyledLink to="/chooseasguest">

                                    {/* <Button
                                        variant="outlined"
                                        fullWidth
                                        sx={{
                                            py: 1.6,
                                            borderRadius: "12px",
                                            borderColor: "#2563EB",
                                            color: "#60A5FA",

                                            "&:hover": {
                                                borderColor:
                                                    "#1D4ED8",
                                                bgcolor:
                                                    "rgba(37,99,235,.08)",
                                            },
                                        }}
                                    >
                                        Continue as Guest
                                    </Button> */}

                                </StyledLink>

                                <Typography
                                    sx={{
                                        color: "#94A3B8",
                                        mt: 2,
                                    }}
                                >
                                    Don't have an account?{" "}

                                    <Link
                                        to="/Adminregister"
                                        style={{
                                            color: "#60A5FA",
                                            fontWeight: 600,
                                            textDecoration: "none",
                                        }}
                                    >
                                        Create one
                                    </Link>

                                </Typography>

                            </ButtonContainer>

                        </HeroCard>

                    </Grid>

                </Grid>

            </Container>

        </PageContainer>

    );
};

export default Homepage;

const PageContainer = styled.div`
    min-height:100vh;

    background:#070B14;

    display:flex;

    align-items:center;

    padding:40px 0;
`;

const ImageWrapper = styled.div`
    display:flex;

    justify-content:center;

    align-items:center;

    img{
        width:100%;
        max-width:650px;
    }
`;

const HeroCard = styled.div`
    background:#111827;

    border:1px solid #1E293B;

    border-radius:24px;

    padding:48px;

    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const ButtonContainer = styled(Box)`
    display:flex;

    flex-direction:column;

    gap:18px;

    margin-top:40px;
`;

const Title = styled.h1`
    margin-top:12px;

    margin-bottom:24px;

    color:#FFFFFF;

    font-size:3.4rem;

    line-height:1.15;

    font-weight:800;
`;

const Description = styled.p`
    color:#94A3B8;

    font-size:1.05rem;

    line-height:1.8;
`;

const StyledLink = styled(Link)`
    width:100%;

    text-decoration:none;
`;