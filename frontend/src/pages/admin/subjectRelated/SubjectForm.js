import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import styled from "styled-components";

import { addStuff } from "../../../redux/userRelated/userHandle";
import { underControl } from "../../../redux/userRelated/userSlice";
import Popup from "../../../components/Popup";


const SubjectForm = () => {

  const [subjects, setSubjects] = useState([
    {
      subName: "",
      subCode: "",
      sessions: "",
    },
  ]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();

  const userState = useSelector((state) => state.user);

  const {
    status,
    currentUser,
    response,
    error,
  } = userState;

  const sclassName = params.id;
  const adminID = currentUser._id;
  const address = "Subject";

  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");
  const [loader, setLoader] = useState(false);
  const handleSubjectNameChange = (index) => (event) => {
    const newSubjects = [...subjects];
    newSubjects[index].subName = event.target.value;
    setSubjects(newSubjects);
};

const handleSubjectCodeChange = (index) => (event) => {
    const newSubjects = [...subjects];
    newSubjects[index].subCode = event.target.value;
    setSubjects(newSubjects);
};

const handleSessionsChange = (index) => (event) => {
    const newSubjects = [...subjects];
    newSubjects[index].sessions = event.target.value || 0;
    setSubjects(newSubjects);
};

const handleAddSubject = () => {
    setSubjects([
        ...subjects,
        {
            subName: "",
            subCode: "",
            sessions: "",
        },
    ]);
};

const handleRemoveSubject = (index) => () => {
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    setSubjects(newSubjects);
};

const fields = {
    sclassName,
    subjects: subjects.map((subject) => ({
        subName: subject.subName,
        subCode: subject.subCode,
        sessions: subject.sessions,
    })),
    adminID,
};

const submitHandler = (event) => {
    event.preventDefault();
    setLoader(true);
    dispatch(addStuff(fields, address));
};
useEffect(() => {

    if (status === "added") {

        navigate("/Admin/subjects");

        dispatch(underControl());

        setLoader(false);

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

return (

    <StyledContainer>

        <StyledCard>

            <Stack
                spacing={2}
                alignItems="center"
            >

                <HeaderIcon>

                    <LibraryBooksRoundedIcon
                        sx={{
                            fontSize: 58,
                            color: "#fff",
                        }}
                    />

                </HeaderIcon>

                <PageTitle>

                    Add Subjects

                </PageTitle>

                <PageSubtitle>

                    Create multiple subjects for this class with
                    subject codes and weekly sessions.

                </PageSubtitle>

            </Stack>

            <FormWrapper
                component="form"
                onSubmit={submitHandler}
            >

               {subjects.map((subject, index) => (

    <SubjectCard key={index}>

        <CardHeader>

            <SubjectTitle>

                Subject {index + 1}

            </SubjectTitle>

            {subjects.length > 1 && (

                <IconButton
                    type="button"
                    onClick={handleRemoveSubject(index)}
                    sx={{
                        bgcolor: "rgba(220,38,38,.12)",
                        color: "#EF4444",
                        "&:hover": {
                            bgcolor: "rgba(220,38,38,.22)",
                        },
                    }}
                >
                    <DeleteRoundedIcon />
                </IconButton>

            )}

        </CardHeader>

        <Grid container spacing={3} sx={{ mt: 1 }}>

            <Grid item xs={12} md={4}>

                <StyledTextField
                    fullWidth
                    label="Subject Name"
                    placeholder="Mathematics"
                    value={subject.subName}
                    onChange={handleSubjectNameChange(index)}
                    required
                />

            </Grid>

            <Grid item xs={12} md={4}>

                <StyledTextField
                    fullWidth
                    label="Subject Code"
                    placeholder="MTH101"
                    value={subject.subCode}
                    onChange={handleSubjectCodeChange(index)}
                    required
                />

            </Grid>

            <Grid item xs={12} md={4}>

                <StyledTextField
                    fullWidth
                    label="Weekly Sessions"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={subject.sessions}
                    onChange={handleSessionsChange(index)}
                    required
                />

            </Grid>

        </Grid>

    </SubjectCard>

))}

<AddButtonContainer>

    <AddSubjectButton
        type="button"
        startIcon={<AddRoundedIcon />}
        onClick={handleAddSubject}
    >
        Add Subject
    </AddSubjectButton>

</AddButtonContainer>

                <SaveContainer>

                    <SaveButton
                        type="submit"
                        variant="contained"
                        disabled={loader}
                        startIcon={
                            !loader ? (
                                <SaveRoundedIcon />
                            ) : null
                        }
                    >

                        {loader ? (

                            <CircularProgress
                                size={24}
                                color="inherit"
                            />

                        ) : (

                            "Save Subjects"

                        )}

                    </SaveButton>

                </SaveContainer>

            </FormWrapper>

            <Popup
                message={message}
                showPopup={showPopup}
                setShowPopup={setShowPopup}
            />

        </StyledCard>

    </StyledContainer>

);

};

const StyledContainer = styled(Box)`
  min-height: calc(100vh - 64px);
  background: #070b14;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 50px 20px;
`;

const StyledCard = styled(Box)`
  width: 100%;
  max-width: 1100px;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 25px 60px rgba(0,0,0,.45);

  @media (max-width:900px){
    padding:25px;
  }
`;

const HeaderIcon = styled(Box)`
  width:110px;
  height:110px;
  border-radius:50%;

  background:linear-gradient(135deg,#2563EB,#1D4ED8);

  display:flex;
  justify-content:center;
  align-items:center;

  border:4px solid #FBBF24;

  box-shadow:
      0 0 0 10px rgba(37,99,235,.08),
      0 20px 45px rgba(37,99,235,.35);

  transition:.35s;

  &:hover{
      transform:translateY(-6px) scale(1.04);
  }
`;

const PageTitle = styled(Typography)`
  color:white;
  font-size:2rem!important;
  font-weight:700!important;
`;

const PageSubtitle = styled(Typography)`
  color:#94A3B8;
  text-align:center;
  max-width:600px;
  line-height:1.7!important;
`;

const FormWrapper = styled(Box)`
  margin-top:40px;
`;

const SubjectCard = styled(Box)`
    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:20px;

    padding:36px;
    margin-bottom:30px;

    transition:.3s;

    &:hover{
        border-color:#2563EB;
        box-shadow:0 18px 40px rgba(37,99,235,.18);
    }
`;

const CardHeader = styled(Box)`
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:28px;
`;
const SubjectTitle = styled(Typography)`
    color:white;
    font-size:1.25rem!important;
    font-weight:700!important;
`;

const AddButtonContainer = styled(Box)`
    display:flex;
    justify-content:center;
    margin:10px 0 45px;
`;

const ButtonRow = styled(Box)`
  display:flex;
  justify-content:flex-end;
  margin-top:25px;
`;

const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root{
      background:#111827;
      border-radius:14px;
      color:white;
  }

  .MuiOutlinedInput-input{
      padding:18px 16px;
      color:white;
  }

  .MuiInputLabel-root{
      color:#94A3B8;
      background:#111827;
      padding:0 8px;
  }

  .MuiInputLabel-shrink{
      background:#111827;
      padding:0 8px;
  }

  .MuiInputLabel-root.Mui-focused{
      color:#2563EB;
      background:#111827;
  }

  .MuiOutlinedInput-notchedOutline{
      border-color:#334155;
  }

  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline{
      border-color:#2563EB;
  }

  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline{
      border-color:#2563EB;
      box-shadow:0 0 0 4px rgba(37,99,235,.12);
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active{
      -webkit-box-shadow:0 0 0 1000px #111827 inset!important;
      -webkit-text-fill-color:white!important;
  }
`;

const AddSubjectButton = styled(Button)`
  background:linear-gradient(135deg,#2563EB,#1D4ED8)!important;
  color:white!important;
  border-radius:12px!important;
  padding:12px 24px!important;
  text-transform:none!important;
  font-weight:600!important;

  &:hover{
      background:linear-gradient(135deg,#1D4ED8,#1E40AF)!important;
  }
`;

const RemoveSubjectButton = styled(Button)`
  background:#DC2626!important;
  color:white!important;
  border-radius:12px!important;
  padding:12px 24px!important;
  text-transform:none!important;
  font-weight:600!important;

  &:hover{
      background:#B91C1C!important;
  }
`;

const SaveContainer = styled(Box)`
  display:flex;
  justify-content:flex-end;
  margin-top:35px;
`;

const SaveButton = styled(Button)`
  background:linear-gradient(135deg,#2563EB,#1D4ED8)!important;
  color:white!important;

  min-width:220px;
  height:58px;

  border-radius:14px!important;

  font-size:16px!important;
  font-weight:700!important;
  text-transform:none!important;

  box-shadow:0 18px 35px rgba(37,99,235,.35);

  &:hover{
      background:linear-gradient(135deg,#1D4ED8,#1E40AF)!important;
  }
`;

export default SubjectForm;