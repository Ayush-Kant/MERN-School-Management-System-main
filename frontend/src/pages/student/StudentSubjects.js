import React, { useEffect, useState } from "react";

import {
    BottomNavigation,
    BottomNavigationAction,
    Container,
    Paper,
    Table,
    TableBody,
    TableHead,
    Typography,
    Box,
    Avatar,
    Grid,
} from "@mui/material";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import styled from "styled-components";

import TableChartIcon from "@mui/icons-material/TableChart";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

import CustomBarChart from "../../components/CustomBarChart";

import {
    StyledTableCell,
    StyledTableRow,
} from "../../components/styles";

import {
    getSubjectList,
} from "../../redux/sclassRelated/sclassHandle";

import {
    getUserDetails,
} from "../../redux/userRelated/userHandle";

const StudentSubjects = () => {

    const dispatch = useDispatch();

    const {
        subjectsList,
        sclassDetails,
    } = useSelector(
        (state) => state.sclass
    );

    const {
        userDetails,
        currentUser,
        loading,
        response,
        error,
    } = useSelector(
        (state) => state.user
    );

    useEffect(() => {

        dispatch(
            getUserDetails(
                currentUser._id,
                "Student"
            )
        );

    }, [
        dispatch,
        currentUser._id,
    ]);

    if (response) {
        console.log(response);
    }
    else if (error) {
        console.log(error);
    }

    const [
        subjectMarks,
        setSubjectMarks,
    ] = useState([]);

    const [
        selectedSection,
        setSelectedSection,
    ] = useState("table");

    useEffect(() => {

        if (userDetails) {

            setSubjectMarks(
                userDetails.examResult || []
            );

        }

    }, [userDetails]);

    useEffect(() => {

        if (subjectMarks.length === 0) {

            dispatch(
                getSubjectList(
                    currentUser.sclassName._id,
                    "ClassSubjects"
                )
            );

        }

    }, [
        subjectMarks,
        dispatch,
        currentUser.sclassName._id,
    ]);

    const handleSectionChange = (
        event,
        newSection
    ) => {

        setSelectedSection(
            newSection
        );

    };

    const renderTableSection = () => {

        return (

            <>
                <SectionHeading>

                    Subject Marks

                </SectionHeading>

                <Table>

                    <TableHead>

                        <StyledTableRow>

                            <StyledTableCell>

                                Subject

                            </StyledTableCell>

                            <StyledTableCell>

                                Marks

                            </StyledTableCell>

                        </StyledTableRow>

                    </TableHead>

                    <TableBody>

                        {subjectMarks.map(
                            (
                                result,
                                index
                            ) => {

                                if (
                                    !result.subName ||
                                    !result.marksObtained
                                ) {
                                    return null;
                                }

                                return (

                                    <StyledTableRow
                                        key={index}
                                    >

                                        <StyledTableCell>

                                            {
                                                result.subName.subName
                                            }

                                        </StyledTableCell>

                                        <StyledTableCell>

                                            {
                                                result.marksObtained
                                            }

                                        </StyledTableCell>

                                    </StyledTableRow>

                                );

                            }
                        )}

                    </TableBody>

                </Table>
            </>

        );

    };

    const renderChartSection = () => {

        return (

            <CustomBarChart
                chartData={subjectMarks}
                dataKey="marksObtained"
            />

        );

    };

    const renderClassDetailsSection = () => {

        return (

            <ContentCard>

                <SectionHeading>

                    Class Information

                </SectionHeading>

                <Typography
                    sx={{
                        color: "#CBD5E1",
                        mb: 2,
                    }}
                >

                    You are currently studying in

                    <strong>

                        {" "}
                        Class {sclassDetails?.sclassName}

                    </strong>

                </Typography>

                <Typography
                    sx={{
                        color: "#94A3B8",
                        mb: 3,
                    }}
                >

                    Subjects Available

                </Typography>

                <Grid
                    container
                    spacing={2}
                >

                    {subjectsList &&
                        subjectsList.map(
                            (
                                subject,
                                index
                            ) => (

                                <Grid
                                    item
                                    xs={12}
                                    md={6}
                                    key={index}
                                >

                                    <SubjectCard>

                                        <MenuBookRoundedIcon />

                                        <Box>

                                            <Typography
                                                sx={{
                                                    color:
                                                        "white",
                                                    fontWeight: 700,
                                                }}
                                            >

                                                {
                                                    subject.subName
                                                }

                                            </Typography>

                                            <Typography
                                                sx={{
                                                    color:
                                                        "#94A3B8",
                                                }}
                                            >

                                                {
                                                    subject.subCode
                                                }

                                            </Typography>

                                        </Box>

                                    </SubjectCard>

                                </Grid>

                            )
                        )}

                </Grid>

            </ContentCard>

        );

    };

    // Part 1B starts from return(...)

    return (
    <>
        {
            loading ? (

                <LoadingContainer>

                    <Typography
                        sx={{
                            color: "#CBD5E1",
                        }}
                    >
                        Loading...
                    </Typography>

                </LoadingContainer>

            ) : (

                <PageWrapper maxWidth="xl">

                    <HeroCard>

                        <HeroLeft>

                            <AvatarCircle>

                                <SchoolRoundedIcon
                                    sx={{
                                        fontSize: 42,
                                    }}
                                />

                            </AvatarCircle>

                            <Box>

                                <PageTitle>

                                    Subjects

                                </PageTitle>

                                <PageSubtitle>

                                    View your academic performance and
                                    enrolled subjects.

                                </PageSubtitle>

                            </Box>

                        </HeroLeft>

                    </HeroCard>

                    {

                        subjectMarks &&
                        Array.isArray(subjectMarks) &&
                        subjectMarks.length > 0 ?

                            <>

                                <ContentCard>

                                    {

                                        selectedSection === "table"
                                            ? renderTableSection()
                                            : (
                                                <>
                                                    <SectionHeading>

                                                        Performance Chart

                                                    </SectionHeading>

                                                    <ChartWrapper>

                                                        {renderChartSection()}

                                                    </ChartWrapper>

                                                </>
                                            )

                                    }

                                </ContentCard>

                                <StyledBottomNavigation>

                                    <BottomNavigation
                                        value={selectedSection}
                                        onChange={handleSectionChange}
                                        showLabels
                                        sx={{
                                            bgcolor: "transparent",
                                        }}
                                    >

                                        <BottomNavigationAction
                                            label="Marks Table"
                                            value="table"
                                            icon={
                                                selectedSection === "table"
                                                    ? <TableChartIcon />
                                                    : <TableChartOutlinedIcon />
                                            }
                                        />

                                        <BottomNavigationAction
                                            label="Performance"
                                            value="chart"
                                            icon={
                                                selectedSection === "chart"
                                                    ? <InsertChartIcon />
                                                    : <InsertChartOutlinedIcon />
                                            }
                                        />

                                    </BottomNavigation>

                                </StyledBottomNavigation>

                            </>

                            :

                            renderClassDetailsSection()

                    }

                </PageWrapper>

            )
        }
    </>
);
}
export default StudentSubjects

const PageWrapper = styled(Container)`
    padding-top: 35px;
    padding-bottom: 110px;
`;

const LoadingContainer = styled(Box)`
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const HeroCard = styled(Box)`
    background: linear-gradient(135deg, #111827, #0F172A);
    border: 1px solid #1E293B;
    border-radius: 28px;
    padding: 36px;
    margin-bottom: 30px;
    box-shadow: 0 25px 60px rgba(0,0,0,.35);
    position: relative;
    overflow: hidden;

    &::before{
        content:"";
        position:absolute;
        width:260px;
        height:260px;
        border-radius:50%;
        background:rgba(37,99,235,.08);
        top:-120px;
        right:-120px;
    }
`;

const HeroLeft = styled(Box)`
    display:flex;
    align-items:center;
    gap:24px;

    @media(max-width:700px){
        flex-direction:column;
        align-items:flex-start;
    }
`;

const AvatarCircle = styled(Avatar)`
    width:90px !important;
    height:90px !important;
    background:linear-gradient(135deg,#2563EB,#1D4ED8) !important;
    box-shadow:0 18px 40px rgba(37,99,235,.35);
`;

const PageTitle = styled(Typography)`
    color:white;
    font-size:2.1rem !important;
    font-weight:800 !important;
`;

const PageSubtitle = styled(Typography)`
    color:#94A3B8;
    margin-top:8px !important;
`;

const ContentCard = styled(Box)`
    background:#111827;
    border:1px solid #1E293B;
    border-radius:22px;
    padding:30px;
    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const SectionHeading = styled(Typography)`
    color:white;
    font-size:1.35rem !important;
    font-weight:700 !important;
    margin-bottom:24px !important;
`;

const ChartWrapper = styled(Box)`
    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:18px;
    padding:24px;
`;

const SubjectCard = styled(Box)`
    display:flex;
    align-items:center;
    gap:18px;

    background:#0F172A;
    border:1px solid #1E293B;
    border-radius:18px;

    padding:20px;

    transition:.3s;

    svg{
        color:#60A5FA;
        font-size:34px;
    }

    &:hover{
        transform:translateY(-5px);
        border-color:#2563EB;
        box-shadow:0 15px 35px rgba(37,99,235,.15);
    }
`;

const StyledBottomNavigation = styled(Paper)`
    position: fixed;
    left: 50%;
    bottom: 22px;
    transform: translateX(-50%);

    width: fit-content;

    background: rgba(17,24,39,.95) !important;

    backdrop-filter: blur(18px);

    border: 1px solid #1E293B;

    border-radius: 20px !important;

    overflow: hidden;

    box-shadow: 0 18px 40px rgba(0,0,0,.35);

    .MuiBottomNavigation-root{
        background: transparent;
    }

    .MuiBottomNavigationAction-root{
        color:#94A3B8;
        min-width:140px;
        transition:.3s;
    }

    .Mui-selected{
        color:#60A5FA !important;
    }

    .MuiSvgIcon-root{
        font-size:1.55rem;
    }
`;