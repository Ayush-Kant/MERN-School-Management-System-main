import {
    Container,
    Grid,
    Paper,
    Box,
    Typography
} from '@mui/material';

import SeeNotice from '../../components/SeeNotice';

import Students from "../../assets/img1.png";
import Classes from "../../assets/img2.png";
import Teachers from "../../assets/img3.png";
import Fees from "../../assets/img4.png";

import styled from 'styled-components';
import CountUp from 'react-countup';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { getAllSclasses } from '../../redux/sclassRelated/sclassHandle';
import { getAllStudents } from '../../redux/studentRelated/studentHandle';
import { getAllTeachers } from '../../redux/teacherRelated/teacherHandle';

const AdminHomePage = () => {

    const dispatch = useDispatch();

    const { studentsList } = useSelector((state) => state.student);
    const { sclassesList } = useSelector((state) => state.sclass);
    const { teachersList } = useSelector((state) => state.teacher);

    const { currentUser } = useSelector((state) => state.user);

    const adminID = currentUser._id;

    useEffect(() => {
        dispatch(getAllStudents(adminID));
        dispatch(getAllSclasses(adminID, "Sclass"));
        dispatch(getAllTeachers(adminID));
    }, [adminID, dispatch]);

    const numberOfStudents = studentsList?.length || 0;
    const numberOfClasses = sclassesList?.length || 0;
    const numberOfTeachers = teachersList?.length || 0;

    const cards = [
        {
            title: "Total Students",
            value: numberOfStudents,
            image: Students,
            duration: 2.5
        },
        {
            title: "Total Classes",
            value: numberOfClasses,
            image: Classes,
            duration: 2.5
        },
        {
            title: "Total Teachers",
            value: numberOfTeachers,
            image: Teachers,
            duration: 2.5
        },
        {
            title: "Fees Collection",
            value: 23000,
            image: Fees,
            duration: 2.5,
            prefix: "$"
        }
    ];

    return (
        <Container
            maxWidth="xl"
            sx={{
                mt: 2,
                mb: 4
            }}
        >

            <HeaderSection>

                <Box>

                    <WelcomeText>
                        Welcome Back,
                    </WelcomeText>

                    <AdminName>
                        {currentUser?.name || "Administrator"} 👋
                    </AdminName>

                    <Subtitle>
                        Here's what's happening in your school today.
                    </Subtitle>

                </Box>

            </HeaderSection>

            <Grid
                container
                spacing={3}
            >

                {cards.map((card, index) => (

                    <Grid
                        item
                        xs={12}
                        sm={6}
                        lg={3}
                        key={index}
                    >

                        <StyledPaper elevation={0}>

                            <TopSection>

                                <ImageContainer>

                                    <img
                                        src={card.image}
                                        alt={card.title}
                                    />

                                </ImageContainer>

                                <CountContainer>

                                    <Data
                                        start={0}
                                        end={card.value}
                                        duration={card.duration}
                                        prefix={card.prefix || ""}
                                    />

                                    <GrowthTag>
                                        Live
                                    </GrowthTag>

                                </CountContainer>

                            </TopSection>

                            <BottomSection>

                                <Title>
                                    {card.title}
                                </Title>

                                <Description>
                                    Updated automatically from the latest records
                                </Description>

                            </BottomSection>

                        </StyledPaper>

                    </Grid>

                ))}

                <Grid
                    item
                    xs={12}
                >

                    <NoticeWrapper
                        elevation={0}
                    >

                        <SeeNotice />

                    </NoticeWrapper>

                </Grid>

            </Grid>

        </Container>
    );
};

/* ===========================================================
   Styled Components
   Part 2 starts from here.
=========================================================== */
const HeaderSection = styled(Box)`
  margin-bottom: 32px;
  padding: 28px 32px;
  border-radius: 20px;
  background: linear-gradient(135deg, #172554 0%, #0f172a 55%, #111827 100%);
  border: 1px solid #1e3a8a;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
`;

const WelcomeText = styled(Typography)`
  color: #94a3b8 !important;
  font-size: 0.95rem !important;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

const AdminName = styled(Typography)`
  color: #ffffff !important;
  font-size: 2rem !important;
  font-weight: 700 !important;
  margin-top: 8px !important;
`;

const Subtitle = styled(Typography)`
  color: #cbd5e1 !important;
  margin-top: 10px !important;
  font-size: 1rem !important;
`;

const StyledPaper = styled(Paper)`
  height: 220px;
  border-radius: 20px !important;
  background: #111827 !important;
  border: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 22px;
  overflow: hidden;
  position: relative;
  transition: all 0.35s ease;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(90deg, #2563eb, #fbbf24);
  }

  &:hover {
    transform: translateY(-8px);
    border-color: #2563eb;
    box-shadow: 0 18px 45px rgba(37, 99, 235, 0.18);
  }
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ImageContainer = styled.div`
  width: 78px;
  height: 78px;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 58px;
    height: 58px;
    object-fit: contain;
  }
`;

const CountContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const GrowthTag = styled.div`
  margin-top: 10px;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.8px;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled(Typography)`
  color: #ffffff !important;
  font-size: 1.15rem !important;
  font-weight: 600 !important;
`;

const Description = styled(Typography)`
  color: #94a3b8 !important;
  font-size: 0.82rem !important;
  margin-top: 6px !important;
  line-height: 1.5;
`;

const Data = styled(CountUp)`
  color: #f8fafc;
  font-size: 2rem;
  font-weight: 700;
`;

const NoticeWrapper = styled(Paper)`
  margin-top: 12px;
  padding: 24px;
  border-radius: 22px !important;
  background: transparent !important;
  border: none;
  box-shadow: none !important;
`;

export default AdminHomePage;