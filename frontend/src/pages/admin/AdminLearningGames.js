import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    InputAdornment,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import FilterAltRounded from "@mui/icons-material/FilterAltRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import ArchiveRounded from "@mui/icons-material/ArchiveRounded";
import BlockRounded from "@mui/icons-material/BlockRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";

import apiClient from "../../utils/apiClient";

const PAGE_SIZE = 25;

const EMPTY_CATALOGUE = {
    activities: [],
    pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 },
    summary: { total: 0, draft: 0, published: 0, archived: 0 },
    filters: { classes: [], subjects: [], teachers: [] },
};

const EMPTY_FILTERS = {
    search: "",
    classId: "",
    subjectId: "",
    teacherId: "",
    status: "all",
    provider: "all",
};

function referenceId(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value._id ? String(value._id) : "";
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function safeExternalUrl(value, isEmbed = false) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "";
        if (isEmbed && (
            !["wordwall.net", "www.wordwall.net"].includes(parsed.hostname) ||
            !/^\/embed\/[^/]+\/?$/.test(parsed.pathname)
        )) return "";
        return parsed.href;
    } catch {
        return "";
    }
}

function StatusChip({ status }) {
    const colors = {
        published: { color: "#34D399", background: "rgba(16,185,129,.12)" },
        draft: { color: "#FBBF24", background: "rgba(245,158,11,.12)" },
        archived: { color: "#94A3B8", background: "rgba(148,163,184,.12)" },
    };
    const style = colors[status] || colors.draft;
    return (
        <Chip
            label={status || "unknown"}
            size="small"
            sx={{
                color: style.color,
                bgcolor: style.background,
                border: "1px solid",
                borderColor: style.color + "44",
                fontWeight: 700,
                textTransform: "capitalize",
                minWidth: 88,
            }}
        />
    );
}

const AdminLearningGames = () => {
    const [catalogue, setCatalogue] = useState(EMPTY_CATALOGUE);
    const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
    const [page, setPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyActivityId, setBusyActivityId] = useState("");
    const [toast, setToast] = useState(null);

    useEffect(() => {
        let active = true;

        const loadCatalogue = async () => {
            setLoading(true);
            setError("");

            const params = { page, limit: PAGE_SIZE };
            Object.entries(appliedFilters).forEach(([key, value]) => {
                if (value && value !== "all") params[key] = value;
            });

            try {
                const response = await apiClient.get("/AdminGameActivityList", { params });
                const result = response && response.data;
                if (!result || !Array.isArray(result.activities) ||
                    !result.pagination || !result.summary || !result.filters) {
                    throw new Error("The server returned an unexpected catalogue response.");
                }

                if (active) {
                    setCatalogue({
                        activities: result.activities,
                        pagination: result.pagination,
                        summary: result.summary,
                        filters: {
                            classes: Array.isArray(result.filters.classes) ? result.filters.classes : [],
                            subjects: Array.isArray(result.filters.subjects) ? result.filters.subjects : [],
                            teachers: Array.isArray(result.filters.teachers) ? result.filters.teachers : [],
                        },
                    });
                }
            } catch (requestError) {
                if (active) {
                    setError(
                        requestError?.response?.data?.message ||
                        requestError?.message ||
                        "Unable to load the school's game catalogue."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadCatalogue();
        return () => {
            active = false;
        };
    }, [appliedFilters, page, refreshKey]);

    const updateDraftFilter = (field) => (event) => {
        setDraftFilters((current) => ({
            ...current,
            [field]: event.target.value,
            ...(field === "classId" ? { subjectId: "" } : {}),
        }));
    };

    const applyFilters = (event) => {
        event.preventDefault();
        setPage(1);
        setAppliedFilters({ ...draftFilters });
    };

    const clearFilters = () => {
        setDraftFilters({ ...EMPTY_FILTERS });
        setAppliedFilters({ ...EMPTY_FILTERS });
        setPage(1);
    };

    const refreshCatalogue = () => setRefreshKey((current) => current + 1);

    const handleAdminAction = async (activity, action) => {
        const isArchive = action === "Archive";
        const description = isArchive
            ? "Archive this published activity? Students will no longer see it."
            : "Unpublish this activity? It will return to draft and disappear from the student catalogue.";
        if (!window.confirm(description)) return;

        setBusyActivityId(activity._id);
        try {
            const endpoint = isArchive
                ? "/AdminGameActivityArchive/"
                : "/AdminGameActivityUnpublish/";
            await apiClient.put(endpoint + activity._id, {});
            setToast({
                severity: "success",
                message: isArchive
                    ? "Game activity archived successfully."
                    : "Game activity unpublished and moved to drafts.",
            });
            refreshCatalogue();
        } catch (requestError) {
            setToast({
                severity: "error",
                message: requestError?.response?.data?.message ||
                    "The game activity could not be updated.",
            });
        } finally {
            setBusyActivityId("");
        }
    };

    const selectedSubjects = draftFilters.classId
        ? catalogue.filters.subjects.filter((subject) =>
            referenceId(subject.sclassName) === draftFilters.classId)
        : catalogue.filters.subjects;

    const totalPages = Math.max(1, catalogue.pagination.totalPages || 1);
    const hasFilters = Object.entries(appliedFilters).some(([key, value]) =>
        key === "search" ? Boolean(value.trim()) : value !== "all" && Boolean(value)
    );

    return (
        <Box sx={{ width: "100%", color: "#F8FAFC", pb: 4 }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "flex-start" }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        sx={{ color: "#F8FAFC", fontWeight: 800, letterSpacing: "-.5px" }}
                    >
                        Learning &amp; Games
                    </Typography>
                    <Typography sx={{ color: "#94A3B8", mt: 0.75 }}>
                        Review your school's Wordwall catalogue and manage published activities.
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<RefreshRounded />}
                    onClick={refreshCatalogue}
                    disabled={loading}
                    sx={{
                        alignSelf: { xs: "flex-start", md: "center" },
                        borderColor: "#334155",
                        color: "#CBD5E1",
                        borderRadius: 2.5,
                        textTransform: "none",
                        fontWeight: 700,
                        "&:hover": { borderColor: "#60A5FA", bgcolor: "rgba(37,99,235,.08)" },
                    }}
                >
                    Refresh
                </Button>
            </Stack>

            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={refreshCatalogue}>
                            Retry
                        </Button>
                    }
                    sx={{ mb: 3, borderRadius: 2 }}
                >
                    {error}
                </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: "All activities", value: catalogue.summary.total, tone: "#60A5FA" },
                    { label: "Published", value: catalogue.summary.published, tone: "#34D399" },
                    { label: "Drafts", value: catalogue.summary.draft, tone: "#FBBF24" },
                    { label: "Archived", value: catalogue.summary.archived, tone: "#94A3B8" },
                ].map((item) => (
                    <Grid item xs={6} md={3} key={item.label}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.25,
                                height: "100%",
                                bgcolor: "#111827",
                                border: "1px solid #1E293B",
                                borderRadius: 3,
                            }}
                        >
                            <Typography sx={{ color: "#94A3B8", fontSize: ".85rem", fontWeight: 600 }}>
                                {item.label}
                            </Typography>
                            <Typography sx={{ color: item.tone, fontSize: "1.8rem", fontWeight: 800, mt: 0.5 }}>
                                {item.value}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Paper
                component="form"
                onSubmit={applyFilters}
                elevation={0}
                sx={{
                    p: { xs: 2, md: 2.5 },
                    mb: 3,
                    bgcolor: "#111827",
                    border: "1px solid #1E293B",
                    borderRadius: 3,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <FilterAltRounded sx={{ color: "#60A5FA" }} />
                    <Typography sx={{ color: "#F8FAFC", fontWeight: 700 }}>
                        Search and filters
                    </Typography>
                </Stack>
                <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            name="search"
                            fullWidth
                            size="small"
                            value={draftFilters.search}
                            onChange={updateDraftFilter("search")}
                            placeholder="Search title, description or topic"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded sx={{ color: "#64748B" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={fieldStyles}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            select
                            name="classId"
                            fullWidth
                            size="small"
                            label="Class"
                            value={draftFilters.classId}
                            onChange={updateDraftFilter("classId")}
                            sx={fieldStyles}
                        >
                            <MenuItem value="">All classes</MenuItem>
                            {catalogue.filters.classes.map((item) => (
                                <MenuItem key={item._id} value={item._id}>{item.sclassName}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            select
                            name="subjectId"
                            fullWidth
                            size="small"
                            label="Subject"
                            value={draftFilters.subjectId}
                            onChange={updateDraftFilter("subjectId")}
                            sx={fieldStyles}
                        >
                            <MenuItem value="">All subjects</MenuItem>
                            {selectedSubjects.map((item) => (
                                <MenuItem key={item._id} value={item._id}>{item.subName}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            select
                            name="teacherId"
                            fullWidth
                            size="small"
                            label="Teacher"
                            value={draftFilters.teacherId}
                            onChange={updateDraftFilter("teacherId")}
                            sx={fieldStyles}
                        >
                            <MenuItem value="">All teachers</MenuItem>
                            {catalogue.filters.teachers.map((item) => (
                                <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            select
                            name="status"
                            fullWidth
                            size="small"
                            label="Status"
                            value={draftFilters.status}
                            onChange={updateDraftFilter("status")}
                            sx={fieldStyles}
                        >
                            <MenuItem value="all">All statuses</MenuItem>
                            <MenuItem value="published">Published</MenuItem>
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="archived">Archived</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            select
                            name="provider"
                            fullWidth
                            size="small"
                            label="Provider"
                            value={draftFilters.provider}
                            onChange={updateDraftFilter("provider")}
                            sx={fieldStyles}
                        >
                            <MenuItem value="all">All providers</MenuItem>
                            <MenuItem value="wordwall">Wordwall</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
                <Stack direction="row" justifyContent="flex-end" spacing={1.25} sx={{ mt: 2 }}>
                    <Button
                        type="button"
                        onClick={clearFilters}
                        sx={{ color: "#94A3B8", textTransform: "none", fontWeight: 700 }}
                    >
                        Clear
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<FilterAltRounded />}
                        disabled={loading}
                        sx={{
                            bgcolor: "#2563EB",
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                            px: 2.5,
                            "&:hover": { bgcolor: "#1D4ED8" },
                        }}
                    >
                        Apply filters
                    </Button>
                </Stack>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    bgcolor: "#111827",
                    border: "1px solid #1E293B",
                    borderRadius: 3,
                    overflow: "hidden",
                }}
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                    sx={{ px: 2.5, py: 2 }}
                >
                    <Box>
                        <Typography sx={{ color: "#F8FAFC", fontWeight: 750 }}>
                            Game catalogue
                        </Typography>
                        <Typography sx={{ color: "#64748B", fontSize: ".82rem", mt: 0.25 }}>
                            {catalogue.pagination.total} matching activities
                        </Typography>
                    </Box>
                    <Chip
                        label="School-scoped"
                        size="small"
                        sx={{
                            bgcolor: "rgba(37,99,235,.12)",
                            color: "#93C5FD",
                            border: "1px solid rgba(96,165,250,.25)",
                            fontWeight: 700,
                        }}
                    />
                </Stack>
                <Divider sx={{ borderColor: "#1E293B" }} />

                {loading ? (
                    <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                        <CircularProgress size={30} sx={{ color: "#60A5FA" }} />
                        <Typography sx={{ color: "#94A3B8", fontSize: ".9rem" }}>
                            Loading game catalogue…
                        </Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ py: 5, px: 3, textAlign: "center" }}>
                        <Typography sx={{ color: "#94A3B8" }}>
                            The catalogue could not be displayed.
                        </Typography>
                    </Box>
                ) : catalogue.activities.length === 0 ? (
                    <Box sx={{ py: 7, px: 3, textAlign: "center" }}>
                        <Typography sx={{ color: "#E2E8F0", fontWeight: 700 }}>
                            {hasFilters ? "No activities match these filters" : "No game activities yet"}
                        </Typography>
                        <Typography sx={{ color: "#64748B", mt: 0.75, fontSize: ".9rem" }}>
                            {hasFilters
                                ? "Try changing or clearing the selected filters."
                                : "Teacher-created Wordwall activities will appear here for review."}
                        </Typography>
                        {hasFilters && (
                            <Button onClick={clearFilters} sx={{ mt: 1.5, color: "#93C5FD", textTransform: "none" }}>
                                Clear filters
                            </Button>
                        )}
                    </Box>
                ) : (
                    <>
                        <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
                            <Table size="small" sx={{ minWidth: 1080 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#0F172A" }}>
                                        {["Activity", "Class / subject", "Created by", "Source URLs", "Status", "Created", "Admin actions"].map((heading) => (
                                            <TableCell
                                                key={heading}
                                                sx={{
                                                    color: "#94A3B8",
                                                    fontSize: ".72rem",
                                                    textTransform: "uppercase",
                                                    letterSpacing: ".6px",
                                                    fontWeight: 800,
                                                    borderColor: "#1E293B",
                                                    py: 1.7,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {heading}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {catalogue.activities.map((activity) => {
                                        const sourceUrl = safeExternalUrl(activity.originalUrl);
                                        const embedUrl = safeExternalUrl(activity.embedUrl, true);
                                        const creatorName = activity.createdByTeacher?.name || "Teacher unavailable";
                                        return (
                                            <TableRow
                                                key={activity._id}
                                                hover
                                                sx={{
                                                    "&:hover": { bgcolor: "rgba(37,99,235,.045) !important" },
                                                    "& td": { borderColor: "#1E293B", color: "#CBD5E1", verticalAlign: "top", py: 1.75 },
                                                }}
                                            >
                                                <TableCell sx={{ minWidth: 190, maxWidth: 260 }}>
                                                    <Typography sx={{ color: "#F8FAFC", fontWeight: 700 }}>
                                                        {activity.title}
                                                    </Typography>
                                                    {activity.topic && (
                                                        <Typography sx={{ color: "#60A5FA", fontSize: ".82rem", mt: 0.35 }}>
                                                            {activity.topic}
                                                        </Typography>
                                                    )}
                                                    {activity.description && (
                                                        <Typography sx={{ color: "#64748B", fontSize: ".78rem", mt: 0.5 }}>
                                                            {activity.description}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 135 }}>
                                                    <Typography sx={{ color: "#E2E8F0", fontWeight: 600, fontSize: ".87rem" }}>
                                                        {activity.class?.sclassName || "Class unavailable"}
                                                    </Typography>
                                                    <Typography sx={{ color: "#94A3B8", fontSize: ".8rem", mt: 0.35 }}>
                                                        {activity.subject?.subName || "Subject unavailable"}
                                                        {activity.subject?.subCode ? " · " + activity.subject.subCode : ""}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 140 }}>
                                                    <Typography sx={{ color: "#E2E8F0", fontSize: ".87rem", fontWeight: 600 }}>
                                                        {creatorName}
                                                    </Typography>
                                                    <Typography sx={{ color: "#64748B", fontSize: ".75rem", mt: 0.35 }}>
                                                        Wordwall
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 145 }}>
                                                    <Stack spacing={0.65} alignItems="flex-start">
                                                        {sourceUrl ? (
                                                            <Button
                                                                component="a"
                                                                href={sourceUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                size="small"
                                                                endIcon={<OpenInNewRounded sx={{ fontSize: 14 }} />}
                                                                sx={{ p: 0, minWidth: 0, color: "#93C5FD", textTransform: "none", fontSize: ".78rem" }}
                                                            >
                                                                Original source
                                                            </Button>
                                                        ) : (
                                                            <Typography sx={{ color: "#64748B", fontSize: ".78rem" }}>
                                                                No source URL
                                                            </Typography>
                                                        )}
                                                        {embedUrl ? (
                                                            <Button
                                                                component="a"
                                                                href={embedUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                size="small"
                                                                endIcon={<OpenInNewRounded sx={{ fontSize: 14 }} />}
                                                                sx={{ p: 0, minWidth: 0, color: "#93C5FD", textTransform: "none", fontSize: ".78rem" }}
                                                            >
                                                                Validated embed
                                                            </Button>
                                                        ) : (
                                                            <Typography sx={{ color: "#64748B", fontSize: ".78rem" }}>
                                                                Invalid embed URL
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 110 }}>
                                                    <StatusChip status={activity.status} />
                                                    {activity.publishedAt && (
                                                        <Typography sx={{ color: "#64748B", fontSize: ".7rem", mt: 0.65 }}>
                                                            Published {formatDate(activity.publishedAt)}
                                                        </Typography>
                                                    )}
                                                    {activity.unpublishedAt && (
                                                        <Typography sx={{ color: "#64748B", fontSize: ".7rem", mt: 0.35 }}>
                                                            Unpublished {formatDate(activity.unpublishedAt)}
                                                        </Typography>
                                                    )}
                                                    {activity.archivedAt && (
                                                        <Typography sx={{ color: "#64748B", fontSize: ".7rem", mt: 0.35 }}>
                                                            Archived {formatDate(activity.archivedAt)}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 145, whiteSpace: "nowrap" }}>
                                                    <Typography sx={{ color: "#CBD5E1", fontSize: ".8rem" }}>
                                                        {formatDate(activity.createdAt)}
                                                    </Typography>
                                                    {activity.updatedAt && activity.updatedAt !== activity.createdAt && (
                                                        <Typography sx={{ color: "#64748B", fontSize: ".72rem", mt: 0.4 }}>
                                                            Updated {formatDate(activity.updatedAt)}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 160 }}>
                                                    {activity.status === "published" ? (
                                                        <Stack spacing={0.8} alignItems="flex-start">
                                                            <Tooltip title="Move this published activity back to draft">
                                                                <span>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        startIcon={<BlockRounded />}
                                                                        disabled={busyActivityId === activity._id}
                                                                        onClick={() => handleAdminAction(activity, "Unpublish")}
                                                                        sx={{
                                                                            borderColor: "#475569",
                                                                            color: "#CBD5E1",
                                                                            textTransform: "none",
                                                                            borderRadius: 2,
                                                                            fontSize: ".76rem",
                                                                            "&:hover": { borderColor: "#60A5FA", bgcolor: "rgba(96,165,250,.08)" },
                                                                        }}
                                                                    >
                                                                        Unpublish
                                                                    </Button>
                                                                </span>
                                                            </Tooltip>
                                                            <Tooltip title="Archive and remove this activity from student listings">
                                                                <span>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="error"
                                                                        startIcon={<ArchiveRounded />}
                                                                        disabled={busyActivityId === activity._id}
                                                                        onClick={() => handleAdminAction(activity, "Archive")}
                                                                        sx={{ textTransform: "none", borderRadius: 2, fontSize: ".76rem" }}
                                                                    >
                                                                        Archive
                                                                    </Button>
                                                                </span>
                                                            </Tooltip>
                                                        </Stack>
                                                    ) : (
                                                        <Typography sx={{ color: "#64748B", fontSize: ".78rem" }}>
                                                            No admin action
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {catalogue.pagination.totalPages > 1 && (
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                justifyContent="space-between"
                                alignItems="center"
                                spacing={1.5}
                                sx={{ px: 2.5, py: 2, borderTop: "1px solid #1E293B" }}
                            >
                                <Typography sx={{ color: "#64748B", fontSize: ".8rem" }}>
                                    Page {catalogue.pagination.page} of {catalogue.pagination.totalPages}
                                </Typography>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(_, nextPage) => setPage(nextPage)}
                                    size="small"
                                    sx={{
                                        "& .MuiPaginationItem-root": { color: "#CBD5E1" },
                                        "& .Mui-selected": { bgcolor: "#1D4ED8 !important", color: "#FFFFFF" },
                                    }}
                                />
                            </Stack>
                        )}
                    </>
                )}
            </Paper>

            <Snackbar
                open={Boolean(toast)}
                autoHideDuration={5000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                {toast ? (
                    <Alert
                        severity={toast.severity}
                        variant="filled"
                        onClose={() => setToast(null)}
                        sx={{ width: "100%" }}
                    >
                        {toast.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </Box>
    );
};

const fieldStyles = {
    "& .MuiOutlinedInput-root": {
        color: "#E2E8F0",
        bgcolor: "#0F172A",
        borderRadius: 2,
        "& fieldset": { borderColor: "#334155" },
        "&:hover fieldset": { borderColor: "#475569" },
        "&.Mui-focused fieldset": { borderColor: "#3B82F6" },
    },
    "& .MuiInputLabel-root": { color: "#94A3B8" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#93C5FD" },
    "& .MuiSelect-icon": { color: "#94A3B8" },
    "& input": { color: "#E2E8F0" },
};

export default AdminLearningGames;
