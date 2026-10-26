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
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";

const API_BASE_URL = (process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");

export function getEntityId(value) {
    if (typeof value === "string") return value;
    return value && typeof value._id === "string" ? value._id : "";
}

export function isOfficialWordwallEmbedUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;

    try {
        const parsed = new URL(value.trim());
        const hostname = parsed.hostname.toLowerCase();
        return parsed.protocol === "https:" &&
            (hostname === "wordwall.net" || hostname === "www.wordwall.net") &&
            !parsed.username &&
            !parsed.password &&
            parsed.pathname.startsWith("/embed/") &&
            !parsed.hash;
    } catch {
        return false;
    }
}

function getErrorMessage(error, fallback) {
    return error?.response?.data?.message || fallback;
}

function getStatusColor(status) {
    if (status === "published") return "success";
    if (status === "archived") return "default";
    return "warning";
}

function getSchoolName(activity) {
    const className = activity?.class?.sclassName;
    const subjectName = activity?.subject?.subName;
    return [className ? `Class ${className}` : "", subjectName || ""]
        .filter(Boolean)
        .join(" • ");
}

const fieldSx = {
    "& .MuiInputLabel-root": { color: "#94A3B8" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#60A5FA" },
    "& .MuiOutlinedInput-root": {
        color: "#F8FAFC",
        borderRadius: "12px",
        backgroundColor: "#0B1220",
        "& fieldset": { borderColor: "#334155" },
        "&:hover fieldset": { borderColor: "#64748B" },
        "&.Mui-focused fieldset": { borderColor: "#2563EB" },
    },
    "& .MuiFormHelperText-root": { color: "#94A3B8" },
};

const surfaceSx = {
    background: "#111827",
    border: "1px solid #1E293B",
    borderRadius: "20px",
};

const TeacherGameZone = () => {
    const currentUser = useSelector((state) => state.user.currentUser);
    const teacherId = getEntityId(currentUser);
    const schoolId = getEntityId(currentUser?.school);

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [busyActivityId, setBusyActivityId] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [previewActivity, setPreviewActivity] = useState(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        topic: "",
        embedUrl: "",
    });

    const loadActivities = useCallback(async () => {
        if (!schoolId || !teacherId) {
            setActivities([]);
            setLoading(false);
            setError("Your teacher or school details are missing. Please sign in again.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({ teacherId });
            const response = await axios.get(
                `${API_BASE_URL}/GameActivityList/${encodeURIComponent(schoolId)}?${params.toString()}`
            );
            setActivities(Array.isArray(response.data) ? response.data : []);
        } catch (requestError) {
            setError(getErrorMessage(
                requestError,
                "Could not load Game Zone activities. Check the backend connection and try again."
            ));
        } finally {
            setLoading(false);
        }
    }, [schoolId, teacherId]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    const activityCounts = useMemo(() => ({
        total: activities.length,
        draft: activities.filter((activity) => activity.status === "draft").length,
        published: activities.filter((activity) => activity.status === "published").length,
        archived: activities.filter((activity) => activity.status === "archived").length,
    }), [activities]);

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
        setError("");
        setNotice("");
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        if (!teacherId || !schoolId) {
            setError("Your teacher or school details are missing. Please sign in again.");
            return;
        }

        if (!isOfficialWordwallEmbedUrl(form.embedUrl)) {
            setError("Enter an HTTPS Wordwall embed URL copied from Wordwall's Embed interface.");
            return;
        }

        setSubmitting(true);
        setError("");
        setNotice("");

        try {
            await axios.post(`${API_BASE_URL}/GameActivityCreate`, {
                teacherId,
                title: form.title.trim(),
                description: form.description.trim(),
                topic: form.topic.trim(),
                embedUrl: form.embedUrl.trim(),
            }, {
                headers: { "Content-Type": "application/json" },
            });

            setForm({ title: "", description: "", topic: "", embedUrl: "" });
            setNotice("Activity saved as a draft. Publish it when it is ready for students.");
            await loadActivities();
        } catch (requestError) {
            setError(getErrorMessage(
                requestError,
                "Could not save the activity. Verify the details and try again."
            ));
        } finally {
            setSubmitting(false);
        }
    };

    const handleTransition = async (activity, nextStatus) => {
        if (!activity?._id || !teacherId) return;

        if (nextStatus === "archived" &&
            !window.confirm("Archive this activity? It will no longer appear in the student Game Zone.")) {
            return;
        }

        setBusyActivityId(activity._id);
        setError("");
        setNotice("");

        const route = nextStatus === "published" ? "GameActivityPublish" : "GameActivityArchive";
        try {
            await axios.put(
                `${API_BASE_URL}/${route}/${encodeURIComponent(activity._id)}`,
                { teacherId },
                { headers: { "Content-Type": "application/json" } }
            );
            setNotice(nextStatus === "published"
                ? `"${activity.title}" is now published for students.`
                : `"${activity.title}" has been archived.`);
            await loadActivities();
        } catch (requestError) {
            setError(getErrorMessage(
                requestError,
                nextStatus === "published"
                    ? "Could not publish this activity. Refresh the list and try again."
                    : "Could not archive this activity. Refresh the list and try again."
            ));
        } finally {
            setBusyActivityId("");
        }
    };

    const statCards = [
        { label: "Total activities", value: activityCounts.total, accent: "#60A5FA" },
        { label: "Drafts", value: activityCounts.draft, accent: "#FBBF24" },
        { label: "Published", value: activityCounts.published, accent: "#34D399" },
        { label: "Archived", value: activityCounts.archived, accent: "#94A3B8" },
    ];

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
                    }}>
                        <SportsEsportsRoundedIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                            Game Zone
                        </Typography>
                        <Typography sx={{ color: "#94A3B8", mt: 0.5 }}>
                            Create, preview and publish interactive Wordwall activities for your class.
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

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {statCards.map((card) => (
                    <Grid item xs={6} sm={3} key={card.label}>
                        <Card elevation={0} sx={{ ...surfaceSx, height: "100%" }}>
                            <CardContent>
                                <Typography sx={{ color: "#94A3B8", fontSize: ".9rem" }}>
                                    {card.label}
                                </Typography>
                                <Typography sx={{ color: card.accent, fontSize: "2rem", fontWeight: 800, mt: 0.5 }}>
                                    {card.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3} alignItems="stretch">
                <Grid item xs={12} lg={4}>
                    <Card component="section" elevation={0} sx={{ ...surfaceSx, height: "100%" }}>
                        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                <AddCircleOutlineRoundedIcon sx={{ color: "#60A5FA" }} />
                                <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                                    Create activity
                                </Typography>
                            </Stack>
                            <Typography sx={{ color: "#94A3B8", fontSize: ".9rem", mb: 2.5 }}>
                                New activities are saved as drafts first. Review the embed and publish when ready.
                            </Typography>
                            <Box component="form" onSubmit={handleCreate}>
                                <Stack spacing={2}>
                                    <TextField
                                        required
                                        fullWidth
                                        name="title"
                                        label="Activity title"
                                        value={form.title}
                                        onChange={handleFieldChange}
                                        inputProps={{ minLength: 2, maxLength: 120 }}
                                        sx={fieldSx}
                                    />
                                    <TextField
                                        fullWidth
                                        name="topic"
                                        label="Topic (optional)"
                                        value={form.topic}
                                        onChange={handleFieldChange}
                                        inputProps={{ maxLength: 160 }}
                                        sx={fieldSx}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        name="description"
                                        label="Description (optional)"
                                        value={form.description}
                                        onChange={handleFieldChange}
                                        inputProps={{ maxLength: 1000 }}
                                        sx={fieldSx}
                                    />
                                    <TextField
                                        required
                                        fullWidth
                                        name="embedUrl"
                                        label="Wordwall embed URL"
                                        placeholder="https://wordwall.net/embed/..."
                                        value={form.embedUrl}
                                        onChange={handleFieldChange}
                                        helperText="Use the HTTPS URL from Wordwall's Embed interface."
                                        sx={fieldSx}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AddCircleOutlineRoundedIcon />}
                                        disabled={submitting || loading}
                                        sx={{
                                            mt: 1,
                                            py: 1.25,
                                            bgcolor: "#2563EB",
                                            borderRadius: "12px",
                                            fontWeight: 700,
                                            textTransform: "none",
                                            "&:hover": { bgcolor: "#1D4ED8" },
                                        }}
                                    >
                                        {submitting ? "Saving..." : "Save as draft"}
                                    </Button>
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={8}>
                    <Box sx={{ ...surfaceSx, p: { xs: 2, md: 3 }, minHeight: 320 }}>
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            flexWrap: "wrap",
                            mb: 2,
                        }}>
                            <Box>
                                <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: 700 }}>
                                    Your activities
                                </Typography>
                                <Typography sx={{ color: "#94A3B8", fontSize: ".9rem", mt: 0.5 }}>
                                    Only published activities appear to students.
                                </Typography>
                            </Box>
                            <Chip
                                label={`${activities.length} total`}
                                sx={{ bgcolor: "#0F172A", border: "1px solid #334155", color: "#CBD5E1" }}
                            />
                        </Box>
                        <Divider sx={{ borderColor: "#1E293B", mb: 2 }} />

                        {loading ? (
                            <Box sx={{ minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <CircularProgress sx={{ color: "#60A5FA" }} />
                            </Box>
                        ) : activities.length === 0 ? (
                            <Box sx={{
                                minHeight: 220,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                gap: 1.5,
                            }}>
                                <SportsEsportsRoundedIcon sx={{ color: "#475569", fontSize: 52 }} />
                                <Typography sx={{ color: "#E2E8F0", fontWeight: 700 }}>
                                    No activities yet
                                </Typography>
                                <Typography sx={{ color: "#94A3B8", maxWidth: 380 }}>
                                    Add a Wordwall embed on the left. It will appear here as a draft until you publish it.
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {activities.map((activity) => (
                                    <Grid item xs={12} md={6} key={activity._id}>
                                        <Card elevation={0} sx={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            bgcolor: "#0B1220",
                                            border: "1px solid #263449",
                                            borderRadius: "16px",
                                        }}>
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                                    <Typography sx={{ color: "#F8FAFC", fontWeight: 700, fontSize: "1.05rem", overflowWrap: "anywhere" }}>
                                                        {activity.title}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={activity.status || "draft"}
                                                        color={getStatusColor(activity.status)}
                                                        sx={{ textTransform: "capitalize", flexShrink: 0 }}
                                                    />
                                                </Stack>
                                                {activity.topic && (
                                                    <Typography sx={{ color: "#60A5FA", fontSize: ".85rem", mt: 1 }}>
                                                        {activity.topic}
                                                    </Typography>
                                                )}
                                                <Typography sx={{ color: "#94A3B8", fontSize: ".9rem", mt: 1.2, overflowWrap: "anywhere" }}>
                                                    {activity.description || "No description provided."}
                                                </Typography>
                                                <Typography sx={{ color: "#64748B", fontSize: ".8rem", mt: 1.5 }}>
                                                    {getSchoolName(activity) || "Class and subject"}
                                                </Typography>
                                            </CardContent>
                                            <Divider sx={{ borderColor: "#1E293B" }} />
                                            <CardActions sx={{ p: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<PlayCircleOutlineRoundedIcon />}
                                                    onClick={() => setPreviewActivity(activity)}
                                                    disabled={!isOfficialWordwallEmbedUrl(activity.embedUrl)}
                                                    sx={{ color: "#93C5FD", textTransform: "none" }}
                                                >
                                                    Preview
                                                </Button>
                                                {activity.status === "draft" && (
                                                    <Button
                                                        size="small"
                                                        startIcon={busyActivityId === activity._id ? <CircularProgress size={14} /> : <CheckCircleOutlineRoundedIcon />}
                                                        onClick={() => handleTransition(activity, "published")}
                                                        disabled={Boolean(busyActivityId)}
                                                        sx={{ color: "#34D399", textTransform: "none" }}
                                                    >
                                                        Publish
                                                    </Button>
                                                )}
                                                {activity.status === "published" && (
                                                    <Button
                                                        size="small"
                                                        startIcon={busyActivityId === activity._id ? <CircularProgress size={14} /> : <ArchiveRoundedIcon />}
                                                        onClick={() => handleTransition(activity, "archived")}
                                                        disabled={Boolean(busyActivityId)}
                                                        sx={{ color: "#FBBF24", textTransform: "none" }}
                                                    >
                                                        Archive
                                                    </Button>
                                                )}
                                                {activity.status === "archived" && (
                                                    <Chip size="small" label="Archived" variant="outlined" sx={{ color: "#94A3B8", borderColor: "#334155" }} />
                                                )}
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                </Grid>
            </Grid>

            <Dialog
                open={Boolean(previewActivity)}
                onClose={() => setPreviewActivity(null)}
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
                    {previewActivity?.title || "Activity preview"}
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: "#263449" }}>
                    {previewActivity && isOfficialWordwallEmbedUrl(previewActivity.embedUrl) ? (
                        <Box sx={{ width: "100%", minHeight: 300 }}>
                            <iframe
                                title={`Wordwall preview: ${previewActivity.title}`}
                                src={previewActivity.embedUrl}
                                loading="lazy"
                                allowFullScreen
                                style={{
                                    width: "100%",
                                    height: "min(65vh, 560px)",
                                    border: 0,
                                    borderRadius: 8,
                                    background: "#FFFFFF",
                                }}
                            />
                        </Box>
                    ) : (
                        <Alert severity="warning">
                            This activity does not contain a supported Wordwall embed URL.
                        </Alert>
                    )}
                    <Typography sx={{ color: "#94A3B8", mt: 1.5, fontSize: ".9rem" }}>
                        Check that the activity loads correctly before publishing it to students.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    {previewActivity?.status === "draft" && (
                        <Button
                            startIcon={<CheckCircleOutlineRoundedIcon />}
                            onClick={() => {
                                const activity = previewActivity;
                                setPreviewActivity(null);
                                handleTransition(activity, "published");
                            }}
                            sx={{ color: "#34D399", textTransform: "none" }}
                        >
                            Publish
                        </Button>
                    )}
                    <Button
                        onClick={() => setPreviewActivity(null)}
                        sx={{ color: "#CBD5E1", textTransform: "none" }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TeacherGameZone;
