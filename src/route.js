import express from "express";
import {getMetadata, streamFile} from "./controller.js";

const router = express.Router()

router.post('/metadata', getMetadata)
router.get('/stream', streamFile)

export default router