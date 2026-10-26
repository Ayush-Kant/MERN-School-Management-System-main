import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import styled from "styled-components";

import {
  Box,
  Paper,
  Button,
  Container,
  Avatar,
  Typography,
  Divider,
  Chip,
  Stack,
  CircularProgress,
  IconButton,
  Collapse,
  Table,
  TableHead,
  TableBody,
  Tab,
  BottomNavigation,
  BottomNavigationAction,
} from "@mui/material";

import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import {
  KeyboardArrowUp,
  KeyboardArrowDown,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import ClassIcon from "@mui/icons-material/Class";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import InsertChartIcon from "@mui/icons-material/InsertChart";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import TableChartIcon from "@mui/icons-material/TableChart";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

import {
  deleteUser,
  getUserDetails,
  updateUser,
} from "../../../redux/userRelated/userHandle";

import {
  getSubjectList,
} from "../../../redux/sclassRelated/sclassHandle";

import {
  removeStuff,
  updateStudentFields,
} from "../../../redux/studentRelated/studentHandle";

import {
  calculateOverallAttendancePercentage,
  calculateSubjectAttendancePercentage,
  groupAttendanceBySubject,
} from "../../../components/attendanceCalculator";

import {
  StyledTableCell,
  StyledTableRow,
} from "../../../components/styles";

import CustomBarChart from "../../../components/CustomBarChart";
import CustomPieChart from "../../../components/CustomPieChart";
import Popup from "../../../components/Popup";

const ViewStudent = () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();

  const studentID = params.id;
  const address = "Student";

  const { userDetails, response, loading, error } =
    useSelector((state) => state.user);

  const [showTab, setShowTab] = useState(false);

  const [value, setValue] = useState("1");

  const [selectedSection, setSelectedSection] =
    useState("table");

  const [showPopup, setShowPopup] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [name, setName] =
    useState("");

  const [rollNum, setRollNum] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [sclassName, setSclassName] =
    useState("");

  const [studentSchool, setStudentSchool] =
    useState("");

  const [subjectMarks, setSubjectMarks] =
    useState([]);

  const [
    subjectAttendance,
    setSubjectAttendance,
  ] = useState([]);

  const [openStates, setOpenStates] =
    useState({});

  useEffect(() => {

    dispatch(
      getUserDetails(
        studentID,
        address
      )
    );

  }, [dispatch, studentID]);

  useEffect(() => {

    if (
      userDetails &&
      userDetails.sclassName &&
      userDetails.sclassName._id
    ) {

      dispatch(
        getSubjectList(
          userDetails.sclassName._id,
          "ClassSubjects"
        )
      );

    }

  }, [dispatch, userDetails]);

  useEffect(() => {

    if (!userDetails) return;

    setName(userDetails.name || "");

    setRollNum(
      userDetails.rollNum || ""
    );

    setSclassName(
      userDetails.sclassName || ""
    );

    setStudentSchool(
      userDetails.school || ""
    );

    setSubjectMarks(
      userDetails.examResult || []
    );

    setSubjectAttendance(
      userDetails.attendance || []
    );

  }, [userDetails]);

  if (response) console.log(response);

  if (error) console.log(error);

  const handleChange = (
    event,
    newValue
  ) => {

    setValue(newValue);

  };

  const handleSectionChange = (
    event,
    newValue
  ) => {

    setSelectedSection(newValue);

  };

  const handleOpen = (subId) => {

    setOpenStates((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));

  };

  const fields =
    password === ""
      ? {
          name,
          rollNum,
        }
      : {
          name,
          rollNum,
          password,
        };

  const submitHandler = (event) => {

    event.preventDefault();

    dispatch(
      updateUser(
        fields,
        studentID,
        address
      )
    )
      .then(() => {

        dispatch(
          getUserDetails(
            studentID,
            address
          )
        );

      })
      .catch(console.error);

  };

  const deleteHandler = () => {

    setMessage(
      "Sorry the delete function has been disabled for now."
    );

    setShowPopup(true);

    /*
    dispatch(deleteUser(studentID,address))
      .then(()=>{
        navigate(-1)
      })
    */

  };

  const removeHandler = (
    id,
    deladdress
  ) => {

    dispatch(
      removeStuff(
        id,
        deladdress
      )
    ).then(() => {

      dispatch(
        getUserDetails(
          studentID,
          address
        )
      );

    });

  };

  const removeSubAttendance = (
    subId
  ) => {

    dispatch(
      updateStudentFields(
        studentID,
        { subId },
        "RemoveStudentSubAtten"
      )
    ).then(() => {

      dispatch(
        getUserDetails(
          studentID,
          address
        )
      );

    });

  };

  const overallAttendancePercentage =
    calculateOverallAttendancePercentage(
      subjectAttendance
    );

  const overallAbsentPercentage =
    100 -
    overallAttendancePercentage;

  const chartData = [
    {
      name: "Present",
      value:
        overallAttendancePercentage,
    },
    {
      name: "Absent",
      value:
        overallAbsentPercentage,
    },
  ];

  const subjectData =
    Object.entries(
      groupAttendanceBySubject(
        subjectAttendance
      )
    ).map(
      ([
        subName,
        {
          present,
          sessions,
        },
      ]) => {

        const percentage =
          calculateSubjectAttendancePercentage(
            present,
            sessions
          );

        return {

          subject: subName,

          attendancePercentage:
            percentage,

          totalClasses:
            sessions,

          attendedClasses:
            present,

        };

      }
    );
    const StudentDetailsSection = () => {

  return (

    <>

      {/* ================= HERO ================= */}

      <HeroCard elevation={0}>

        <HeroLeft>

          <AvatarCircle>

            <PersonIcon
              sx={{
                fontSize: 48,
              }}
            />

          </AvatarCircle>

          <Box>

            <PageTitle>

              {userDetails?.name}

            </PageTitle>

            <PageSubtitle>

              Student Profile & Academic Overview

            </PageSubtitle>

            <Stack
              direction="row"
              spacing={1.5}
              mt={3}
              flexWrap="wrap"
              useFlexGap
            >

              <Chip
                color="primary"
                label={`Roll No : ${userDetails?.rollNum}`}
              />

              <Chip
               color="primary"
                label={
                  sclassName?.sclassName ||
                  "No Class Assigned"
                }
              />

            </Stack>

          </Box>

        </HeroLeft>

        <HeroRight>

          <DashboardCard>

            <SchoolIcon />

            <DashboardValue>

              {subjectMarks?.length || 0}

            </DashboardValue>

            <DashboardLabel>

              Subjects

            </DashboardLabel>

          </DashboardCard>

          <DashboardCard>

            <FactCheckIcon />

            <DashboardValue>

              {overallAttendancePercentage.toFixed(0)}%

            </DashboardValue>

            <DashboardLabel>

              Attendance

            </DashboardLabel>

          </DashboardCard>

          <DashboardCard>

            <TrendingUpIcon />

            <DashboardValue>

              {subjectAttendance?.length || 0}

            </DashboardValue>

            <DashboardLabel>

              Records

            </DashboardLabel>

          </DashboardCard>

        </HeroRight>

      </HeroCard>

      {/* ================= INFO ================= */}

      <InfoGrid>

        <InfoCard elevation={0}>

          <SectionHeading>

            Student Information

          </SectionHeading>

          <Divider
            sx={{
              borderColor:"#1E293B",
              mb:3
            }}
          />

          <InfoRow>

            <InfoTitle>

              Student Name

            </InfoTitle>

            <InfoValue>

              {userDetails?.name}

            </InfoValue>

          </InfoRow>

          <InfoRow>

            <InfoTitle>

              Roll Number

            </InfoTitle>

            <InfoValue>

              {userDetails?.rollNum}

            </InfoValue>

          </InfoRow>

          <InfoRow>

            <InfoTitle>

              Class

            </InfoTitle>

            <InfoValue>

              {sclassName?.sclassName}

            </InfoValue>

          </InfoRow>

          <InfoRow>

            <InfoTitle>

              School

            </InfoTitle>

            <InfoValue>

              {studentSchool?.schoolName}

            </InfoValue>

          </InfoRow>

        </InfoCard>

        <InfoCard elevation={0}>

          <SectionHeading>

            Attendance Overview

          </SectionHeading>

          <Divider
            sx={{
              borderColor:"#1E293B",
              mb:3
            }}
          />

          {subjectAttendance &&
          Array.isArray(subjectAttendance) &&
          subjectAttendance.length > 0 ? (

            <ChartWrapper>

              <CustomPieChart
                data={chartData}
              />

            </ChartWrapper>

          ) : (

            <EmptyText>

              No attendance data available.

            </EmptyText>

          )}

        </InfoCard>

      </InfoGrid>

      {/* ================= ACTIONS ================= */}

      <ActionCard elevation={0}>

        <SectionHeading>

          Student Actions

        </SectionHeading>

        <Divider
          sx={{
            borderColor:"#1E293B",
            mb:3
          }}
        />

        <ButtonGroup>

          <DangerButton
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={deleteHandler}
          >

            Delete Student

          </DangerButton>

          <PrimaryButton
            variant="contained"
            onClick={() =>
              setShowTab(!showTab)
            }
          >

            {showTab
              ? "Hide Edit Form"
              : "Edit Student"}

          </PrimaryButton>

        </ButtonGroup>

        <Collapse
          in={showTab}
          timeout="auto"
          unmountOnExit
        >

          <EditCard>

            <Typography
              variant="h6"
              color="white"
              mb={3}
            >

              Update Student Details

            </Typography>

            <form
              onSubmit={submitHandler}
            >

              <InputGroup>

                <InputLabel>

                  Student Name

                </InputLabel>

                <StyledInput
                  value={name}
                  onChange={(e)=>
                    setName(e.target.value)
                  }
                  required
                />

              </InputGroup>

              <InputGroup>

                <InputLabel>

                  Roll Number

                </InputLabel>

                <StyledInput
                  type="number"
                  value={rollNum}
                  onChange={(e)=>
                    setRollNum(e.target.value)
                  }
                  required
                />

              </InputGroup>

              <InputGroup>

                <InputLabel>

                  Password
                  (Optional)

                </InputLabel>

                <StyledInput
                  type="password"
                  value={password}
                  onChange={(e)=>
                    setPassword(e.target.value)
                  }
                />

              </InputGroup>

              <PrimaryButton
                type="submit"
                variant="contained"
                sx={{mt:3}}
              >

                Update Student

              </PrimaryButton>

            </form>

          </EditCard>

        </Collapse>

      </ActionCard>

    </>

  );

};
const StudentAttendanceSection = () => {

  const renderTableSection = () => {

    return (

      <>

        <StatsGrid>

          <StatCard>

            <AssessmentIcon sx={{ fontSize: 34 }} />

            <StatValue>

              {overallAttendancePercentage.toFixed(1)}%

            </StatValue>

            <StatLabel>

              Overall Attendance

            </StatLabel>

          </StatCard>

          <StatCard>

            <ClassIcon sx={{ fontSize: 34 }} />

            <StatValue>

              {
                Object.keys(
                  groupAttendanceBySubject(subjectAttendance)
                ).length
              }

            </StatValue>

            <StatLabel>

              Subjects

            </StatLabel>

          </StatCard>

          <StatCard>

            <FactCheckIcon sx={{ fontSize: 34 }} />

            <StatValue>

              {subjectAttendance.length}

            </StatValue>

            <StatLabel>

              Attendance Records

            </StatLabel>

          </StatCard>

        </StatsGrid>

        <ContentCard elevation={0}>

          <SectionHeading>

            Subject Attendance

          </SectionHeading>

          <Divider
            sx={{
              borderColor:"#1E293B",
              mb:3
            }}
          />

          <Table>

            <TableHead>

              <StyledTableRow>

                <StyledTableCell>

                  Subject

                </StyledTableCell>

                <StyledTableCell align="center">

                  Present

                </StyledTableCell>

                <StyledTableCell align="center">

                  Sessions

                </StyledTableCell>

                <StyledTableCell align="center">

                  Attendance

                </StyledTableCell>

                <StyledTableCell align="center">

                  Actions

                </StyledTableCell>

              </StyledTableRow>

            </TableHead>

            {

              Object.entries(

                groupAttendanceBySubject(subjectAttendance)

              ).map((

                [

                  subName,

                  {

                    present,

                    sessions,

                    subId,

                    allData,

                  },

                ],

                index

              ) => {

                const percentage =

                  calculateSubjectAttendancePercentage(

                    present,

                    sessions

                  );

                return (

                  <TableBody key={index}>

                    <StyledTableRow hover>

                      <StyledTableCell>

                        {subName}

                      </StyledTableCell>

                      <StyledTableCell align="center">

                        {present}

                      </StyledTableCell>

                      <StyledTableCell align="center">

                        {sessions}

                      </StyledTableCell>

                      <StyledTableCell align="center">

                        <AttendanceChip>

                          {percentage}%

                        </AttendanceChip>

                      </StyledTableCell>

                      <StyledTableCell align="center">

                        <PrimaryButton
                          size="small"
                          onClick={() =>
                            handleOpen(subId)
                          }
                        >

                          {

                            openStates[subId]

                            ?

                            <KeyboardArrowUp />

                            :

                            <KeyboardArrowDown />

                          }

                          Details

                        </PrimaryButton>

                        <IconButton
                          onClick={() =>
                            removeSubAttendance(subId)
                          }
                        >

                          <DeleteIcon
                            color="error"
                          />

                        </IconButton>

                        <PrimaryButton
                          size="small"
                          sx={{ ml:1 }}
                          onClick={() =>
                            navigate(

                              `/Admin/subject/student/attendance/${studentID}/${subId}`

                            )
                          }
                        >

                          Change

                        </PrimaryButton>

                      </StyledTableCell>

                    </StyledTableRow>

                    <StyledTableRow>

                      <StyledTableCell
                        colSpan={5}
                        sx={{
                          p:0,
                          borderBottom:0
                        }}
                      >

                        <Collapse

                          in={openStates[subId]}

                          timeout="auto"

                          unmountOnExit

                        >

                          <AttendanceHistoryCard>

                            <Typography
                              variant="h6"
                              color="white"
                              mb={3}
                            >

                              Attendance History

                            </Typography>

                            <Table size="small">

                              <TableHead>

                                <StyledTableRow>

                                  <StyledTableCell>

                                    Date

                                  </StyledTableCell>

                                  <StyledTableCell align="right">

                                    Status

                                  </StyledTableCell>

                                </StyledTableRow>

                              </TableHead>

                              <TableBody>

                                {

                                  allData.map((data,index)=>{

                                    const date =

                                      new Date(data.date);

                                    const dateString =

                                      date.toString() !== "Invalid Date"

                                      ?

                                      date

                                      .toISOString()

                                      .substring(0,10)

                                      :

                                      "Invalid Date";

                                    return(

                                      <StyledTableRow key={index}>

                                        <StyledTableCell>

                                          {dateString}

                                        </StyledTableCell>

                                        <StyledTableCell align="right">

                                          {data.status}

                                        </StyledTableCell>

                                      </StyledTableRow>

                                    );

                                  })

                                }

                              </TableBody>

                            </Table>

                          </AttendanceHistoryCard>

                        </Collapse>

                      </StyledTableCell>

                    </StyledTableRow>

                  </TableBody>

                );

              })

            }

          </Table>

        </ContentCard>

        <ButtonRow>

          <DangerButton

            variant="contained"

            startIcon={<DeleteIcon />}

            onClick={() =>

              removeHandler(

                studentID,

                "RemoveStudentAtten"

              )

            }

          >

            Delete Attendance

          </DangerButton>

          <PrimaryButton

            variant="contained"

            onClick={() =>

              navigate(

                "/Admin/students/student/attendance/" +

                studentID

              )

            }

          >

            Add Attendance

          </PrimaryButton>

        </ButtonRow>

      </>

    );

  };
    const renderChartSection = () => {
    return (
      <ContentCard elevation={0}>
        <SectionHeading>
          Attendance Analytics
        </SectionHeading>

        <Divider
          sx={{
            borderColor: "#1E293B",
            mb: 3,
          }}
        />

        <ChartWrapper>
          <CustomBarChart
            chartData={subjectData}
            dataKey="attendancePercentage"
          />
        </ChartWrapper>
      </ContentCard>
    );
  };

  return (
    <>
      {subjectAttendance &&
      Array.isArray(subjectAttendance) &&
      subjectAttendance.length > 0 ? (
        <>
          {selectedSection === "table" &&
            renderTableSection()}

          {selectedSection === "chart" &&
            renderChartSection()}

          <BottomNavPaper elevation={0}>
            <BottomNavigation
              value={selectedSection}
              onChange={handleSectionChange}
              showLabels
              sx={{
                background: "transparent",
              }}
            >
              <BottomNavigationAction
                label="Attendance"
                value="table"
                icon={
                  selectedSection === "table" ? (
                    <TableChartIcon />
                  ) : (
                    <TableChartOutlinedIcon />
                  )
                }
              />

              <BottomNavigationAction
                label="Analytics"
                value="chart"
                icon={
                  selectedSection === "chart" ? (
                    <InsertChartIcon />
                  ) : (
                    <InsertChartOutlinedIcon />
                  )
                }
              />
            </BottomNavigation>
          </BottomNavPaper>
        </>
      ) : (
        <EmptyCard elevation={0}>
          <AssessmentIcon
            sx={{
              fontSize: 80,
              color: "#2563EB",
              mb: 2,
            }}
          />

          <Typography
            variant="h4"
            fontWeight={700}
            color="white"
          >
            No Attendance Records
          </Typography>

          <Typography
            sx={{
              color: "#94A3B8",
              mt: 2,
              mb: 4,
              maxWidth: 480,
              textAlign: "center",
            }}
          >
            No attendance has been recorded for
            this student yet. Add attendance to
            generate reports and analytics.
          </Typography>

          <PrimaryButton
            variant="contained"
            onClick={() =>
              navigate(
                "/Admin/students/student/attendance/" +
                  studentID
              )
            }
          >
            Add Attendance
          </PrimaryButton>
        </EmptyCard>
      )}
    </>
  );
};
const StudentMarksSection = () => {

  const renderTableSection = () => {

    return (

      <>

        <StatsGrid>

          <StatCard>

            <SchoolIcon sx={{ fontSize: 34 }} />

            <StatValue>

              {subjectMarks.length}

            </StatValue>

            <StatLabel>

              Subjects

            </StatLabel>

          </StatCard>

          <StatCard>

            <AssessmentIcon sx={{ fontSize: 34 }} />

            <StatValue>

              {
                subjectMarks.filter(
                  (item) => item.marksObtained
                ).length
              }

            </StatValue>

            <StatLabel>

              Results Added

            </StatLabel>

          </StatCard>

          <StatCard>

            <TrendingUpIcon sx={{ fontSize: 34 }} />

            <StatValue>

              {
                subjectMarks.length
                  ? Math.round(
                      subjectMarks.reduce(
                        (sum, item) =>
                          sum +
                          (item.marksObtained || 0),
                        0
                      ) / subjectMarks.length
                    )
                  : 0
              }

            </StatValue>

            <StatLabel>

              Average Marks

            </StatLabel>

          </StatCard>

        </StatsGrid>

        <ContentCard elevation={0}>

          <SectionHeading>

            Subject Marks

          </SectionHeading>

          <Divider
            sx={{
              borderColor:"#1E293B",
              mb:3
            }}
          />

          <Table>

            <TableHead>

              <StyledTableRow>

                <StyledTableCell>

                  Subject

                </StyledTableCell>

                <StyledTableCell align="center">

                  Marks Obtained

                </StyledTableCell>

              </StyledTableRow>

            </TableHead>

            <TableBody>

              {

                subjectMarks.map((result,index)=>{

                  if(
                    !result.subName ||
                    !result.marksObtained
                  ){
                    return null;
                  }

                  return(

                    <StyledTableRow
                      hover
                      key={index}
                    >

                      <StyledTableCell>

                        {result.subName.subName}

                      </StyledTableCell>

                      <StyledTableCell
                        align="center"
                      >

                        <AttendanceChip>

                          {result.marksObtained}

                        </AttendanceChip>

                      </StyledTableCell>

                    </StyledTableRow>

                  );

                })

              }

            </TableBody>

          </Table>

        </ContentCard>

        <ButtonRow>

          <PrimaryButton
            variant="contained"
            onClick={() =>
              navigate(
                "/Admin/students/student/marks/" +
                  studentID
              )
            }
          >

            Add / Update Marks

          </PrimaryButton>

        </ButtonRow>

      </>

    );

  };

  const renderChartSection = () => {

    return (

      <ContentCard elevation={0}>

        <SectionHeading>

          Marks Analytics

        </SectionHeading>

        <Divider
          sx={{
            borderColor:"#1E293B",
            mb:3
          }}
        />

        <ChartWrapper>

          <CustomBarChart
            chartData={subjectMarks}
            dataKey="marksObtained"
          />

        </ChartWrapper>

      </ContentCard>

    );

  };

  return (

    <>

      {

        subjectMarks &&
        Array.isArray(subjectMarks) &&
        subjectMarks.length > 0

        ?

        <>

          {

            selectedSection === "table" &&

            renderTableSection()

          }

          {

            selectedSection === "chart" &&

            renderChartSection()

          }

          <BottomNavPaper elevation={0}>

            <BottomNavigation

              value={selectedSection}

              onChange={handleSectionChange}

              showLabels

              sx={{

                background:"transparent"

              }}

            >

              <BottomNavigationAction
               sx={{

              fontSize:30,

              color:"#80a1e8",

              

            }}

                label="Marks"

                value="table"

                icon={

                  selectedSection === "table"

                  ?

                  <TableChartIcon/>

                  :

                  <TableChartOutlinedIcon
                   sx={{

              fontSize:30,

              color:"#80a1e8",

              

            }}/>

                }

              />

              <BottomNavigationAction
             sx={{

              fontSize:30,

              color:"#80a1e8",

              

            }}


                label="Analytics"

                value="chart"

                icon={

                  selectedSection === "chart"

                  ?

                  <InsertChartIcon
                   sx={{

              fontSize:30,

              color:"#4876d8",

              

            }}
                  />

                  :

                  <InsertChartOutlinedIcon
                   sx={{

              fontSize:30,

              color:"#80a1e8",

              

            }}

            />

                }

              />

            </BottomNavigation>

          </BottomNavPaper>

        </>

        :

        <EmptyCard elevation={0}>

          <SchoolIcon

            sx={{

              fontSize:80,

              color:"#2563EB",

              mb:2

            }}

          />

          <Typography

            variant="h4"

            fontWeight={700}

            color="white"

          >

            No Marks Available

          </Typography>

          <Typography

            sx={{

              color:"#94A3B8",

              mt:2,

              mb:4,

              textAlign:"center",

              maxWidth:450

            }}

          >

            No marks have been uploaded for
            this student yet.

          </Typography>

          <PrimaryButton

            variant="contained"

            onClick={()=>

              navigate(

                "/Admin/students/student/marks/" +

                studentID

              )

            }

          >

            Add Marks

          </PrimaryButton>

        </EmptyCard>

      }

    </>

  );

};
return (
  <PageWrapper>

    {loading ? (

      <LoadingContainer>

        <CircularProgress
          size={70}
          thickness={4}
        />

        <Typography
          mt={3}
          color="#CBD5E1"
          fontSize={18}
        >
          Loading Student Profile...
        </Typography>

      </LoadingContainer>

    ) : (

      <>

        <Box
          sx={{
            width: "100%",
            typography: "body1",
          }}
        >

          <TabContext value={value}>

            <PremiumTabsContainer>

              <PremiumTabList
                onChange={handleChange}
                variant="fullWidth"
              >

                <PremiumTab
                  label="Profile"
                  value="1"
                />

                <PremiumTab
                  label="Attendance"
                  value="2"
                />

                <PremiumTab
                  label="Marks"
                  value="3"
                />

              </PremiumTabList>

            </PremiumTabsContainer>

            <MainContainer maxWidth="xl">

              <TabPanel
                value="1"
                sx={{ px: 0 }}
              >

                <StudentDetailsSection />

              </TabPanel>

              <TabPanel
                value="2"
                sx={{ px: 0 }}
              >

                <StudentAttendanceSection />

              </TabPanel>

              <TabPanel
                value="3"
                sx={{ px: 0 }}
              >

                <StudentMarksSection />

              </TabPanel>

            </MainContainer>

          </TabContext>

        </Box>

      </>

    )}

    <Popup
      message={message}
      showPopup={showPopup}
      setShowPopup={setShowPopup}
    />

  </PageWrapper>
);

};

export default ViewStudent;
/* ===========================
   PAGE LAYOUT
=========================== */

const PageWrapper = styled(Box)`
  min-height: 100vh;
  background: #070b14;
  padding: 32px;
`;

const LoadingContainer = styled(Box)`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const MainContainer = styled(Container)`
  margin-top: 36px;
  margin-bottom: 80px;
`;



/* ===========================
   HERO
=========================== */

const HeroCard = styled(Paper)`
  background: #111827 !important;
  border: 1px solid #1e293b;
  border-radius: 24px !important;

  padding: 36px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;

  margin-bottom: 32px;

  flex-wrap: wrap;
`;

const HeroLeft = styled(Box)`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const HeroRight = styled(Box)`
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
`;

const AvatarCircle = styled(Avatar)`
  &&{
    width:90px;
    height:90px;
    background:#2563EB;
  }
`;

const PageTitle = styled(Typography)`
  &&{
    color:white;
    font-size:2rem;
    font-weight:700;
  }
`;

const PageSubtitle = styled(Typography)`
  &&{
    color:#94A3B8;
    margin-top:6px;
  }
`;



/* ===========================
   DASHBOARD CARDS
=========================== */

const DashboardCard = styled(Paper)`
  background:#0F172A !important;

  border:1px solid #1E293B;

  border-radius:18px !important;

  width:150px;

  padding:22px;

  display:flex;

  flex-direction:column;

  align-items:center;

  transition:.25s;

  svg{

      font-size:34px;

      color:#2563EB;

      margin-bottom:12px;

  }

  &:hover{

      transform:translateY(-5px);

      border-color:#2563EB;

  }
`;

const DashboardValue = styled(Typography)`
  &&{
    color:white;
    font-size:1.7rem;
    font-weight:700;
  }
`;

const DashboardLabel = styled(Typography)`
  &&{
    color:#94A3B8;
    font-size:.9rem;
    margin-top:6px;
  }
`;



/* ===========================
   INFO SECTION
=========================== */

const InfoGrid = styled(Box)`
  display:grid;

  grid-template-columns:repeat(auto-fit,minmax(350px,1fr));

  gap:24px;

  margin-bottom:28px;
`;

const InfoCard = styled(Paper)`
  background:#111827 !important;

  border:1px solid #1E293B;

  border-radius:20px !important;

  padding:28px;
`;

const InfoRow = styled(Box)`
  display:flex;

  justify-content:space-between;

  padding:14px 0;

  border-bottom:1px solid #1E293B;
`;

const InfoTitle = styled(Typography)`
  &&{
    color:#94A3B8;
    font-weight:500;
  }
`;

const InfoValue = styled(Typography)`
  &&{
    color:white;
    font-weight:600;
  }
`;



/* ===========================
   COMMON CARDS
=========================== */

const ContentCard = styled(Paper)`
  background:#111827 !important;

  border:1px solid #1E293B;

  border-radius:20px !important;

  padding:28px;

  margin-top:24px;
`;

const ActionCard = styled(ContentCard)``;

const AttendanceHistoryCard = styled(Box)`
  padding:24px;

  background:#0F172A;

  border-top:1px solid #1E293B;
`;

const ChartWrapper = styled(Box)`
  height:340px;

  display:flex;

  justify-content:center;

  align-items:center;
`;

const EmptyCard = styled(Paper)`
  background:#111827 !important;

  border:1px dashed #334155;

  border-radius:20px !important;

  padding:60px;

  display:flex;

  flex-direction:column;

  align-items:center;

  justify-content:center;
`;
/* ===========================
   SECTION HEADINGS
=========================== */

const SectionHeading = styled(Typography)`
  && {
    color: white;
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 8px;
  }
`;

/* ===========================
   STATS
=========================== */

const StatsGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
`;

const StatCard = styled(Paper)`
  background: #111827 !important;
  border: 1px solid #1E293B;
  border-radius: 18px !important;
  padding: 24px;
  text-align: center;
  transition: .25s;

  svg{
    color:#2563EB;
    margin-bottom:14px;
  }

  &:hover{
    transform:translateY(-5px);
    border-color:#2563EB;
  }
`;

const StatValue = styled(Typography)`
  &&{
    color:white;
    font-size:1.8rem;
    font-weight:700;
  }
`;

const StatLabel = styled(Typography)`
  &&{
    color:#94A3B8;
    margin-top:8px;
    font-size:.95rem;
  }
`;

/* ===========================
   BUTTONS
=========================== */

const ButtonRow = styled(Box)`
  display:flex;
  justify-content:flex-end;
  gap:16px;
  flex-wrap:wrap;
  margin-top:28px;
`;

const ButtonGroup = styled(Box)`
  display:flex;
  gap:16px;
  flex-wrap:wrap;
`;

const PrimaryButton = styled(Button)`
  &&{
    background:#2563EB;
    color:white;
    text-transform:none;
    font-weight:600;
    border-radius:12px;
    padding:10px 22px;

    &:hover{
      background:#1D4ED8;
    }
  }
`;

const DangerButton = styled(Button)`
  &&{
    background:#DC2626;
    color:white;
    text-transform:none;
    font-weight:600;
    border-radius:12px;
    padding:10px 22px;

    &:hover{
      background:#B91C1C;
    }
  }
`;

/* ===========================
   EDIT FORM
=========================== */

const EditCard = styled(Box)`
  margin-top:28px;
  background:#0F172A;
  border:1px solid #1E293B;
  border-radius:18px;
  padding:28px;
`;

const InputGroup = styled(Box)`
  display:flex;
  flex-direction:column;
  margin-bottom:20px;
`;

const InputLabel = styled(Typography)`
  &&{
    color:#CBD5E1;
    font-weight:600;
    margin-bottom:8px;
  }
`;

const StyledInput = styled.input`
  width:100%;
  padding:14px 16px;

  background:#070B14;

  border:1px solid #334155;

  color:white;

  border-radius:12px;

  outline:none;

  font-size:15px;

  transition:.25s;

  &:focus{

    border-color:#2563EB;

    box-shadow:0 0 0 3px rgba(37,99,235,.2);

  }

  &::placeholder{

    color:#64748B;

  }
`;

/* ===========================
   SMALL COMPONENTS
=========================== */

const AttendanceChip = styled(Box)`
  display:inline-flex;
  align-items:center;
  justify-content:center;

  min-width:72px;

  padding:6px 14px;

  border-radius:30px;

  background:#2563EB22;

  color:#60A5FA;

  font-weight:700;
`;

const EmptyText = styled(Typography)`
  &&{
    color:#94A3B8;
    text-align:center;
    margin-top:40px;
  }
`;
/* ===========================
   TABS
=========================== */

const PremiumTabsContainer = styled(Box)`
  position: sticky;
  top: 0;
  z-index: 100;

  background: #070B14;

  padding: 0 0 18px 0;
`;

const PremiumTabList = styled(TabList)`
  &&{
    background:#111827;

    border:1px solid #1E293B;

    border-radius:18px;

    padding:8px;

    .MuiTabs-indicator{
      display:none;
    }
  }
`;

const PremiumTab = styled(Tab)`
  &&{

    color:#94A3B8;

    text-transform:none;

    font-size:15px;

    font-weight:600;

    border-radius:12px;

    min-height:52px;

    transition:.25s;

    &.Mui-selected{

      background:#2563EB;

      color:white;

    }

  }
`;


/* ===========================
   BOTTOM NAVIGATION
=========================== */

const BottomNavPaper = styled(Paper)`
  position:fixed;

  left:50%;

  bottom:22px;

  transform:translateX(-50%);

  width:420px;

  max-width:95%;

  background:#111827 !important;

  border:1px solid #1E293B;

  border-radius:18px !important;

  overflow:hidden;

  z-index:1000;
`;


/* ===========================
   RESPONSIVE
=========================== */

const ResponsiveSpace = styled(Box)`
  height:90px;
`;


/* ===========================
   MOBILE
=========================== */

const MobileHide = styled(Box)`
  @media (max-width:900px){
    display:none;
  }
`;

const DesktopHide = styled(Box)`
  display:none;

  @media (max-width:900px){
    display:block;
  }
`;


/* ===========================
   TABLE FIXES
=========================== */

const TableWrapper = styled(Box)`
  overflow-x:auto;

  border-radius:16px;
`;


/* ===========================
   SCROLLBAR
=========================== */

const ScrollContainer = styled(Box)`
  &::-webkit-scrollbar{
    width:8px;
    height:8px;
  }

  &::-webkit-scrollbar-thumb{
    background:#334155;
    border-radius:20px;
  }

  &::-webkit-scrollbar-track{
    background:transparent;
  }
`;