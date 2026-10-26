import React, { useState } from "react";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  Typography,
} from "@mui/material";

import styled from "styled-components";

import { StyledTableCell, StyledTableRow } from "./styles";

const TableTemplate = ({
  buttonHaver: ButtonHaver,
  columns,
  rows,
}) => {

  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(5);

    return (

<PageWrapper>

<StyledPaper>

<TableContainer>

<Table
stickyHeader
aria-label="table"
>

<TableHead>

<StyledTableRow>

{columns.map((column)=>(

<StyledTableCell
key={column.id}
align={column.align}
style={{
minWidth:column.minWidth,
}}
>

{column.label}

</StyledTableCell>

))}

<StyledTableCell
align="center"
>

Actions

</StyledTableCell>

</StyledTableRow>

</TableHead>

<TableBody>
    {rows.length === 0 ? (

  <StyledTableRow>

    <StyledTableCell
      colSpan={columns.length + 1}
      align="center"
      sx={{
        py: 8,
        borderBottom: "none",
      }}
    >

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={1}
      >

        <Typography
          sx={{
            color: "#FFFFFF",
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          No Data Found
        </Typography>

        <Typography
          sx={{
            color: "#94A3B8",
            fontSize: "14px",
          }}
        >
          Nothing has been added yet.
        </Typography>

      </Box>

    </StyledTableCell>

  </StyledTableRow>

) : (

  rows
    .slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    )
    .map((row) => (

      <StyledTableRow
        hover
        key={row.id}
      >

    {columns.map((column) => {

  const value = row[column.id];

  return (

    <StyledTableCell
      key={column.id}
      align={column.align}
    >
      {column.format && typeof value === "number"
        ? column.format(value)
        : value}
    </StyledTableCell>

  );

})}

<StyledTableCell
  align="center"
  sx={{
    whiteSpace: "nowrap",
  }}
>

  <ButtonHaver row={row} />

</StyledTableCell>

</StyledTableRow>

))

)}
</TableBody>

</Table>

</TableContainer>

</StyledPaper>

<TablePagination
    component="div"
    count={rows.length}
    page={page}
    rowsPerPage={rowsPerPage}
    rowsPerPageOptions={[5, 10, 25, 100]}
    onPageChange={(event, newPage) => {
        setPage(newPage);
    }}
    onRowsPerPageChange={(event) => {
        setRowsPerPage(
            parseInt(event.target.value, 10)
        );
        setPage(0);
    }}
    sx={{
        mt: 2,
        borderRadius: "14px",
        background: "#111827",
        color: "#F8FAFC",
        border: "1px solid #1E293B",

        "& .MuiTablePagination-toolbar": {
            minHeight: 70,
        },

        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
            {
                color: "#CBD5E1",
                fontWeight: 500,
            },

        "& .MuiSvgIcon-root": {
            color: "#F8FAFC",
        },

        "& .MuiIconButton-root:hover": {
            background: "rgba(37,99,235,0.15)",
        },

        "& .MuiSelect-icon": {
            color: "#F8FAFC",
        },
    }}
/>

</PageWrapper>

);
};

export default TableTemplate;

const PageWrapper = styled.div`
  width: 100%;
  margin-top: 24px;
`;

const StyledPaper = styled(Paper)`
  background: #111827 !important;
  border: 1px solid #1e293b;
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.45),
      0 0 0 1px rgba(37, 99, 235, 0.25);
  }

  .MuiTable-root {
    background: transparent;
  }

  .MuiTableHead-root {
    background: #0f172a;
  }

  .MuiTableBody-root tr {
    transition: all 0.25s ease;
  }

  .MuiTableBody-root tr:hover {
    background: rgba(37, 99, 235, 0.08);
  }

  .MuiTableCell-root {
    border-bottom: 1px solid #1e293b;
    padding: 18px 20px;
    font-size: 15px;
  }

  .MuiTablePagination-root {
    background: #111827;
    color: #f8fafc;
    border-top: 1px solid #1e293b;
  }

  .MuiTablePagination-selectLabel,
  .MuiTablePagination-displayedRows {
    color: #cbd5e1;
  }

  .MuiTablePagination-actions button {
    color: white;
  }

  @media (max-width: 900px) {
    .MuiTableCell-root {
      padding: 14px;
      font-size: 14px;
    }
  }

  @media (max-width: 600px) {
    border-radius: 14px !important;

    .MuiTableCell-root {
      padding: 12px;
      font-size: 13px;
    }
  }
`;