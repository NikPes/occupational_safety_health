import React, { useState } from 'react';
import axios from 'axios';
import './LoginForm.css';

const LoginForm = ({ setToken }) => {
  const [formData, setFormData] = useState({
    user_login: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios({
        method: "POST",
        url: "/WorkOST/login",
        data: {
          user_login: formData.user_login,
          password: formData.password
        }
      });

      // Успешная авторизация
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        setToken(response.data.access_token);
      }

    } catch (error) {
      if (error.response) {
        // Сервер вернул ошибку
        setError(error.response.data.msg || 'Ошибка авторизации');
      } else {
        // Ошибка сети или соединения
        setError('Ошибка соединения с сервером');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit}>
        <h2>Вход в систему</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="input-field">
          <input
            type="text"
            name="user_login"
            value={formData.user_login}
            onChange={handleInputChange}
            required
          />
          <label>Введите логин</label>
        </div>

        <div className="input-field">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <label>Введите пароль</label>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;