import express, { Application, urlencoded } from 'express'
import cors from 'cors'
import { uploadPdf } from './controllers/uploadPdf'
import fileUpload from 'express-fileupload'
import { chatWithPdf } from './controllers/chat-with-pdf'
const app: Application = express()

app.use(express.json())
app.use(fileUpload({useTempFiles: true}))
app.use(cors())
app.use(urlencoded())


app.post('/upload-pdf', uploadPdf)
app.post('/chat-with-pdf', chatWithPdf)

app.listen(3000)
