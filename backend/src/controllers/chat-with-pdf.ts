import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";
dotenv.config();

const embedding = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GOOGLE_API_KEY,
});

const client = new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const chatWithPdf = async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        const vectorDb = await QdrantVectorStore.fromExistingCollection(
            embedding,
            {
                url: "http://localhost:6333",
                collectionName: "chat-with-pdf",
            }
        );

        const search_results = await vectorDb.similaritySearch(query);
        // console.log(search_results);
        const context = search_results
            .map(
                (result) => `
                Page Content : ${result.pageContent}\n
                Page MetaData-Pdf: ${result.metadata.pdf}\n
                Page MetaData-Loc: ${result.metadata.loc}\n
                Page Source : ${result.metadata.source}
            `
            )
            .join("\n\n\n");

        const SYSTEM_PROMPT = `
            You are a helpfull AI Assistant who asnweres user query based on the available context
            retrieved from a PDF file along with page_contents and page number.

            You should only ans the user based on the following context and navigate the user
            to open the right page number to know more.

            Context:
            ${context}
        `;

        const chat_response = await client.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: query,
                },
            ],
        });


        res.status(200).json({
            success: true,
            message: chat_response.choices[0].message.content,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
