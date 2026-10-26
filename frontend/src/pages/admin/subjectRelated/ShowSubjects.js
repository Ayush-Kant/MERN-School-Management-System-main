import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
    Paper,
    Box,
    IconButton,
    Typography,
    Container,
    Avatar,
    Divider,
    Chip,
    Stack,
    CircularProgress,
} from "@mui/material";

import PostAddIcon from "@mui/icons-material/PostAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";

import styled from "styled-components";

import { getSubjectList } from "../../../redux/sclassRelated/sclassHandle";
import { deleteUser } from "../../../redux/userRelated/userHandle";

import TableTemplate from "../../../components/TableTemplate";
import {
    BlueButton,
    GreenButton,
} from "../../../components/buttonStyles";

import SpeedDialTemplate from "../../../components/SpeedDialTemplate";
import Popup from "../../../components/Popup";

const ShowSubjects = () => {

    const navigate = useNavigate();

    const dispatch = useDispatch();

    const {
        subjectsList,
        loading,
        error,
        response,
    } = useSelector(
        (state) => state.sclass
    );

    const {
        currentUser,
    } = useSelector(
        (state) => state.user
    );

    useEffect(() => {

        dispatch(
            getSubjectList(
                currentUser._id,
                "AllSubjects"
            )
        );

    }, [currentUser._id, dispatch]);

    if (error) {
        console.log(error);
    }

    const [showPopup, setShowPopup] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const deleteHandler = (
        deleteID,
        address
    ) => {

        console.log(deleteID);
        console.log(address);

        setMessage(
            "Sorry the delete function has been disabled for now."
        );

        setShowPopup(true);

        /*
        dispatch(deleteUser(deleteID, address))
            .then(() => {
                dispatch(
                    getSubjectList(
                        currentUser._id,
                        "AllSubjects"
                    )
                );
            });
        */

    };

    const subjectColumns = [
        {
            id: "subName",
            label: "Subject",
            minWidth: 170,
        },
        {
            id: "sessions",
            label: "Sessions",
            minWidth: 170,
        },
        {
            id: "sclassName",
            label: "Class",
            minWidth: 170,
        },
    ];

    const subjectRows =
        (subjectsList || []).map((subject) => ({
            subName: subject.subName,
            sessions: subject.sessions,
            sclassName: subject.sclassName.sclassName,
            sclassID: subject.sclassName._id,
            id: subject._id,
        }));

    const SubjectsButtonHaver = ({ row }) => {

        return (

            <Box
                sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                }}
            >

                <IconButton
                    onClick={() =>
                        deleteHandler(
                            row.id,
                            "Subject"
                        )
                    }
                >
                    <DeleteIcon color="error" />
                </IconButton>

                <BlueButton
                    variant="contained"
                    onClick={() =>
                        navigate(
                            `/Admin/subjects/subject/${row.sclassID}/${row.id}`
                        )
                    }
                >
                    View
                </BlueButton>

            </Box>

        );

    };

    const actions = [
        {
            icon: <PostAddIcon color="primary" />,
            name: "Add New Subject",
            action: () =>
                navigate(
                    "/Admin/subjects/chooseclass"
                ),
        },
        {
            icon: <DeleteIcon color="error" />,
            name: "Delete All Subjects",
            action: () =>
                deleteHandler(
                    currentUser._id,
                    "Subjects"
                ),
        },
    ];

    // PART 1B STARTS FROM return(...)

    return (
    <>
        {loading ? (

            <LoadingContainer>

                <CircularProgress
                    size={55}
                    sx={{ color: "#2563EB" }}
                />

            </LoadingContainer>

        ) : response ? (

            <PageWrapper maxWidth="lg">

                <HeroCard elevation={0}>

                    <HeroLeft>

                        <AvatarCircle>

                            <MenuBookRoundedIcon sx={{ fontSize: 42 }} />

                        </AvatarCircle>

                        <Box>

                            <PageTitle>
                                No Subjects Found
                            </PageTitle>

                            <PageSubtitle>
                                Create your first subject to begin assigning teachers and managing classes.
                            </PageSubtitle>

                        </Box>

                    </HeroLeft>

                </HeroCard>

                <ContentCard>

                    <EmptyState>

                        <MenuBookRoundedIcon
                            sx={{
                                fontSize: 70,
                                color: "#2563EB",
                                mb: 2,
                            }}
                        />

                        <Typography
                            variant="h5"
                            fontWeight={700}
                            color="white"
                        >
                            No Subjects Available
                        </Typography>

                        <Typography
                            sx={{
                                color: "#94A3B8",
                                mt: 2,
                                mb: 4,
                                maxWidth: 550,
                                textAlign: "center",
                            }}
                        >
                            Add a subject to start assigning teachers and
                            organizing your academic curriculum.
                        </Typography>

                        <GreenButton
                            variant="contained"
                            onClick={() =>
                                navigate("/Admin/subjects/chooseclass")
                            }
                        >
                            Add Subject
                        </GreenButton>

                    </EmptyState>

                </ContentCard>

            </PageWrapper>

        ) : (

            <PageWrapper maxWidth="lg">

                {/* Hero */}

                <HeroCard elevation={0}>

                    <HeroLeft>

                        <AvatarCircle>

                            <SchoolRoundedIcon
                                sx={{ fontSize: 42 }}
                            />

                        </AvatarCircle>

                        <Box>

                            <PageTitle>

                                Subject Management

                            </PageTitle>

                            <PageSubtitle>

                                Manage all subjects, assign teachers and organize classes from one place.

                            </PageSubtitle>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                mt={3}
                                flexWrap="wrap"
                            >

                                <Chip
                                    color="primary"
                                    label={`${subjectsList?.length || 0} Subjects`}
                                />

                                <Chip
                                color="primary"
                                    icon={<ClassRoundedIcon />}
                                    label="Academic Management"
                                />

                            </Stack>

                        </Box>

                    </HeroLeft>

                    <HeroRight>

                        <DashboardCard>

                            <MenuBookRoundedIcon />

                            <DashboardValue>

                                {subjectsList?.length || 0}

                            </DashboardValue>

                            <DashboardLabel>

                                Total Subjects

                            </DashboardLabel>

                        </DashboardCard>

                    </HeroRight>

                </HeroCard>

                {/* Table */}

                <ContentCard>

                    <SectionHeading>

                        Subject Directory

                    </SectionHeading>

                    <Divider
                        sx={{
                            borderColor: "#1E293B",
                            mb: 3,
                        }}
                    />

                    <TableTemplate
                        buttonHaver={SubjectsButtonHaver}
                        columns={subjectColumns}
                        rows={subjectRows}
                    />

                    <SpeedDialTemplate
                        actions={actions}
                    />

                </ContentCard>

            </PageWrapper>

        )}

        <Popup
            message={message}
            setShowPopup={setShowPopup}
            showPopup={showPopup}
        />

    </>
);
}
export default ShowSubjects


const LoadingContainer = styled(Box)`
    min-height: calc(100vh - 70px);
    display: flex;
    justify-content: center;
    align-items: center;
    background: #070B14;
`;

const PageWrapper = styled(Container)`
    padding-top: 35px;
    padding-bottom: 60px;
`;

const HeroCard = styled(Paper)`
    background: linear-gradient(135deg, #111827, #0F172A) !important;
    border: 1px solid #1E293B;
    border-radius: 28px !important;
    padding: 36px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 30px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 25px 60px rgba(0,0,0,.35);

    &::before{
        content:"";
        position:absolute;
        width:280px;
        height:280px;
        border-radius:50%;
        background:rgba(37,99,235,.08);
        right:-120px;
        top:-120px;
    }

    @media(max-width:900px){
        flex-direction:column;
        align-items:flex-start;
    }
`;

const HeroLeft = styled(Box)`
    display:flex;
    align-items:center;
    gap:24px;
    flex:1;
`;

const HeroRight = styled(Box)`
    display:flex;
    gap:18px;
    flex-wrap:wrap;
`;

const AvatarCircle = styled(Avatar)`
    width:90px !important;
    height:90px !important;
    background:linear-gradient(135deg,#2563EB,#1D4ED8) !important;
    box-shadow:0 15px 35px rgba(37,99,235,.35);
`;

const PageTitle = styled(Typography)`
    color:white;
    font-size:2.2rem !important;
    font-weight:800 !important;
`;

const PageSubtitle = styled(Typography)`
    color:#94A3B8;
    margin-top:10px !important;
    line-height:1.8;
    max-width:650px;
`;

const DashboardCard = styled(Box)`
    min-width:170px;
    background:#111827;
    border:1px solid #1E293B;
    border-radius:22px;
    padding:22px;
    text-align:center;
    transition:.3s;

    svg{
        color:#2563EB;
        font-size:34px;
        margin-bottom:14px;
    }

    &:hover{
        transform:translateY(-6px);
        border-color:#2563EB;
        box-shadow:0 20px 35px rgba(37,99,235,.15);
    }
`;

const DashboardValue = styled(Typography)`
    color:white;
    font-size:1.8rem !important;
    font-weight:800 !important;
`;

const DashboardLabel = styled(Typography)`
    color:#94A3B8;
    margin-top:6px !important;
`;

const ContentCard = styled(Paper)`
    background:#111827 !important;
    border:1px solid #1E293B;
    border-radius:24px !important;
    padding:32px;
    position:relative;
    overflow:hidden;
    box-shadow:0 20px 45px rgba(0,0,0,.25);
`;

const SectionHeading = styled(Typography)`
    color:white;
    font-size:1.45rem !important;
    font-weight:700 !important;
`;

const EmptyState = styled(Box)`
    min-height:420px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    text-align:center;
    padding:40px;
`;