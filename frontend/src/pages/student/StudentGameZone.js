import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../utils/apiClient";
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
import WordwallEmbed from "../../components/WordwallEmbed";

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
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
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
            const response = await apiClient.get(
                `/GameActivityList/${encodeURIComponent(schoolId)}?${params.toString()}`
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
            setSelectedActivity((current) =>
                current
                    ? publishedActivities.find((activity) => activity._id === current._id) || null
                    : null
            );
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

    const subjectOptions = useMemo(() => {
        const uniqueSubjects = new Map();

        activities.forEach((activity) => {
            const subjectId = getEntityId(activity.subject);
            const subjectName = typeof activity.subject?.subName === "string"
                ? activity.subject.subName.trim()
                : "";

            if (subjectId && subjectName && !uniqueSubjects.has(subjectId)) {
                uniqueSubjects.set(subjectId, {
                    id: subjectId,
                    name: subjectName,
                });
            }
        });

        return Array.from(uniqueSubjects.values()).sort((left, right) =>
            left.name.localeCompare(right.name)
        );
    }, [activities]);

    const visibleActivities = useMemo(() => {
        const term = search.trim().toLowerCase();

        return activities.filter((activity) => {
            const matchesSearch = !term || [
                activity.title,
                activity.description,
                activity.topic,
                activity.subject?.subName,
                activity.class?.sclassName,
            ].some((value) =>
                typeof value === "string" && value.toLowerCase().includes(term)
            );

            const matchesSubject = !selectedSubjectId ||
                getEntityId(activity.subject) === selectedSubjectId;

            return matchesSearch && matchesSubject;
        });
    }, [activities, search, selectedSubjectId]);

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
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                        <TextField
                            name="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search games or topics"
                            aria-label="Search games or topics"
                            size="small"
                            InputProps={{
                                startAdornment: <SearchRoundedIcon sx={{ color: "#64748B", mr: 1 }} />,
                            }}
                            sx={{
                                minWidth: { xs: "100%", sm: 250 },
                                "& .MuiOutlinedInput-root": {
                                    color: "#F8FAFC",
                                    borderRadius: "12px",
                                    bgcolor: "#0B1220",
                                    "& fieldset": { borderColor: "#334155" },
                                },
                                "& input::placeholder": { color: "#94A3B8", opacity: 1 },
                            }}
                        />
                        <TextField
                            select
                            native
                            name="subjectFilter"
                            label="Filter by subject"
                            value={selectedSubjectId}
                            onChange={(event) => setSelectedSubjectId(event.target.value)}
                            size="small"
                            SelectProps={{ native: true }}
                            sx={{
                                minWidth: { xs: "100%", sm: 210 },
                                "& .MuiOutlinedInput-root": {
                                    color: "#F8FAFC",
                                    borderRadius: "12px",
                                    bgcolor: "#0B1220",
                                    "& fieldset": { borderColor: "#334155" },
                                },
                                "& .MuiNativeSelect-select": { color: "#F8FAFC" },
                            }}
                        >
                            <option value="">All subjects</option>
                            {subjectOptions.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </TextField>
                    </Stack>
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
                            {activities.length === 0
                                ? "No games published yet"
                                : selectedSubjectId && !search.trim()
                                    ? "No games for this subject"
                                    : "No games match your filters"}
                        </Typography>
                        <Typography sx={{ color: "#94A3B8", maxWidth: 450, lineHeight: 1.7 }}>
                            {activities.length === 0
                                ? "When your teacher publishes a game for your class, it will appear here."
                                : "Try another title or topic, choose a different subject, or clear your filters."}
                        </Typography>
                        {(search.trim() || selectedSubjectId) && (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSearch("");
                                    setSelectedSubjectId("");
                                }}
                                sx={{
                                    mt: 0.5,
                                    color: "#BFDBFE",
                                    borderColor: "#334155",
                                    textTransform: "none",
                                }}
                            >
                                Clear filters
                            </Button>
                        )}
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
                    {selectedActivity ? (
                        <>
                            <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                    {selectedActivity.topic && (
                                        <Chip
                                            size="small"
                                            label={`Topic: ${selectedActivity.topic}`}
                                            sx={{ bgcolor: "rgba(37,99,235,.14)", color: "#93C5FD" }}
                                        />
                                    )}
                                    {selectedActivity.subject?.subName && (
                                        <Chip
                                            size="small"
                                            label={`Subject: ${selectedActivity.subject.subName}`}
                                            sx={{ bgcolor: "rgba(16,185,129,.12)", color: "#6EE7B7" }}
                                        />
                                    )}
                                    <Chip
                                        size="small"
                                        label={`Class: ${selectedActivity.class?.sclassName || currentUser?.sclassName?.sclassName || "Your class"}`}
                                        sx={{ bgcolor: "rgba(148,163,184,.12)", color: "#CBD5E1" }}
                                    />
                                </Stack>
                                <Typography sx={{ color: "#CBD5E1", lineHeight: 1.7, overflowWrap: "anywhere" }}>
                                    {selectedActivity.description || "A practice activity prepared by your teacher."}
                                </Typography>
                                {selectedActivity.createdByTeacher?.name && (
                                    <Typography sx={{ color: "#94A3B8", fontSize: ".85rem" }}>
                                        Shared by {selectedActivity.createdByTeacher.name}
                                    </Typography>
                                )}
                            </Stack>
                            <Divider sx={{ borderColor: "#263449", mb: 2 }} />
                            <WordwallEmbed
                                title={`Wordwall game: ${selectedActivity.title}`}
                                embedUrl={selectedActivity.embedUrl}
                            />
                        </>
                    ) : (
                        <Alert severity="warning">
                            Select a game to start playing.
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
