import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
    Box,
    Paper,
    Typography,
    TextField,
    Container,
    Avatar,
    Chip,
    Stack,
    CircularProgress,
    Divider,
} from "@mui/material";

import SchoolIcon from "@mui/icons-material/School";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";

import styled from "styled-components";

import { getSubjectDetails } from "../../../redux/sclassRelated/sclassHandle";

import Popup from "../../../components/Popup";

import { registerUser } from "../../../redux/userRelated/userHandle";

import { underControl } from "../../../redux/userRelated/userSlice";

const AddTeacher = () => {

    const params = useParams();

    const dispatch = useDispatch();

    const navigate = useNavigate();

    const subjectID = params.id;

    const {
        status,
        response,
        error,
    } = useSelector(
        (state) => state.user
    );

    const {
        subjectDetails,
    } = useSelector(
        (state) => state.sclass
    );

    useEffect(() => {

        dispatch(
            getSubjectDetails(
                subjectID,
                "Subject"
            )
        );

    }, [dispatch, subjectID]);

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPopup, setShowPopup] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [loader, setLoader] =
        useState(false);

    const role = "Teacher";

    const school =
        subjectDetails &&
        subjectDetails.school;

    const teachSubject =
        subjectDetails &&
        subjectDetails._id;

    const teachSclass =
        subjectDetails &&
        subjectDetails.sclassName &&
        subjectDetails.sclassName._id;

    const fields = {
        name,
        email,
        password,
        role,
        school,
        teachSubject,
        teachSclass,
    };

    const submitHandler = (event) => {

        event.preventDefault();

        setLoader(true);

        dispatch(
            registerUser(
                fields,
                role
            )
        );

    };

    useEffect(() => {

        if (status === "added") {

            dispatch(
                underControl()
            );

            navigate(
                "/Admin/teachers"
            );

        }
        else if (status === "failed") {

            setMessage(response);

            setShowPopup(true);

            setLoader(false);

        }
        else if (status === "error") {

            setMessage("Network Error");

            setShowPopup(true);

            setLoader(false);

        }

    }, [
        status,
        navigate,
        error,
        response,
        dispatch,
    ]);

    // PART 1B STARTS FROM return(...)
    return (
    <>
        <PageWrapper maxWidth="lg">

            {/* Hero */}

            <HeroCard elevation={0}>

                <HeroLeft>

                    <AvatarCircle>
                        <PersonAddAlt1RoundedIcon sx={{ fontSize: 42 }} />
                    </AvatarCircle>

                    <Box>

                        <PageTitle>
                            Add New Teacher
                        </PageTitle>

                        <PageSubtitle>
                            Register a new faculty member and assign them to a subject and class.
                        </PageSubtitle>

                        <Stack
                            direction="row"
                            spacing={1.5}
                            mt={3}
                            flexWrap="wrap"
                        >

                            <Chip
                                color="primary"
                                icon={<MenuBookRoundedIcon />}
                                label={
                                    subjectDetails?.subName || "Loading Subject"
                                }
                            />

                            <Chip
                                icon={<Groups2RoundedIcon />}
                                label={
                                    subjectDetails?.sclassName?.sclassName || "Loading Class"
                                }
                            />

                        </Stack>

                    </Box>

                </HeroLeft>

            </HeroCard>

            {/* Form */}

            <FormCard elevation={0}>

                <SectionHeading>

                    Teacher Information

                </SectionHeading>

                <Divider
                    sx={{
                        borderColor: "#1E293B",
                        mb: 4,
                    }}
                />

                <form onSubmit={submitHandler}>

                    <FormGrid>

                        <TextField
                            fullWidth
                            label="Teacher Name"
                            placeholder="Enter teacher's full name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            autoComplete="name"
                            required
                        />

                        <TextField
                            fullWidth
                            type="email"
                            label="Email Address"
                            placeholder="Enter teacher's email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            autoComplete="email"
                            required
                        />

                        <TextField
                            fullWidth
                            type="password"
                            label="Password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            autoComplete="new-password"
                            required
                        />

                    </FormGrid>

                    <InfoCard>

                        <Typography
                            sx={{
                                color: "#94A3B8",
                                fontWeight: 600,
                                mb: 2,
                            }}
                        >
                            Assignment Details
                        </Typography>

                        <InfoRow>

                            <InfoLabel>
                                Subject
                            </InfoLabel>

                            <InfoValue>
                                {subjectDetails?.subName || "--"}
                            </InfoValue>

                        </InfoRow>

                        <InfoRow>

                            <InfoLabel>
                                Class
                            </InfoLabel>

                            <InfoValue>
                                {subjectDetails?.sclassName?.sclassName || "--"}
                            </InfoValue>

                        </InfoRow>

                    </InfoCard>

                    <Box
                        mt={5}
                        display="flex"
                        justifyContent="flex-end"
                    >

                        <SubmitButton
                            type="submit"
                            disabled={loader}
                        >

                            {loader ? (
                                <CircularProgress
                                    size={24}
                                    sx={{
                                        color: "#fff",
                                    }}
                                />
                            ) : (
                                "Register Teacher"
                            )}

                        </SubmitButton>

                    </Box>

                </form>

            </FormCard>

        </PageWrapper>

        <Popup
            message={message}
            setShowPopup={setShowPopup}
            showPopup={showPopup}
        />
    </>
);
}
export default AddTeacher;

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
    margin-top:10px !important;
    line-height:1.8;
    max-width:650px;
`;

const FormCard = styled(Paper)`
    background:#111827 !important;
    border:1px solid #1E293B;
    border-radius:24px !important;
    padding:38px;
    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const SectionHeading = styled(Typography)`
    color:white;
    font-size:1.45rem !important;
    font-weight:700 !important;
`;

const FormGrid = styled(Box)`
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
    gap:24px;
    margin-bottom:35px;

    .MuiTextField-root{

        .MuiOutlinedInput-root{

            background:#0F172A;
            border-radius:14px;
            color:white;

            fieldset{
                border-color:#1E293B;
            }

            &:hover fieldset{
                border-color:#2563EB;
            }

            &.Mui-focused fieldset{
                border-color:#2563EB;
            }

            input{
                color:white;
            }
        }

        .MuiInputLabel-root{
            color:#94A3B8;
        }

        .MuiInputLabel-root.Mui-focused{
            color:#60A5FA;
        }
    }
`;

const InfoCard = styled(Box)`
    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:18px;
    padding:24px;
`;

const InfoRow = styled(Box)`
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:14px 0;
    border-bottom:1px solid #1E293B;

    &:last-child{
        border-bottom:none;
    }

    @media(max-width:600px){
        flex-direction:column;
        align-items:flex-start;
        gap:6px;
    }
`;

const InfoLabel = styled(Typography)`
    color:#94A3B8;
    font-weight:600 !important;
`;

const InfoValue = styled(Typography)`
    color:white;
    font-weight:700 !important;
`;

const SubmitButton = styled.button`
    background:linear-gradient(135deg,#2563EB,#1D4ED8);
    color:white;
    border:none;
    border-radius:14px;
    padding:14px 34px;
    font-size:1rem;
    font-weight:700;
    cursor:pointer;
    transition:.3s;
    display:flex;
    align-items:center;
    justify-content:center;
    min-width:220px;

    &:hover:not(:disabled){
        transform:translateY(-3px);
        box-shadow:0 15px 30px rgba(37,99,235,.35);
    }

    &:disabled{
        opacity:.7;
        cursor:not-allowed;
    }
`;