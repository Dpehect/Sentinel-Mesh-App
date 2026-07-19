"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, OrbitControls, Sphere, Text } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";

const nodes = [
  { p: [-2.3, 1.2, 0] as [number,number,number], label: "PUBLIC API", risk: .4 },
  { p: [-.5, .2, .4] as [number,number,number], label: "AUTH", risk: .65 },
  { p: [1.6, 1.1, -.2] as [number,number,number], label: "ADMIN", risk: .9 },
  { p: [2.4, -1, .3] as [number,number,number], label: "DATABASE", risk: .75 },
  { p: [-1.4, -1.3, -.4] as [number,number,number], label: "CI/CD", risk: .3 },
];

function Scene({ active }: { active: boolean }) {
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * (active ? .09 : .025);
    state.camera.position.y = Math.sin(state.clock.elapsedTime * .18) * .25;
  });
  return <group ref={group}>
    {nodes.map((node, i) => <Float key={node.label} speed={1+i*.08} rotationIntensity={.12} floatIntensity={.32}>
      <Sphere args={[.18 + node.risk*.1, 24, 24]} position={node.p}>
        <meshStandardMaterial color={node.risk>.8 ? "#ff7d8a" : "#7cf6c5"} emissive={node.risk>.8 ? "#7a1224" : "#0b644b"} emissiveIntensity={active ? 1.6 : .8} />
      </Sphere>
      <Text position={[node.p[0],node.p[1]-.42,node.p[2]]} fontSize={.16} color="#9eb5ae" anchorX="center">{node.label}</Text>
    </Float>)}
    <Line points={nodes.slice(0,4).map(n=>n.p)} color={active ? "#ff7d8a" : "#76b8ff"} lineWidth={active ? 2.2 : 1} transparent opacity={.72} />
    <Line points={[nodes[4].p,nodes[1].p]} color="#7cf6c5" lineWidth={1} transparent opacity={.35} />
  </group>;
}

export function SecurityMesh({ active }: { active: boolean }) {
  return <Canvas camera={{ position:[0,0,6.2], fov:45 }} dpr={[1,1.6]}>
    <ambientLight intensity={.38}/><pointLight position={[2,3,4]} intensity={18} color="#7cf6c5"/><pointLight position={[-3,-2,2]} intensity={12} color="#76b8ff"/>
    <Scene active={active}/><OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={.25}/>
  </Canvas>;
}
