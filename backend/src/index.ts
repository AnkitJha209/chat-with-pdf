import express, { Application, urlencoded } from 'express'
import cors from 'cors'
import { uploadPdf } from './controllers/uploadPdf'
import fileUpload from 'express-fileupload'
const app: Application = express()

app.use(express.json())
app.use(fileUpload({useTempFiles: true}))
app.use(cors())
app.use(urlencoded())


app.post('/upload-pdf', uploadPdf)

app.listen(3000)
