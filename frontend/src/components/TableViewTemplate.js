import React, { useState } from "react";

import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  Box,
} from "@mui/material";

import {
  StyledTableCell,
  StyledTableRow,
} from "./styles";

const TableViewTemplate = ({ columns, rows }) => {
  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(5);

  return (
    <Box
      sx={{
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #1E293B",
        bgcolor: "#111827",
      }}
    >
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <StyledTableRow>
              {columns.map((column, index) => (
                <StyledTableCell
                  key={index}
                  align={column.align}
                  style={{
                    minWidth: column.minWidth,
                  }}
                >
                  {column.label}
                </StyledTableCell>
              ))}
            </StyledTableRow>
          </TableHead>

          <TableBody>
            {rows
              .slice(
                page * rowsPerPage,
                page * rowsPerPage + rowsPerPage
              )
              .map((row) => (
                <StyledTableRow
                  hover
                  key={row.id}
                >
                  {columns.map((column, index) => {
                    const value = row[column.id];

                    return (
                      <StyledTableCell
                        key={index}
                        align={column.align}
                      >
                        {column.format &&
                        typeof value === "number"
                          ? column.format(value)
                          : value}
                      </StyledTableCell>
                    );
                  })}
                </StyledTableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}

        rowsPerPageOptions={[5, 10, 25, 100]}

        onPageChange={(event, newPage) =>
          setPage(newPage)
        }

        onRowsPerPageChange={(event) => {
          setRowsPerPage(
            parseInt(event.target.value, 10)
          );
          setPage(0);
        }}

        sx={{
          bgcolor: "#111827",

          color: "#F8FAFC",

          borderTop: "1px solid #1E293B",

          ".MuiTablePagination-selectIcon": {
            color: "#FBBF24",
          },

          ".MuiSvgIcon-root": {
            color: "#F8FAFC",
          },

          ".MuiIconButton-root:hover": {
            bgcolor: "rgba(37,99,235,.12)",
          },

          ".MuiTablePagination-select": {
            color: "#F8FAFC",
          },
        }}
      />
    </Box>
  );
};

export default TableViewTemplate;