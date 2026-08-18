import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { v4 as uuidv4 } from "uuid";
import styled from "@emotion/styled";
import { HexColorPicker } from "react-colorful";
import { FaPlus, FaPalette, FaTimes, FaGripLines } from "react-icons/fa";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import {
  getDashboardCards,
  saveDashboardCards,
  getDashboardMigrationState,
  setDashboardMigrationDecision,
} from "../api";

// Required styles for react-grid-layout
const RGL_STYLES = `
  .react-grid-layout { position: relative; transition: height 200ms ease; }
  .react-grid-item { transition: all 200ms ease; }
  .react-grid-item.cssTransforms { transition-property: transform; }
  .react-grid-item.resizing { z-index: 1; will-change: width, height; }
  .react-grid-item.react-draggable-dragging { transition: none; z-index: 3; will-change: transform; }
  .react-grid-item .react-resizable-handle { position: absolute; width: 20px; height: 20px; bottom: -30px; right: -30px; cursor: se-resize;  z-index: 100}
  .react-grid-item .react-resizable-handle::after { content: ""; position: absolute; right: 3px; bottom: 3px; width: 5px; height: 5px; border-right: 2px solid rgba(0, 0, 0, 0.4); border-bottom: 2px solid rgba(0, 0, 0, 0.4); }
`;

const GlobalStyleInjector = () => {
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = RGL_STYLES;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  return null;
};

// Custom hook to detect clicks outside a component
const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

// Emotion Styled Components
// =================================================================

const FirstLayerContainer = styled.div(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "calc(100vh - 16px)",
  width: "calc(100vw - 16px)",
}));

const PageContainer = styled.div`
  background-color: transparent;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family:
    -apple-system, BlinkMacSystemFont, Lexend, Dosis, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
`;

const GridContainer = styled.div`
  width: 95%;
  height: 95%;
  background-color: rgba(255, 255, 255, 0);
  margin: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  position: relative;
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const CardWrapper = styled.div`
  background-color: ${(props) => props.bgColor || "#E8EAF6"};
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid #c0c0c0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
  width: 100%;
  height: 100%;
  position: relative; /* Add this */
  z-index: ${(props) => (props.isPickerOpen ? 10 : 1)}; /* Add this */
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  min-height: 28px;
  gap: 10px;
`;

const CardTitle = styled.h2`
  font-size: 1.1em;
  font-weight: 600;
  margin: 0;
  cursor: pointer;
  color: #1c1c1e;
  flex-grow: 1;
`;

const HeaderIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SubtleButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #5c5c5e;
  transition: color 0.2s ease;
  &:hover {
    color: #000;
  }
`;

const CardContent = styled.div`
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(${(props) => props.columns}, 1fr);
  gap: 8px 16px;
  overflow-y: auto;
  padding-right: 5px;
  align-content: flex-start;

  /* NEW: Adds vertical dividers for wide cards */
  & > div {
    position: relative;
    padding-left: ${(props) => (props.columns > 1 ? "16px" : "0")};
  }
  & > div:not(:nth-of-type(${(props) => props.columns}n + 1))::before {
    content: "";
    position: absolute;
    left: 0;
    top: 5%;
    height: 90%;
    width: 2px;
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 26px;
  font-size: 0.9em;
  color: #3c3c3e;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    background-color: rgba(255, 255, 255, 0.35);
  }
  &:hover .remove-row-btn {
    opacity: 1;
  }
`;

const DividerRowLine = styled.div`
  width: 100%;
  flex: 1;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(60, 60, 62, 0.2) 0%,
    rgba(60, 60, 62, 0.55) 15%,
    rgba(60, 60, 62, 0.55) 85%,
    rgba(60, 60, 62, 0.2) 100%
  );
`;

const RowMain = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const DragHandle = styled.span`
  font-size: 0.9em;
  cursor: grab;
  user-select: none;
  line-height: 1;
  &:active {
    cursor: grabbing;
  }
`;

const RowPrice = styled.span`
  font-weight: bold; /* NEW: Price is bold */
`;

const RemoveRowButton = styled(FaTimes)`
  color: #9e9e9e;
  cursor: pointer;
  opacity: 0; /* Hidden by default */
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
  margin-left: 8px;
  &:hover {
    color: #e53935;
  }
`;

const AddRowContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
  align-items: center;
`;

const AddRowButton = styled.button`
  background: none;
  border: 1.5px dashed #9e9e9e;
  border-radius: 4px;
  color: #5c5c5e;
  cursor: pointer;
  padding: 8px;
  margin-top: auto;
  width: 100%;
  transition: all 0.2s ease;
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: #1c1c1e;
  }
`;

const UniversalInput = styled.input`
  border: none;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 0.9em;
  outline: none;
  border: 1px solid transparent;
  width: 100%;
  &:focus {
    border: 1px solid #4a90e2;
  }
`;

const AddCardButton = styled.button`
  position: absolute;
  bottom: 50px;
  right: 70px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #007aff;
  color: white;
  border: none;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  z-index: 1000;
  &:hover {
    transform: scale(1.1);
    background-color: #0056b3;
  }
`;

const ColorPickerContainer = styled.div`
  position: relative;
`;

const ColorPopover = styled.div`
  position: absolute;
  top: 140%;
  right: -10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 2000;
  width: 220px;
`;

const Palette = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const PaletteColor = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  cursor: pointer;
  border: 2px solid ${(props) => (props.isSelected ? "#007aff" : "#a0a0a0ff")};
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.1);
  }
`;

const ResponsiveGridLayout = WidthProvider(Responsive);
const SOFT_PALETTE = [
  "#E8EAF6",
  "#E0F2F1",
  "#F3E5F5",
  "#FFF9C4",
  "#FBE9E7",
  "#E1F5FE",
];
const LEGACY_STORAGE_KEY = "dashboard-cards";

const createDefaultCards = () => [
  {
    id: "a",
    title: "Groceries",
    color: "#E8EAF6",
    rows: [
      { id: uuidv4(), item: "Milk", price: "2" },
      { id: uuidv4(), item: "Bread", price: "1.50" },
    ],
    layout: { i: "a", x: 0, y: 0, w: 1, h: 2 },
  },
  {
    id: "b",
    title: "Work Tasks",
    color: "#E0F2F1",
    rows: [{ id: uuidv4(), item: "Finish report", price: "EOD" }],
    layout: { i: "b", x: 1, y: 0, w: 1, h: 1 },
  },
  {
    id: "c",
    title: "Project Ideas",
    color: "#F3E5F5",
    rows: [],
    layout: { i: "c", x: 2, y: 0, w: 2, h: 3 },
  },
];

// Card Component
// =================================================================
const Card = ({ card, updateCard, removeCard, isNew }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowItem, setNewRowItem] = useState("");
  const [newRowPrice, setNewRowPrice] = useState("");
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingRowItem, setEditingRowItem] = useState("");
  const [editingRowPrice, setEditingRowPrice] = useState("");
  const [draggingRowId, setDraggingRowId] = useState(null);
  const [dragOverRowId, setDragOverRowId] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const titleInputRef = useRef(null);
  const colorPickerRef = useRef(null);
  const rowRefs = useRef(new Map());
  const previousRowPositions = useRef(new Map());
  const dragPreviewRef = useRef(null);

  useOnClickOutside(colorPickerRef, () => setShowColorPicker(false));

  useEffect(() => {
    isNew && setIsEditingTitle(true);
  }, [isNew]);
  useEffect(() => {
    isEditingTitle && titleInputRef.current?.focus();
  }, [isEditingTitle]);

  useLayoutEffect(() => {
    const nextPositions = new Map();

    card.rows.forEach((row) => {
      const element = rowRefs.current.get(row.id);
      if (!element) return;
      nextPositions.set(row.id, element.getBoundingClientRect());
    });

    nextPositions.forEach((nextRect, rowId) => {
      const prevRect = previousRowPositions.current.get(rowId);
      if (!prevRect) return;

      const deltaX = prevRect.left - nextRect.left;
      const deltaY = prevRect.top - nextRect.top;

      if (!deltaX && !deltaY) return;

      const element = rowRefs.current.get(rowId);
      if (!element) return;

      element.style.transition = "none";
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      requestAnimationFrame(() => {
        element.style.transition =
          "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)";
        element.style.transform = "translate(0, 0)";
      });
    });

    previousRowPositions.current = nextPositions;
  }, [card.rows]);

  useEffect(() => {
    return () => {
      if (dragPreviewRef.current) {
        dragPreviewRef.current.remove();
        dragPreviewRef.current = null;
      }
    };
  }, []);

  const handleTitleSubmit = () => {
    if (title.trim()) updateCard(card.id, { title: title.trim() });
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") handleTitleSubmit();
    if (e.key === "Escape") {
      setTitle(card.title);
      setIsEditingTitle(false);
    }
  };

  const handleAddRowSubmit = () => {
    if (newRowItem.trim()) {
      const newRow = {
        id: uuidv4(),
        item: newRowItem.trim(),
        price: newRowPrice.trim() || "0",
      };
      updateCard(card.id, { rows: [...card.rows, newRow] });
    }
    setIsAddingRow(false);
    setNewRowItem("");
    setNewRowPrice("");
  };

  const handleNewRowKeyDown = (e) => {
    if (e.key === "Enter") handleAddRowSubmit();
    if (e.key === "Escape") {
      setIsAddingRow(false);
      setNewRowItem("");
      setNewRowPrice("");
    }
  };

  const handleRemoveRow = (rowId) => {
    const updatedRows = card.rows.filter((row) => row.id !== rowId);
    updateCard(card.id, { rows: updatedRows });
  };

  const handleAddDividerRow = () => {
    const dividerRow = {
      id: uuidv4(),
      type: "divider",
    };
    updateCard(card.id, { rows: [...card.rows, dividerRow] });
  };

  const handleStartRowEdit = (row) => {
    if (row.type === "divider") return;
    setEditingRowId(row.id);
    setEditingRowItem(row.item || "");
    setEditingRowPrice(row.price || "");
  };

  const handleCancelRowEdit = () => {
    setEditingRowId(null);
    setEditingRowItem("");
    setEditingRowPrice("");
  };

  const handleSaveRowEdit = () => {
    if (!editingRowId) return;

    const updatedRows = card.rows.map((row) =>
      row.id === editingRowId
        ? { ...row, item: editingRowItem, price: editingRowPrice }
        : row,
    );

    updateCard(card.id, { rows: updatedRows });
    handleCancelRowEdit();
  };

  const handleEditingRowKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRowEdit();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      handleCancelRowEdit();
    }
  };

  const handleEditingRowBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    handleSaveRowEdit();
  };

  const moveRow = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;

    const rows = [...card.rows];
    const fromIndex = rows.findIndex((row) => row.id === fromId);
    const toIndex = rows.findIndex((row) => row.id === toId);

    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = rows.splice(fromIndex, 1);
    rows.splice(toIndex, 0, moved);
    updateCard(card.id, { rows });
  };

  const moveRowToEnd = (fromId) => {
    if (!fromId) return;

    const rows = [...card.rows];
    const fromIndex = rows.findIndex((row) => row.id === fromId);
    if (fromIndex === -1 || fromIndex === rows.length - 1) return;

    const [moved] = rows.splice(fromIndex, 1);
    rows.push(moved);
    updateCard(card.id, { rows });
  };

  const cleanupDragPreview = () => {
    if (dragPreviewRef.current) {
      dragPreviewRef.current.remove();
      dragPreviewRef.current = null;
    }
  };

  const createDragPreview = (rowElement) => {
    cleanupDragPreview();

    const preview = rowElement.cloneNode(true);
    preview.style.position = "fixed";
    preview.style.top = "-1000px";
    preview.style.left = "-1000px";
    preview.style.width = `${rowElement.getBoundingClientRect().width}px`;
    preview.style.pointerEvents = "none";
    preview.style.margin = "0";
    preview.style.opacity = "0.95";
    preview.style.borderRadius = "6px";
    preview.style.background = "rgba(255, 255, 255, 0.9)";
    preview.style.backdropFilter = "blur(2px)";
    preview.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.22)";
    preview.style.transform = "scale(1.02)";
    preview.style.zIndex = "9999";
    document.body.appendChild(preview);
    dragPreviewRef.current = preview;
    return preview;
  };

  const handleRowDragStart = (e, rowId) => {
    if (editingRowId === rowId) return;

    const rowElement = rowRefs.current.get(rowId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", rowId);

    if (rowElement && e.dataTransfer.setDragImage) {
      const preview = createDragPreview(rowElement);
      e.dataTransfer.setDragImage(preview, 18, 12);
    }

    setDraggingRowId(rowId);
  };

  const handleRowDragEnd = () => {
    cleanupDragPreview();
    setDraggingRowId(null);
    setDragOverRowId(null);
  };

  const handleRowDragOver = (e, rowId) => {
    e.preventDefault();
    if (rowId !== draggingRowId) {
      setDragOverRowId(rowId);
    }
  };

  const handleRowDrop = (e, rowId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggingRowId;
    moveRow(sourceId, rowId);
    cleanupDragPreview();
    setDraggingRowId(null);
    setDragOverRowId(null);
  };

  const handleCardContentDrop = (e) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggingRowId;
    moveRowToEnd(sourceId);
    cleanupDragPreview();
    setDraggingRowId(null);
    setDragOverRowId(null);
  };

  return (
    <CardWrapper isPickerOpen={showColorPicker} bgColor={card.color}>
      <CardHeader>
        {isEditingTitle ? (
          <UniversalInput
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleTitleSubmit}
          />
        ) : (
          <CardTitle
            className="no-drag"
            onClick={() => setIsEditingTitle(true)}
          >
            {card.title}
          </CardTitle>
        )}
        <HeaderIcons className="no-drag">
          <SubtleButton>
            <ColorPickerContainer ref={colorPickerRef}>
              <FaPalette
                onClick={() =>
                  // console.log(showColorPicker)
                  setShowColorPicker(!showColorPicker)
                }
              />
              {showColorPicker && (
                <ColorPopover className="no-drag">
                  <Palette>
                    {SOFT_PALETTE.map((color) => (
                      <PaletteColor
                        key={color}
                        color={color}
                        isSelected={card.color === color}
                        onClick={() => updateCard(card.id, { color })}
                      />
                    ))}
                  </Palette>
                  <HexColorPicker
                    color={card.color}
                    onChange={(newColor) =>
                      updateCard(card.id, { color: newColor })
                    }
                  />
                </ColorPopover>
              )}
            </ColorPickerContainer>
          </SubtleButton>
          <SubtleButton
            className="no-drag"
            onClick={handleAddDividerRow}
            title="Add divider row"
          >
            <FaGripLines />
          </SubtleButton>
          <SubtleButton className="no-drag" onClick={() => removeCard(card.id)}>
            <FaTimes />
          </SubtleButton>
        </HeaderIcons>
      </CardHeader>

      <CardContent
        columns={card.layout.w}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleCardContentDrop}
      >
        {card.rows.map((row) => (
          <Row
            className="no-drag"
            key={row.id}
            ref={(el) => {
              if (el) {
                rowRefs.current.set(row.id, el);
              } else {
                rowRefs.current.delete(row.id);
              }
            }}
            onClick={() => handleStartRowEdit(row)}
            onBlur={editingRowId === row.id ? handleEditingRowBlur : undefined}
            onKeyDown={
              editingRowId === row.id ? handleEditingRowKeyDown : undefined
            }
            onDragOver={(e) => handleRowDragOver(e, row.id)}
            onDrop={(e) => handleRowDrop(e, row.id)}
            style={{
              gridColumn: row.type === "divider" ? "1 / -1" : "auto",
              opacity: draggingRowId === row.id ? 0.3 : 1,
              transform: draggingRowId === row.id ? "scale(0.98)" : "scale(1)",
              boxShadow:
                draggingRowId === row.id
                  ? "0 6px 14px rgba(0, 0, 0, 0.16)"
                  : "none",
              outline:
                dragOverRowId === row.id && draggingRowId !== row.id
                  ? "2px dashed rgba(0, 122, 255, 0.5)"
                  : "none",
            }}
          >
            {row.type === "divider" ? (
              <>
                <RowMain>
                  <DragHandle
                    className="no-drag"
                    draggable={true}
                    onDragStart={(e) => handleRowDragStart(e, row.id)}
                    onDragEnd={handleRowDragEnd}
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to reorder"
                  >
                    ⋮⋮
                  </DragHandle>
                  <DividerRowLine />
                </RowMain>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <RemoveRowButton
                    className="remove-row-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRow(row.id);
                    }}
                  />
                </div>
              </>
            ) : editingRowId === row.id ? (
              <>
                <UniversalInput
                  autoFocus
                  value={editingRowItem}
                  onChange={(e) => setEditingRowItem(e.target.value)}
                  placeholder="Item"
                  onClick={(e) => e.stopPropagation()}
                />
                <UniversalInput
                  value={editingRowPrice}
                  onChange={(e) => setEditingRowPrice(e.target.value)}
                  placeholder="Price"
                  style={{ width: "90px", marginLeft: "8px" }}
                  onClick={(e) => e.stopPropagation()}
                />
              </>
            ) : (
              <>
                <RowMain>
                  <DragHandle
                    className="no-drag"
                    draggable={editingRowId !== row.id}
                    onDragStart={(e) => handleRowDragStart(e, row.id)}
                    onDragEnd={handleRowDragEnd}
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to reorder"
                  >
                    ⋮⋮
                  </DragHandle>
                  <span>{row.item}</span>
                </RowMain>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <RowPrice>${row.price}</RowPrice>
                  <RemoveRowButton
                    className="remove-row-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRow(row.id);
                    }}
                  />
                </div>
              </>
            )}
          </Row>
        ))}
      </CardContent>

      {isAddingRow ? (
        <AddRowContainer className="no-drag" onKeyDown={handleNewRowKeyDown}>
          <UniversalInput
            value={newRowItem}
            onChange={(e) => setNewRowItem(e.target.value)}
            placeholder="Item Name"
            autoFocus
          />
          <UniversalInput
            value={newRowPrice}
            onChange={(e) => setNewRowPrice(e.target.value)}
            placeholder="Price"
            type="number"
            style={{ width: "80px" }}
          />
        </AddRowContainer>
      ) : (
        <AddRowButton className="no-drag" onClick={() => setIsAddingRow(true)}>
          + Add row
        </AddRowButton>
      )}
    </CardWrapper>
  );
};

// Main App Component
// =================================================================
function Dashboard() {
  const [cards, setCards] = useState([]);
  const [storageMode, setStorageMode] = useState("file");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [legacyCardsForPrompt, setLegacyCardsForPrompt] = useState([]);

  const [newlyAddedCardId, setNewlyAddedCardId] = useState(null);
  const gridRef = useRef(null);
  const skipInitialFilePersistRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    const initializeCards = async () => {
      try {
        const rawLegacyCards = localStorage.getItem(LEGACY_STORAGE_KEY);
        let parsedLegacyCards = [];

        if (rawLegacyCards) {
          try {
            const parsed = JSON.parse(rawLegacyCards);
            if (Array.isArray(parsed)) {
              parsedLegacyCards = parsed;
            }
          } catch (error) {
            parsedLegacyCards = [];
          }
        }

        const hasLegacyCards = parsedLegacyCards.length > 0;
        const migrationStateResponse = await getDashboardMigrationState();
        const decisionMade = migrationStateResponse.data?.decisionMade;
        const accepted = migrationStateResponse.data?.accepted;

        if (!isActive) return;

        // if ((hasLegacyCards || true) && !decisionMade) {
        if (hasLegacyCards && !decisionMade) {
          setLegacyCardsForPrompt(parsedLegacyCards);
          setCards(parsedLegacyCards);
          setStorageMode("local");
          setMigrationModalOpen(true);
          setIsBootstrapping(false);
          return;
        }

        // if ((hasLegacyCards || true) && decisionMade && !accepted) {
        if (hasLegacyCards && decisionMade && !accepted) {
          setCards(parsedLegacyCards);
          setStorageMode("local");
          setIsBootstrapping(false);
          return;
        }

        const serverCardsResponse = await getDashboardCards();
        const serverCards = Array.isArray(serverCardsResponse.data?.cards)
          ? serverCardsResponse.data.cards
          : [];
        const serverTouched = Boolean(serverCardsResponse.data?.touched);

        if (!serverTouched) {
          skipInitialFilePersistRef.current = true;
          setCards(createDefaultCards());
        } else {
          setCards(serverCards);
        }
        setStorageMode("file");
        setIsBootstrapping(false);
      } catch (error) {
        if (!isActive) return;
        setCards(createDefaultCards());
        setStorageMode("file");
        setIsBootstrapping(false);
      }
    };

    initializeCards();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isBootstrapping) return;

    const persistCards = async () => {
      if (storageMode === "local") {
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(cards));
        return;
      }

      if (skipInitialFilePersistRef.current) {
        skipInitialFilePersistRef.current = false;
        return;
      }

      try {
        await saveDashboardCards(cards);
      } catch (error) {
        // Keep UI responsive even if save fails temporarily.
      }
    };

    persistCards();
  }, [cards, storageMode, isBootstrapping]);

  const handleAcceptMigration = async () => {
    try {
      await setDashboardMigrationDecision(true, legacyCardsForPrompt);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setCards(
        legacyCardsForPrompt.length > 0
          ? legacyCardsForPrompt
          : createDefaultCards(),
      );
      setStorageMode("file");
    } catch (error) {
      // If migration request fails, keep local mode for this run.
      setStorageMode("local");
    } finally {
      setMigrationModalOpen(false);
      setLegacyCardsForPrompt([]);
    }
  };

  const handleDenyMigration = async () => {
    try {
      await setDashboardMigrationDecision(false);
    } catch (error) {
      // Best effort only; local mode still applies for current run.
    } finally {
      setCards(
        legacyCardsForPrompt.length > 0
          ? legacyCardsForPrompt
          : createDefaultCards(),
      );
      setStorageMode("local");
      setMigrationModalOpen(false);
      setLegacyCardsForPrompt([]);
    }
  };

  const handleResetLocalAndUseFile = async () => {
    try {
      const serverCardsResponse = await getDashboardCards();
      const serverCards = Array.isArray(serverCardsResponse.data?.cards)
        ? serverCardsResponse.data.cards
        : [];
      const serverTouched = Boolean(serverCardsResponse.data?.touched);

      const cardsToUse = serverTouched ? serverCards : createDefaultCards();

      await setDashboardMigrationDecision(true, cardsToUse);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setCards(cardsToUse);
      setStorageMode("file");
    } catch (error) {
      // Fall back to file mode with defaults if backend lookup fails.
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setCards(createDefaultCards());
      setStorageMode("file");
    } finally {
      setMigrationModalOpen(false);
      setLegacyCardsForPrompt([]);
    }
  };

  useEffect(() => {
    if (newlyAddedCardId && gridRef.current) {
      const newCardElement = gridRef.current.querySelector(
        `[data-grid-id="${newlyAddedCardId}"]`,
      );
      if (newCardElement) {
        newCardElement.scrollIntoView({ behavior: "smooth", block: "end" });
      }
      setNewlyAddedCardId(null);
    }
  }, [newlyAddedCardId, cards]);

  const updateCard = useCallback((cardId, updates) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, ...updates } : card,
      ),
    );
  }, []);

  const removeCard = useCallback((cardId) => {
    setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
  }, []);

  const onLayoutChange = (layout) => {
    setCards((prevCards) =>
      prevCards.map((card) => {
        const newLayout = layout.find((l) => l.i === card.id);
        return newLayout ? { ...card, layout: newLayout } : card;
      }),
    );
  };

  const addCard = () => {
    const newId = uuidv4();
    const newCard = {
      id: newId,
      title: "New Card",
      color: SOFT_PALETTE[Math.floor(Math.random() * SOFT_PALETTE.length)],
      rows: [],
      layout: { i: newId, x: (cards.length * 2) % 5, y: Infinity, w: 1, h: 2 },
    };
    setCards((prevCards) => [...prevCards, newCard]);
    setNewlyAddedCardId(newId);
  };

  return (
    <FirstLayerContainer>
      <Dialog open={migrationModalOpen} disableEscapeKeyDown onClose={() => {}}>
        <DialogTitle>Move Existing Dashboard Data?</DialogTitle>
        <DialogContent>
          <Typography>
            We found dashboard cards saved in this browser profile.
          </Typography>
          <Typography sx={{ marginTop: 1 }}>
            If you choose Move, your cards and rows will be transferred to the
            server file so they are shared across browser profiles. The browser
            copy will be removed.
          </Typography>
          <Typography sx={{ marginTop: 1 }}>
            If you choose Keep Local, this run will continue using browser-only
            data and no migration will happen until the next server restart.
          </Typography>
          <Typography sx={{ marginTop: 1 }}>
            If you choose Reset Local and Use File, browser-saved dashboard data
            is deleted and file-based storage is used from now on.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetLocalAndUseFile} color="error">
            Reset Local & Use File
          </Button>
          <Button onClick={handleDenyMigration} variant="outlined">
            Keep Local
          </Button>
          <Button onClick={handleAcceptMigration} variant="contained">
            Move To Shared File
          </Button>
        </DialogActions>
      </Dialog>
      <PageContainer>
        <GlobalStyleInjector />
        <GridContainer ref={gridRef}>
          {/* <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0)",
            }}
          >
            <h3>Shop</h3>
          </div> */}
          <ResponsiveGridLayout
            layouts={{ lg: cards.map((c) => c.layout) }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 5, md: 4, sm: 3, xs: 2, xxs: 1 }}
            margin={[50, 50]}
            rowHeight={100}
            onLayoutChange={onLayoutChange}
            draggableCancel=".no-drag"
            isResizable={true}
            isDraggable={true}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                data-grid={card.layout}
                data-grid-id={card.id}
                // style={{ margin: "0 40px" }}
              >
                <Card
                  card={card}
                  updateCard={updateCard}
                  removeCard={removeCard}
                  isNew={card.id === newlyAddedCardId}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        </GridContainer>
        <AddCardButton onClick={addCard}>
          {" "}
          <FaPlus />{" "}
        </AddCardButton>
      </PageContainer>
    </FirstLayerContainer>
  );
}

export default Dashboard;
