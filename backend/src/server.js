import dotenv from 'dotenv';
import express from 'express';
import job from './config/cron.js';
import { sql } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';

dotenv.config();

const app=express()

if(process.env.NODE_ENV==="production") job.start();

app.use(rateLimiter);
app.use(express.json());

const PORT=process.env.PORT;

app.get("/api/health",(req,res)=> {
    res.status(200).json({message: "API is running"});
    console.log("API is running");
})

async function initDB() {
    try {
        await sql`CREATE TABLE IF NOT EXISTS transactions(
            id SERIAL PRIMARY KEY,
            user_id  VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            category VARCHAR(255) NOT NULL,
            created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )`
        console.log("Database initialized successfully");
    } catch (error) {
        console.log("Error initializing database:", error);
        process.exit(1);
    }
}

app.post("/api/transactions", async (req,res)=>{
    try {
        const {title,amount,category,user_id}=req.body;
        if(!title || amount===undefined || !category || !user_id) {
            return res.status(400).json({error: "All fields are required"});
        }

        const transaction=await sql`INSERT INTO transactions(user_id,title,amount,category)
        VALUES(${user_id},${title},${amount},${category})
        RETURNING *`;
        console.log(transaction);
        res.status(201).json(transaction[0]);
    } catch (error) {
        console.log("Error: ",error);
        res.status(500).json({message:"Internal server error"});
    }
})

app.get("/api/transactions/:userId", async (req,res)=>{
    try {
        const {userId}=req.params;
        const transactions=await sql`SELECT * FROM transactions WHERE user_id=${userId} ORDER BY created_at DESC`;
        res.status(200).json(transactions);
    } catch (error) {
        console.log("Error: ",error);
        res.status(500).json({message:"Internal server error"});
    }
})

app.delete("/api/transactions/:id", async (req,res)=>{
    try {
        const {id}=req.params;
        const result=await sql`DELETE FROM transactions WHERE id=${id} RETURNING *`;
        if(result.length === 0) {
            return res.status(404).json({message: "Transaction not found"});
        }
        res.status(200).json({message: "Transaction deleted successfully"});
    } catch (error) {
        console.log("Error: ",error);
        res.status(500).json({message:"Internal server error"});
    }
})

app.get("/api/transactions/summary/:userId",async (req,res)=>{
    try {
        const {userId}=req.params;
        const balanceResult=await sql`SELECT COALESCE(SUM(amount),0) AS balance FROM transactions WHERE user_id=${userId}`;
        const incomeResult=await sql`SELECT COALESCE(SUM(amount),0) AS income FROM transactions WHERE user_id=${userId} AND amount > 0`;
        const expenseResult=await sql`SELECT COALESCE(SUM(amount),0) AS expense FROM transactions WHERE user_id=${userId} AND amount < 0`;
        res.status(200).json({
            balance: balanceResult[0].balance,
            income: incomeResult[0].income,
            expense: expenseResult[0].expense
        })
    } catch (error) {
        console.log("Error: ",error);
        res.status(500).json({message:"Internal server error"});
    }
})

initDB().then(()=>{
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});