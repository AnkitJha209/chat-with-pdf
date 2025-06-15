import { Request, Response } from "express";
import dotenv from "dotenv";
import { Queue } from "bullmq";
dotenv.config();

const queue = new Queue("AnswerQueue")

export const chatWithPdf = async (req: Request, res: Response) => {
    try{
        const {query} = req.body
        const response = await queue.add('query', query)
        console.log(response)
        res.status(200).json({
            success: true,
            message: "job added to queue"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
