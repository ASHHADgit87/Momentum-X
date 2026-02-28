import { forwardRef } from 'react';
import * as THREE from 'three';

interface CarModelProps {
  color: string;
}

/** Improved 3D car with more detailed geometry */
const CarModel = forwardRef<THREE.Group, CarModelProps>(({ color }, ref) => {
  return (
    <group ref={ref}>
      {/* Chassis / lower body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[2.1, 0.35, 4.6]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Main body */}
      <mesh position={[0, 0.55, 0.1]} castShadow>
        <boxGeometry args={[1.95, 0.4, 4.2]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Hood (sloped front) */}
      <mesh position={[0, 0.6, 1.6]} castShadow>
        <boxGeometry args={[1.8, 0.15, 1.2]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.9, -0.15]} castShadow>
        <boxGeometry args={[1.6, 0.4, 1.6]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.15, -0.2]} castShadow>
        <boxGeometry args={[1.5, 0.08, 1.4]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.92, 0.6]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[1.5, 0.38, 0.05]} />
        <meshStandardMaterial color="#1a3a5c" metalness={0.95} roughness={0.05} transparent opacity={0.7} />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 0.92, -0.95]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[1.4, 0.32, 0.05]} />
        <meshStandardMaterial color="#1a3a5c" metalness={0.95} roughness={0.05} transparent opacity={0.6} />
      </mesh>

      {/* Side windows left */}
      <mesh position={[-0.82, 0.9, -0.15]}>
        <boxGeometry args={[0.05, 0.3, 1.2]} />
        <meshStandardMaterial color="#1a3a5c" metalness={0.9} roughness={0.1} transparent opacity={0.5} />
      </mesh>

      {/* Side windows right */}
      <mesh position={[0.82, 0.9, -0.15]}>
        <boxGeometry args={[0.05, 0.3, 1.2]} />
        <meshStandardMaterial color="#1a3a5c" metalness={0.9} roughness={0.1} transparent opacity={0.5} />
      </mesh>

      {/* Front splitter */}
      <mesh position={[0, 0.15, 2.3]} castShadow>
        <boxGeometry args={[2.0, 0.08, 0.15]} />
        <meshStandardMaterial color="#111111" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Rear diffuser */}
      <mesh position={[0, 0.15, -2.3]} castShadow>
        <boxGeometry args={[1.9, 0.12, 0.2]} />
        <meshStandardMaterial color="#111111" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Rear spoiler */}
      <mesh position={[0, 1.0, -2.0]} castShadow>
        <boxGeometry args={[1.8, 0.06, 0.35]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Spoiler supports */}
      <mesh position={[-0.6, 0.85, -2.0]} castShadow>
        <boxGeometry args={[0.08, 0.25, 0.08]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[0.6, 0.85, -2.0]} castShadow>
        <boxGeometry args={[0.08, 0.25, 0.08]} />
        <meshStandardMaterial color="#222222" />
      </mesh>

      {/* Wheels with rims */}
      {([[-1.0, 0.22, 1.4], [1.0, 0.22, 1.4], [-1.0, 0.22, -1.4], [1.0, 0.22, -1.4]] as [number, number, number][]).map((pos, i) => (
        <group key={i} position={pos}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 0.28, 16]} />
            <meshStandardMaterial color="#111111" roughness={0.9} />
          </mesh>
          {/* Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.3, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Headlights */}
      <mesh position={[-0.65, 0.5, 2.3]}>
        <boxGeometry args={[0.35, 0.12, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffdd" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.65, 0.5, 2.3]}>
        <boxGeometry args={[0.35, 0.12, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffdd" emissiveIntensity={0.8} />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.7, 0.5, -2.3]}>
        <boxGeometry args={[0.3, 0.1, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.7, 0.5, -2.3]}>
        <boxGeometry args={[0.3, 0.1, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>

      {/* Side mirrors */}
      <mesh position={[-1.1, 0.8, 0.5]}>
        <boxGeometry args={[0.15, 0.1, 0.2]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[1.1, 0.8, 0.5]}>
        <boxGeometry args={[0.15, 0.1, 0.2]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
});

CarModel.displayName = 'CarModel';
export default CarModel;
