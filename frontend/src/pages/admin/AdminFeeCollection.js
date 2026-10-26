import React, {
    useMemo,
    useState,
} from "react";

import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    TextField,
    MenuItem,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
} from "@mui/material";

import {
    SearchRounded,
    PictureAsPdfRounded,
    ReceiptLongRounded,
    PaidRounded,
    WarningAmberRounded,
    GroupsRounded,
    AccountBalanceWalletRounded,
} from "@mui/icons-material";

import {
    Table,
    TableBody,
    TableHead,
} from "@mui/material";

import {
    StyledTableCell,
    StyledTableRow,
} from "../../components/styles";

import styled from "styled-components";

import CountUp from "react-countup";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ========================================================= */
/* Dummy Data */
/* ========================================================= */

const feeData = [

    {
        id: 1,
        name: "Rahul Sharma",
        roll: "101",
        class: "CSE-2A",
        amount: 45000,
        mode: "UPI",
        date: "12 Jul 2026",
        status: "Paid",
    },

    {
        id: 2,
        name: "Ayush Verma",
        roll: "102",
        class: "CSE-2A",
        amount: 45000,
        mode: "Cash",
        date: "15 Jul 2026",
        status: "Pending",
    },

    {
        id: 3,
        name: "Ankit Singh",
        roll: "103",
        class: "CSE-2B",
        amount: 43000,
        mode: "Card",
        date: "17 Jul 2026",
        status: "Paid",
    },

    {
        id: 4,
        name: "Neha Gupta",
        roll: "104",
        class: "ME-2A",
        amount: 40000,
        mode: "UPI",
        date: "18 Jul 2026",
        status: "Overdue",
    },

    {
        id: 5,
        name: "Sahil Jain",
        roll: "105",
        class: "EE-2A",
        amount: 39000,
        mode: "Net Banking",
        date: "20 Jul 2026",
        status: "Paid",
    },

    {
        id: 6,
        name: "Priya Kumari",
        roll: "106",
        class: "CSE-2B",
        amount: 42000,
        mode: "Cash",
        date: "22 Jul 2026",
        status: "Paid",
    },

    {
        id: 7,
        name: "Rohit Kumar",
        roll: "107",
        class: "ME-2A",
        amount: 41000,
        mode: "UPI",
        date: "25 Jul 2026",
        status: "Pending",
    },

    {
        id: 8,
        name: "Vikas Raj",
        roll: "108",
        class: "EE-2A",
        amount: 39000,
        mode: "Card",
        date: "26 Jul 2026",
        status: "Paid",
    },

];

/* ========================================================= */

const AdminFeeCollection = () => {

    const [search, setSearch] =
        useState("");

    const [selectedClass, setSelectedClass] =
        useState("All");

    const [selectedStatus, setSelectedStatus] =
        useState("All");

    const [receiptOpen, setReceiptOpen] =
        useState(false);

    const [selectedStudent, setSelectedStudent] =
        useState(null);

    const classes = [

        "All",

        ...new Set(
            feeData.map(
                (item) => item.class
            )
        ),

    ];

    const statuses = [

        "All",

        "Paid",

        "Pending",

        "Overdue",

    ];

    const filteredData = useMemo(() => {

        return feeData.filter((student) => {

            const matchesSearch =

                student.name
                    .toLowerCase()
                    .includes(search.toLowerCase())

                ||

                student.roll.includes(search);

            const matchesClass =

                selectedClass === "All"

                ||

                student.class === selectedClass;

            const matchesStatus =

                selectedStatus === "All"

                ||

                student.status === selectedStatus;

            return (

                matchesSearch

                &&

                matchesClass

                &&

                matchesStatus

            );

        });

    }, [

        search,

        selectedClass,

        selectedStatus,

    ]);

    const totalCollection = feeData
        .filter((s) => s.status === "Paid")
        .reduce((a, b) => a + b.amount, 0);

    const pendingAmount = feeData
        .filter((s) => s.status !== "Paid")
        .reduce((a, b) => a + b.amount, 0);

    const paidStudents =
        feeData.filter(
            (s) => s.status === "Paid"
        ).length;

    const pendingStudents =
        feeData.filter(
            (s) => s.status !== "Paid"
        ).length;

   const exportPDF = () => {

    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const today = new Date();

    const reportID =
        "FCR-" +
        today.getFullYear() +
        "-" +
        Math.floor(1000 + Math.random() * 9000);

    const generatedDate =
        today.toLocaleDateString();

    const generatedTime =
        today.toLocaleTimeString();

    //----------------------------------------------------
    // Header Background
    //----------------------------------------------------

    doc.setFillColor(17, 24, 39);

    doc.rect(
        0,
        0,
        pageWidth,
        32,
        "F"
    );

    //----------------------------------------------------
    // School Name
    //----------------------------------------------------

    doc.setFont("helvetica", "bold");

    doc.setTextColor(255,255,255);

    doc.setFontSize(22);

    doc.text(
        "SCHOOL MANAGEMENT SYSTEM",
        pageWidth / 2,
        12,
        {
            align:"center"
        }
    );

    doc.setFontSize(12);

    doc.setFont("helvetica","normal");

    doc.text(
        "Fee Collection Report",
        pageWidth / 2,
        20,
        {
            align:"center"
        }
    );

    doc.setFontSize(10);

    doc.text(
        `${generatedDate}   •   ${generatedTime}`,
        pageWidth / 2,
        27,
        {
            align:"center"
        }
    );

    //----------------------------------------------------
    // Report Details
    //----------------------------------------------------

    let y = 42;

    doc.setTextColor(40);

    doc.setFont("helvetica","bold");

    doc.setFontSize(13);

    doc.text(
        "REPORT INFORMATION",
        14,
        y
    );

    y += 1;

    doc.setFontSize(10);

    doc.setFont("helvetica","normal");

    

    y += 3;

    doc.text(
        "Generated By : Administrator",
        14,
        y
    );

    y += 8;

    doc.setDrawColor(210);

    doc.line(
        14,
        y-3,
        pageWidth-14,
        y-3
    );

    y += 6;

    doc.text(
        `Total Records : ${filteredData.length}`,
        14,
        y
    );

    //----------------------------------------------------
    // Executive Summary
    //----------------------------------------------------

    y += 12;

    doc.setFont("helvetica","bold");

    doc.setFontSize(13);

    doc.text(
        "EXECUTIVE SUMMARY",
        14,
        y
    );

    y += 8;

    doc.setDrawColor(210);

    doc.line(
        14,
        y-3,
        pageWidth-14,
        y-3
    );

    doc.setFont("helvetica","normal");

    doc.setFontSize(10);

    //----------------------------------------------------
    // Left Column
    //----------------------------------------------------

    doc.text(
        "Total Students",
        16,
        y+5
    );

    doc.text(
        String(feeData.length),
        70,
        y+5
    );

    doc.text(
        "Paid Students",
        16,
        y+12
    );

    doc.text(
        String(paidStudents),
        70,
        y+12
    );

    doc.text(
        "Pending Students",
        16,
        y+19
    );

    doc.text(
        String(pendingStudents),
        70,
        y+19
    );

    //----------------------------------------------------
    // Right Column
    //----------------------------------------------------

    doc.text(
        "Total Collection",
        110,
        y+5
    );

    doc.text(
        `Rs. ${totalCollection.toLocaleString()}`,
        185,
        y+5,
        {
            align:"right"
        }
    );

    doc.text(
        "Pending Amount",
        110,
        y+12
    );

    doc.text(
        `Rs. ${pendingAmount.toLocaleString()}`,
        185,
        y+12,
        {
            align:"right"
        }
    );

    doc.text(
        "Collection Rate",
        110,
        y+19
    );

    doc.text(
        `${(
            (paidStudents / feeData.length) *
            100
        ).toFixed(1)} %`,
        185,
        y+19,
        {
            align:"right"
        }
    );

    //----------------------------------------------------
    // Divider before table
    //----------------------------------------------------

    y += 30;

    doc.setFont("helvetica","bold");

    doc.setFontSize(13);

    doc.text(
        "FEE COLLECTION DETAILS",
        14,
        y
    );

    y += 6;

    //----------------------------------------------------
// Fee Collection Table
//----------------------------------------------------

autoTable(doc, {

    startY: y,

    theme: "striped",

    head: [[

        "Roll",

        "Student Name",

        "Class",

        "Amount",

        "Mode",

        "Status",

        "Date",

    ]],

    body: filteredData.map((student) => [

        student.roll,

        student.name,

        student.class,

        `Rs. ${student.amount.toLocaleString()}`,

        student.mode,

        student.status,

        student.date,

    ]),

    styles: {

        font: "helvetica",

        fontSize: 9,

        cellPadding: 3,

        overflow: "linebreak",

        valign: "middle",

        textColor: [40, 40, 40],

    },

    headStyles: {

        fillColor: [37, 99, 235],

        textColor: [255,255,255],

        fontStyle: "bold",

        halign: "center",

        fontSize: 10,

    },

    alternateRowStyles: {

        fillColor: [248,250,252],

    },

    bodyStyles: {

        halign: "center",

    },

    //------------------------------------------------
    // Proper Column Widths
    //------------------------------------------------

    columnStyles: {

        0: {

            cellWidth: 18,

        },

        1: {

            cellWidth: 55,

            halign: "left",

        },

        2: {

            cellWidth: 24,

        },

        3: {

            cellWidth: 30,

            halign: "right",

        },

        4: {

            cellWidth: 24,

        },

        5: {

            cellWidth: 22,

            fontStyle: "bold",

        },

        6: {

            cellWidth: 24,

        },

    },

    //------------------------------------------------
    // Color Paid / Pending / Overdue
    //------------------------------------------------

    didParseCell: function(data){

        if(

            data.section==="body"

            &&

            data.column.index===5

        ){

            if(data.cell.raw==="Paid"){

                data.cell.styles.textColor=[16,185,129];

            }

            else if(data.cell.raw==="Pending"){

                data.cell.styles.textColor=[245,158,11];

            }

            else{

                data.cell.styles.textColor=[239,68,68];

            }

        }

    },

    //------------------------------------------------
    // Header & Footer on Every Page
    //------------------------------------------------

    didDrawPage: function () {

        doc.setFontSize(9);

        doc.setTextColor(120);

     

        doc.text(

            `Page ${doc.internal.getNumberOfPages()}`,

            pageWidth-14,

            pageHeight-8,

            {

                align:"right"

            }

        );

    }

});

//----------------------------------------------------
// Continue after the table
//----------------------------------------------------

let finalY = doc.lastAutoTable.finalY + 15;

// ============================
// PART 3 STARTS HERE
// Financial Summary
// ============================
//----------------------------------------------------
// Financial Summary
//----------------------------------------------------

doc.setFont("helvetica", "bold");
doc.setFontSize(13);
doc.setTextColor(30);

doc.text(
    "FINANCIAL SUMMARY",
    14,
    finalY
);

finalY += 8;

doc.setDrawColor(200);

doc.line(
    14,
    finalY - 3,
    pageWidth - 14,
    finalY - 3
);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);

doc.text(
    "Total Fee Collection",
    16,
    finalY + 5
);

doc.text(
    `Rs. ${totalCollection.toLocaleString()}`,
    185,
    finalY + 5,
    {
        align: "right",
    }
);

doc.text(
    "Pending Fee Amount",
    16,
    finalY + 12
);

doc.text(
    `Rs. ${pendingAmount.toLocaleString()}`,
    185,
    finalY + 12,
    {
        align: "right",
    }
);

doc.text(
    "Overall Fee Amount",
    16,
    finalY + 19
);

doc.text(
    `Rs. ${(totalCollection + pendingAmount).toLocaleString()}`,
    185,
    finalY + 19,
    {
        align: "right",
    }
);

doc.text(
    "Collection Efficiency",
    16,
    finalY + 26
);

doc.text(
    `${(
        (paidStudents / feeData.length) *
        100
    ).toFixed(1)} %`,
    185,
    finalY + 26,
    {
        align: "right",
    }
);

finalY += 40;

//----------------------------------------------------
// Remarks
//----------------------------------------------------

doc.setFont("helvetica", "bold");
doc.setFontSize(12);

doc.text(
    "REMARKS",
    14,
    finalY
);

finalY += 8;

doc.setFont("helvetica", "normal");
doc.setFontSize(10);

doc.text(
    "• This report contains the current fee collection status of all displayed students.",
    16,
    finalY
);

finalY += 6;

doc.text(
    "• Pending fees should be collected before the due date.",
    16,
    finalY
);

finalY += 6;

doc.text(
    "• This report is generated automatically by the School Management ERP.",
    16,
    finalY
);

finalY += 24;

//----------------------------------------------------
// Signature Section
//----------------------------------------------------

doc.setDrawColor(100);

doc.line(
    20,
    finalY,
    75,
    finalY
);

doc.line(
    pageWidth - 75,
    finalY,
    pageWidth - 20,
    finalY
);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);

doc.text(
    "Accountant",
    47,
    finalY + 6,
    {
        align: "center",
    }
);

doc.text(
    "Principal",
    pageWidth - 47,
    finalY + 6,
    {
        align: "center",
    }
);






//----------------------------------------------------
// Save PDF
//----------------------------------------------------

doc.save(
    `Fee_Collection_Report_${reportID}.pdf`
);

};

    const openReceipt = (student) => {

        setSelectedStudent(student);

        setReceiptOpen(true);

    };

    const closeReceipt = () => {

        setReceiptOpen(false);

    };

    // =========================================================
    // PART 2 STARTS FROM return (
    // =========================================================

    return (

<PageContainer>

    {/* ================================================= */}
    {/* Header */}
    {/* ================================================= */}

    <HeaderSection>

        <Box>

            <PageTitle>
                Fee Collection
            </PageTitle>

            <PageSubtitle>
                Manage student fee payments, monitor collections,
                generate reports and track pending payments.
            </PageSubtitle>

        </Box>

        <Button
            variant="contained"
            startIcon={<PictureAsPdfRounded />}
            onClick={exportPDF}
            sx={{
                bgcolor: "#DC2626",
                px: 3,
                py: 1.3,
                borderRadius: "12px",
                fontWeight: 700,

                "&:hover": {
                    bgcolor: "#B91C1C",
                },
            }}
        >
            Export PDF
        </Button>

    </HeaderSection>

    {/* ================================================= */}
    {/* Statistics */}
    {/* ================================================= */}

    <Grid
        container
        spacing={3}
        sx={{
            mb: 4,
        }}
    >

        <Grid item xs={12} sm={6} lg={3}>

            <StatCard>

                <IconBox
                    bg="rgba(16,185,129,.12)"
                    color="#10B981"
                >
                    <PaidRounded />
                </IconBox>

                <Box>

                    <CardLabel>
                        Total Collection
                    </CardLabel>

                    <CardValue>

                        ₹

                        <CountUp
                            end={totalCollection}
                            separator=","
                            duration={2}
                        />

                    </CardValue>

                </Box>

            </StatCard>

        </Grid>

        <Grid item xs={12} sm={6} lg={3}>

            <StatCard>

                <IconBox
                    bg="rgba(245,158,11,.12)"
                    color="#F59E0B"
                >
                    <AccountBalanceWalletRounded />
                </IconBox>

                <Box>

                    <CardLabel>
                        Pending Fees
                    </CardLabel>

                    <CardValue>

                        ₹

                        <CountUp
                            end={pendingAmount}
                            separator=","
                            duration={2}
                        />

                    </CardValue>

                </Box>

            </StatCard>

        </Grid>

        <Grid item xs={12} sm={6} lg={3}>

            <StatCard>

                <IconBox
                    bg="rgba(37,99,235,.12)"
                    color="#60A5FA"
                >
                    <GroupsRounded />
                </IconBox>

                <Box>

                    <CardLabel>
                        Students Paid
                    </CardLabel>

                    <CardValue>

                        <CountUp
                            end={paidStudents}
                            duration={2}
                        />

                    </CardValue>

                </Box>

            </StatCard>

        </Grid>

        <Grid item xs={12} sm={6} lg={3}>

            <StatCard>

                <IconBox
                    bg="rgba(239,68,68,.12)"
                    color="#EF4444"
                >
                    <WarningAmberRounded />
                </IconBox>

                <Box>

                    <CardLabel>
                        Pending Students
                    </CardLabel>

                    <CardValue>

                        <CountUp
                            end={pendingStudents}
                            duration={2}
                        />

                    </CardValue>

                </Box>

            </StatCard>

        </Grid>

    </Grid>

    {/* ================================================= */}
    {/* Search & Filters */}
    {/* ================================================= */}

    <FilterCard>

        <Grid
            container
            spacing={2}
            alignItems="center"
        >

            <Grid item xs={12} md={5}>

                <StyledTextField
                    fullWidth
                    placeholder="Search student name or roll..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">

                                <SearchRounded
                                    sx={{
                                        color: "#60A5FA",
                                    }}
                                />

                            </InputAdornment>
                        ),
                    }}
                />

            </Grid>

            <Grid item xs={12} md={3}>

                <StyledTextField
                    select
                    fullWidth
                    value={selectedClass}
                    onChange={(e)=>
                        setSelectedClass(
                            e.target.value
                        )
                    }
                >

                    {classes.map((item)=>(
                        <MenuItem
                            key={item}
                            value={item}
                        >
                            {item}
                        </MenuItem>
                    ))}

                </StyledTextField>

            </Grid>

            <Grid item xs={12} md={2}>

                <StyledTextField
                    select
                    fullWidth
                    value={selectedStatus}
                    onChange={(e)=>
                        setSelectedStatus(
                            e.target.value
                        )
                    }
                >

                    {statuses.map((item)=>(
                        <MenuItem
                            key={item}
                            value={item}
                        >
                            {item}
                        </MenuItem>
                    ))}

                </StyledTextField>

            </Grid>

            <Grid item xs={12} md={2}>

                <Typography
                    sx={{
                        color:"#94A3B8",
                        textAlign:"center",
                        fontWeight:600,
                    }}
                >
                    {filteredData.length}
                    <br/>
                    Records
                </Typography>

            </Grid>

        </Grid>

    </FilterCard>

    {/* ================================================= */}
    {/* PART 3 STARTS HERE */}

    <MainTableCard>

    <Table>

        <TableHead>

            <StyledTableRow>

                <StyledTableCell>Name</StyledTableCell>

                <StyledTableCell>Roll No.</StyledTableCell>

                <StyledTableCell>Class</StyledTableCell>

                <StyledTableCell align="center">
                    Amount
                </StyledTableCell>

                <StyledTableCell align="center">
                    Payment Mode
                </StyledTableCell>

                <StyledTableCell align="center">
                    Date
                </StyledTableCell>

                <StyledTableCell align="center">
                    Status
                </StyledTableCell>

                <StyledTableCell align="center">
                    Action
                </StyledTableCell>

            </StyledTableRow>

        </TableHead>

        <TableBody>

            {filteredData.length > 0 ? (

                filteredData.map((student) => (

                    <StyledTableRow
                        key={student.id}
                        hover
                    >

                        <StyledTableCell>

                            <Typography
                                noWrap
                                sx={{
                                    color: "#F8FAFC",
                                    fontWeight: 600,
                                    maxWidth: 180,
                                }}
                            >
                                {student.name}
                            </Typography>

                        </StyledTableCell>

                        <StyledTableCell>
                            {student.roll}
                        </StyledTableCell>

                        <StyledTableCell>
                            {student.class}
                        </StyledTableCell>

                        <StyledTableCell align="center">

                            <AmountChip>

                                ₹ {student.amount.toLocaleString()}

                            </AmountChip>

                        </StyledTableCell>

                        <StyledTableCell align="center">

                            <ModeChip
                                label={student.mode}
                                size="small"
                            />

                        </StyledTableCell>

                        <StyledTableCell align="center">

                            {student.date}

                        </StyledTableCell>

                        <StyledTableCell align="center">

                            <Chip
                                label={student.status}
                                size="small"
                                sx={{

                                    fontWeight: 700,

                                    minWidth: 90,

                                    color: "#FFFFFF",

                                    bgcolor:

                                        student.status === "Paid"

                                            ? "#10B981"

                                            : student.status === "Pending"

                                            ? "#F59E0B"

                                            : "#EF4444",

                                }}
                            />

                        </StyledTableCell>

                        <StyledTableCell align="center">

                            <Button

                                variant="contained"

                                startIcon={
                                    <ReceiptLongRounded />
                                }

                                onClick={() =>
                                    openReceipt(student)
                                }

                                sx={{

                                    borderRadius: "10px",

                                    textTransform: "none",

                                    bgcolor: "#2563EB",

                                    fontWeight: 600,

                                    "&:hover": {

                                        bgcolor: "#1D4ED8",

                                    },

                                }}

                            >

                                Receipt

                            </Button>

                        </StyledTableCell>

                    </StyledTableRow>

                ))

            ) : (

                <StyledTableRow>

                    <StyledTableCell
                        colSpan={8}
                        align="center"
                    >

                        <Typography
                            sx={{
                                color: "#94A3B8",
                                py: 5,
                            }}
                        >
                            No fee records found.
                        </Typography>

                    </StyledTableCell>

                </StyledTableRow>

            )}

        </TableBody>

    </Table>

</MainTableCard>

<Box
    sx={{
        mt: 4,
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
    }}
>

    <Typography
        sx={{
            color: "#94A3B8",
            fontWeight: 600,
        }}
    >
        Total Fees :
        <span
            style={{
                color: "#FFFFFF",
                marginLeft: 8,
            }}
        >
            ₹
            {(totalCollection + pendingAmount).toLocaleString()}
        </span>
    </Typography>

    <Typography
        sx={{
            color: "#10B981",
            fontWeight: 700,
        }}
    >
        Collection Rate :
        {" "}
        {(
            (paidStudents / feeData.length) *
            100
        ).toFixed(0)}
        %
    </Typography>

</Box>

{/* ===================================================== */}
{/* Receipt Dialog */}
{/* ===================================================== */}

<Dialog
    open={receiptOpen}
    onClose={closeReceipt}
    maxWidth="sm"
    fullWidth
>

    <DialogTitle>

        Fee Receipt

    </DialogTitle>

    <DialogContent dividers>

        {selectedStudent && (

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                }}
            >

                <Typography>
                    <b>Student :</b>{" "}
                    {selectedStudent.name}
                </Typography>

                <Typography>
                    <b>Roll :</b>{" "}
                    {selectedStudent.roll}
                </Typography>

                <Typography>
                    <b>Class :</b>{" "}
                    {selectedStudent.class}
                </Typography>

                <Typography>
                    <b>Amount :</b>
                    {" "}
                    ₹
                    {selectedStudent.amount.toLocaleString()}
                </Typography>

                <Typography>
                    <b>Payment Mode :</b>{" "}
                    {selectedStudent.mode}
                </Typography>

                <Typography>
                    <b>Status :</b>{" "}
                    {selectedStudent.status}
                </Typography>

                <Typography>
                    <b>Date :</b>{" "}
                    {selectedStudent.date}
                </Typography>

                <Typography>
                    <b>Transaction ID :</b>

                    {" "}

                    TXN-

                    {Math.floor(
                        100000000 +
                        Math.random() *
                        900000000
                    )}

                </Typography>

            </Box>

        )}

    </DialogContent>

    <DialogActions>

        <Button
            onClick={closeReceipt}
        >
            Close
        </Button>

        <Button
            variant="contained"
        >
            Print
        </Button>

    </DialogActions>

</Dialog>

</PageContainer>

);
}
export default AdminFeeCollection;



const PageContainer = styled(Box)`
    width: 100%;
    min-height: 100%;
    padding: 0;
`;

const HeaderSection = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 28px;
`;

const PageTitle = styled(Typography)`
    color: #f8fafc !important;
    font-size: 2rem !important;
    font-weight: 800 !important;
`;

const PageSubtitle = styled(Typography)`
    color: #94a3b8 !important;
    margin-top: 8px !important;
`;

const StatCard = styled(Paper)`
    background: #111827 !important;
    border: 1px solid #1e293b;
    border-radius: 18px !important;
    padding: 22px;
    display: flex;
    align-items: center;
    gap: 18px;
    height: 100%;
    transition: .25s;

    &:hover {
        transform: translateY(-4px);
        border-color: #2563eb;
    }
`;

const IconBox = styled(Box)`
    width: 64px;
    height: 64px;
    border-radius: 16px;

    display: flex;
    justify-content: center;
    align-items: center;

    background: ${(props) => props.bg};
    color: ${(props) => props.color};

    flex-shrink: 0;

    svg {
        font-size: 30px;
    }
`;

const CardLabel = styled(Typography)`
    color: #94a3b8 !important;
    font-size: .85rem !important;
`;

const CardValue = styled(Typography)`
    color: #ffffff !important;
    font-size: 1.3rem !important;
    font-weight: 700 !important;
`;

const FilterCard = styled(Paper)`
    background: #111827 !important;
    border: 1px solid #1e293b;
    border-radius: 18px !important;
    padding: 20px;
    margin-bottom: 28px;
`;

const MainTableCard = styled(Paper)`
    background: #111827 !important;
    border: 1px solid #1e293b;
    border-radius: 18px !important;
    overflow-x: auto;
    width: 100%;

    table {
        width: 100%;
        border-collapse: collapse;
    }

    .MuiTableHead-root {
        background: #0f172a;
    }

    .MuiTableCell-root {
        border-color: #1e293b;
        color: #e2e8f0;
        padding: 16px;
        font-size: .92rem;
    }

    .MuiTableHead-root .MuiTableCell-root {
        color: white;
        font-weight: 700;
    }

    .MuiTableBody-root .MuiTableRow-root:hover {
        background: rgba(37, 99, 235, .05);
    }
`;

const StyledTextField = styled(TextField)`
    .MuiOutlinedInput-root {
        background: #0f172a;
        color: white;
        border-radius: 12px;

        fieldset {
            border-color: #334155;
        }

        &:hover fieldset {
            border-color: #2563eb;
        }

        &.Mui-focused fieldset {
            border-color: #2563eb;
        }

        input {
            color: white;
        }

        svg {
            color: #94a3b8;
        }
    }

    .MuiInputBase-input::placeholder {
        color: #94a3b8;
        opacity: 1;
    }

    .MuiSelect-select {
        color: white;
    }
`;

const AmountChip = styled.div`
    display: inline-block;
    padding: 6px 12px;
    background: rgba(37, 99, 235, .12);
    color: #60a5fa;
    border-radius: 8px;
    font-weight: 700;
`;

const ModeChip = styled(Chip)`
    background: #0f172a !important;
    color: #cbd5e1 !important;
    border: 1px solid #334155 !important;
    font-weight: 600 !important;
`;