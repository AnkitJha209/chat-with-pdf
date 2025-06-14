import { Worker } from "bullmq";
import {Redis} from 'ioredis'

const connection = new Redis({
  host: 'localhost', // or use process.env.REDIS_HOST
  port: 6379,        // or use process.env.REDIS_PORT
  maxRetriesPerRequest: null
});
const worker = new Worker(
  'AnswerQueue',
  async (job) => {
    console.log(`Processing job ${job.id} with data`, job.data);
  },{connection}
);
