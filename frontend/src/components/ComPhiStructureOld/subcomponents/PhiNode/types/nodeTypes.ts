// Добавляем тип PhiPort
export interface PhiPort {
  id: string;
  name: string;
  type: string;
  direction: 'input' | 'output';
  color: string;
  icon: string;
  control?: PhiControl;
  compatibleWith: string[];
  description?: string;
}

export interface PhiControl {
  type: 'input' | 'select' | 'checkbox' | 'slider' | 'textarea';
  props: Record<string, any>;
  value: any;
}

// Остальные типы остаются без изменений
export interface STDTypeConnectionPhi {
  id: number;
  type_key: string;
  show_name: string;
  color: string;
  icon: string;
  description: string;
  order: number;
  is_builtin: boolean;
}

export interface PhiSocket {
  id: number;
  name: string;
  std_type_id: number;
  description?: string;
  is_deprecated: boolean;
  created_at: string;
  updated_at: string;
  std_type_rel?: STDTypeConnectionPhi;
}

export interface PhiNode {
  id: number;
  node_key: string;
  name: string;
  std_node_category_id?: number;
  std_node_type_id?: number;
  icon?: string;
  color?: string;
  width: number;
  height: number;
  inputs: any[];
  outputs: any[];
  controls: any[];
  executor?: string;
  init_code?: string;
  description?: string;
  version: string;
  is_deprecated: boolean;
  tags: string[];
  required_permission: number;
  usage_count: number;
  last_used?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface PhiNodeInstance {
  id: number;
  node_id: string;
  schema_id: number;
  component_key: string;
  position_x: number;
  position_y: number;
  node_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  input_connections: PhiConnection[];
  output_connections: PhiConnection[];
}

export interface PhiConnection {
  id: number;
  connection_id: string;
  schema_id: number;
  source_node_id: string;
  source_socket: string;
  target_node_id: string;
  target_socket: string;
  connection_data: Record<string, any>;
  created_at: string;
}

export interface PhiNodeData {
  id: string;
  node_key: string;
  name: string;
  version: string;
  icon: string;
  color: string;
  position: { x: number; y: number };
  ports: PhiPort[];  // ← Теперь используем PhiPort вместо any
  controls: PhiControl[];
  data: Record<string, any>;
  status: 'online' | 'offline' | 'error';
  width: number;
  height: number;
}

export interface PhiSchema {
  id: number;
  name: string;
  description?: string;
  viewport: {
    zoom: number;
    x: number;
    y: number;
  };
  metadata: {
    version: string;
    is_template: boolean;
    is_public: boolean;
    nodes_count: number;
    connections_count: number;
    last_executed?: string;
    created_at: string;
    updated_at: string;
  };
  nodes: PhiNodeData[];
  connections: PhiConnection[];
}

export interface PhiNodeEditData {
  id: string;
  name: string;
  version: string;
  icon: string;
  color: string;
  inputs: PhiPortEdit[];
  outputs: PhiPortEdit[];
  controls: PhiControlEdit[];
  executor?: string;
  init_code?: string;
  description?: string;
  tags: string[];
}

export interface PhiPortEdit {
  id: string;
  name: string;
  type: string;
  socketType: string;
  color: string;
  icon: string;
  controlType?: string;
  controlProps?: Record<string, any>;
  description?: string;
  compatibleWith: string[];
}

export interface PhiControlEdit {
  id: string;
  type: string;
  props: Record<string, any>;
  defaultValue: any;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface CreateNodeRequest {
  node_key: string;
  name: string;
  inputs: any[];
  outputs: any[];
  controls: any[];
  executor?: string;
}

export interface UpdateNodeRequest {
  id: string;
  data: Partial<PhiNodeData>;
}

export type Vector2 = { x: number; y: number };
export type Bounds = { x: number; y: number; width: number; height: number };

export const NODE_DEFAULT_WIDTH = 200;
export const NODE_DEFAULT_HEIGHT = 100;
export const SOCKET_RADIUS = 4;
export const GRID_SIZE = 20;