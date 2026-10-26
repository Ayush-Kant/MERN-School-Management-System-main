import { useState } from "react";
import {
  CssBaseline,
  Box,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppBar, Drawer } from "../../components/styles";
import AccountMenu from "../../components/AccountMenu";
import SideBar from "./SideBar";
import Logout from "../Logout";

import AdminProfile from "./AdminProfile";
import AdminHomePage from "./AdminHomePage";

import AddStudent from "./studentRelated/AddStudent";
import SeeComplains from "./studentRelated/SeeComplains";
import ShowStudents from "./studentRelated/ShowStudents";
import StudentAttendance from "./studentRelated/StudentAttendance";
import StudentExamMarks from "./studentRelated/StudentExamMarks";
import ViewStudent from "./studentRelated/ViewStudent";

import AddNotice from "./noticeRelated/AddNotice";
import ShowNotices from "./noticeRelated/ShowNotices";

import ShowSubjects from "./subjectRelated/ShowSubjects";
import SubjectForm from "./subjectRelated/SubjectForm";
import ViewSubject from "./subjectRelated/ViewSubject";

import AddTeacher from "./teacherRelated/AddTeacher";
import ChooseClass from "./teacherRelated/ChooseClass";
import ChooseSubject from "./teacherRelated/ChooseSubject";
import ShowTeachers from "./teacherRelated/ShowTeachers";
import TeacherDetails from "./teacherRelated/TeacherDetails";

import AddClass from "./classRelated/AddClass";
import ClassDetails from "./classRelated/ClassDetails";
import ShowClasses from "./classRelated/ShowClasses";

import AdminFeeCollection from "./AdminFeeCollection";

const AdminDashboard = () => {
  // Sidebar open by default
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#070B14" }}>
      <CssBaseline />

      {/* ================= APPBAR ================= */}

      <AppBar position="fixed" open={open}>
        <Toolbar
          sx={{
            px: 3,
            minHeight: "72px !important",
            display: "flex",
            alignItems: "center",
          }}
        >
          {!open && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleDrawer}
              sx={{
                mr: 2,
                color: "#F8FAFC",
                "&:hover": {
                  bgcolor: "rgba(37,99,235,.12)",
                },
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <SchoolRoundedIcon
              sx={{
                color: "#FBBF24",
                mr: 1.5,
                fontSize: 30,
              }}
            />

            <Box>
              <Typography
                sx={{
                  color: "#F8FAFC",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  lineHeight: 1.2,
                }}
              >
                Student Management System
              </Typography>

              <Typography
                sx={{
                  color: "#94A3B8",
                  fontSize: ".8rem",
                }}
              >
                Admin Dashboard
              </Typography>
            </Box>
          </Box>

          <AccountMenu />
        </Toolbar>
      </AppBar>

      {/* ================= DRAWER ================= */}

      <Drawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            minHeight: "72px !important",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
          }}
        >
          {open && (
            <Typography
              sx={{
                color: "#FBBF24",
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              SMS
            </Typography>
          )}

          <IconButton
            onClick={toggleDrawer}
            sx={{
              color: "#F8FAFC",
              "&:hover": {
                bgcolor: "rgba(37,99,235,.15)",
              },
            }}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
        </Toolbar>

        <Divider
          sx={{
            borderColor: "#1E293B",
          }}
        />

        <List
          component="nav"
          sx={{
            mt: 1,
            px: 1,
          }}
        >
          <SideBar />
        </List>
      </Drawer>

      {/* ================= MAIN ================= */}

      <Box
        component="main"
        sx={styles.boxStyled}
      >
        <Toolbar
          sx={{
            minHeight: "72px !important",
          }}
        />

        <Routes>
          <Route path="/" element={<AdminHomePage />} />
          <Route path="*" element={<Navigate to="/" />} />

          <Route path="/Admin/dashboard" element={<AdminHomePage />} />
          <Route path="/Admin/profile" element={<AdminProfile />} />
          <Route path="/Admin/complains" element={<SeeComplains />} />
                    <Route
    path="/Admin/fees"
    element={<AdminFeeCollection />}
/>

          {/* Notice */}

          <Route path="/Admin/addnotice" element={<AddNotice />} />
          <Route path="/Admin/notices" element={<ShowNotices />} />

          {/* Subject */}

          <Route path="/Admin/subjects" element={<ShowSubjects />} />
          <Route
            path="/Admin/subjects/subject/:classID/:subjectID"
            element={<ViewSubject />}
          />
          <Route
            path="/Admin/subjects/chooseclass"
            element={<ChooseClass situation="Subject" />}
          />

          <Route
            path="/Admin/addsubject/:id"
            element={<SubjectForm />}
          />

          <Route
            path="/Admin/class/subject/:classID/:subjectID"
            element={<ViewSubject />}
          />

          <Route
            path="/Admin/subject/student/attendance/:studentID/:subjectID"
            element={<StudentAttendance situation="Subject" />}
          />

          <Route
            path="/Admin/subject/student/marks/:studentID/:subjectID"
            element={<StudentExamMarks situation="Subject" />}
          />

          {/* Class */}

          <Route path="/Admin/addclass" element={<AddClass />} />
          <Route path="/Admin/classes" element={<ShowClasses />} />
          <Route
            path="/Admin/classes/class/:id"
            element={<ClassDetails />}
          />

          <Route
            path="/Admin/class/addstudents/:id"
            element={<AddStudent situation="Class" />}
          />

          {/* Student */}

          <Route
            path="/Admin/addstudents"
            element={<AddStudent situation="Student" />}
          />

          <Route
            path="/Admin/students"
            element={<ShowStudents />}
          />

          <Route
            path="/Admin/students/student/:id"
            element={<ViewStudent />}
          />

          <Route
            path="/Admin/students/student/attendance/:id"
            element={<StudentAttendance situation="Student" />}
          />

          <Route
            path="/Admin/students/student/marks/:id"
            element={<StudentExamMarks situation="Student" />}
          />

          {/* Teacher */}

          <Route
            path="/Admin/teachers"
            element={<ShowTeachers />}
          />

          <Route
            path="/Admin/teachers/teacher/:id"
            element={<TeacherDetails />}
          />

          <Route
            path="/Admin/teachers/chooseclass"
            element={<ChooseClass situation="Teacher" />}
          />

          <Route
            path="/Admin/teachers/choosesubject/:id"
            element={<ChooseSubject situation="Norm" />}
          />

          <Route
            path="/Admin/teachers/choosesubject/:classID/:teacherID"
            element={<ChooseSubject situation="Teacher" />}
          />

          <Route
            path="/Admin/teachers/addteacher/:id"
            element={<AddTeacher />}
          />





          <Route path="/logout" element={<Logout />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminDashboard;

const styles = {
  boxStyled: {
    flexGrow: 1,
    minHeight: "100vh",
    overflow: "auto",

    background: "#070B14",

    px: {
      xs: 2,
      sm: 3,
      md: 4,
    },

    py: 3,

    transition: "all .3s ease",
  },
};