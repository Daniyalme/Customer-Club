import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
} from "@mui/material";
import styled from "@emotion/styled";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import EditPurchaseModal from "./EditPurchaseModal";
import ConfirmDeleteModal from "./DeletePurchaseModal";
import { editPurchase, deletePurchase } from "../api";

const CustomPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "12px",
}));

const CustomContainer = styled.div(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
}));

const CustomTablePaper = styled(Paper)(({ theme }) => ({
  borderRadius: "12px",
  border: "1px solid #c8c8c8",
  width: "calc(100% - 2px) !important",
}));

export default function PurchasesTableModal({
  name,
  purchases,
  open,
  onClose,
  updateData,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("date");
  const [localPurchases, setLocalPurchases] = useState(purchases || []);
  const [actionModal, setActionModal] = useState({
    type: null, // 'edit' | 'delete'
    purchase: null, // purchase object being modified
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const openEditModal = (purchase) => {
    setActionModal({ type: "edit", purchase });
  };

  const openDeleteModal = (purchase) => {
    setActionModal({ type: "delete", purchase });
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleEditPurchase = async (id, amount) => {
    try {
      const updated = await editPurchase(id, amount); // your existing API
      //   console.log({ updated });
      setLocalPurchases(updated.data.purchases);
      setActionModal({ type: null, purchase: null });
      updateData(updated.data);
      setSuccessMsg(`Amount changed to €${amount}`);
    } catch (error) {
      setErrorMsg(`Edit Failed: ${error}`);
    }
  };

  const handleDeletePurchase = async (id) => {
    try {
      const updated = await deletePurchase(id); // your existing API
      setLocalPurchases(updated.data.purchases);
      setActionModal({ type: null, purchase: null });
      updateData(updated.data);
      setSuccessMsg("Row Deleted Succecfully");
    } catch (error) {
      setErrorMsg(`Delete Failed: ${error}`);
    }
  };

  const sortedPurchases = [...localPurchases].sort((a, b) => {
    if (orderBy === "amount" || orderBy === "date") {
      return order === "asc"
        ? a[orderBy] > b[orderBy]
          ? 1
          : -1
        : b[orderBy] > a[orderBy]
        ? 1
        : -1;
    }
    return 0;
  });

  const paginatedRows = sortedPurchases.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  useEffect(() => {
    setLocalPurchases(purchases); // sync when prop changes
  }, [purchases]);

  return (
    <>
      {actionModal.type === "edit" && (
        <EditPurchaseModal
          purchase={actionModal.purchase}
          open={true}
          onClose={() => setActionModal({ type: null, purchase: null })}
          onSave={handleEditPurchase}
        />
      )}

      {actionModal.type === "delete" && (
        <ConfirmDeleteModal
          purchase={actionModal.purchase}
          open={true}
          onClose={() => setActionModal({ type: null, purchase: null })}
          onConfirm={handleDeletePurchase}
        />
      )}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperComponent={CustomPaper}
      >
        <DialogTitle>
          <CustomContainer>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography sx={{ padding: "0 0 0 10px" }}>
                <strong>
                  {name || "User"}
                  {"'s"} Purchases
                </strong>
              </Typography>
              <IconButton aria-label="close" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
            {successMsg && (
              <Alert
                severity="success"
                onClose={() => setSuccessMsg("")}
                sx={{ mt: 2 }}
              >
                {successMsg}
              </Alert>
            )}
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          </CustomContainer>
        </DialogTitle>

        <DialogContent>
          <TableContainer component={CustomTablePaper}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f0f4ff" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold" }}
                    sortDirection={orderBy === "date" ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === "date"}
                      direction={order}
                      onClick={() => handleRequestSort("date")}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold" }}
                    sortDirection={orderBy === "amount" ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === "amount"}
                      direction={order}
                      onClick={() => handleRequestSort("amount")}
                    >
                      Amount
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>
                      {row.amount < 300 ? (
                        `€${new Intl.NumberFormat("en-US").format(row.amount)}`
                      ) : (
                        <strong>
                          {`€${new Intl.NumberFormat("en-US").format(
                            row.amount
                          )}`}
                        </strong>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => openEditModal(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => openDeleteModal(row)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={localPurchases?.length || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </DialogContent>
      </Dialog>
    </>
  );
}
