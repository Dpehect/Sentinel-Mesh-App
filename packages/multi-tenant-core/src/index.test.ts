import{describe,expect,it}from"vitest";
import{assertTenantResourceAccess,authorizeTenantAction,evaluateTenantQuota,validateTenantIsolation}from"./index.js";
const tenant={id:"org-1",name:"Example",status:"active" as const,dataRegion:"eu"};
describe("multi tenant core",()=>{
 it("authorizes scoped analysts",()=>expect(authorizeTenantAction(tenant,{tenantId:"org-1",principalId:"u1",role:"analyst",active:true},"security:investigate").allowed).toBe(true));
 it("blocks cross tenant access",()=>expect(()=>assertTenantResourceAccess("org-1",{id:"a",tenantId:"org-2",type:"asset"})).toThrow("CROSS_TENANT_RESOURCE_ACCESS"));
 it("detects quotas",()=>expect(evaluateTenantQuota({tenantId:"org-1",assets:1,users:1,eventsPerDay:10,storageMb:10},{tenantId:"org-1",assets:2,users:1,eventsToday:11,storageMb:5})).toEqual(["ASSET_QUOTA_EXCEEDED","EVENT_QUOTA_EXCEEDED"]));
 it("blocks cross tenant references",()=>expect(validateTenantIsolation([tenant,{...tenant,id:"org-2"}],[],[{id:"a",tenantId:"org-1",type:"asset"},{id:"b",tenantId:"org-2",type:"asset"}],[{fromResourceId:"a",toResourceId:"b"}],[],[]).decision).toBe("block"));
});
