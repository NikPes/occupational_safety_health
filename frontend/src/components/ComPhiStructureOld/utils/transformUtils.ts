// src/components/ComPhiStructure/utils/transformUtils.ts
import { PhiNodeData, PhiPort, PhiNodeInstance, PhiNode, STDTypeConnectionPhi } from '../subcomponents/PhiNode/types/nodeTypes';

export const transformBackendNodeToFrontend = (
  backendNode: PhiNodeInstance,
  phiNodeTemplate: PhiNode,
  typeMap: Map<string, STDTypeConnectionPhi>
): PhiNodeData => {
  const ports: PhiPort[] = [];

  // Преобразуем входы
  phiNodeTemplate.inputs.forEach((input: any) => {
    const socketType = typeMap.get(input.socketType);
    ports.push({
      id: `input-${input.key}`,
      name: input.name || input.key,
      type: input.socketType,
      direction: 'input',
      color: socketType?.color || '#808080',
      icon: socketType?.icon || '🔵',
      compatibleWith: socketType ? [socketType.type_key] : [],
      control: input.control ? {
        type: input.control.type,
        props: input.control.props || {},
        value: backendNode.node_data[input.key] || input.control.default
      } : undefined
    });
  });

  // Преобразуем выходы
  phiNodeTemplate.outputs.forEach((output: any) => {
    const socketType = typeMap.get(output.socketType);
    ports.push({
      id: `output-${output.key}`,
      name: output.name || output.key,
      type: output.socketType,
      direction: 'output',
      color: socketType?.color || '#808080',
      icon: socketType?.icon || '🔵',
      compatibleWith: socketType ? [socketType.type_key] : [],
    });
  });

  return {
    id: backendNode.node_id,
    node_key: backendNode.component_key,
    name: phiNodeTemplate.name,
    version: phiNodeTemplate.version,
    icon: phiNodeTemplate.icon || '⚙️',
    color: phiNodeTemplate.color || '#6B7280',
    position: { x: backendNode.position_x, y: backendNode.position_y },
    ports,
    controls: [],
    data: backendNode.node_data,
    status: 'offline',
    width: phiNodeTemplate.width,
    height: phiNodeTemplate.height
  };
};