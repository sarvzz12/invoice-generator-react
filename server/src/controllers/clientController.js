import Client from "../models/Client.js";

const createClient = async (req, res) => {
  try {
    const client = await Client.create({
      userId: req.user.userId,
      ...req.body,
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create client",
      error: error.message,
    });
  }
};

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch clients",
      error: error.message,
    });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch client",
      error: error.message,
    });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update client",
      error: error.message,
    });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete client",
      error: error.message,
    });
  }
};

export {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};