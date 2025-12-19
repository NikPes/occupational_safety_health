// ComPhiStructure.tsx
import React, { useEffect, useState } from 'react';
import { PhiCanvas } from './PhiCanvas/PhiCanvas';
import { useGetDataBd, useGetUserStatus } from './core/utils/GetData';
import './ComPhiStructure.css';

interface ComPhiStructureProps {
  data: any;
  token: string;
}

const ComPhiStructure: React.FC<ComPhiStructureProps> = ({ token }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Запрос настроек пользователя
  const jsonQuery = {
    table: "UserConfig",
    filter: ["id_user", "current_user"],
    fields: ["settings"],
    limit: 1
  };

  const {
    data: userSettingsData,
    loading: loadingSettings,
    error: errorSettings
  } = useGetDataBd(jsonQuery, token);

  // Запрос статуса пользователя
  const {
    userStatus,
    loading: loadingStatus,
    error: errorStatus
  } = useGetUserStatus(token);

  useEffect(() => {
    // Ждем загрузки обоих запросов
    if (!loadingSettings && !loadingStatus) {
      if (errorSettings || errorStatus) {
        console.error('Ошибки загрузки:', { errorSettings, errorStatus });
      }
      setIsLoaded(true);
    }
  }, [loadingSettings, loadingStatus]);

  if (!isLoaded) {
    return <div className="com-phi-structure-loading">Загрузка редактора...</div>;
  }

  const validStatuses = ['root', 'admin', 'user'] as const;
  if (!validStatuses.includes(userStatus as any)) {
    console.error(`Неверный статус пользователя: ${userStatus}`);
    return <div>Ошибка: неверный статус пользователя</div>;
  }

  // Получаем настройки или дефолтные
  const settings = userSettingsData?.[0]?.settings || {
    theme: 'dark',
    uiPhiNode: {
      scale: 1.0,
      animations: true,
      gridMode: 'none' as const
    }
  };

  return (
    <div className="com-phi-structure">
      <div className="com-phi-structure-editor">
        <PhiCanvas
          userStatus={userStatus as 'root' | 'admin' | 'user'}  // 'root', 'admin' или 'user'
          userSettings={settings}
          token={token}
          className="phi-canvas-container"
        />
      </div>
    </div>
  );
};

export default ComPhiStructure;