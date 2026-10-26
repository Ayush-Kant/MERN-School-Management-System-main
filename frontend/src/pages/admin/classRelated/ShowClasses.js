import { useEffect, useState } from "react";
import {
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
  Typography,
  CircularProgress,
  Paper,
  Avatar,
  Stack,
  Divider,
  Chip,
  Container,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import PostAddIcon from "@mui/icons-material/PostAdd";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import AddCardIcon from "@mui/icons-material/AddCard";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { deleteUser } from "../../../redux/userRelated/userHandle";
import { getAllSclasses } from "../../../redux/sclassRelated/sclassHandle";

import {
  BlueButton,
  GreenButton,
} from "../../../components/buttonStyles";

import TableTemplate from "../../../components/TableTemplate";
import SpeedDialTemplate from "../../../components/SpeedDialTemplate";
import Popup from "../../../components/Popup";

import styled from "styled-components";

const ShowClasses = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    sclassesList,
    loading,
    error,
    getresponse,
  } = useSelector((state) => state.sclass);

  const { currentUser } = useSelector(
    (state) => state.user
  );

  const adminID = currentUser._id;

  useEffect(() => {
    dispatch(getAllSclasses(adminID, "Sclass"));
  }, [dispatch, adminID]);

  if (error) {
    console.log(error);
  }

  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");

  const deleteHandler = (deleteID, address) => {
    console.log(deleteID);
    console.log(address);

    setMessage(
      "Sorry the delete function has been disabled for now."
    );

    setShowPopup(true);

    // dispatch(deleteUser(deleteID, address))
    // .then(() => {
    //   dispatch(getAllSclasses(adminID,"Sclass"))
    // })
  };

  const sclassColumns = [
    {
      id: "name",
      label: "Class Name",
      minWidth: 220,
    },
  ];

  const sclassRows =
    sclassesList &&
    sclassesList.length > 0 &&
    sclassesList.map((sclass) => ({
      name: sclass.sclassName,
      id: sclass._id,
    }));

  const SclassButtonHaver = ({ row }) => {
    const actions = [
      {
        icon: <PostAddIcon />,
        name: "Add Subjects",
        action: () =>
          navigate(
            "/Admin/addsubject/" + row.id
          ),
      },
      {
        icon: <PersonAddAlt1Icon />,
        name: "Add Student",
        action: () =>
          navigate(
            "/Admin/class/addstudents/" + row.id
          ),
      },
    ];

    return (
      <ButtonContainer>
        <IconButton
          onClick={() =>
            deleteHandler(row.id, "Sclass")
          }
        >
          <DeleteIcon color="error" />
        </IconButton>

        <BlueButton
          variant="contained"
          onClick={() =>
            navigate(
              "/Admin/classes/class/" +
                row.id
            )
          }
        >
          View
        </BlueButton>

        <ActionMenu actions={actions} />
      </ButtonContainer>
    );
  };

  const ActionMenu = ({ actions }) => {
    const [anchorEl, setAnchorEl] =
      useState(null);

    const open = Boolean(anchorEl);

    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    return (
      <>
        <Tooltip title="Quick Actions">
          <IconButton
            onClick={handleClick}
            sx={{
              ml: 1,
              width: 42,
              height: 42,
              bgcolor: "#111827",
              border: "1px solid #1E293B",
              color: "#CBD5E1",
              transition: ".25s",

              "&:hover": {
                bgcolor: "#2563EB",
                color: "#fff",
                borderColor: "#2563EB",
              },
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            sx: {
              background: "#111827",
              border:
                "1px solid #1E293B",
              borderRadius: "16px",
              color: "#fff",
              minWidth: 220,

              "& .MuiMenuItem-root": {
                py: 1.4,
                borderRadius: "10px",
                mx: 1,
                my: 0.5,

                "&:hover": {
                  background:
                    "rgba(37,99,235,.18)",
                },
              },

              "& .MuiListItemIcon-root": {
                color: "#2563EB",
              },
            },
          }}
        >
          {actions.map((action, index) => (
            <MenuItem
              key={index}
              onClick={action.action}
            >
              <ListItemIcon>
                {action.icon}
              </ListItemIcon>

              {action.name}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  };

    const actions = [
    {
      icon: <AddCardIcon color="primary" />,
      name: "Add New Class",
      action: () => navigate("/Admin/addclass"),
    },
    {
      icon: <DeleteIcon color="error" />,
      name: "Delete All Classes",
      action: () => deleteHandler(adminID, "Sclasses"),
    },
  ];

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

          {/* ================= HERO ================= */}

          <HeroCard elevation={0}>

            <HeroLeft>

              <AvatarCircle>
                <SchoolIcon sx={{ fontSize: 42 }} />
              </AvatarCircle>

              <Box>

                <PageTitle>
                  Classes Dashboard
                </PageTitle>

                <PageSubtitle>
                  Manage academic classes, students and
                  subjects from one place with a clean,
                  modern interface.
                </PageSubtitle>

                <Stack
                  direction="row"
                  spacing={1.5}
                  mt={3}
                  flexWrap="wrap"
                >
                  <Chip
                    color="primary"
                    label="School Classes"
                  />

                  <Chip
                  color="primary"
                    label={`${sclassesList.length} Total Classes`}
                  />
                </Stack>

              </Box>

            </HeroLeft>

            <HeroRight>

              <DashboardCard>

                <SchoolIcon />

                <DashboardValue>
                  {sclassesList.length}
                </DashboardValue>

                <DashboardLabel>
                  Classes
                </DashboardLabel>

              </DashboardCard>

              <DashboardCard>

                <MenuBookIcon />

                <DashboardValue>
                  Active
                </DashboardValue>

                <DashboardLabel>
                  Academic
                </DashboardLabel>

              </DashboardCard>

              <DashboardCard>

                <TrendingUpIcon />

                <DashboardValue>
                  100%
                </DashboardValue>

                <DashboardLabel>
                  Ready
                </DashboardLabel>

              </DashboardCard>

            </HeroRight>

          </HeroCard>

          {/* ============== EMPTY STATE ============== */}

          {getresponse ? (

            <EmptyCard>

              <SchoolIcon
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
                No Classes Found
              </Typography>

              <Typography
                sx={{
                  color: "#94A3B8",
                  mt: 2,
                  mb: 4,
                  maxWidth: 520,
                }}
              >
                Create your first academic class to
                begin managing students, subjects,
                attendance and teachers.
              </Typography>

              <GreenButton
                variant="contained"
                onClick={() =>
                  navigate("/Admin/addclass")
                }
              >
                Create First Class
              </GreenButton>

            </EmptyCard>

          ) : (

            <>
              <TableCard>

                <SectionHeading>
                  All Classes
                </SectionHeading>

                <Divider
                  sx={{
                    borderColor: "#1E293B",
                    mb: 3,
                  }}
                />

                <TableTemplate
                  buttonHaver={SclassButtonHaver}
                  columns={sclassColumns}
                  rows={sclassRows}
                />

              </TableCard>

              <SpeedDialTemplate actions={actions} />

            </>
          )}

        </PageWrapper>
      )}

      <Popup
        message={message}
        showPopup={showPopup}
        setShowPopup={setShowPopup}
      />
    </>
  );
};

export default ShowClasses;

const LoadingContainer = styled(Box)`
  min-height: calc(100vh - 70px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: #070B14;
`;

const PageWrapper = styled(Container)`
  padding-top: 40px;
  padding-bottom: 60px;
`;

const HeroCard = styled(Paper)`
  background: linear-gradient(
    135deg,
    #111827,
    #0f172a
  ) !important;

  width:100%;
box-sizing:border-box;
  border: 1px solid #1e293b;

  border-radius: 28px !important;

  padding: 38px;

  display: flex;
  

  justify-content: space-between;

  align-items: center;

  gap:24px;

  margin-bottom: 32px;

  position: relative;

  overflow: hidden;

  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);

  &:before {
    content: "";

    position: absolute;

    width: 320px;

    height: 320px;

    right: -120px;

    top: -120px;

    border-radius: 50%;

    background: rgba(37, 99, 235, 0.12);

    filter: blur(30px);
  }

  @media (max-width: 900px) {
    flex-direction: column;

    align-items: flex-start;
  }
`;

const HeroLeft = styled(Box)`
display:flex;
align-items:center;
gap:28px;
flex:1;
min-width:0;
`;

const HeroRight = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 16px;
  z-index: 2;
  flex: 1;

  @media (max-width: 1100px) {
    justify-content: flex-start;
    width: 100%;
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

  letter-spacing: -0.8px;
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

  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
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
`;

const ButtonContainer = styled.div`
  display: flex;

  justify-content: center;

  align-items: center;

  gap: 12px;

  flex-wrap: wrap;
`;