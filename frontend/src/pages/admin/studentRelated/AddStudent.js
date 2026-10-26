import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Button,
} from "@mui/material";

import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { registerUser } from "../../../redux/userRelated/userHandle";
import { underControl } from "../../../redux/userRelated/userSlice";
import { getAllSclasses } from "../../../redux/sclassRelated/sclassHandle";

import { BlueButton } from "../../../components/buttonStyles";
import Popup from "../../../components/Popup";

import styled from "styled-components";

const AddStudent = ({ situation }) => {

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

  const { sclassesList } = useSelector(
    (state) => state.sclass
  );

  const [name, setName] = useState("");

  const [rollNum, setRollNum] = useState("");

  const [password, setPassword] =
    useState("");

  const [className, setClassName] =
    useState("");

  const [sclassName, setSclassName] =
    useState("");

  const adminID = currentUser._id;

  const role = "Student";

  const attendance = [];

  useEffect(() => {

    if (situation === "Class") {

      setSclassName(params.id);

    }

  }, [params.id, situation]);

  const [showPopup, setShowPopup] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [loader, setLoader] =
    useState(false);

  useEffect(() => {

    dispatch(
      getAllSclasses(adminID, "Sclass")
    );

  }, [adminID, dispatch]);

  const changeHandler = (event) => {

    if (
      event.target.value ===
      "Select Class"
    ) {

      setClassName("Select Class");

      setSclassName("");

    } else {

      const selectedClass =
        sclassesList.find(
          (classItem) =>
            classItem.sclassName ===
            event.target.value
        );

      setClassName(
        selectedClass.sclassName
      );

      setSclassName(selectedClass._id);

    }

  };

  const fields = {
    name,
    rollNum,
    password,
    sclassName,
    adminID,
    role,
    attendance,
  };

  const submitHandler = (event) => {

    event.preventDefault();

    if (sclassName === "") {

      setMessage(
        "Please select a class"
      );

      setShowPopup(true);

    } else {

      setLoader(true);

      dispatch(
        registerUser(fields, role)
      );

    }

  };

  useEffect(() => {

    if (status === "added") {

      dispatch(underControl());

      navigate(-1);

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
    <>

      <StyledContainer>

        <StyledCard>

          <Stack
            spacing={2}
            alignItems="center"
          >

            <AvatarCircle>

              <SchoolRoundedIcon
                sx={{
                  fontSize: 60,
                  color: "#fff",
                }}
              />

            </AvatarCircle>

            <Title>

              Add Student

            </Title>

            <SubTitle>

              Register a new student to
              your school and assign them
              to a classroom.

            </SubTitle>

          </Stack>

          <FormContainer
            component="form"
            onSubmit={submitHandler}
          >

            <StyledTextField
              fullWidth
              label="Student Name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />

            {situation === "Student" && (

              <StyledFormControl
                fullWidth
              >

                <InputLabel>
                  Select Class
                </InputLabel>

                <Select
                  value={className}
                  label="Select Class"
                  onChange={changeHandler}
                >

                  <MenuItem value="Select Class">
                    Select Class
                  </MenuItem>

                  {sclassesList.map(
                    (classItem) => (

                      <MenuItem
                        key={classItem._id}
                        value={
                          classItem.sclassName
                        }
                      >
                        {
                          classItem.sclassName
                        }
                      </MenuItem>

                    )
                  )}

                </Select>

              </StyledFormControl>

            )}

            <StyledTextField
              fullWidth
              label="Roll Number"
              type="number"
              value={rollNum}
              onChange={(e) =>
                setRollNum(
                  e.target.value
                )
              }
              required
            />

            <StyledTextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />

            <BlueButton
              fullWidth
              variant="contained"
              type="submit"
              disabled={loader}
              sx={{
                mt: 4,
                height: 56,
                borderRadius: "14px",
              }}
            >

              {loader ? (

                <CircularProgress
                  size={24}
                  color="inherit"
                />

              ) : (

                "Add Student"

              )}

            </BlueButton>

            <Button
              variant="outlined"
              onClick={() =>
                navigate(-1)
              }
              sx={{
                mt: 2,
                height: 52,
                borderRadius: "14px",
              }}
            >

              Go Back

            </Button>

          </FormContainer>

        </StyledCard>

      </StyledContainer>

      <Popup
        message={message}
        showPopup={showPopup}
        setShowPopup={setShowPopup}
      />

    </>
  );

};
const StyledContainer = styled(Box)`
  min-height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background: #070b14;
`;

const StyledCard = styled(Box)`
  width: 100%;
  max-width: 680px;

  background: #111827;

  border: 1px solid #1e293b;

  border-radius: 26px;

  padding: 55px;

  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);

  @media (max-width: 700px) {
    padding: 30px 22px;
  }
`;

const AvatarCircle = styled(Avatar)`
  width: 120px !important;
  height: 120px !important;

  background: linear-gradient(
    135deg,
    #2563eb,
    #1d4ed8
  ) !important;

  border: 4px solid #fbbf24;

  box-shadow:
    0 0 0 10px rgba(37, 99, 235, .08),
    0 20px 55px rgba(37, 99, 235, .35);

  transition: .35s;

  &:hover{
      transform: translateY(-8px) scale(1.05);

      box-shadow:
        0 0 35px rgba(37,99,235,.45),
        0 30px 70px rgba(37,99,235,.45);
  }
`;

const Title = styled(Typography)`
  color: white;
  font-size: 2rem !important;
  font-weight: 700 !important;
  text-align: center;
`;

const SubTitle = styled(Typography)`
  color: #94a3b8;
  text-align: center;
  max-width: 470px;
  line-height: 1.8 !important;
  margin-bottom: 25px !important;
`;

const FormContainer = styled(Box)`
  margin-top: 40px;

  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    background: #0f172a;
    border-radius: 16px;
    color: white;
    transition: .3s;
  }

  .MuiOutlinedInput-root fieldset {
    border-color: #334155;
  }

  .MuiOutlinedInput-root:hover fieldset {
    border-color: #2563eb;
  }

  .MuiOutlinedInput-root.Mui-focused fieldset {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37,99,235,.12);
  }

  .MuiInputBase-input {
    color: white;
    padding: 16px;
  }

  .MuiInputLabel-root {
    color: #94a3b8;
  }

  .MuiInputLabel-root.Mui-focused {
    color: #2563eb;
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #0f172a inset !important;
    -webkit-text-fill-color: white !important;
    caret-color: white;
    transition: background-color 9999s ease-in-out 0s;
  }
`;

const StyledFormControl = styled(FormControl)`
  .MuiOutlinedInput-root {
    background: #0f172a;
    border-radius: 16px;
    color: white;
  }

  .MuiOutlinedInput-root fieldset {
    border-color: #334155;
  }

  .MuiOutlinedInput-root:hover fieldset {
    border-color: #2563eb;
  }

  .MuiOutlinedInput-root.Mui-focused fieldset {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37,99,235,.12);
  }

  .MuiInputLabel-root {
    color: #94a3b8;
  }

  .MuiInputLabel-root.Mui-focused {
    color: #2563eb;
  }

  .MuiSelect-select {
    color: white;
    padding: 16px;
  }

  .MuiSvgIcon-root {
    color: #94a3b8;
  }
`;

export default AddStudent;