import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
  getClassDetails,
  getClassStudents,
  getSubjectList,
} from "../../../redux/sclassRelated/sclassHandle";

import { deleteUser } from "../../../redux/userRelated/userHandle";
import { resetSubjects } from "../../../redux/sclassRelated/sclassSlice";

import {
  Box,
  Container,
  Typography,
  IconButton,
  CircularProgress,
  Avatar,
  Chip,
  Stack,
  Divider,
  Paper,
} from "@mui/material";

import {
  School,
  Groups,
  MenuBook,
  TrendingUp,
  ArrowForward,
} from "@mui/icons-material";

import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";

import styled from "styled-components";

import TableTemplate from "../../../components/TableTemplate";
import SpeedDialTemplate from "../../../components/SpeedDialTemplate";
import Popup from "../../../components/Popup";

import {
  BlueButton,
  GreenButton,
  PurpleButton,
} from "../../../components/buttonStyles";

import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import PostAddIcon from "@mui/icons-material/PostAdd";


const ClassDetails = () => {
    const params = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch();
    const { subjectsList, sclassStudents, sclassDetails, loading, error, response, getresponse } = useSelector((state) => state.sclass);

    const classID = params.id

    useEffect(() => {
        dispatch(getClassDetails(classID, "Sclass"));
        dispatch(getSubjectList(classID, "ClassSubjects"))
        dispatch(getClassStudents(classID));
    }, [dispatch, classID])

    if (error) {
        console.log(error)
    }

    const [value, setValue] = useState('1');

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    const deleteHandler = (deleteID, address) => {
        console.log(deleteID);
        console.log(address);
        setMessage("Sorry the delete function has been disabled for now.")
        setShowPopup(true)
        // dispatch(deleteUser(deleteID, address))
        //     .then(() => {
        //         dispatch(getClassStudents(classID));
        //         dispatch(resetSubjects())
        //         dispatch(getSubjectList(classID, "ClassSubjects"))
        //     })
    }

    const subjectColumns = [
        { id: 'name', label: 'Subject Name', minWidth: 170 },
        { id: 'code', label: 'Subject Code', minWidth: 100 },
    ]

    const subjectRows = subjectsList && subjectsList.length > 0 && subjectsList.map((subject) => {
        return {
            name: subject.subName,
            code: subject.subCode,
            id: subject._id,
        };
    })

    const SubjectsButtonHaver = ({ row }) => {
        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Subject")}>
                    <DeleteIcon color="error" />
                </IconButton>
                <BlueButton
                    variant="contained"
                    onClick={() => {
                        navigate(`/Admin/class/subject/${classID}/${row.id}`)
                    }}
                >
                    View
                </BlueButton >
            </>
        );
    };

    const subjectActions = [
        {
            icon: <PostAddIcon color="primary" />, name: 'Add New Subject',
            action: () => navigate("/Admin/addsubject/" + classID)
        },
        {
            icon: <DeleteIcon color="error" />, name: 'Delete All Subjects',
            action: () => deleteHandler(classID, "SubjectsClass")
        }
    ];

const ClassSubjectsSection = () => {

  return (

    <>

      {response ? (

        <CenteredAction>

          <ActionCircle
            onClick={() =>
              navigate(
                "/Admin/addsubject/" +
                  classID
              )
            }
          >

            +

          </ActionCircle>

          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              mt: 3,
            }}
          >
            No Subjects Yet
          </Typography>

          <Typography
            sx={{
              color: "#94A3B8",
              mt: 1,
            }}
          >
            Add your first subject to this class.
          </Typography>

        </CenteredAction>

      ) : (

        <>

          <Typography
            variant="h5"
            sx={{
              color: "#fff",
              mb: 3,
            }}
          >
            Subjects
          </Typography>

          <TableTemplate
            buttonHaver={SubjectsButtonHaver}
            columns={subjectColumns}
            rows={subjectRows}
          />

          <SpeedDialTemplate
            actions={subjectActions}
          />

        </>

      )}

    </>

  );

};

    const studentColumns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'rollNum', label: 'Roll Number', minWidth: 100 },
    ]

    const studentRows = sclassStudents.map((student) => {
        return {
            name: student.name,
            rollNum: student.rollNum,
            id: student._id,
        };
    })

    const StudentsButtonHaver = ({ row }) => {
        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Student")}>
                    <PersonRemoveIcon color="error" />
                </IconButton>
                <BlueButton
                    variant="contained"
                    onClick={() => navigate("/Admin/students/student/" + row.id)}
                >
                    View
                </BlueButton>
                <PurpleButton
                    variant="contained"
                    onClick={() =>
                        navigate("/Admin/students/student/attendance/" + row.id)
                    }
                >
                    Attendance
                </PurpleButton>
            </>
        );
    };

    const studentActions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />, name: 'Add New Student',
            action: () => navigate("/Admin/class/addstudents/" + classID)
        },
        {
            icon: <PersonRemoveIcon color="error" />, name: 'Delete All Students',
            action: () => deleteHandler(classID, "StudentsClass")
        },
    ];

const ClassStudentsSection = () => {

  return (

    <>

      {getresponse ? (

        <CenteredAction>

          <ActionCircle
            onClick={() =>
              navigate(
                "/Admin/class/addstudents/" +
                  classID
              )
            }
          >

            +

          </ActionCircle>

          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              mt: 3,
            }}
          >
            No Students Yet
          </Typography>

          <Typography
            sx={{
              color: "#94A3B8",
              mt: 1,
            }}
          >
            Start by adding students to
            this class.
          </Typography>

        </CenteredAction>

      ) : (

        <>

          <Typography
            variant="h5"
            sx={{
              color: "#fff",
              mb: 3,
            }}
          >
            Students
          </Typography>

          <TableTemplate
            buttonHaver={StudentsButtonHaver}
            columns={studentColumns}
            rows={studentRows}
          />

          <SpeedDialTemplate
            actions={studentActions}
          />

        </>

      )}

    </>

  );

};
const ClassTeachersSection = () => {

  return (

    <CenteredAction>

      <Typography
        variant="h5"
        sx={{
          color: "#fff",
          fontWeight: 700,
        }}
      >
        Teachers
      </Typography>

      <Typography
        sx={{
          color: "#94A3B8",
          mt: 2,
        }}
      >
        Teacher management will appear
        here.

      </Typography>

    </CenteredAction>

  );

};

const ClassDetailsSection = () => {
  const numberOfSubjects = subjectsList.length;
  const numberOfStudents = sclassStudents.length;

  return (
    <Box>

      <Typography
        variant="h4"
        sx={{
          color: "#fff",
          fontWeight: 700,
          mb: 4,
        }}
      >
        Class Overview
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3,1fr)",
          },
          gap: 3,
          mb: 5,
        }}
      >

        <OverviewCard>

          <OverviewTitle>
            Class Name
          </OverviewTitle>

          <OverviewValue>
            {sclassDetails?.sclassName}
          </OverviewValue>

        </OverviewCard>

        <OverviewCard>

          <OverviewTitle>
            Subjects
          </OverviewTitle>

          <OverviewValue>
            {numberOfSubjects}
          </OverviewValue>

        </OverviewCard>

        <OverviewCard>

          <OverviewTitle>
            Students
          </OverviewTitle>

          <OverviewValue>
            {numberOfStudents}
          </OverviewValue>

        </OverviewCard>

      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
        }}
      >

        {getresponse && (

          <GreenButton
            variant="contained"
            onClick={() =>
              navigate(
                "/Admin/class/addstudents/" +
                  classID
              )
            }
          >
            Add Students
          </GreenButton>

        )}

        {response && (

          <BlueButton
            variant="contained"
            onClick={() =>
              navigate(
                "/Admin/addsubject/" +
                  classID
              )
            }
          >
            Add Subjects
          </BlueButton>

        )}

      </Box>

    </Box>
  );
};

    return (
<>
{
loading ?

<LoadingContainer>

<CircularProgress
size={55}
sx={{
color:"#2563EB"
}}
/>

</LoadingContainer>

:

<PageWrapper maxWidth="xl">

<HeroCard>

<HeroLeft>

<AvatarCircle>

<School
sx={{
fontSize:42
}}
/>

</AvatarCircle>

<Box>

<PageTitle>

{sclassDetails?.sclassName || "Class"}

</PageTitle>

<PageSubtitle>

Manage students, teachers,
subjects and attendance
from one beautiful dashboard.

</PageSubtitle>

<Stack
direction="row"
spacing={1.5}
mt={3}
flexWrap="wrap"
>

<Chip
label="Academic Class"
color="primary"
/>

<Chip
label={`${subjectsList.length} Subjects`}
/>

<Chip
label={`${sclassStudents.length} Students`}
/>

</Stack>

</Box>

</HeroLeft>

<HeroRight>

<DashboardCard>

<MenuBook/>

<DashboardValue>

{subjectsList.length}

</DashboardValue>

<DashboardLabel>

Subjects

</DashboardLabel>

</DashboardCard>

<DashboardCard>

<Groups/>

<DashboardValue>

{sclassStudents.length}

</DashboardValue>

<DashboardLabel>

Students

</DashboardLabel>

</DashboardCard>

<DashboardCard>

<TrendingUp/>

<DashboardValue>

100%

</DashboardValue>

<DashboardLabel>

Progress

</DashboardLabel>

</DashboardCard>

</HeroRight>

</HeroCard>

<QuickActions>

<SectionHeading>

Quick Actions

</SectionHeading>

<Divider
sx={{
borderColor:"#1E293B",
mb:3
}}
/>

<Stack
direction={{
xs:"column",
sm:"row"
}}
spacing={2}
>

<BlueButton
variant="contained"
onClick={()=>
navigate(
"/Admin/addsubject/"+classID
)
}
>

Add Subject

</BlueButton>

<GreenButton
variant="contained"
onClick={()=>
navigate(
"/Admin/class/addstudents/"+classID
)
}
>

Add Student

</GreenButton>

<PurpleButton
variant="contained"
onClick={()=>
setValue("2")
}
>

View Subjects

</PurpleButton>

</Stack>

</QuickActions>

        <TabContext value={value}>

<NavigationCard>

<StyledTabList
onChange={handleChange}
variant="scrollable"
scrollButtons="auto"
>

<StyledTab

icon={<TrendingUp/>}

iconPosition="start"

label="Overview"

value="1"

/>

<StyledTab

icon={<MenuBook/>}

iconPosition="start"

label={`Subjects (${subjectsList.length})`}

value="2"

/>

<StyledTab

icon={<Groups/>}

iconPosition="start"

label={`Students (${sclassStudents.length})`}

value="3"

/>

<StyledTab

icon={<School/>}

iconPosition="start"

label="Teachers"

value="4"

/>

</StyledTabList>

</NavigationCard>

<MainContent>


            <TabPanel
value="1"
sx={{
padding:0,
mt:4
}}
>

              <ClassDetailsSection />

            </TabPanel>

            <TabPanel
value="2"
sx={{
padding:0,
mt:4
}}
>

              <ClassSubjectsSection />

            </TabPanel>

          <TabPanel
value="3"
sx={{
padding:0,
mt:4
}}
>

              <ClassStudentsSection />

            </TabPanel>

            <TabPanel
value="4"
sx={{
padding:0,
mt:4
}}
>

              <ClassTeachersSection />

            </TabPanel>

       

        </MainContent>

</TabContext>

      </PageWrapper>
    }

    <Popup
      message={message}
      showPopup={showPopup}
      setShowPopup={setShowPopup}
    />
  </>
);
};


const LoadingContainer = styled(Box)`
  min-height: calc(100vh - 70px);
  display:flex;
  justify-content:center;
  align-items:center;
  background:#070B14;
`;

const PageWrapper = styled(Container)`
  padding-top:40px;
  padding-bottom:60px;
`;

const HeroCard = styled(Paper)`
  background:linear-gradient(
      135deg,
      #111827,
      #0F172A
  ) !important;

  border:1px solid #1E293B;

  border-radius:28px !important;

  padding:38px;

  display:flex;

  justify-content:space-between;

  align-items:center;

  gap:40px;

  margin-bottom:32px;

  overflow:hidden;

  position:relative;

  box-shadow:
      0 25px 60px rgba(0,0,0,.45);

  &:before{

      content:"";

      position:absolute;

      width:320px;

      height:320px;

      right:-120px;

      top:-120px;

      border-radius:50%;

      background:rgba(37,99,235,.12);

      filter:blur(30px);

  }

  @media(max-width:960px){

      flex-direction:column;

      align-items:flex-start;

  }
`;

const HeroLeft = styled(Box)`
  display:flex;
  align-items:center;
  gap:28px;
  z-index:2;
`;

const HeroRight = styled(Box)`
  display:flex;
  gap:22px;
  z-index:2;

  @media(max-width:900px){
      width:100%;
      justify-content:space-between;
      flex-wrap:wrap;
  }
`;

const AvatarCircle = styled(Avatar)`
  width:95px !important;
  height:95px !important;

  background:linear-gradient(
      135deg,
      #2563EB,
      #1D4ED8
  ) !important;

  box-shadow:
      0 15px 40px rgba(37,99,235,.45);
`;

const PageTitle = styled(Typography)`
  color:white;
  font-size:2.3rem !important;
  font-weight:800 !important;
  letter-spacing:-1px;
`;

const PageSubtitle = styled(Typography)`
  color:#94A3B8;
  margin-top:10px !important;
  max-width:560px;
  line-height:1.8;
`;

const DashboardCard = styled(Box)`
  min-width:170px;

  padding:24px;

  border-radius:22px;

  background:#111827;

  border:1px solid #1E293B;

  text-align:center;

  transition:.35s;

  cursor:pointer;

  svg{

      color:#2563EB;

      font-size:34px;

      margin-bottom:15px;

  }

  &:hover{

      transform:translateY(-8px);

      border-color:#2563EB;

      box-shadow:
          0 25px 50px rgba(37,99,235,.18);

  }
`;

const DashboardValue = styled(Typography)`
  color:white;
  font-size:2.3rem !important;
  font-weight:800 !important;
`;

const DashboardLabel = styled(Typography)`
  color:#94A3B8;
  margin-top:8px !important;
`;

const QuickActions = styled(Paper)`
  background:#111827 !important;

  border-radius:22px !important;

  border:1px solid #1E293B;

  padding:28px;

  margin-bottom:28px;
`;

const SectionHeading = styled(Typography)`
  color:white;
  font-size:1.25rem !important;
  font-weight:700 !important;
  margin-bottom:18px !important;
`;

const NavigationCard = styled(Paper)`
  background:#111827 !important;

  border:1px solid #1E293B;

  border-radius:22px !important;

  padding:10px 14px;

  margin-bottom:28px;

  position:sticky;

  top:18px;

  z-index:20;

  backdrop-filter:blur(12px);
`;

const StyledTabList = styled(TabList)`

.MuiTabs-indicator{

display:none;

}

`;

const StyledTab = styled(Tab)`

text-transform:none !important;

font-size:15px !important;

font-weight:700 !important;

color:#94A3B8 !important;

border-radius:14px !important;

min-height:54px !important;

padding:0 22px !important;

transition:.25s !important;

&.Mui-selected{

background:#2563EB;

color:white !important;

box-shadow:
0 10px 25px rgba(37,99,235,.35);

}

svg{

font-size:20px;

}

`;

const MainContent = styled(Box)`
  background:#111827;

  border-radius:24px;

  border:1px solid #1E293B;

  padding:28px;

  box-shadow:
      0 18px 45px rgba(0,0,0,.30);
`;
const OverviewCard = styled(Box)`
  background: linear-gradient(
    145deg,
    #111827,
    #0F172A
  );

  border: 1px solid #1E293B;

  border-radius: 22px;

  padding: 30px;

  position: relative;

  overflow: hidden;

  transition: .35s ease;

  cursor: pointer;

  &:before{
    content:"";
    position:absolute;
    width:180px;
    height:180px;
    right:-70px;
    top:-70px;
    border-radius:50%;
    background:rgba(37,99,235,.10);
    transition:.35s;
  }

  &:hover{

    transform:translateY(-8px);

    border-color:#2563EB;

    box-shadow:
      0 25px 50px rgba(37,99,235,.18);

  }

  &:hover:before{

    transform:scale(1.25);

  }
`;

const OverviewTitle = styled(Typography)`
  color:#94A3B8;
  font-size:.9rem !important;
  font-weight:600 !important;
  text-transform:uppercase;
  letter-spacing:1px;
`;

const OverviewValue = styled(Typography)`
  color:white;
  font-size:2.4rem !important;
  font-weight:800 !important;
  margin-top:14px !important;
`;

const CenteredAction = styled(Box)`
  min-height:520px;

  display:flex;

  flex-direction:column;

  justify-content:center;

  align-items:center;

  text-align:center;

  padding:40px;
`;

const ActionCircle = styled(Box)`
  width:170px;

  height:170px;

  border-radius:50%;

  background:linear-gradient(
    135deg,
    #2563EB,
    #1D4ED8
  );

  border:6px solid #FBBF24;

  display:flex;

  justify-content:center;

  align-items:center;

  color:white;

  font-size:82px;

  font-weight:bold;

  cursor:pointer;

  transition:.35s;

  box-shadow:
    0 0 0 12px rgba(37,99,235,.08),
    0 25px 60px rgba(37,99,235,.35);

  &:hover{

    transform:
      translateY(-10px)
      scale(1.06);

    box-shadow:
      0 0 45px rgba(37,99,235,.45),
      0 35px 70px rgba(37,99,235,.45);

  }

  &:active{

    transform:scale(.96);

  }
`;

const EmptyTitle = styled(Typography)`
  color:white;
  font-size:2rem !important;
  font-weight:700 !important;
  margin-top:32px !important;
`;

const EmptySubtitle = styled(Typography)`
  color:#94A3B8;
  margin-top:12px !important;
  max-width:430px;
  line-height:1.8;
`;

const FloatingGlow = styled(Box)`
  position:absolute;

  width:350px;

  height:350px;

  border-radius:50%;

  background:rgba(37,99,235,.08);

  filter:blur(70px);

  right:-150px;

  bottom:-150px;

  pointer-events:none;
`;

const GlassCard = styled(Paper)`
  background:rgba(17,24,39,.75) !important;

  backdrop-filter:blur(20px);

  border:1px solid rgba(255,255,255,.05);

  border-radius:22px !important;

  padding:30px;

  transition:.3s;

  &:hover{

    border-color:#2563EB;

    transform:translateY(-5px);

  }
`;

const MetricGrid = styled(Box)`
  display:grid;

  grid-template-columns:
    repeat(auto-fit,minmax(220px,1fr));

  gap:24px;

  margin-top:30px;
`;

const MetricCard = styled(Box)`
  background:#0F172A;

  border:1px solid #1E293B;

  border-radius:20px;

  padding:24px;

  transition:.3s;

  &:hover{

    border-color:#2563EB;

    transform:translateY(-5px);

  }
`;

const MetricTitle = styled(Typography)`
  color:#94A3B8;
  font-size:.9rem !important;
`;

const MetricValue = styled(Typography)`
  color:white;
  font-size:2rem !important;
  font-weight:700 !important;
  margin-top:10px !important;
`;

const SectionCard = styled(Paper)`
  background:#111827 !important;

  border-radius:22px !important;

  border:1px solid #1E293B;

  padding:30px;

  margin-top:28px;
`;
export default ClassDetails;


