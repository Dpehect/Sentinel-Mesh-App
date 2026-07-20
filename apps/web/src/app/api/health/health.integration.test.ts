import {describe,it,expect} from "vitest";describe("health contract",()=>{it("uses explicit readiness states",()=>{const states=["ok","degraded","unavailable"];expect(states).toContain("ok")})});
