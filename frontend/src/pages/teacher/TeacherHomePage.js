import { useEffect } from "react";
import { Container, Grid, Paper, Box } from "@mui/material";
import styled from "styled-components";
import CountUp from "react-countup";
import { useDispatch, useSelector } from "react-redux";

import SeeNotice from "../../components/SeeNotice";

import Students from "../../assets/img1.png";
import Lessons from "../../assets/subjects.svg";
import Tests from "../../assets/assignment.svg";
import Time from "../../assets/time.svg";

import { getClassStudents, getSubjectDetails } from "../../redux/sclassRelated/sclassHandle";

const TeacherHomePage = () => {

    const dispatch = useDispatch();

    const { currentUser } = useSelector(
        (state) => state.user
    );

    const {
        subjectDetails,
        sclassStudents,
    } = useSelector(
        (state) => state.sclass
    );

    const classID =
        currentUser.teachSclass?._id;

    const subjectID =
        currentUser.teachSubject?._id;

    useEffect(() => {

        dispatch(
            getSubjectDetails(
                subjectID,
                "Subject"
            )
        );

        dispatch(
            getClassStudents(classID)
        );

    }, [
        dispatch,
        subjectID,
        classID,
    ]);

    const numberOfStudents =
        sclassStudents?.length || 0;

    const numberOfSessions =
        subjectDetails?.sessions || 0;

    const dashboardCards = [
        {
            title: "Class Students",
            value: numberOfStudents,
            image: Students,
            duration: 2.5,
        },
        {
            title: "Total Lessons",
            value: numberOfSessions,
            image: Lessons,
            duration: 3,
        },
        {
            title: "Tests Taken",
            value: 24,
            image: Tests,
            duration: 3.5,
        },
        {
            title: "Teaching Hours",
            value: 30,
            image: Time,
            duration: 4,
            suffix: " hrs",
        },
    ];

    // Part 2 starts from:
    // return (

    return (
    <Container
        maxWidth="xl"
        sx={{
            py: 4,
            minHeight: "100vh",
        }}
    >

        {/* Header */}

        <Box
            sx={{
                mb: 4,
                p: 3,
                borderRadius: "22px",
                bgcolor: "#111827",
                border: "1px solid #1E293B",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
            }}
        >

            <Box>

                <PageTitle>
                    Teacher Dashboard
                </PageTitle>

                <PageSubtitle>
                    Welcome back! Here's an overview of your class.
                </PageSubtitle>

            </Box>

        </Box>

        <Grid container spacing={3}>

            {dashboardCards.map((card) => (

                <Grid
                    item
                    xs={12}
                    sm={6}
                    md={3}
                    key={card.title}
                >

                    <DashboardCard elevation={0}>

                        <CardIcon>

                            <img
                                src={card.image}
                                alt={card.title}
                            />

                        </CardIcon>

                        <CardTitle>
                            {card.title}
                        </CardTitle>

                        <CardValue
                            start={0}
                            end={card.value}
                            duration={card.duration}
                            suffix={card.suffix}
                        />

                    </DashboardCard>

                </Grid>

            ))}

            <Grid
                item
                xs={12}
            >

                <NoticeCard elevation={0}>

                    <NoticeTitle>
                        Latest Notices
                    </NoticeTitle>

                    <SeeNotice />

                </NoticeCard>

            </Grid>

        </Grid>

    </Container>
);

}

const DashboardCard = styled(Paper)`
    background: #111827 !important;
    border: 1px solid #1E293B;
    border-radius: 20px !important;
    padding: 28px 20px;
    height: 220px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    transition: all .3s ease;

    &:hover{
        transform: translateY(-6px);
        border-color:#2563EB;
        box-shadow:0 15px 40px rgba(37,99,235,.18);
    }
`;

const CardIcon = styled.div`
    width:72px;
    height:72px;

    border-radius:18px;

    background:#0F172A;

    display:flex;
    justify-content:center;
    align-items:center;

    border:1px solid #1E293B;

    img{
        width:42px;
        height:42px;
    }
`;

const CardTitle = styled.h3`
    margin:18px 0 8px;

    color:#CBD5E1;

    font-size:1rem;

    font-weight:600;

    text-align:center;
`;

const CardValue = styled(CountUp)`
    color:#FBBF24;

    font-size:2.4rem;

    font-weight:700;

    line-height:1;
`;

const NoticeCard = styled(Paper)`
    background:#111827 !important;

    border:1px solid #1E293B;

    border-radius:20px !important;

    padding:28px;

    margin-top:8px;
`;

const NoticeTitle = styled.h2`
    margin:0 0 24px;

    color:#FFFFFF;

    font-size:1.4rem;

    font-weight:700;
`;

const PageTitle = styled.h1`
    margin:0;

    color:#FFFFFF;

    font-size:2rem;

    font-weight:700;
`;

const PageSubtitle = styled.p`
    margin-top:8px;

    color:#94A3B8;

    font-size:1rem;
`;

export default TeacherHomePage;


