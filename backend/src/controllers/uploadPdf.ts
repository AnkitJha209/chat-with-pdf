import { Request, Response, text } from "express";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { UploadedFile, FileArray } from "express-fileupload";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import dotenv from "dotenv";
import { QdrantVectorStore } from "@langchain/qdrant";

dotenv.config();

const textspliter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
});

const embedding = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GOOGLE_API_KEY,
});

export const uploadPdf = async (req: Request, res: Response) => {
    try {
        const files = req.files as FileArray;

        const pdf = files?.pdf as UploadedFile;
        console.log(pdf);
        if (!pdf) {
            res.status(404).json({
                success: false,
                message: "Pdf Missing",
            });
            return;
        }

        const loader = new PDFLoader(pdf.tempFilePath);
        console.log(loader);
        const docs = await loader.load();

        const chunks = await textspliter.splitDocuments(docs);

        await QdrantVectorStore.fromDocuments(chunks, embedding, {
            url: "http://localhost:6333",
            collectionName: "chat-with-pdf",
        });

        res.status(200).json({
            success: true,
            message: "Indexing completed Successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
