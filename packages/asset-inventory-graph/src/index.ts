export interface Asset{
  id:string;
  type:string;
  name:string;
  criticality:"low"|"medium"|"high"|"critical";
  connections:string[];
}

export interface InventoryGraph{
  assets:Asset[];
}

export function buildGraph(assets:Asset[]):InventoryGraph{
  return {assets};
}

export function findCriticalAssets(graph:InventoryGraph){
  return graph.assets.filter(a=>a.criticality==="critical");
}
