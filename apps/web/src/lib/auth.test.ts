import {describe,it,expect} from "vitest";import {hashPassword,verifyPassword} from "./auth";
describe("password hashing",()=>{it("validates the original password",()=>{const value=hashPassword("CorrectHorseBatteryStaple");expect(verifyPassword("CorrectHorseBatteryStaple",value)).toBe(true);expect(verifyPassword("wrong",value)).toBe(false)})});
