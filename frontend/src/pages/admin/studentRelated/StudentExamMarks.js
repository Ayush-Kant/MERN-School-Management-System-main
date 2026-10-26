import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { getUserDetails } from '../../../redux/userRelated/userHandle';
import { getSubjectList } from '../../../redux/sclassRelated/sclassHandle';
import { updateStudentFields } from '../../../redux/studentRelated/studentHandle';

import Popup from '../../../components/Popup';
import { BlueButton } from '../../../components/buttonStyles';

import styled from "styled-components";

import {
    Box,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    Stack,
    TextField,
    CircularProgress,
    FormControl,
} from '@mui/material';

const StudentExamMarks = ({ situation }) => {
    const dispatch = useDispatch();

    const { currentUser, userDetails, loading } = useSelector(
        (state) => state.user
    );

    const { subjectsList } = useSelector((state) => state.sclass);

    const { response, error, statestatus } = useSelector(
        (state) => state.student
    );

    const params = useParams();

    const [studentID, setStudentID] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [chosenSubName, setChosenSubName] = useState("");
    const [marksObtained, setMarksObtained] = useState("");

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [loader, setLoader] = useState(false);

    useEffect(() => {
        if (situation === "Student") {
            setStudentID(params.id);
            const stdID = params.id;
            dispatch(getUserDetails(stdID, "Student"));
        } else if (situation === "Subject") {
            const { studentID, subjectID } = params;
            setStudentID(studentID);
            dispatch(getUserDetails(studentID, "Student"));
            setChosenSubName(subjectID);
        }
    }, [situation]);

    useEffect(() => {
        if (
            userDetails &&
            userDetails.sclassName &&
            situation === "Student"
        ) {
            dispatch(
                getSubjectList(
                    userDetails.sclassName._id,
                    "ClassSubjects"
                )
            );
        }
    }, [dispatch, userDetails]);

    const changeHandler = (event) => {
        const selectedSubject = subjectsList.find(
            (subject) => subject.subName === event.target.value
        );

        setSubjectName(selectedSubject.subName);
        setChosenSubName(selectedSubject._id);
    };

    const fields = {
        subName: chosenSubName,
        marksObtained,
    };

    const submitHandler = (event) => {
        event.preventDefault();
        setLoader(true);
        dispatch(
            updateStudentFields(
                studentID,
                fields,
                "UpdateExamResult"
            )
        );
    };

    useEffect(() => {
        if (response) {
            setLoader(false);
            setShowPopup(true);
            setMessage(response);
        } else if (error) {
            setLoader(false);
            setShowPopup(true);
            setMessage("error");
        } else if (statestatus === "added") {
            setLoader(false);
            setShowPopup(true);
            setMessage("Done Successfully");
        }
    }, [response, statestatus, error]);

    // PART 1B STARTS FROM HERE (RETURN JSX)

        return (
        <>
            {loading ? (
                <LoadingContainer>
                    <CircularProgress
                        size={60}
                        sx={{ color: "#2563EB" }}
                    />
                    <LoadingText>
                        Loading Student...
                    </LoadingText>
                </LoadingContainer>
            ) : (
                <>
                    <PageWrapper>

                        <HeroCard>
                            <HeroContent>

                                <AvatarCircle>
                                    {userDetails?.name?.charAt(0)?.toUpperCase()}
                                </AvatarCircle>

                                <HeroInfo>
                                    <HeroTitle>
                                        Student Exam Marks
                                    </HeroTitle>

                                    <HeroSubtitle>
                                        Add or update examination marks for the selected student.
                                    </HeroSubtitle>
                                </HeroInfo>

                            </HeroContent>
                        </HeroCard>

                        <ContentCard>

                            <SectionTitle>
                                Student Details
                            </SectionTitle>

                            <InfoGrid>

                                <InfoItem>
                                    <InfoLabel>
                                        Student Name
                                    </InfoLabel>

                                    <InfoValue>
                                        {userDetails.name}
                                    </InfoValue>
                                </InfoItem>

                                {currentUser.teachSubject && (
                                    <InfoItem>
                                        <InfoLabel>
                                            Subject
                                        </InfoLabel>

                                        <InfoValue>
                                            {currentUser.teachSubject?.subName}
                                        </InfoValue>
                                    </InfoItem>
                                )}

                            </InfoGrid>

                            <StyledForm
                                onSubmit={submitHandler}
                            >

                                {situation === "Student" && (
                                    <StyledFormControl fullWidth>

                                        <InputLabel>
                                            Select Subject
                                        </InputLabel>

                                        <Select
                                            value={subjectName}
                                            label="Select Subject"
                                            onChange={changeHandler}
                                            required
                                        >
                                            {subjectsList ? (
                                                subjectsList.map((subject, index) => (
                                                    <MenuItem
                                                        key={index}
                                                        value={subject.subName}
                                                    >
                                                        {subject.subName}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem value="">
                                                    Add Subjects First
                                                </MenuItem>
                                            )}
                                        </Select>

                                    </StyledFormControl>
                                )}

                                <StyledFormControl>

                                    <TextField
                                        type="number"
                                        label="Marks Obtained"
                                        value={marksObtained}
                                        required
                                        onChange={(e) =>
                                            setMarksObtained(e.target.value)
                                        }
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />

                                </StyledFormControl>

                                <BlueButton
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    type="submit"
                                    disabled={loader}
                                    sx={{
                                        mt: 2,
                                        py: 1.4,
                                        borderRadius: "12px",
                                        fontWeight: 700,
                                        fontSize: "15px",
                                        textTransform: "none",
                                    }}
                                >
                                    {loader ? (
                                        <CircularProgress
                                            size={24}
                                            color="inherit"
                                        />
                                    ) : (
                                        "Submit Marks"
                                    )}
                                </BlueButton>

                            </StyledForm>

                        </ContentCard>

                    </PageWrapper>

                    <Popup
                        message={message}
                        setShowPopup={setShowPopup}
                        showPopup={showPopup}
                    />
                </>
            )}
        </>
    );
}
const PageWrapper = styled.div`
    min-height: 100vh;
    background: #070b14;
    padding: 32px;
`;

const LoadingContainer = styled.div`
    min-height: 100vh;
    background: #070b14;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 18px;
`;

const LoadingText = styled(Typography)`
    color: #cbd5e1 !important;
    font-size: 18px !important;
    font-weight: 500 !important;
`;

const HeroCard = styled.div`
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border-radius: 22px;
    padding: 28px;
    margin-bottom: 30px;
    box-shadow: 0 18px 40px rgba(37, 99, 235, 0.35);
`;

const HeroContent = styled.div`
    display: flex;
    align-items: center;
    gap: 22px;

    @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
    }
`;

const AvatarCircle = styled.div`
    width: 82px;
    height: 82px;
    border-radius: 50%;
    background: rgba(255,255,255,0.18);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 34px;
    font-weight: 700;
    border: 2px solid rgba(255,255,255,.25);
`;

const HeroInfo = styled.div`
    flex: 1;
`;

const HeroTitle = styled.h2`
    margin: 0;
    color: white;
    font-size: 30px;
    font-weight: 700;
`;

const HeroSubtitle = styled.p`
    margin-top: 10px;
    color: rgba(255,255,255,.9);
    font-size: 15px;
`;

const ContentCard = styled.div`
    background: #111827;
    border: 1px solid #1e293b;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,.25);
`;

const SectionTitle = styled.h3`
    margin: 0 0 24px;
    color: white;
    font-size: 22px;
    font-weight: 700;
`;

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px,1fr));
    gap: 18px;
    margin-bottom: 28px;
`;

const InfoItem = styled.div`
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 14px;
    padding: 18px;
`;

const InfoLabel = styled.div`
    color: #94a3b8;
    font-size: 13px;
    margin-bottom: 6px;
`;

const InfoValue = styled.div`
    color: white;
    font-size: 18px;
    font-weight: 600;
`;

const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 22px;

    .MuiInputLabel-root {
        color: #94a3b8;
    }

    .MuiOutlinedInput-root {
        color: white;
        border-radius: 12px;
        background: #0f172a;

        fieldset {
            border-color: #334155;
        }

        &:hover fieldset {
            border-color: #2563eb;
        }

        &.Mui-focused fieldset {
            border-color: #2563eb;
        }
    }

    .MuiSelect-icon {
        color: white;
    }

    .MuiInputBase-input {
        color: white;
    }
`;

const StyledFormControl = styled(FormControl)`
    width: 100%;
`;
export default StudentExamMarks;