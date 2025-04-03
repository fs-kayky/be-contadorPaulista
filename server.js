require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🚀 Verifica se a variável de ambiente foi carregada
if (!process.env.MONGO_PUBLIC_URL) {
    console.error("❌ ERRO: MONGO_PUBLIC_URL não foi definido!");
    process.exit(1);
}

// 🔗 Conectar ao MongoDB com timeout maior para evitar erros
mongoose.connect(process.env.MONGO_PUBLIC_URL, {
    serverSelectionTimeoutMS: 30000, // Tempo máximo para conectar ao servidor (30s)
    socketTimeoutMS: 45000, // Tempo máximo de resposta do socket (45s)
}).then(() => console.log("✅ MongoDB conectado com sucesso!"))
    .catch(err => {
        console.error("❌ Erro ao conectar MongoDB:", err);
        process.exit(1);
    });

// Criar Schema e Modelo
const CounterSchema = new mongoose.Schema({ clicks: Number });
const Counter = mongoose.model("Counter", CounterSchema);

// Inicializar contador no banco
const initCounter = async () => {
    try {
        const existing = await Counter.findOne();
        if (!existing) {
            await Counter.create({ clicks: 0 });
        }
    } catch (err) {
        console.error("❌ Erro ao inicializar contador:", err);
    }
};
initCounter();

// Rotas da API
app.get("/clicks", async (req, res) => {
    try {
        const counter = await Counter.findOne();
        res.json({ clicks: counter?.clicks || 0 });
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar contador" });
    }
});

app.post("/clicks", async (req, res) => {
    try {
        const counter = await Counter.findOne();
        if (!counter) return res.status(500).json({ error: "Contador não encontrado" });

        counter.clicks += 1;
        await counter.save();
        res.json({ clicks: counter.clicks });
    } catch (err) {
        res.status(500).json({ error: "Erro ao atualizar contador" });
    }
});

// 🚀 Iniciar o servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
