import Item from "../models/Item.js";

// GET /api/items  — only the logged-in user's items
export const getItems = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const filter = { owner: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: "i" };

    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json({ items, count: items.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch items" });
  }
};

// GET /api/items/:id
export const getItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch item" });
  }
};

// POST /api/items
export const createItem = async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    const item = await Item.create({
      title,
      description,
      status,
      priority,
      owner: req.user._id,
    });
    res.status(201).json({ item });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to create item" });
  }
};

// PUT /api/items/:id
export const updateItem = async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    // owner check built into query — users can't edit others' items
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { title, description, status, priority },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ item });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to update item" });
  }
};

// DELETE /api/items/:id
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete item" });
  }
};
