import * as React from "react";
import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  Grid,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  CssBaseline,
  IconButton,
  InputAdornment,
  CircularProgress,
  Stack,
  Avatar,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
  SchoolRounded,
  GroupsRounded,
  MenuBookRounded,
  InsightsRounded,
  ShieldRounded,
} from "@mui/icons-material";

import styled from "styled-components";

import bgpic from "../../assets/designlogin.jpg";

import Popup from "../../components/Popup";

import { LightPurpleButton } from "../../components/buttonStyles";

import { registerUser } from "../../redux/userRelated/userHandle";

const AdminRegisterPage = () => {

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const {
    status,
    currentUser,
    response,
    error,
    currentRole,
  } = useSelector((state) => state.user);

  const [toggle, setToggle] = useState(false);

  const [loader, setLoader] = useState(false);

  const [showPopup, setShowPopup] = useState(false);

  const [message, setMessage] = useState("");

  const [emailError, setEmailError] = useState(false);

  const [passwordError, setPasswordError] = useState(false);

  const [adminNameError, setAdminNameError] =
    useState(false);

  const [schoolNameError, setSchoolNameError] =
    useState(false);

  const role = "Admin";

  const handleSubmit = (event) => {

    event.preventDefault();

    const name = event.target.adminName.value;

    const schoolName =
      event.target.schoolName.value;

    const email = event.target.email.value;

    const password =
      event.target.password.value;

    if (
      !name ||
      !schoolName ||
      !email ||
      !password
    ) {
      if (!name) setAdminNameError(true);

      if (!schoolName)
        setSchoolNameError(true);

      if (!email) setEmailError(true);

      if (!password)
        setPasswordError(true);

      return;
    }

    const fields = {
      name,
      email,
      password,
      role,
      schoolName,
    };

    setLoader(true);

    dispatch(registerUser(fields, role));
  };

  const handleInputChange = (event) => {

    const { name } = event.target;

    if (name === "email")
      setEmailError(false);

    if (name === "password")
      setPasswordError(false);

    if (name === "adminName")
      setAdminNameError(false);

    if (name === "schoolName")
      setSchoolNameError(false);
  };

  useEffect(() => {

    if (
      status === "success" ||
      (currentUser !== null &&
        currentRole === "Admin")
    ) {
      navigate("/Admin/dashboard");
    }

    else if (status === "failed") {

      setMessage(response);

      setShowPopup(true);

      setLoader(false);
    }

    else if (status === "error") {

      console.log(error);
    }

  }, [
    status,
    currentUser,
    currentRole,
    navigate,
    error,
    response,
  ]);

  return (

    <>

      <CssBaseline />

      <MainWrapper>

        {/* LEFT PANEL */}

        <LeftPanel>

          <FormContainer>

            <Logo>

              <SchoolRounded
                sx={{
                  fontSize: 42,
                  color: "#fff",
                }}
              />

            </Logo>

            <Title>
              Create Admin Account
            </Title>

            <SubTitle>

              Register your school and start
              managing teachers, students,
              attendance and classes from one
              beautiful dashboard.

            </SubTitle>

            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
            >

              <StyledTextField
                fullWidth
                margin="normal"
                id="adminName"
                label="Administrator Name"
                name="adminName"
                autoFocus
                error={adminNameError}
                helperText={
                  adminNameError &&
                  "Administrator name is required"
                }
                onChange={handleInputChange}
              />

              <StyledTextField
                fullWidth
                margin="normal"
                id="schoolName"
                label="School Name"
                name="schoolName"
                error={schoolNameError}
                helperText={
                  schoolNameError &&
                  "School name is required"
                }
                onChange={handleInputChange}
              />

              <StyledTextField
                fullWidth
                margin="normal"
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                error={emailError}
                helperText={
                  emailError &&
                  "Email is required"
                }
                onChange={handleInputChange}
              />

              <StyledTextField
                fullWidth
                margin="normal"
                id="password"
                label="Password"
                name="password"
                type={
                  toggle
                    ? "text"
                    : "password"
                }
                error={passwordError}
                helperText={
                  passwordError &&
                  "Password is required"
                }
                onChange={handleInputChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">

                      <IconButton
                        onClick={() =>
                          setToggle(!toggle)
                        }
                      >
                        {toggle ? (
                          <Visibility />
                        ) : (
                          <VisibilityOff />
                        )}
                      </IconButton>

                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    sx={{
                      color: "#2563EB",
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      color: "#CBD5E1",
                    }}
                  >
                    Remember me
                  </Typography>
                }
              />

              <LightPurpleButton
                fullWidth
                type="submit"
                variant="contained"
                sx={{
                  mt: 3,
                  height: 56,
                  fontSize: "1rem",
                }}
              >

                {loader ? (
                  <CircularProgress
                    size={24}
                    color="inherit"
                  />
                ) : (
                  "Create School"
                )}

              </LightPurpleButton>

              <Typography
                align="center"
                sx={{
                  mt: 3,
                  color: "#94A3B8",
                }}
              >

                Already have an account?{" "}

                <StyledLink to="/Adminlogin">

                  Login

                </StyledLink>

              </Typography>

            </Box>

          </FormContainer>

        </LeftPanel>

        {/* RIGHT PANEL */}

        <RightPanel>

          <Overlay />

          <RightContent>

            <Typography
              variant="h2"
              fontWeight={700}
            >

              Empower Your School

            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: "#CBD5E1",
                maxWidth: 500,
                fontSize: "1.1rem",
              }}
            >

              Manage everything in one place.

              Smart. Secure. Modern.

            </Typography>

            <FeatureContainer>

              {/* Feature cards continue in Part 2 */}
              <FeatureCard>

                <Avatar
                  sx={{
                    bgcolor: "rgba(37,99,235,.15)",
                    color: "#4F8CFF",
                    width: 56,
                    height: 56,
                  }}
                >
                  <GroupsRounded />
                </Avatar>

                <Box>

                  <Typography
                    fontWeight={700}
                    fontSize="1.05rem"
                  >
                    Student Management
                  </Typography>

                  <Typography
                    sx={{
                      color: "#CBD5E1",
                      mt: .5,
                    }}
                  >
                    Register, organize and monitor every student from one dashboard.
                  </Typography>

                </Box>

              </FeatureCard>

              <FeatureCard>

                <Avatar
                  sx={{
                    bgcolor: "rgba(251,191,36,.15)",
                    color: "#FBBF24",
                    width: 56,
                    height: 56,
                  }}
                >
                  <MenuBookRounded />
                </Avatar>

                <Box>

                  <Typography
                    fontWeight={700}
                    fontSize="1.05rem"
                  >
                    Class Management
                  </Typography>

                  <Typography
                    sx={{
                      color: "#CBD5E1",
                      mt: .5,
                    }}
                  >
                    Organize subjects, classrooms and academic structure with ease.
                  </Typography>

                </Box>

              </FeatureCard>

              <FeatureCard>

                <Avatar
                  sx={{
                    bgcolor: "rgba(34,197,94,.15)",
                    color: "#22C55E",
                    width: 56,
                    height: 56,
                  }}
                >
                  <InsightsRounded />
                </Avatar>

                <Box>

                  <Typography
                    fontWeight={700}
                    fontSize="1.05rem"
                  >
                    Analytics
                  </Typography>

                  <Typography
                    sx={{
                      color: "#CBD5E1",
                      mt: .5,
                    }}
                  >
                    Track attendance, performance and school activities in real time.
                  </Typography>

                </Box>

              </FeatureCard>

              <FeatureCard>

                <Avatar
                  sx={{
                    bgcolor: "rgba(168,85,247,.15)",
                    color: "#A855F7",
                    width: 56,
                    height: 56,
                  }}
                >
                  <ShieldRounded />
                </Avatar>

                <Box>

                  <Typography
                    fontWeight={700}
                    fontSize="1.05rem"
                  >
                    Secure Administration
                  </Typography>

                  <Typography
                    sx={{
                      color: "#CBD5E1",
                      mt: .5,
                    }}
                  >
                    Protected access with centralized administration for your institution.
                  </Typography>

                </Box>

              </FeatureCard>

            </FeatureContainer>

           

          </RightContent>

        </RightPanel>

      </MainWrapper>

      <Popup
        message={message}
        showPopup={showPopup}
        setShowPopup={setShowPopup}
      />

    </>
  );

};

/* =======================================================

        Styled Components Start Here

======================================================= */
const MainWrapper = styled(Box)`
  display: flex;
  min-height: 100vh;
  background: #070b14;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const LeftPanel = styled(Box)`
  width: 42%;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
  border-right: 1px solid #1e293b;

  @media (max-width: 900px) {
    width: 100%;
    padding: 35px 22px;
  }
`;

const RightPanel = styled(Box)`
  width: 58%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  background: linear-gradient(
      rgba(7, 11, 20, 0.82),
      rgba(7, 11, 20, 0.82)
    ),
    url(${bgpic});

  background-size: cover;
  background-position: center;

  @media (max-width: 900px) {
    display: none;
  }
`;

const Overlay = styled(Box)`
  position: absolute;
  inset: 0;
  background: radial-gradient(
      circle at top right,
      rgba(37, 99, 235, 0.35),
      transparent 40%
    ),
    radial-gradient(
      circle at bottom left,
      rgba(251, 191, 36, 0.08),
      transparent 35%
    );
`;

const RightContent = styled(Box)`
  position: relative;
  z-index: 2;
  width: 82%;
  color: white;
`;

const FormContainer = styled(Box)`
  width: 100%;
  max-width: 470px;
`;

const Logo = styled(Box)`
  width: 82px;
  height: 82px;
  border-radius: 22px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);

  border: 3px solid #fbbf24;

  display: flex;
  align-items: center;
  justify-content: center;

  margin: auto;
  margin-bottom: 30px;

  box-shadow: 0 18px 45px rgba(37, 99, 235, 0.35);
`;

const Title = styled(Typography)`
  color: white;
  text-align: center !important;
  font-size: 2.2rem !important;
  font-weight: 700 !important;
`;

const SubTitle = styled(Typography)`
  color: #94a3b8;
  text-align: center;
  margin: 18px 0 38px !important;
  line-height: 1.8 !important;
`;

const FeatureContainer = styled(Stack)`
  margin-top: 50px;
  gap: 20px;
`;

const FeatureCard = styled(Box)`
  display: flex;
  gap: 18px;
  align-items: center;

  padding: 22px;

  border-radius: 18px;

  background: rgba(17, 24, 39, 0.72);

  backdrop-filter: blur(16px);

  border: 1px solid rgba(255, 255, 255, 0.08);

  transition: 0.35s;

  &:hover {
    transform: translateY(-5px);
    border-color: #2563eb;
    box-shadow: 0 15px 40px rgba(37, 99, 235, 0.2);
  }
`;

const ImageCard = styled(Box)`
  margin-top: 45px;

  border-radius: 24px;

  overflow: hidden;

  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);

  img {
    width: 100%;
    display: block;
    transition: 0.5s;
  }

  &:hover img {
    transform: scale(1.03);
  }
`;

const StyledTextField = styled(TextField)`
  margin-top: 14px !important;
  margin-bottom: 12px !important;

  .MuiOutlinedInput-root {
    background: #111827;
    border-radius: 15px;
    color: white;
    transition: 0.3s;
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
  }

  .MuiInputLabel-root {
    color: #94a3b8;
  }

  .MuiInputLabel-root.Mui-focused {
    color: #2563eb;
  }

  .MuiFormHelperText-root {
    margin-left: 3px;
  }

  .MuiIconButton-root {
    color: #94a3b8;
  }

  .MuiIconButton-root:hover {
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.08);
  }

  /* Chrome Autofill Fix */

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #111827 inset !important;
    -webkit-text-fill-color: #ffffff !important;
    caret-color: white;
    transition: background-color 9999s ease-in-out 0s;
  }
`;

const StyledLink = styled(Link)`
  color: #fbbf24;
  text-decoration: none;
  font-weight: 600;

  transition: 0.25s;

  &:hover {
    color: #ffd54f;
    text-decoration: underline;
  }
`;

export default AdminRegisterPage;