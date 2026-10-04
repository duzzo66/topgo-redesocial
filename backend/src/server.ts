import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express(); const port = Number(process.env.PORT || 4000)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' })); app.use(express.json({ limit: '2mb' }))
app.get('/health', (_req,res)=>res.json({ok:true,service:'entre-nos-backend'}))
app.get('/api/profile/:id', async (req,res)=>{const {data,error}=await supabase.from('profiles').select('*').eq('id',req.params.id).single();if(error)return res.status(404).json({error:error.message});res.json(data)})
app.patch('/api/profile/:id', async (req,res)=>{const allowed=['username','display_name','bio','avatar_url','banner_url','theme'];const updates=Object.fromEntries(Object.entries(req.body).filter(([key])=>allowed.includes(key)));const {data,error}=await supabase.from('profiles').update({...updates,updated_at:new Date().toISOString()}).eq('id',req.params.id).select().single();if(error)return res.status(400).json({error:error.message});res.json(data)})
app.get('/api/posts', async (_req,res)=>{const {data,error}=await supabase.from('posts').select('*, profiles(*), post_media(*)').order('created_at',{ascending:false});if(error)return res.status(500).json({error:error.message});res.json(data)})
app.post('/api/posts', async (req,res)=>{const {author_id,content=''}=req.body;if(!author_id||!content.trim())return res.status(400).json({error:'author_id e content são obrigatórios.'});const {data,error}=await supabase.from('posts').insert({author_id,content}).select().single();if(error)return res.status(400).json({error:error.message});res.status(201).json(data)})
app.delete('/api/posts/:id', async (req,res)=>{const {error}=await supabase.from('posts').delete().eq('id',req.params.id);if(error)return res.status(400).json({error:error.message});res.status(204).send()})
app.listen(port,()=>console.log(`Entre Nós backend em http://localhost:${port}`))
