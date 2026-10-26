import {
    TableCell,
    TableRow,
    styled,
    tableCellClasses,
    Drawer as MuiDrawer,
    AppBar as MuiAppBar,
} from "@mui/material";

const drawerWidth = 260;

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderBottom: "1px solid #1E293B",

    [`&.${tableCellClasses.head}`]: {
        background: "#0F172A",
        color: "#F8FAFC",
        fontSize: "0.9rem",
        fontWeight: 700,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        borderBottom: "2px solid #2563EB",
        paddingTop: 18,
        paddingBottom: 18,
    },

    [`&.${tableCellClasses.body}`]: {
        backgroundColor: "#111827",
        color: "#E5E7EB",
        fontSize: "0.92rem",
        fontWeight: 500,
        paddingTop: 16,
        paddingBottom: 16,
        transition: "all .25s ease",
    },
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
    background: "#111827",
    transition: "all .25s ease",

    "&:nth-of-type(odd)": {
        background: "#101827",
    },

    "&:hover": {
        background: "#172554",
        transform: "scale(1.002)",
    },

    "& td": {
        borderBottom: "1px solid #1E293B",
    },

    "&:last-child td, &:last-child th": {
        border: 0,
    },
}));

export const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,

    background: "#0B1220",

    color: "#F8FAFC",

    backdropFilter: "blur(18px)",

    WebkitBackdropFilter: "blur(18px)",

    borderBottom: "1px solid #1E293B",

    boxShadow: "0 8px 30px rgba(0,0,0,.35)",

    transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),

    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,

        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

export const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
    "& .MuiDrawer-paper": {
        position: "relative",

        whiteSpace: "nowrap",

        width: drawerWidth,

        boxSizing: "border-box",

        overflowX: "hidden",

        background: "#0B1220",

        color: "#F8FAFC",

        borderRight: "1px solid #1E293B",

        boxShadow: "8px 0 30px rgba(0,0,0,.35)",

        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),

        "&::-webkit-scrollbar": {
            width: 6,
        },

        "&::-webkit-scrollbar-thumb": {
            background: "#2563EB",
            borderRadius: 10,
        },

        "&::-webkit-scrollbar-track": {
            background: "#0B1220",
        },

        ...(!open && {
            width: theme.spacing(9),

            transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),

            [theme.breakpoints.up("sm")]: {
                width: theme.spacing(10),
            },
        }),
    },
}));