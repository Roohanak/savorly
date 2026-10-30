import { createApp } from './app.mjs';
const production=process.env.NODE_ENV==='production';
const port=Number(process.env.PORT)||3001;
const host=process.env.HOST||(production?'0.0.0.0':'127.0.0.1');
const server=createApp();
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Stop the earlier Savorly server before starting another.`:'Server could not start.');process.exitCode=1;});
server.listen(port,host,()=>console.log(`Savorly ${production?'production':'local'} server: http://${host}:${port}`));
process.on('SIGTERM',()=>server.close());
process.on('SIGINT',()=>server.close());
