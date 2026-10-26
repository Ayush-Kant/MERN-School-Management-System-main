import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Box,
  Checkbox,
  Typography,
  CircularProgress,
  Container,
  Avatar,
  Chip,
  Stack,
  Divider,
} from '@mui/material';

import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import FeedbackIcon from '@mui/icons-material/Feedback';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

import styled from 'styled-components';

import { getAllComplains } from '../../../redux/complainRelated/complainHandle';
import TableTemplate from '../../../components/TableTemplate';

const SeeComplains = () => {

  const label = {
    inputProps: {
      'aria-label': 'Checkbox demo',
    },
  };

  const dispatch = useDispatch();

  const {
    complainsList,
    loading,
    error,
    response,
  } = useSelector((state) => state.complain);

  const { currentUser } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    dispatch(
      getAllComplains(
        currentUser._id,
        "Complain"
      )
    );
  }, [currentUser._id, dispatch]);

  if (error) {
    console.log(error);
  }

  const complainColumns = [
    {
      id: 'user',
      label: 'User',
      minWidth: 170,
    },
    {
      id: 'complaint',
      label: 'Complaint',
      minWidth: 100,
    },
    {
      id: 'date',
      label: 'Date',
      minWidth: 170,
    },
  ];

  // Always returns an array
  const complainRows = (complainsList || []).map((complain) => {

    const date = new Date(complain.date);

    const dateString =
      date.toString() !== "Invalid Date"
        ? date.toISOString().substring(0, 10)
        : "Invalid Date";

    return {
      user: complain.user.name,
      complaint: complain.complaint,
      date: dateString,
      id: complain._id,
    };

  });

  const ComplainButtonHaver = ({ row }) => {
    return (
      <>
        <Checkbox {...label} />
      </>
    );
  };

  // PART 2 STARTS FROM return(...)

  return (
  <>
    {loading ? (
      <LoadingContainer>
        <CircularProgress
          size={55}
          sx={{ color: "#2563EB" }}
        />
      </LoadingContainer>
    ) : (
      <PageWrapper maxWidth="xl">

        {/* Hero Section */}

        <HeroCard elevation={0}>

          <HeroLeft>

            <AvatarCircle>

              <FeedbackIcon sx={{ fontSize: 42 }} />

            </AvatarCircle>

            <Box>

              <PageTitle>
                Student Complaints
              </PageTitle>

              <PageSubtitle>
                Review, manage and track complaints submitted by students in one place.
              </PageSubtitle>

              <Stack
                direction="row"
                spacing={1.5}
                mt={3}
                flexWrap="wrap"
              >

                <Chip
                  color="primary"
                  label="Complaint Management"
                />

                <Chip
                color="primary"
                  label={`${complainsList?.length || 0} Complaints`}
                />

              </Stack>

            </Box>

          </HeroLeft>

          <HeroRight>

            <DashboardCard>

              <ReportProblemIcon />

              <DashboardValue>
                {complainsList?.length || 0}
              </DashboardValue>

              <DashboardLabel>
                Total
              </DashboardLabel>

            </DashboardCard>

            <DashboardCard>

              <AssignmentTurnedInIcon />

              <DashboardValue>
                Pending
              </DashboardValue>

              <DashboardLabel>
                Review
              </DashboardLabel>

            </DashboardCard>

          </HeroRight>

        </HeroCard>

        {response ? (

          <EmptyCard>

            <ReportProblemIcon
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
              No Complaints
            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: "#94A3B8",
                textAlign: "center",
                maxWidth: 500,
              }}
            >
              There are currently no complaints submitted by students.
            </Typography>

          </EmptyCard>

        ) : (

          <TableCard>

            <SectionHeading>
              Student Complaints
            </SectionHeading>

            <Divider
              sx={{
                borderColor: "#1E293B",
                mb: 3,
              }}
            />

            {Array.isArray(complainsList) &&
              complainsList.length > 0 && (

                <TableTemplate
                  buttonHaver={ComplainButtonHaver}
                  columns={complainColumns}
                  rows={complainRows}
                />

              )}

          </TableCard>

        )}

      </PageWrapper>
    )}
  </>
);
} 
export default SeeComplains;

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
  background: linear-gradient(135deg, #111827, #0f172a) !important;
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
  box-shadow: 0 25px 60px rgba(0,0,0,.35);

  @media (max-width:1100px){
    flex-direction:column;
    align-items:flex-start;
  }
`;

const HeroLeft = styled(Box)`
  display:flex;
  gap:28px;
  align-items:center;
  flex:1;
`;

const HeroRight = styled(Box)`
  display:flex;
  gap:16px;
  flex-wrap:wrap;
`;

const AvatarCircle = styled(Avatar)`
  width:95px!important;
  height:95px!important;
  background:linear-gradient(135deg,#2563EB,#1D4ED8)!important;
`;

const PageTitle = styled(Typography)`
  color:white;
  font-size:2.1rem!important;
  font-weight:800!important;
`;

const PageSubtitle = styled(Typography)`
  color:#94A3B8;
  margin-top:10px!important;
  line-height:1.8;
`;

const DashboardCard = styled(Box)`
  width:150px;
  background:#111827;
  border:1px solid #1E293B;
  border-radius:22px;
  padding:24px;
  text-align:center;
  transition:.3s;

  svg{
    color:#2563EB;
    font-size:34px;
    margin-bottom:12px;
  }

  &:hover{
    transform:translateY(-6px);
    border-color:#2563EB;
  }
`;

const DashboardValue = styled(Typography)`
  color:white;
  font-size:1.8rem!important;
  font-weight:800!important;
`;

const DashboardLabel = styled(Typography)`
  color:#94A3B8;
`;

const TableCard = styled(Paper)`
  background:#111827!important;
  border:1px solid #1E293B;
  border-radius:24px!important;
  padding:28px;
`;

const SectionHeading = styled(Typography)`
  color:white;
  font-size:1.3rem!important;
  font-weight:700!important;
`;

const EmptyCard = styled(Paper)`
  background:#111827!important;
  border:1px solid #1E293B;
  border-radius:28px!important;
  min-height:500px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  text-align:center;
  padding:40px;
`;
