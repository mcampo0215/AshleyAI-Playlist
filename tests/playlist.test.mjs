import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const context = { exports: {} };
const source = fs.readFileSync('src/lib/playlist.ts', 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, context);
const { loadWeeklyPlaylist } = context.exports;
const mix = { id: 'p.weekly', attributes: { name: 'AshleyAI Weekly Mix' } };

test('finds the weekly mix beyond the first page and loads every track page in order', async () => {
  const pages = [
    { data: [{ id: 'other', attributes: { name: 'Other mix' } }], next: '/v1/me/library/playlists?offset=100' },
    { data: [mix] },
    { data: [{ id: 'song1', attributes: { name: 'First song', artistName: 'First artist' } }], next: '/v1/me/library/playlists/p.weekly/tracks?offset=100' },
    { data: [{ id: 'song2', attributes: { name: 'Second song', artistName: 'Second artist' } }] },
  ];
  const paths = [];
  const result = await loadWeeklyPlaylist(async path => { paths.push(path); return { data: pages.shift() }; });
  assert.equal(result.name, 'AshleyAI Weekly Mix');
  assert.deepEqual(Array.from(result.tracks, track => [track.title, track.artist]), [['First song', 'First artist'], ['Second song', 'Second artist']]);
  assert.deepEqual(paths, ['/v1/me/library/playlists?limit=100', '/v1/me/library/playlists?offset=100', '/v1/me/library/playlists/p.weekly/tracks?limit=100', '/v1/me/library/playlists/p.weekly/tracks?offset=100']);
});

test('does not substitute another playlist when the weekly mix is missing', async () => {
  const result = await loadWeeklyPlaylist(async () => ({ data: { data: [{ id: 'other', attributes: { name: 'Favorites' } }] } }));
  assert.equal(result, null);
});

test('returns an empty existing mix so the UI can prompt for a refresh', async () => {
  let call = 0;
  const result = await loadWeeklyPlaylist(async () => ({ data: { data: call++ ? [] : [mix] } }));
  assert.equal(result.id, mix.id);
  assert.equal(result.tracks.length, 0);
});

test('propagates authorization or network errors for the retry state', async () => {
  await assert.rejects(loadWeeklyPlaylist(async () => { throw new Error('Unauthorized'); }), /Unauthorized/);
});

test('preserves repeated playlist entries and handles missing metadata', async () => {
  let call = 0;
  const result = await loadWeeklyPlaylist(async () => ({ data: { data: call++ ? [{ id: 'same' }, { id: 'same' }] : [mix] } }));
  assert.equal(result.tracks.length, 2);
  assert.equal(result.tracks[0].title, 'Untitled track');
  assert.equal(result.tracks[0].artist, 'Unknown artist');
});
