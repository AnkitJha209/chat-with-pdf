import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Worker } from "bullmq";
import {Redis} from 'ioredis'
import OpenAI from "openai";



const embedding = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GOOGLE_API_KEY,
});

const client = new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});
const connection = new Redis({
  host: 'localhost', 
  port: 6379,    
  maxRetriesPerRequest: null
});


const worker = new Worker(
  'AnswerQueue',
  async (job) => {
    console.log(`Processing job ${job.id} with data`, job.data);
    const query = job.data
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

        // store it in db with specific job id and use long polling to send response to user
        console.log(chat_response.choices[0].message.content)
  },{connection}
);
