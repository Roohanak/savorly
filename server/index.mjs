import { createServer } from 'node:http'
import { buildRequest, finalAnswer } from './assistant.mjs'

createServer(async (req,res) => {
  res.setHeader('Content-Type','application/json')
  const send = (code,data) => { res.writeHead(code); res.end(JSON.stringify(data)) }
  if (req.method !== 'POST' || req.url !== '/api/assist') return send(404,{error:'Not found'})
  if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL || !process.env.AI_MODEL) return send(503,{error:'AI is not connected yet. Configure AI_API_KEY, AI_BASE_URL and AI_MODEL in .env, then restart the AI server.'})
  let request
  try {
    let body=''
    for await (const chunk of req) { body+=chunk; if(body.length>100000) return send(413,{error:'Recipe too large.'}) }
    const {action,recipe}=JSON.parse(body)
    request=buildRequest(action,recipe,process.env.AI_MODEL)
  } catch { return send(400,{error:'Invalid recipe request.'}) }
  try {
    const response=await fetch(process.env.AI_BASE_URL.replace(/\/$/,'')+'/chat/completions',{
      method:'POST', signal:AbortSignal.timeout(45000),
      headers:{Authorization:`Bearer ${process.env.AI_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify(request)
    })
    if(!response.ok) return send(502,{error:`AI provider returned ${response.status}. Check your configuration and provider account.`})
    const data=await response.json()
    try { return send(200,{text:finalAnswer(data)}) }
    catch(error) { return send(502,{error:error.message}) }
  } catch { return send(502,{error:'Could not complete the AI request. Check your connection and server configuration.'}) }
}).listen(3001,'127.0.0.1',()=>console.log('Savorly AI server: http://127.0.0.1:3001'))
