import {
    Avatar,
    Box,
    Chip,
    Container,
    Divider,
    Grid,
    Paper,
    Typography
} from "@mui/material";

import {
    EmailRounded,
    SchoolRounded,
    AdminPanelSettingsRounded,
    PersonRounded
} from "@mui/icons-material";

import { useSelector } from "react-redux";

const AdminProfile = () => {

    const { currentUser } = useSelector((state) => state.user);

    const profileItems = [
        {
            icon: <PersonRounded />,
            label: "Administrator Name",
            value: currentUser.name,
        },
        {
            icon: <EmailRounded />,
            label: "Email Address",
            value: currentUser.email,
        },
        {
            icon: <SchoolRounded />,
            label: "School Name",
            value: currentUser.schoolName,
        },
    ];

    return (
        <Container
            maxWidth="md"
            sx={{
                mt: 4,
                mb: 4,
            }}
        >

            <Paper
                elevation={0}
                sx={{
                    bgcolor: "#111827",
                    border: "1px solid #1E293B",
                    borderRadius: "22px",
                    overflow: "hidden",
                }}
            >

                <Box
                    sx={{
                        background:
                            "linear-gradient(135deg,#172554 0%,#111827 100%)",
                        px: 4,
                        py: 5,
                        display: "flex",
                        flexDirection: {
                            xs: "column",
                            md: "row",
                        },
                        alignItems: "center",
                        gap: 3,
                    }}
                >

                    <Avatar
                        sx={{
                            width: 110,
                            height: 110,
                            bgcolor: "#2563EB",
                            color: "#fff",
                            fontSize: "2.8rem",
                            fontWeight: 700,
                            border: "4px solid #FBBF24",
                            boxShadow:
                                "0 10px 25px rgba(0,0,0,.35)",
                        }}
                    >
                        {currentUser?.name?.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box>

                        <Typography
                            variant="h4"
                            sx={{
                                color: "#fff",
                                fontWeight: 700,
                            }}
                        >
                            {currentUser.name}
                        </Typography>

                        <Typography
                            sx={{
                                color: "#CBD5E1",
                                mt: 1,
                            }}
                        >
                            School Administrator
                        </Typography>

                        <Chip
                            icon={
                                <AdminPanelSettingsRounded
                                    sx={{
                                        color: "#FBBF24 !important",
                                    }}
                                />
                            }
                            label="Administrator"
                            sx={{
                                mt: 2,
                                bgcolor: "rgba(251,191,36,.15)",
                                color: "#FBBF24",
                                border:
                                    "1px solid rgba(251,191,36,.35)",
                                fontWeight: 600,
                            }}
                        />

                    </Box>

                </Box>

                <Divider
                    sx={{
                        borderColor: "#1E293B",
                    }}
                />

                <Grid
                    container
                    spacing={3}
                    sx={{
                        p: 4,
                    }}
                >

                    {profileItems.map((item, index) => (

                        <Grid
                            item
                            xs={12}
                            key={index}
                        >

                            <Paper
                                elevation={0}
                                sx={{
                                    bgcolor: "#0F172A",
                                    border:
                                        "1px solid #1E293B",
                                    borderRadius: "16px",
                                    p: 3,
                                    transition: ".3s",

                                    "&:hover": {
                                        borderColor: "#2563EB",
                                        transform:
                                            "translateY(-2px)",
                                    },
                                }}
                            >

                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                    }}
                                >

                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: "14px",
                                            bgcolor:
                                                "rgba(37,99,235,.12)",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            color: "#2563EB",
                                        }}
                                    >
                                        {item.icon}
                                    </Box>

                                    <Box>

                                        <Typography
                                            sx={{
                                                color: "#94A3B8",
                                                fontSize: ".85rem",
                                            }}
                                        >
                                            {item.label}
                                        </Typography>

                                        <Typography
                                            sx={{
                                                color: "#fff",
                                                fontSize: "1.08rem",
                                                fontWeight: 600,
                                                mt: .5,
                                            }}
                                        >
                                            {item.value}
                                        </Typography>

                                    </Box>

                                </Box>

                            </Paper>

                        </Grid>

                    ))}

                </Grid>

            </Paper>

        </Container>
    );
};

export default AdminProfile;