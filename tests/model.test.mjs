import test from 'node:test'
import assert from 'node:assert/strict'
import { parseBackup } from '../src/model.ts'

const recipe = { id: 'recipe', title: 'Crepe', category: 'Breakfast', servings: 2, ingredients: '1 cup lentils', steps: 'Mix', notes: '', attempts: [] }
const photo = { id: 'photo', name: 'crepe.jpg', data: 'data:image/jpeg;base64,YWJj' }

test('legacy text backups remain importable', () => {
  assert.deepEqual(parseBackup([recipe]), { version: 2, recipes: [recipe], photos: [] })
})
test('backup preserves recipe and attempt photos', () => {
  const data = { version: 2, recipes: [{ ...recipe, photoIds: ['photo'], attempts: [{ id: 'a', date: '2026-10-24', changes: 'More water', result: 'Thinner', rating: 4, photoIds: ['photo'] }] }], photos: [photo] }
  assert.deepEqual(parseBackup(data), data)
})
test('missing media and unsafe data URLs cannot replace a journal', () => {
  assert.throws(() => parseBackup({ version: 2, recipes: [{ ...recipe, photoIds: ['missing'] }], photos: [] }), /missing/)
  assert.throws(() => parseBackup({ version: 2, recipes: [recipe], photos: [{ ...photo, data: 'data:image/svg+xml;base64,YWJj' }] }), /invalid/)
  assert.throws(() => parseBackup([{ ...recipe, photoIds: ['photo'] }]), /does not include/)
})
test('duplicate IDs, invalid ratings and invalid servings are rejected', () => {
  assert.throws(() => parseBackup([recipe, recipe]), /unique/)
  assert.throws(() => parseBackup([{ ...recipe, servings: 0 }]), /valid/)
  assert.throws(() => parseBackup([{ ...recipe, attempts: [{ id: 'a', date: '', changes: '', result: '', rating: 99 }] }]), /valid/)
})
test('oversized media and unsupported versions are rejected', () => {
  assert.throws(() => parseBackup({ version: 2, recipes: [recipe], photos: [{ ...photo, data: 'data:image/jpeg;base64,' + 'a'.repeat(1500000) }] }), /oversized/)
  assert.throws(() => parseBackup({ version: 99, recipes: [], photos: [] }), /Unsupported/)
})

test('photo canvas layout survives backup and rejects out-of-bounds placement', () => {
  const page = { id:'p',title:'Collage',text:'',template:'blank',paper:'plain',strokes:[],photoIds:['photo'],photoLayout:{photo:{x:35,y:20,width:25,height:40}} };
  const backup = {version:2,recipes:[{...recipe,journalPages:[page]}],photos:[photo]};
  assert.deepEqual(parseBackup(backup),backup);
  assert.throws(()=>parseBackup({...backup,recipes:[{...recipe,journalPages:[{...page,photoLayout:{photo:{x:90,y:20,width:25,height:40}}}]}]}),/valid/);
});
