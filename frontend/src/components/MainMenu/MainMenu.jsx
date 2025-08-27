import React, { useState, useEffect } from 'react';
import './MainMenu.css';

const MainMenu = ({
                    token,
                    pageName = 'root',
                    setPageName,
                  }) => {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchMenuData();
    }
  }, [pageName, token]);

  const fetchMenuData = async () => {
    try {
      if (!token) {
        setError('Токен отсутствует');
        return;
      }

      setLoading(true);
      setError('');

      const response = await fetch(`/WorkOST/main_menu/menu?page_name=${pageName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки меню');
      }

      const data = await response.json();
      setMenuData(data.menu || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemClick = (item, e) => {
    e.stopPropagation();

    if (item.target_type === 'PAGE') {
      console.log('Переход на страницу:', item.target_value);
      if (setPageName) {
        setPageName(item.target_value); // Обновляем страницу
      }
    } else if (item.target_type === 'URL') {
      window.open(item.target_value, '_blank');
    } else if (item.target_type === 'ACTION') {
      console.log('Выполнение действия:', item.target_value);
      // Здесь можно добавить вызов действий
    }
  };

  const renderMenuTree = (items, level = 0) => {
    return items.map((item) => (
      <li key={item.id}>
        <div className="menu">
          <div
            className={`menu-title ${level === 0 ? `menu-title_${(item.id % 4) + 1}` : ''}`}
            onClick={(e) => handleMenuItemClick(item, e)}
          >
            <span className="menu-text">{item.text_show}</span>
          </div>

          {item.children && item.children.length > 0 && (
            <ul className="menu-dropdown">
              {renderMenuTree(item.children, level + 1)}
            </ul>
          )}
        </div>
      </li>
    ));
  };

  if (!token) {
    return <div className="menu-error">Не авторизован</div>;
  }

  if (loading) {
    return <div className="menu-loading">Загрузка меню...</div>;
  }

  if (error) {
    return <div className="menu-error">Ошибка: {error}</div>;
  }

  if (!menuData.length) {
    return <div className="menu-empty">Меню пустое</div>;
  }

  return (
    <div className="main-menu-container">
      <nav className="main-menu">
        <ul className="hList">
          {renderMenuTree(menuData)}
        </ul>
      </nav>
    </div>
  );
};

export default MainMenu;