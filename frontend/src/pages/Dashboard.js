import React, { useState, useEffect, useRef, useCallback } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { v4 as uuidv4 } from "uuid";
import styled from "@emotion/styled";
import { HexColorPicker } from "react-colorful";
import { FaPlus, FaPalette, FaTimes, FaBackspace } from "react-icons/fa";

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
  font-family: -apple-system, BlinkMacSystemFont, Lexend, Dosis, "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
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
  &:hover .remove-row-btn {
    opacity: 1;
  }
`;

const RowPrice = styled.span`
  font-weight: bold; /* NEW: Price is bold */
`;

const RemoveRowButton = styled(FaTimes)`
  color: #9e9e9e;
  cursor: pointer;
  opacity: 0; /* Hidden by default */
  transition: opacity 0.2s ease, color 0.2s ease;
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

// Card Component
// =================================================================
const Card = ({ card, updateCard, removeCard, isNew }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowItem, setNewRowItem] = useState("");
  const [newRowPrice, setNewRowPrice] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const titleInputRef = useRef(null);
  const colorPickerRef = useRef(null);

  useOnClickOutside(colorPickerRef, () => setShowColorPicker(false));

  useEffect(() => {
    isNew && setIsEditingTitle(true);
  }, [isNew]);
  useEffect(() => {
    isEditingTitle && titleInputRef.current?.focus();
  }, [isEditingTitle]);

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
          <SubtleButton className="no-drag" onClick={() => removeCard(card.id)}>
            <FaTimes />
          </SubtleButton>
        </HeaderIcons>
      </CardHeader>

      <CardContent columns={card.layout.w}>
        {card.rows.map((row) => (
          <Row className="no-drag" key={row.id}>
            <span>{row.item}</span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <RowPrice>${row.price}</RowPrice>
              <RemoveRowButton
                className="remove-row-btn"
                onClick={() => handleRemoveRow(row.id)}
              />
            </div>
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
  const [cards, setCards] = useState(() => {
    try {
      const savedCards = localStorage.getItem("dashboard-cards");
      return savedCards
        ? JSON.parse(savedCards)
        : [
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
    } catch (error) {
      return [];
    }
  });

  const [newlyAddedCardId, setNewlyAddedCardId] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("dashboard-cards", JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    if (newlyAddedCardId && gridRef.current) {
      const newCardElement = gridRef.current.querySelector(
        `[data-grid-id="${newlyAddedCardId}"]`
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
        card.id === cardId ? { ...card, ...updates } : card
      )
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
      })
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
