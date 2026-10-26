import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import { getEntityId, isOfficialWordwallEmbedUrl } from "../../utils/wordwallUrl";

const API_BASE_URL = (process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");

const surfaceSx = {
    background: "#111827",
    border: "1px solid #1E293B",
    borderRadius: "20px",
};

const StudentGameZone = () => {
    const currentUser = useSelector((state) => state.user.currentUser);
    const schoolId = getEntityId(currentUser?.school);
    const classId = getEntityId(currentUser?.sclassName);

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedActivity, setSelectedActivity] = useState(null);

    const loadActivities = useCallback(async () => {
        if (!schoolId || !classId) {
            setActivities([]);
            setLoading(false);
            setError("Your school or class details are missing. Please sign in again.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({ classId });
            const response = await axios.get(
                `${API_BASE_URL}/GameActivityList/${encodeURIComponent(schoolId)}?${params.toString()}`
            );

            // Student views must never render drafts/archived records, even if
            // an unexpected response is returned by the server.
            const publishedActivities = Array.isArray(response.data)
                ? response.data.filter((activity) =>
                    activity && activity.status === "published" &&
                    isOfficialWordwallEmbedUrl(activity.embedUrl)
                )
                : [];

            setActivities(publishedActivities);
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                "Could not load games right now. Please try again."
            );
            setActivities([]);
        } finally {
            setLoading(false);
        }
    }, [schoolId, classId]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    const visibleActivities = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return activities;

        return activities.filter((activity) => [
            activity.title,
            activity.description,
            activity.topic,
            activity.subject?.subName,
            activity.class?.sclassName,
        ].some((value) => typeof value === "string" && value.toLowerCase().includes(term)));
    }, [activities, search]);

    const subjectsCount = useMemo(
        () => new Set(activities.map((activity) => activity.subject?.subName).filter(Boolean)).size,
        [activities]
    );

    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, color: "#F8FAFC" }}>
            <Box
                sx={{
                    ...surfaceSx,
                    p: { xs: 2.5, md: 3.5 },
                    mb: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{
                        width: 58,
                        height: 58,
                        borderRadius: "16px",
                        bgcolor: "rgba(37,99,235,.18)",
                        color: "#60A5FA",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <SportsEsportsRoundedIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ color: "#FFFFFF", fontWeight: 800 }}>
                            Game Zone
                        </Typography>
                        <Typography sx={{ color: "#94A3B8", mt: 0.5 }}>
                            Learn by playing. Explore the games your teachers have published for your class.
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={loadActivities}
                    disabled={loading}
                    sx={{
                        borderColor: "#334155",
                        color: "#E2E8F0",
                        borderRadius: "12px",
                        textTransform: "none",
                    }}
                >
                    Refresh
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={4}>
                    <Box sx={{ ...surfaceSx, p: 2.5, height: "100%" }}>
                        <Typography sx={{ color: "#94A3B8", fontSize: ".9rem" }}>
                            Games available
                        </Typography>
                        <Typography sx={{ color: "#60A5FA", fontWeight: 800, fontSize: "2rem", mt: 0.5 }}>
                            {activities.length}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sm={4}>
                    <Box sx={{ ...surfaceSx, p: 2.5, height: "100%" }}>
                        <Typography sx={{ color: "#94A3B8", fontSize: ".9rem" }}>
                            Subjects covered
                        </Typography>
                        <Typography sx={{ color: "#34D399", fontWeight: 800, fontSize: "2rem", mt: 0.5 }}>
                            {subjectsCount}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box sx={{ ...surfaceSx, p: 2.5, height: "100%" }}>
                        <Typography sx={{ color: "#94A3B8", fontSize: ".9rem" }}>
                            Your class
                        </Typography>
                        <Typography sx={{ color: "#FBBF24", fontWeight: 800, fontSize: "1.45rem", mt: 1 }}>
                            {currentUser?.sclassName?.sclassName || "Class activities"}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ ...surfaceSx, p: { xs: 2, md: 3 } }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                    spacing={2}
                    sx={{ mb: 2.5 }}
                >
                    <Box>
                        <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                            Published games
                        </Typography>
                        <Typography sx={{ color: "#94A3B8", mt: 0.5, fontSize: ".9rem" }}>
                            These activities are selected by your teachers for classroom practice.
                        </Typography>
                    </Box>
                    <TextField
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search games or topics"
                        aria-label="Search games or topics"
                        size="small"
                        InputProps={{
                            startAdornment: <SearchRoundedIcon sx={{ color: "#64748B", mr: 1 }} />,
                        }}
                        sx={{
                            minWidth: { xs: "100%", sm: 270 },
                            "& .MuiOutlinedInput-root": {
                                color: "#F8FAFC",
                                borderRadius: "12px",
                                bgcolor: "#0B1220",
                                "& fieldset": { borderColor: "#334155" },
                            },
                            "& input::placeholder": { color: "#94A3B8", opacity: 1 },
                        }}
                    />
                </Stack>
                <Divider sx={{ borderColor: "#1E293B", mb: 2.5 }} />

                {loading ? (
                    <Box sx={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CircularProgress sx={{ color: "#60A5FA" }} />
                    </Box>
                ) : visibleActivities.length === 0 ? (
                    <Box sx={{
                        minHeight: 240,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: 1.5,
                        px: 2,
                    }}>
                        <SportsEsportsRoundedIcon sx={{ color: "#475569", fontSize: 56 }} />
                        <Typography sx={{ color: "#E2E8F0", fontWeight: 700, fontSize: "1.1rem" }}>
                            {search.trim() ? "No games match your search" : "No games published yet"}
                        </Typography>
                        <Typography sx={{ color: "#94A3B8", maxWidth: 450, lineHeight: 1.7 }}>
                            {search.trim()
                                ? "Try another title, topic, or subject."
                                : "When your teacher publishes a game for your class, it will appear here."}
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {visibleActivities.map((activity) => (
                            <Grid item xs={12} sm={6} lg={4} key={activity._id}>
                                <Card elevation={0} sx={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    bgcolor: "#0B1220",
                                    border: "1px solid #263449",
                                    borderRadius: "16px",
                                    transition: "border-color .2s ease, transform .2s ease",
                                    "&:hover": { borderColor: "#2563EB", transform: "translateY(-3px)" },
                                }}>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                            <Typography sx={{
                                                color: "#F8FAFC",
                                                fontWeight: 700,
                                                fontSize: "1.05rem",
                                                overflowWrap: "anywhere",
                                            }}>
                                                {activity.title}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label="Published"
                                                sx={{ bgcolor: "rgba(16,185,129,.12)", color: "#34D399", flexShrink: 0 }}
                                            />
                                        </Stack>
                                        {activity.topic && (
                                            <Typography sx={{ color: "#60A5FA", mt: 1.2, fontSize: ".85rem" }}>
                                                {activity.topic}
                                            </Typography>
                                        )}
                                        <Typography sx={{ color: "#94A3B8", mt: 1.2, fontSize: ".92rem", lineHeight: 1.7, overflowWrap: "anywhere" }}>
                                            {activity.description || "A practice activity prepared by your teacher."}
                                        </Typography>
                                        <Typography sx={{ color: "#64748B", mt: 1.5, fontSize: ".82rem" }}>
                                            {[activity.subject?.subName, activity.createdByTeacher?.name]
                                                .filter(Boolean)
                                                .join(" • ")}
                                        </Typography>
                                    </CardContent>
                                    <Divider sx={{ borderColor: "#1E293B" }} />
                                    <CardActions sx={{ p: 1.5 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={<PlayCircleOutlineRoundedIcon />}
                                            onClick={() => setSelectedActivity(activity)}
                                            sx={{
                                                bgcolor: "#2563EB",
                                                borderRadius: "11px",
                                                textTransform: "none",
                                                fontWeight: 700,
                                                py: 1,
                                                "&:hover": { bgcolor: "#1D4ED8" },
                                            }}
                                        >
                                            Play game
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            <Dialog
                open={Boolean(selectedActivity)}
                onClose={() => setSelectedActivity(null)}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        bgcolor: "#111827",
                        color: "#F8FAFC",
                        border: "1px solid #334155",
                        borderRadius: "18px",
                    },
                }}
            >
                <DialogTitle sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                    {selectedActivity?.title || "Play game"}
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: "#263449" }}>
                    {selectedActivity && isOfficialWordwallEmbedUrl(selectedActivity.embedUrl) ? (
                        <Box sx={{ width: "100%", minHeight: 300 }}>
                            <iframe
                                title={`Wordwall game: ${selectedActivity.title}`}
                                src={selectedActivity.embedUrl}
                                loading="lazy"
                                allowFullScreen
                                style={{
                                    width: "100%",
                                    height: "min(68vh, 600px)",
                                    border: 0,
                                    borderRadius: 8,
                                    background: "#FFFFFF",
                                }}
                            />
                        </Box>
                    ) : (
                        <Alert severity="warning">
                            This game does not contain a supported Wordwall embed URL.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSelectedActivity(null)} sx={{ color: "#CBD5E1", textTransform: "none" }}>
                        Close game
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default StudentGameZone;
