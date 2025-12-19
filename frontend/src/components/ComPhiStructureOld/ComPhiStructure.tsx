// ComPhiStructure.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PhiConstructSpace, PhiConstructSpaceHandle } from './subcomponents/PhiConstructSpace/PhiConstructSpace';
import { ThemeMode, GridMode } from './subcomponents/PhiConstructSpace/types';
import './ComPhiStructure.css';

interface ComPhiStructureProps {
  data: any;
  token: string;
  table_name?: string;
  count_sheet?: number;
}

const ComPhiStructure: React.FC<ComPhiStructureProps> = ({
  data,
  token,
  table_name
}) => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [gridMode, setGridMode] = useState<GridMode>('lines');
  const [isLoaded, setIsLoaded] = useState(false);

  // Используем правильный тип для ref
  const phiSpaceRef = useRef<PhiConstructSpaceHandle>(null);

  useEffect(() => {
    console.log('ComPhiStructure mounted with data:', data);
    setIsLoaded(true);
  }, [data, token, table_name]);

  const handleAddNode = useCallback((nodeData: unknown) => {
    console.log('Adding node from parent:', nodeData);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const toggleGridMode = () => {
    setGridMode(prevMode => {
      if (prevMode === 'lines') return 'dots';
      if (prevMode === 'dots') return 'none';
      return 'lines';
    });
  };

  if (!isLoaded) {
    return <div className="com-phi-structure-loading">Загрузка редактора нодов...</div>;
  }

  return (
    <div className="com-phi-structure">

      <div className="com-phi-structure-editor">
        <PhiConstructSpace
          ref={phiSpaceRef}
          theme={theme}
          gridMode={gridMode}
          onAddNode={handleAddNode}
          className="phi-construct-space-container"
        />
      </div>

    </div>
  );
};

export default ComPhiStructure;