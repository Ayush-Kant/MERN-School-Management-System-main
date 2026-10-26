import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Container,
  Avatar,
  Chip,
  Stack,
  Divider,
} from "@mui/material";

import NoteAddIcon from "@mui/icons-material/NoteAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import CampaignIcon from "@mui/icons-material/Campaign";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

import styled from "styled-components";

import { getAllNotices } from "../../../redux/noticeRelated/noticeHandle";
import { deleteUser } from "../../../redux/userRelated/userHandle";

import TableTemplate from "../../../components/TableTemplate";
import SpeedDialTemplate from "../../../components/SpeedDialTemplate";
import { GreenButton } from "../../../components/buttonStyles";

const ShowNotices = () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    noticesList,
    loading,
    error,
    response,
  } = useSelector((state) => state.notice);

  const { currentUser } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    dispatch(
      getAllNotices(
        currentUser._id,
        "Notice"
      )
    );
  }, [currentUser._id, dispatch]);

  if (error) {
    console.log(error);
  }

  const deleteHandler = (
    deleteID,
    address
  ) => {
    dispatch(deleteUser(deleteID, address))
      .then(() => {
        dispatch(
          getAllNotices(
            currentUser._id,
            "Notice"
          )
        );
      });
  };

  const noticeColumns = [
    {
      id: "title",
      label: "Title",
      minWidth: 220,
    },
    {
      id: "details",
      label: "Details",
      minWidth: 280,
    },
    {
      id: "date",
      label: "Date",
      minWidth: 180,
    },
  ];

const noticeRows = Array.isArray(noticesList)
  ? noticesList.map((notice) => {
      const date = new Date(notice.date);

      const dateString =
        date.toString() !== "Invalid Date"
          ? date.toISOString().substring(0, 10)
          : "Invalid Date";

      return {
        title: notice.title,
        details: notice.details,
        date: dateString,
        id: notice._id,
      };
    })
  : [];
  const NoticeButtonHaver = ({
    row,
  }) => {
    return (
      <ButtonContainer>

        <IconButton
          onClick={() =>
            deleteHandler(
              row.id,
              "Notice"
            )
          }
        >
          <DeleteIcon color="error" />
        </IconButton>

      </ButtonContainer>
    );
  };
    const actions = [
    {
      icon: <NoteAddIcon color="primary" />,
      name: "Add New Notice",
      action: () => navigate("/Admin/addnotice"),
    },
    {
      icon: <DeleteIcon color="error" />,
      name: "Delete All Notices",
      action: () =>
        deleteHandler(currentUser._id, "Notices"),
    },
  ];

  return (
    <>
      {loading ? (
        <LoadingContainer>
          <CircularProgress
            size={55}
            sx={{
              color: "#2563EB",
            }}
          />
        </LoadingContainer>
      ) : (
        <PageWrapper maxWidth="xl">

          {/* ================= HERO ================= */}

          <HeroCard elevation={0}>

            <HeroLeft>

              <AvatarCircle>

                <CampaignIcon
                  sx={{ fontSize: 42 }}
                />

              </AvatarCircle>

              <Box>

                <PageTitle>

                  Notice Board

                </PageTitle>

                <PageSubtitle>

                  Publish announcements,
                  examination updates,
                  holidays and important
                  information for students
                  and teachers.

                </PageSubtitle>

                <Stack
                  direction="row"
                  spacing={1.5}
                  mt={3}
                  flexWrap="wrap"
                >

                  <Chip
                    color="primary"
                    label="Administration"
                  />

                  <Chip
                  color="primary"
                    label={`${noticesList.length} Notices`}
                  />

                </Stack>

              </Box>

            </HeroLeft>

            <HeroRight>

              <DashboardCard>

                <CampaignIcon />

                <DashboardValue>

                  {noticesList.length}

                </DashboardValue>

                <DashboardLabel>

                  Notices

                </DashboardLabel>

              </DashboardCard>

              <DashboardCard>

                <NotificationsActiveIcon />

                <DashboardValue>

                  Active

                </DashboardValue>

                <DashboardLabel>

                  Notice Board

                </DashboardLabel>

              </DashboardCard>

              <DashboardCard>

                <TrendingUpIcon />

                <DashboardValue>

                  100%

                </DashboardValue>

                <DashboardLabel>

                  Updated

                </DashboardLabel>

              </DashboardCard>

            </HeroRight>

          </HeroCard>

          {response ? (

            <EmptyCard>

              <CampaignIcon
                sx={{
                  fontSize: 90,
                  color: "#2563EB",
                  mb: 2,
                }}
              />

              <Typography
                variant="h4"
                fontWeight={700}
                color="white"
              >
                No Notices Found
              </Typography>

              <Typography
                sx={{
                  color: "#94A3B8",
                  mt: 2,
                  mb: 4,
                  maxWidth: 500,
                  textAlign: "center",
                }}
              >
                Create your first notice
                to communicate with
                students and faculty.

              </Typography>

              <GreenButton
                variant="contained"
                onClick={() =>
                  navigate("/Admin/addnotice")
                }
              >
                Add First Notice
              </GreenButton>

            </EmptyCard>

          ) : (

            <>
              <TableCard>

                <SectionHeading>

                  All Notices

                </SectionHeading>

                <Divider
                  sx={{
                    borderColor: "#1E293B",
                    mb: 3,
                  }}
                />

                <TableTemplate
                  buttonHaver={NoticeButtonHaver}
                  columns={noticeColumns}
                  rows={noticeRows}
                />

              </TableCard>

              <SpeedDialTemplate
                actions={actions}
              />

            </>

          )}

        </PageWrapper>
      )}
    </>
  );
};

export default ShowNotices;


const LoadingContainer = styled(Box)`
  min-height: calc(100vh - 70px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: #070b14;
`;

const PageWrapper = styled(Container)`
  padding-top: 40px;
  padding-bottom: 60px;
`;

const HeroCard = styled(Paper)`
  width: 100%;
  box-sizing: border-box;

  background: linear-gradient(
    135deg,
    #111827,
    #0f172a
  ) !important;

  border: 1px solid #1e293b;

  border-radius: 28px !important;

  padding: 38px;

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 24px;

  margin-bottom: 30px;

  overflow: hidden;

  position: relative;

  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);

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

  @media (max-width: 1100px) {
    flex-direction: column;

    align-items: flex-start;
  }
`;

const HeroLeft = styled(Box)`
  display: flex;

  align-items: center;

  gap: 28px;

  flex: 1;

  min-width: 0;

  z-index: 2;
`;

const HeroRight = styled(Box)`
  display: flex;

  flex-wrap: wrap;

  justify-content: flex-end;

  gap: 16px;

  flex: 1;

  z-index: 2;

  @media (max-width: 1100px) {
    width: 100%;

    justify-content: flex-start;
  }
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

  max-width: 560px;

  line-height: 1.8;
`;

const DashboardCard = styled(Box)`
  width: 145px;

  min-width: 145px;

  background: #111827;

  border: 1px solid #1e293b;

  border-radius: 22px;

  padding: 24px;

  text-align: center;

  transition: 0.3s;

  cursor: pointer;

  svg {
    color: #2563eb;

    font-size: 34px;

    margin-bottom: 14px;
  }

  &:hover {
    transform: translateY(-8px);

    border-color: #2563eb;

    box-shadow: 0 20px 45px rgba(37, 99, 235, 0.22);
  }
`;

const DashboardValue = styled(Typography)`
  color: white;

  font-size: 1.8rem !important;

  font-weight: 800 !important;
`;

const DashboardLabel = styled(Typography)`
  color: #94a3b8;

  margin-top: 8px !important;
`;

const TableCard = styled(Paper)`
  background: #111827 !important;

  border-radius: 24px !important;

  border: 1px solid #1e293b;

  padding: 28px;

  overflow: hidden;

  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.3);
`;

const SectionHeading = styled(Typography)`
  color: white;

  font-size: 1.3rem !important;

  font-weight: 700 !important;

  margin-bottom: 18px !important;
`;

const EmptyCard = styled(Paper)`
  background: #111827 !important;

  border: 1px solid #1e293b;

  border-radius: 28px !important;

  min-height: 520px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  text-align: center;

  padding: 50px;

  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const ButtonContainer = styled(Box)`
  display: flex;

  justify-content: center;

  align-items: center;

  gap: 10px;
`;