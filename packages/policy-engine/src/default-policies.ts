import type {SecurityPolicy} from "./types.js";

export const defaultPolicies: SecurityPolicy[] = [
  {
    id:"block-critical-main",
    name:"Block critical attack paths on main",
    enabled:true,
    minimumScore:80,
    action:"block",
    requireUnblockedPath:true,
    appliesToBranches:["main"]
  },
  {
    id:"warn-high-feature",
    name:"Warn on high-risk feature branches",
    enabled:true,
    minimumScore:65,
    action:"warn",
    requireUnblockedPath:true,
    appliesToBranches:["feature/*"]
  }
];
