require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.MONGO_PUBLIC_URL) {
    console.error("❌ ERRO: MONGO_PUBLIC_URL não foi definido!");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_PUBLIC_URL, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
}).then(() => console.log("✅ MongoDB conectado com sucesso!"))
    .catch(err => {
        console.error("❌ Erro ao conectar MongoDB:", err);
        process.exit(1);
    });

const TimerSchema = new mongoose.Schema({
    elapsedTime: Number,
    isRunning: Boolean,
    lastUpdated: { type: Date, default: Date.now }
});
const CounterSchema = new mongoose.Schema({ clicks: Number });


const Timer = mongoose.model("Timer", TimerSchema);
const Counter = mongoose.model("Counter", CounterSchema);

let timer = { elapsedTime: 0, isRunning: false };
let timerInterval = null;
let counter = 0;

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

const startTimer = async () => {
    const savedTimer = await Timer.findOne();
    if (savedTimer) {
        timer.elapsedTime = savedTimer.elapsedTime;
        timer.isRunning = savedTimer.isRunning;
    } else {
        await Timer.create({ elapsedTime: 0, isRunning: false });
    }

    if (timer.isRunning) {
        timerInterval = setInterval(async () => {
            timer.elapsedTime++;
            await Timer.updateOne({}, { elapsedTime: timer.elapsedTime, lastUpdated: new Date() });
        }, 1000);
    }
};
startTimer();

app.get("/api/timer", async (req, res) => {
    res.json(timer);
});

app.post("/api/start", async (req, res) => {
    if (!timer.isRunning) {
        timer.isRunning = true;
        timerInterval = setInterval(async () => {
            timer.elapsedTime++;
            await Timer.updateOne({}, { elapsedTime: timer.elapsedTime, lastUpdated: new Date() });
        }, 1000);
        await Timer.updateOne({}, { isRunning: true });
    }
    res.json({ message: "Timer iniciado" });
});

app.post("/api/stop", async (req, res) => {
    if (timer.isRunning) {
        clearInterval(timerInterval);
        timer.isRunning = false;
        await Timer.updateOne({}, { isRunning: false });
    }
    res.json({ message: "Timer parado" });
});

app.post("/api/reset", async (req, res) => {
    clearInterval(timerInterval);
    timer = { elapsedTime: 0, isRunning: false };
    await Timer.updateOne({}, { elapsedTime: 0, isRunning: false, lastUpdated: new Date() });
    res.json({ message: "Timer resetado" });
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
