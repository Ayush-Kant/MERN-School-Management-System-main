import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  addStuff,
} from "../../../redux/userRelated/userHandle";

import {
  underControl,
} from "../../../redux/userRelated/userSlice";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Container,
  Stack,
  Avatar,
  Divider,
  Chip,
} from "@mui/material";

import CampaignIcon from "@mui/icons-material/Campaign";
import EventNoteIcon from "@mui/icons-material/EventNote";

import styled from "styled-components";

import Popup from "../../../components/Popup";

const AddNotice = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    status,
    response,
    error,
  } = useSelector((state) => state.user);

  const { currentUser } = useSelector(
    (state) => state.user
  );

  const adminID = currentUser._id;

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState("");

  const [loader, setLoader] = useState(false);

  const [showPopup, setShowPopup] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const fields = {
    title,
    details,
    date,
    adminID,
  };

  const address = "Notice";

  const submitHandler = (event) => {
    event.preventDefault();

    setLoader(true);

    dispatch(addStuff(fields, address));
  };

  useEffect(() => {
    if (status === "added") {
      navigate("/Admin/notices");
      dispatch(underControl());
    }

    else if (status === "error") {
      setMessage("Network Error");
      setShowPopup(true);
      setLoader(false);
    }
  }, [
    status,
    navigate,
    dispatch,
    error,
    response,
  ]);

  return (
    <>
      <PageWrapper maxWidth="lg">

        <HeroCard elevation={0}>

          <HeroLeft>

            <AvatarCircle>

              <CampaignIcon
                sx={{ fontSize: 42 }}
              />

            </AvatarCircle>

            <Box>

              <PageTitle>
                Add Notice
              </PageTitle>

              <PageSubtitle>

                Publish important
                announcements for
                students and teachers.

              </PageSubtitle>

              <Stack
                direction="row"
                spacing={1.5}
                mt={3}
              >

                <Chip
                  color="primary"
                  label="Notice Board"
                />

                <Chip
                color="primary"
                  label="Admin"
                />

              </Stack>

            </Box>

          </HeroLeft>

        </HeroCard>

        <FormCard elevation={0}>

          <SectionHeading>

            Notice Details

          </SectionHeading>

          <Divider
            sx={{
              borderColor: "#1E293B",
              mb: 4,
            }}
          />

          <form onSubmit={submitHandler}>

            <Stack spacing={4}>

              <StyledTextField
                fullWidth
                label="Notice Title"
                placeholder="Enter notice title"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                required
              />

              <StyledTextField
                fullWidth
                multiline
                rows={5}
                label="Notice Details"
                placeholder="Enter notice details"
                value={details}
                onChange={(e) =>
                  setDetails(e.target.value)
                }
                required
              />

              <StyledTextField
                fullWidth
                type="date"
                label="Notice Date"
                value={date}
                InputLabelProps={{
                  shrink: true,
                }}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                required
              />

              <ButtonRow>

                <CancelButton
                  variant="outlined"
                  onClick={() =>
                    navigate("/Admin/notices")
                  }
                >
                  Cancel
                </CancelButton>

                <SubmitButton
                  variant="contained"
                  type="submit"
                  disabled={loader}
                >
                  {loader ? (
                    <CircularProgress
                      size={22}
                      color="inherit"
                    />
                  ) : (
                    <>
                      <EventNoteIcon
                        sx={{
                          mr: 1,
                        }}
                      />
                      Publish Notice
                    </>
                  )}
                </SubmitButton>

              </ButtonRow>

            </Stack>

          </form>

        </FormCard>

      </PageWrapper>

      <Popup
        message={message}
        showPopup={showPopup}
        setShowPopup={setShowPopup}
      />
    </>
  );
};

export default AddNotice;

const PageWrapper = styled(Container)`
  padding-top: 40px;
  padding-bottom: 60px;
`;

const HeroCard = styled(Paper)`
  background: linear-gradient(135deg, #111827, #0f172a) !important;
  border: 1px solid #1e293b;
  border-radius: 28px !important;
  padding: 38px;
  margin-bottom: 30px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);

  &:before {
    content: "";
    position: absolute;
    width: 320px;
    height: 320px;
    right: -120px;
    top: -120px;
    border-radius: 50%;
    background: rgba(37, 99, 235, 0.12);
    filter: blur(35px);
  }
`;

const HeroLeft = styled(Box)`
  display: flex;
  align-items: center;
  gap: 28px;
  position: relative;
  z-index: 2;
`;

const AvatarCircle = styled(Avatar)`
  width: 95px !important;
  height: 95px !important;
  background: linear-gradient(
    135deg,
    #2563eb,
    #1d4ed8
  ) !important;

  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.45);
`;

const PageTitle = styled(Typography)`
  color: white;
  font-size: 2.2rem !important;
  font-weight: 800 !important;
`;

const PageSubtitle = styled(Typography)`
  color: #94a3b8;
  margin-top: 10px !important;
  line-height: 1.8;
`;

const FormCard = styled(Paper)`
  background: #111827 !important;
  border: 1px solid #1e293b;
  border-radius: 24px !important;
  padding: 35px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const SectionHeading = styled(Typography)`
  color: white;
  font-size: 1.35rem !important;
  font-weight: 700 !important;
`;

const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    background: #0f172a;
    border-radius: 14px;
    color: white;

    fieldset {
      border-color: #1e293b;
    }

    &:hover fieldset {
      border-color: #2563eb;
    }

    &.Mui-focused fieldset {
      border-color: #2563eb;
      border-width: 2px;
    }

    input,
    textarea {
      color: white;
    }
  }

  .MuiInputLabel-root {
    color: #94a3b8;
    background: #111827;
    padding: 0 8px;
  }

  .MuiInputLabel-root.Mui-focused {
    color: #2563eb;
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }

  margin-bottom: 6px;
`;

const ButtonRow = styled(Box)`
  display: flex;
  justify-content: flex-end;
  gap: 18px;
  margin-top: 12px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const CancelButton = styled(Button)`
  border: 1px solid #475569 !important;
  color: #cbd5e1 !important;
  padding: 12px 28px !important;
  border-radius: 12px !important;
  text-transform: none !important;
  font-weight: 600 !important;

  &:hover {
    border-color: #2563eb !important;
    color: white !important;
  }
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(
    135deg,
    #2563eb,
    #1d4ed8
  ) !important;

  color: white !important;

  padding: 12px 32px !important;

  border-radius: 12px !important;

  text-transform: none !important;

  font-weight: 700 !important;

  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.35);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 35px rgba(37, 99, 235, 0.45);
  }

  &:disabled {
    background: #334155 !important;
    color: white !important;
  }
`;