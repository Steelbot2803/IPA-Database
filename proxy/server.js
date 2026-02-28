import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"

const app = express()

app.use(
  "/",
  createProxyMiddleware({
    target: "https://nwtlqdhcnpyhldsxsotk.supabase.co",
    changeOrigin: true,
    ws: true
  })
)

app.listen(process.env.PORT || 10000)