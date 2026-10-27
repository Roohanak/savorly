import test from 'node:test'
import assert from 'node:assert/strict'
import {buildRequest,finalAnswer} from '../server/assistant.mjs'
test('direct-answer requests omit internal recipe metadata',()=>{
 const request=buildRequest('polish',{id:'private-id',title:'Crepe',photoIds:['photo'],notes:'1 cup lentils',attempts:[]},'test-model')
 assert.equal(request.chat_template_kwargs.enable_thinking,false)
 assert.equal(JSON.stringify(request).includes('private-id'),false)
 assert.equal(JSON.stringify(request).includes('photoIds'),false)
 assert.match(request.messages[0].content,/finished recipe/)
})
test('only finished content is returned, never separate reasoning',()=>{
 assert.equal(finalAnswer({choices:[{finish_reason:'stop',message:{content:'## Lentil crepe\nA finished recipe.',reasoning_content:'Hidden planning'}}]}),'## Lentil crepe\nA finished recipe.')
 assert.equal(finalAnswer({choices:[{message:{content:'<think>Private planning</think>\nFinished recipe'}}]}),'Finished recipe')
})
test('truncated and untagged planning responses are rejected',()=>{
 assert.throws(()=>finalAnswer({choices:[{finish_reason:'length',message:{content:'unfinished'}}]}),/cut short/)
 assert.throws(()=>finalAnswer({choices:[{message:{content:'**Analyze User Input:**\nIdentify the Goal'}}]}),/planning/)
 assert.throws(()=>finalAnswer({choices:[{message:{content:'<think>unfinished'}}]}),/planning/)
})
