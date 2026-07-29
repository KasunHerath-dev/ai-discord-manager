import test from "node:test";import assert from "node:assert/strict";import{createPasswordVerifier,verifyPassword}from"../src/security.js";
test("password verifier",()=>{const v=createPasswordVerifier("strong-password");assert.equal(verifyPassword("strong-password",v),true);assert.equal(verifyPassword("wrong-password",v),false)});
