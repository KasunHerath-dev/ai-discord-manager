import test from "node:test";import assert from "node:assert/strict";import{permissionValue,permissionNames}from"../src/discord/permissions.js";
test("permission conversion",()=>{const names=["ViewChannel","SendMessages","ManageChannels"];assert.deepEqual(permissionNames(permissionValue(names)).sort(),names.sort())});
