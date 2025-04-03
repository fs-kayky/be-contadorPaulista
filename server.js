require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.MONGO_URI) {
    console.error("ERRO: MONGO_URI não definido no .env");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB conectado"))
    .catch(err => {
        console.error("Erro ao conectar ao MongoDB:", err);
        process.exit(1);
    });

const CounterSchema = new mongoose.Schema({ clicks: { type: Number, default: 0 } });
const Counter = mongoose.model("Counter", CounterSchema);

const initCounter = async () => {
    try {
        const existing = await Counter.findOne();
        if (!existing) {
            await Counter.create({ clicks: 0 });
            console.log("✅ Contador inicializado com 0 cliques");
        }
    } catch (error) {
        console.error("Erro ao inicializar contador:", error);
    }
};
initCounter();

app.get("/clicks", async (req, res) => {
    try {
        const counter = await Counter.findOne();
        res.json({ clicks: counter ? counter.clicks : 0 });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar contador" });
    }
});

app.post("/clicks", async (req, res) => {
    try {
        const counter = await Counter.findOne();
        if (counter) {
            counter.clicks += 1;
            await counter.save();
            res.json({ clicks: counter.clicks });
        } else {
            res.status(500).json({ error: "Contador não encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar contador" });
    }
});

// 🏁 Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));