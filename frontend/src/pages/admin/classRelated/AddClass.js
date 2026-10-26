import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  TextField,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { addStuff } from "../../../redux/userRelated/userHandle";
import { underControl } from "../../../redux/userRelated/userSlice";

import { BlueButton } from "../../../components/buttonStyles";

import Popup from "../../../components/Popup";

import styled from "styled-components";

const AddClass = () => {

  const [sclassName, setSclassName] = useState("");

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const userState = useSelector((state) => state.user);

  const {
    status,
    currentUser,
    response,
    error,
    tempDetails,
  } = userState;

  const adminID = currentUser._id;

  const address = "Sclass";

  const [loader, setLoader] = useState(false);

  const [message, setMessage] = useState("");

  const [showPopup, setShowPopup] = useState(false);

  const fields = {
    sclassName,
    adminID,
  };

  const submitHandler = (event) => {

    event.preventDefault();

    setLoader(true);

    dispatch(addStuff(fields, address));

  };

  useEffect(() => {

    if (status === "added" && tempDetails) {

      navigate("/Admin/classes/class/" + tempDetails._id);

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
    tempDetails,
  ]);

  return (
    <>

      <StyledContainer>

        <StyledBox>

          <Stack
            spacing={3}
            alignItems="center"
          >

            <AddCircle>

              <AddRoundedIcon
                sx={{
                  fontSize: 72,
                  color: "#FFFFFF",
                }}
              />

            </AddCircle>

            <Title>

              Create New Class

            </Title>

            <SubTitle>

              Create a classroom and start managing
              students, attendance and subjects from
              your dashboard.

            </SubTitle>

          </Stack>

          <FormContainer
            component="form"
            onSubmit={submitHandler}
          >

            <StyledTextField
              fullWidth
              label="Class Name"
              placeholder="Enter class name..."
              value={sclassName}
              onChange={(event) =>
                setSclassName(event.target.value)
              }
              required
            />

            <BlueButton
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loader}
              sx={{
                mt: 4,
                height: 56,
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >

              {loader ? (
                <CircularProgress
                  size={24}
                  color="inherit"
                />
              ) : (
                "Create Class"
              )}

            </BlueButton>

            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{
                mt: 2,
                color: "#CBD5E1",
                borderColor: "#334155",
                height: 52,
                borderRadius: "14px",

                "&:hover": {
                  borderColor: "#2563EB",
                  color: "#FFFFFF",
                  background: "rgba(37,99,235,.08)",
                },
              }}
            >

              Go Back

            </Button>

          </FormContainer>

        </StyledBox>

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
  flex: 1;
  min-height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background: #070b14;
`;

const StyledBox = styled(Box)`
  width: 100%;
  max-width: 650px;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 24px;
  padding: 55px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);

  @media (max-width: 700px) {
    padding: 35px 22px;
  }
`;

const AddCircle = styled(Box)`
  width: 130px;
  height: 130px;
  border-radius: 50%;

  display: flex;
  justify-content: center;
  align-items: center;

  background: linear-gradient(135deg, #2563eb, #1d4ed8);

  border: 4px solid #fbbf24;

  box-shadow:
    0 0 0 10px rgba(37, 99, 235, 0.08),
    0 20px 45px rgba(37, 99, 235, 0.35);

  transition: all 0.35s ease;

  cursor: pointer;

  &:hover {
    transform: translateY(-8px) scale(1.05);

    box-shadow:
      0 0 35px rgba(37, 99, 235, 0.45),
      0 30px 60px rgba(37, 99, 235, 0.45);
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
  max-width: 460px;
  line-height: 1.8 !important;
  margin-bottom: 20px !important;
`;

const FormContainer = styled(Box)`
  margin-top: 45px;
`;

const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    background: #0f172a;
    color: white;
    border-radius: 16px;
    transition: all 0.3s ease;
  }

  .MuiOutlinedInput-root fieldset {
    border-color: #334155;
  }

  .MuiOutlinedInput-root:hover fieldset {
    border-color: #2563eb;
  }

  .MuiOutlinedInput-root.Mui-focused fieldset {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
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

  /* Chrome Autofill Fix */

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #0f172a inset !important;
    -webkit-text-fill-color: #ffffff !important;
    caret-color: #ffffff;
    transition: background-color 9999s ease-in-out 0s;
  }
`;

export default AddClass;