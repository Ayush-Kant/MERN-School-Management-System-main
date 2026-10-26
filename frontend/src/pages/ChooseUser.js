import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Grid,
    Paper,
    Box,
    Container,
    CircularProgress,
    Backdrop,
    Typography,
} from "@mui/material";
import {
    AccountCircle,
    School,
    Group,
    ArrowForwardRounded,
} from "@mui/icons-material";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/userRelated/userHandle";
import Popup from "../components/Popup";

const ChooseUser = ({ visitor }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const password = "zxc";

    const {
        status,
        currentUser,
        currentRole,
    } = useSelector((state) => state.user);

    const [loader, setLoader] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    const navigateHandler = (user) => {

        if (user === "Admin") {

            if (visitor === "guest") {

                const email = "yogendra@12";
                const fields = { email, password };

                setLoader(true);

                dispatch(loginUser(fields, user));

            } else {

                navigate("/Adminlogin");

            }
        }

        else if (user === "Student") {

            if (visitor === "guest") {

                const rollNum = "1";
                const studentName = "Dipesh Awasthi";

                const fields = {
                    rollNum,
                    studentName,
                    password,
                };

                setLoader(true);

                dispatch(loginUser(fields, user));

            } else {

                navigate("/Studentlogin");

            }
        }

        else if (user === "Teacher") {

            if (visitor === "guest") {

                const email = "tony@12";
                const fields = { email, password };

                setLoader(true);

                dispatch(loginUser(fields, user));

            } else {

                navigate("/Teacherlogin");

            }
        }
    };

    useEffect(() => {

        if (
            status === "success" ||
            currentUser !== null
        ) {

            if (currentRole === "Admin") {
                navigate("/Admin/dashboard");
            }

            else if (currentRole === "Student") {
                navigate("/Student/dashboard");
            }

            else if (currentRole === "Teacher") {
                navigate("/Teacher/dashboard");
            }

        }

        else if (status === "error") {

            setLoader(false);

            setMessage("Network Error");

            setShowPopup(true);

        }

    }, [
        status,
        currentRole,
        navigate,
        currentUser,
    ]);

    const cards = [
        {
            title: "Administrator",
            icon: <AccountCircle sx={{ fontSize: 56 }} />,
            description:
                "Manage schools, teachers, students, notices and complete system administration.",
            role: "Admin",
        },
        {
            title: "Student",
            icon: <School sx={{ fontSize: 56 }} />,
            description:
                "Access attendance, marks, assignments, notices and academic progress.",
            role: "Student",
        },
        {
            title: "Teacher",
            icon: <Group sx={{ fontSize: 56 }} />,
            description:
                "Manage classes, attendance, marks and monitor student performance.",
            role: "Teacher",
        },
    ];

    return (
        <PageContainer>

            <Container maxWidth="lg">

                <HeroCard>

                    <Typography
                        variant="h3"
                        sx={{
                            color: "#FFFFFF",
                            fontWeight: 700,
                        }}
                    >
                        Welcome Back
                    </Typography>

                    <Typography
                        sx={{
                            color: "#94A3B8",
                            mt: 1,
                            fontSize: "1.05rem",
                        }}
                    >
                        Select your role to continue
                    </Typography>

                </HeroCard>

                <Grid
                    container
                    spacing={4}
                >

                    {cards.map((card) => (

                        <Grid
                            item
                            xs={12}
                            md={4}
                            key={card.role}
                        >

                            <RoleCard
                                elevation={0}
                                onClick={() =>
                                    navigateHandler(card.role)
                                }
                            >

                                <IconWrapper>

                                    {card.icon}

                                </IconWrapper>

                                <RoleTitle>

                                    {card.title}

                                </RoleTitle>

                                <RoleDescription>

                                    {card.description}

                                </RoleDescription>

                                <ArrowForwardRounded
                                    sx={{
                                        color: "#60A5FA",
                                        mt: 3,
                                        fontSize: 32,
                                    }}
                                />

                            </RoleCard>

                        </Grid>

                    ))}

                </Grid>

            </Container>

            <Backdrop
                open={loader}
                sx={{
                    color: "#fff",
                    zIndex: (theme) =>
                        theme.zIndex.drawer + 1,
                }}
            >

                <CircularProgress color="inherit" />

                <Typography
                    sx={{
                        ml: 2,
                    }}
                >
                    Please Wait...
                </Typography>

            </Backdrop>

            <Popup
                message={message}
                setShowPopup={setShowPopup}
                showPopup={showPopup}
            />

        </PageContainer>
    );
};

export default ChooseUser;

const PageContainer = styled.div`
    min-height:100vh;

    background:#070B14;

    display:flex;

    justify-content:center;

    align-items:center;

    padding:40px 20px;
`;

const HeroCard = styled.div`
    text-align:center;

    margin-bottom:50px;
`;

const RoleCard = styled(Paper)`
    background:#111827 !important;

    border:1px solid #1E293B;

    border-radius:22px !important;

    padding:40px 28px;

    text-align:center;

    color:white;

    cursor:pointer;

    transition:.35s;

    height:100%;

    &:hover{
        transform:translateY(-8px);

        border-color:#2563EB;

        box-shadow:0 18px 40px rgba(37,99,235,.18);
    }
`;

const IconWrapper = styled(Box)`
    width:90px;

    height:90px;

    border-radius:22px;

    margin:0 auto 25px;

    display:flex;

    justify-content:center;

    align-items:center;

    background:#0F172A;

    color:#60A5FA;

    border:1px solid #1E293B;
`;

const RoleTitle = styled.h2`
    color:#FFFFFF;

    margin-bottom:18px;

    font-size:1.6rem;
`;

const RoleDescription = styled.p`
    color:#94A3B8;

    line-height:1.7;

    min-height:80px;
`;