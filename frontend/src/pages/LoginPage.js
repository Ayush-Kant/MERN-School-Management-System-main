import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
    Avatar,
    Backdrop,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    CssBaseline,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography,
    Chip,
} from "@mui/material";

import {
    Visibility,
    VisibilityOff,
    SchoolRounded,
} from "@mui/icons-material";

import {
    createTheme,
    ThemeProvider,
} from "@mui/material/styles";

import styled from "styled-components";

import bgpic from "../assets/designlogin.jpg";

import { LightPurpleButton } from "../components/buttonStyles";
import Popup from "../components/Popup";

import { loginUser } from "../redux/userRelated/userHandle";

const defaultTheme = createTheme();

const LoginPage = ({ role }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        status,
        currentUser,
        response,
        error,
        currentRole,
    } = useSelector(
        (state) => state.user
    );

    const [toggle, setToggle] = useState(false);
    const [guestLoader, setGuestLoader] = useState(false);
    const [loader, setLoader] = useState(false);

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [rollNumberError, setRollNumberError] = useState(false);
    const [studentNameError, setStudentNameError] = useState(false);

    const handleSubmit = (event) => {

        event.preventDefault();

        if (role === "Student") {

            const rollNum = event.target.rollNumber.value;
            const studentName = event.target.studentName.value;
            const password = event.target.password.value;

            if (!rollNum || !studentName || !password) {

                if (!rollNum)
                    setRollNumberError(true);

                if (!studentName)
                    setStudentNameError(true);

                if (!password)
                    setPasswordError(true);

                return;
            }

            const fields = {
                rollNum,
                studentName,
                password,
            };

            setLoader(true);

            dispatch(
                loginUser(
                    fields,
                    role
                )
            );
        }

        else {

            const email =
                event.target.email.value;

            const password =
                event.target.password.value;

            if (!email || !password) {

                if (!email)
                    setEmailError(true);

                if (!password)
                    setPasswordError(true);

                return;
            }

            const fields = {
                email,
                password,
            };

            setLoader(true);

            dispatch(
                loginUser(
                    fields,
                    role
                )
            );
        }
    };

    const handleInputChange = (event) => {

        const { name } = event.target;

        if (name === "email")
            setEmailError(false);

        if (name === "password")
            setPasswordError(false);

        if (name === "rollNumber")
            setRollNumberError(false);

        if (name === "studentName")
            setStudentNameError(false);
    };

    const guestModeHandler = () => {

        const password = "zxc";

        if (role === "Admin") {

            dispatch(
                loginUser(
                    {
                        email: "yogendra@12",
                        password,
                    },
                    role
                )
            );

            setGuestLoader(true);
        }

        else if (role === "Student") {

            dispatch(
                loginUser(
                    {
                        rollNum: "1",
                        studentName: "Dipesh Awasthi",
                        password,
                    },
                    role
                )
            );

            setGuestLoader(true);
        }

        else if (role === "Teacher") {

            dispatch(
                loginUser(
                    {
                        email: "tony@12",
                        password,
                    },
                    role
                )
            );

            setGuestLoader(true);
        }
    };

    useEffect(() => {

        if (
            status === "success" ||
            currentUser !== null
        ) {

            if (currentRole === "Admin") {

                navigate(
                    "/Admin/dashboard"
                );

            }

            else if (
                currentRole === "Student"
            ) {

                navigate(
                    "/Student/dashboard"
                );

            }

            else if (
                currentRole === "Teacher"
            ) {

                navigate(
                    "/Teacher/dashboard"
                );

            }

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

            setGuestLoader(false);

        }

    }, [
        status,
        currentRole,
        navigate,
        error,
        response,
        currentUser,
    ]);

    // Part 1B starts from return(...)

    return (
    <ThemeProvider theme={defaultTheme}>
        <PageContainer container component="main">

            <CssBaseline />

            <LeftPanel
                item
                xs={12}
                md={5}
            >

                <LoginCard>

                    <Avatar
                        sx={{
                            bgcolor: "#2563EB",
                            width: 72,
                            height: 72,
                            mb: 3,
                            boxShadow:
                                "0 18px 35px rgba(37,99,235,.35)",
                        }}
                    >
                        <SchoolRounded sx={{ fontSize: 36 }} />
                    </Avatar>

                    <Chip
                        label={role}
                        sx={{
                            mb: 2,
                            bgcolor: "rgba(37,99,235,.12)",
                            color: "#60A5FA",
                            border:
                                "1px solid rgba(37,99,235,.35)",
                            fontWeight: 600,
                        }}
                    />

                    <Typography
                        variant="h3"
                        sx={{
                            color: "#fff",
                            fontWeight: 800,
                            mb: 1,
                        }}
                    >
                        {role} Login
                    </Typography>

                    <Typography
                        sx={{
                            color: "#94A3B8",
                            mb: 4,
                        }}
                    >
                        Welcome back! Sign in to continue.
                    </Typography>

                    <Box
                        component="form"
                        noValidate
                        onSubmit={handleSubmit}
                        sx={{
                            width: "100%",
                        }}
                    >

                        {role === "Student" ? (

                            <>

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="rollNumber"
                                    label="Roll Number"
                                    name="rollNumber"
                                    type="number"
                                    autoComplete="off"
                                    autoFocus
                                    error={rollNumberError}
                                    helperText={
                                        rollNumberError &&
                                        "Roll Number is required"
                                    }
                                    onChange={handleInputChange}
                                    sx={textFieldStyle}
                                />

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="studentName"
                                    label="Student Name"
                                    name="studentName"
                                    autoComplete="off"
                                    error={studentNameError}
                                    helperText={
                                        studentNameError &&
                                        "Name is required"
                                    }
                                    onChange={handleInputChange}
                                    sx={textFieldStyle}
                                />

                            </>

                        ) : (

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                error={emailError}
                                helperText={
                                    emailError &&
                                    "Email is required"
                                }
                                onChange={handleInputChange}
                                sx={textFieldStyle}
                            />

                        )}

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="password"
                            name="password"
                            label="Password"
                            autoComplete="current-password"
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
                            sx={textFieldStyle}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setToggle(!toggle)
                                            }
                                            sx={{
                                                color: "#94A3B8",
                                            }}
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

                        <Grid
                            container
                            sx={{
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                mt: 1,
                            }}
                        >

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        sx={{
                                            color:
                                                "#475569",
                                            "&.Mui-checked":
                                            {
                                                color:
                                                    "#2563EB",
                                            },
                                        }}
                                    />
                                }
                                label="Remember me"
                                sx={{
                                    color:
                                        "#CBD5E1",
                                }}
                            />

                            <StyledLink to="#">
                                Forgot Password?
                            </StyledLink>

                        </Grid>

                                                <LightPurpleButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 4,
                                py: 1.7,
                                borderRadius: "16px",
                                fontWeight: 700,
                                fontSize: "1rem",
                                background:
                                    "linear-gradient(135deg,#2563EB,#1D4ED8)",
                                boxShadow:
                                    "0 18px 35px rgba(37,99,235,.35)",
                                transition: ".3s",

                                "&:hover": {
                                    background:
                                        "linear-gradient(135deg,#1D4ED8,#1E40AF)",
                                    transform: "translateY(-2px)",
                                    boxShadow:
                                        "0 25px 45px rgba(37,99,235,.45)",
                                },
                            }}
                        >
                            {loader ? (
                                <CircularProgress
                                    size={24}
                                    color="inherit"
                                />
                            ) : (
                                "Login"
                            )}
                        </LightPurpleButton>

                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={guestModeHandler}
                            sx={{
                                mt: 2,
                                py: 1.6,
                                borderRadius: "16px",
                                border: "1px solid #1E293B",
                                background: "#0F172A",
                                color: "#fff",
                                textTransform: "none",
                                fontWeight: 600,

                                "&:hover": {
                                    background: "#111827",
                                    borderColor: "#2563EB",
                                },
                            }}
                        >
                            Login as Guest
                        </Button>

                        {role === "Admin" && (

                            <Grid
                                container
                                justifyContent="center"
                                sx={{
                                    mt: 4,
                                    color: "#CBD5E1",
                                }}
                            >
                                <Typography>

                                    Don't have an account?

                                </Typography>

                                <StyledLink
                                    to="/Adminregister"
                                    style={{
                                        marginLeft: 8,
                                    }}
                                >
                                    Sign Up
                                </StyledLink>

                            </Grid>

                        )}

                    </Box>

                </LoginCard>

            </LeftPanel>

            <RightPanel
                item
                md={7}
                sx={{
                    backgroundImage: `url(${bgpic})`,
                }}
            >

                <Overlay>

                    <HeroContent>

                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 800,
                                color: "#fff",
                                mb: 3,
                            }}
                        >
                            School Management
                            <br />
                            System
                        </Typography>

                        <Typography
                            sx={{
                                color: "#CBD5E1",
                                fontSize: "1.15rem",
                                lineHeight: 1.9,
                                maxWidth: 520,
                                mb: 5,
                            }}
                        >
                            Manage students, teachers,
                            attendance, examinations,
                            assignments and academic
                            records from one premium
                            dashboard.
                        </Typography>

                        <Feature>

                            ✓ Student Management

                        </Feature>

                        <Feature>

                            ✓ Attendance Tracking

                        </Feature>

                        <Feature>

                            ✓ Examination & Results

                        </Feature>

                        <Feature>

                            ✓ Teacher Dashboard

                        </Feature>

                    </HeroContent>

                </Overlay>

            </RightPanel>

        </PageContainer>

        <Backdrop
            open={guestLoader}
            sx={{
                color: "#fff",
                backdropFilter: "blur(8px)",
                zIndex: (theme) =>
                    theme.zIndex.drawer + 1,
                flexDirection: "column",
                gap: 2,
            }}
        >
            <CircularProgress
                color="primary"
            />

            <Typography>

                Logging you in as Guest...

            </Typography>

        </Backdrop>

        <Popup
            message={message}
            showPopup={showPopup}
            setShowPopup={setShowPopup}
        />

    </ThemeProvider>
);
}
export default LoginPage

const textFieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "16px",
    backgroundColor: "#0F172A",
    color: "#fff",

    "& fieldset": {
      borderColor: "#1E293B",
    },

    "&:hover fieldset": {
      borderColor: "#2563EB",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#2563EB",
      borderWidth: "2px",
    },

    "& input": {
      color: "#fff",
      backgroundColor: "transparent",
    },

    // Fix Chrome autofill white background
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #0F172A inset",
      WebkitTextFillColor: "#fff",
      borderRadius: "16px",
      transition: "background-color 9999s ease-in-out 0s",
    },
  },

  "& .MuiInputLabel-root": {
    color: "#94A3B8",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#60A5FA",
  },

  "& .MuiFormHelperText-root": {
    color: "#EF4444",
  },
};
const PageContainer = styled(Grid)`
    min-height: 100vh;
    background: #070b14;
`;

const LeftPanel = styled(Grid)`
    display: flex !important;
    justify-content: center;
    align-items: center;
    padding: 48px;
    background: #070b14;

    @media (max-width: 900px) {
        padding: 24px;
    }
`;

const LoginCard = styled(Box)`
    width: 100%;
    max-width: 480px;

    background: #111827;

    border: 1px solid #1e293b;

    border-radius: 28px;

    padding: 45px;

    box-shadow: 0 25px 60px rgba(0, 0, 0, .35);

    position: relative;

    overflow: hidden;

    &::before {
        content: "";
        position: absolute;

        width: 240px;
        height: 240px;

        border-radius: 50%;

        background: rgba(37, 99, 235, .08);

        top: -120px;
        right: -120px;
    }

    @media (max-width: 600px) {
        padding: 28px 22px;
    }
`;

const RightPanel = styled(Grid)`
    position: relative;

    display: flex !important;

    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    @media (max-width: 900px) {
        display: none !important;
    }
`;

const Overlay = styled(Box)`
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;

    padding: 80px;

    background: linear-gradient(
        135deg,
        rgba(7,11,20,.82),
        rgba(7,11,20,.55)
    );
`;

const HeroContent = styled(Box)`
    max-width: 560px;
`;

const Feature = styled(Box)`
    display: flex;
    align-items: center;

    gap: 14px;

    color: white;

    font-size: 1.05rem;

    margin-bottom: 22px;

    font-weight: 600;

    &::before{
        content:"";

        width:10px;
        height:10px;

        border-radius:50%;

        background:#2563EB;

        box-shadow:0 0 14px rgba(37,99,235,.8);
    }
`;

const StyledLink = styled(Link)`
    color: #60A5FA;

    text-decoration: none;

    font-weight: 600;

    transition: .25s;

    &:hover {
        color: white;
    }
`;