import { useEffect, useState } from "react";

import {
    Box,
    CircularProgress,
    Stack,
    TextField,
    Typography,
    Avatar,
    Container,
} from "@mui/material";

import FeedbackRoundedIcon from "@mui/icons-material/FeedbackRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

import styled from "styled-components";

import Popup from "../../components/Popup";
import { BlueButton } from "../../components/buttonStyles";

import { addStuff } from "../../redux/userRelated/userHandle";

import {
    useDispatch,
    useSelector,
} from "react-redux";

const StudentComplain = () => {

    const [complaint, setComplaint] =
        useState("");

    const [date, setDate] =
        useState("");

    const dispatch = useDispatch();

    const {
        status,
        currentUser,
        error,
    } = useSelector(
        (state) => state.user
    );

    const user = currentUser._id;

    const school =
        currentUser.school._id;

    const address = "Complain";

    const [loader, setLoader] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [showPopup, setShowPopup] =
        useState(false);

    const fields = {
        user,
        date,
        complaint,
        school,
    };

    const submitHandler = (
        event
    ) => {

        event.preventDefault();

        setLoader(true);

        dispatch(
            addStuff(
                fields,
                address
            )
        );

    };

    useEffect(() => {

        if (status === "added") {

            setLoader(false);

            setShowPopup(true);

            setMessage(
                "Done Successfully"
            );

        }
        else if (error) {

            setLoader(false);

            setShowPopup(true);

            setMessage(
                "Network Error"
            );

        }

    }, [
        status,
        error,
    ]);

    // PART 1B STARTS FROM return(...)

    return (
    <>
        <PageWrapper maxWidth="md">

            <HeroCard>

                <HeroLeft>

                    <AvatarCircle>

                        <FeedbackRoundedIcon
                            sx={{ fontSize: 42 }}
                        />

                    </AvatarCircle>

                    <Box>

                        <PageTitle>

                            Submit Complaint

                        </PageTitle>

                        <PageSubtitle>

                            Share any academic or campus-related issue with
                            the administration. Your complaint will be securely
                            recorded for review.

                        </PageSubtitle>

                    </Box>

                </HeroLeft>

            </HeroCard>

            <FormCard
                component="form"
                onSubmit={submitHandler}
            >

                <SectionHeading>

                    Complaint Details

                </SectionHeading>

                <FormGrid>

                    <StyledTextField
                        fullWidth
                        label="Complaint Date"
                        type="date"
                        value={date}
                        onChange={(event) =>
                            setDate(event.target.value)
                        }
                        required
                        InputLabelProps={{
                            shrink: true,
                        }}
                        InputProps={{
                            startAdornment: (
                                <CalendarMonthRoundedIcon
                                    sx={{
                                        color: "#2563EB",
                                        mr: 1,
                                    }}
                                />
                            ),
                        }}
                    />

                    <StyledTextField
                        fullWidth
                        multiline
                        minRows={6}
                        label="Describe your complaint"
                        placeholder="Explain the issue in detail..."
                        value={complaint}
                        onChange={(event) =>
                            setComplaint(
                                event.target.value
                            )
                        }
                        required
                    />

                </FormGrid>

                <InfoCard>

                    <Typography
                        sx={{
                            color: "#FBBF24",
                            fontWeight: 700,
                            mb: 1,
                        }}
                    >
                        Note
                    </Typography>

                    <Typography
                        sx={{
                            color: "#94A3B8",
                            lineHeight: 1.8,
                        }}
                    >
                        Please provide complete and accurate information.
                        Your complaint will be reviewed by the school
                        administration.

                    </Typography>

                </InfoCard>

                <SubmitContainer>

                    <SubmitButton
                        variant="contained"
                        type="submit"
                        disabled={loader}
                    >

                        {loader ? (

                            <CircularProgress
                                size={24}
                                color="inherit"
                            />

                        ) : (

                            "Submit Complaint"

                        )}

                    </SubmitButton>

                </SubmitContainer>

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
export default StudentComplain;

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
    max-width:620px;
`;

const FormCard = styled(Box)`
    background:#111827;
    border:1px solid #1E293B;
    border-radius:24px;
    padding:36px;
    box-shadow:0 20px 45px rgba(0,0,0,.25);

    @media(max-width:700px){
        padding:24px;
    }
`;

const SectionHeading = styled(Typography)`
    color:white;
    font-size:1.45rem !important;
    font-weight:700 !important;
    margin-bottom:30px !important;
`;

const FormGrid = styled(Box)`
    display:flex;
    flex-direction:column;
    gap:28px;
`;

const StyledTextField = styled(TextField)`
    .MuiOutlinedInput-root{
        background:#0F172A;
        border-radius:14px;
        color:white;
    }

    .MuiOutlinedInput-input{
        color:white;
        padding:18px 16px;
    }

    textarea{
        color:white;
    }

    .MuiInputLabel-root{
        color:#94A3B8;
    }

    .MuiInputLabel-root.Mui-focused{
        color:#2563EB;
    }

    .MuiOutlinedInput-notchedOutline{
        border-color:#334155;
    }

    .MuiOutlinedInput-root:hover
    .MuiOutlinedInput-notchedOutline{
        border-color:#2563EB;
    }

    .MuiOutlinedInput-root.Mui-focused
    .MuiOutlinedInput-notchedOutline{
        border-color:#2563EB;
        box-shadow:0 0 0 4px rgba(37,99,235,.12);
    }

    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus{
        -webkit-box-shadow:0 0 0 1000px #0F172A inset !important;
        -webkit-text-fill-color:white !important;
    }
`;

const InfoCard = styled(Box)`
    margin-top:30px;
    background:#0F172A;
    border:1px solid #1E293B;
    border-left:5px solid #FBBF24;
    border-radius:18px;
    padding:22px;
`;

const SubmitContainer = styled(Box)`
    display:flex;
    justify-content:flex-end;
    margin-top:35px;

    @media(max-width:700px){
        justify-content:stretch;
    }
`;

const SubmitButton = styled(BlueButton)`
    min-width:240px;
    height:56px;

    border-radius:14px !important;

    font-size:16px !important;
    font-weight:700 !important;

    text-transform:none !important;

    box-shadow:0 18px 35px rgba(37,99,235,.35);

    @media(max-width:700px){
        width:100%;
    }
`;