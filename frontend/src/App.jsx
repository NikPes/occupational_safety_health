import { BrowserRouter } from 'react-router-dom'
import './App.css'
import axios from "axios";
import React, { useState, useEffect } from "react";
import LoginForm from './components/LoginForm/LoginForm.jsx'
import Header from './components/Header/Header.jsx'
import UseToken from './components/UseToken/UseToken.jsx'
import BodyConstruct from './components/BodyConstruct/BodyConstruct.jsx'

function App() {
    const { token, clearToken, setToken } = UseToken();
    const [pageName, setPageName] = useState('root');
    const [isTokenValid, setIsTokenValid] = useState(null);

    useEffect(() => {
        const checkTokenValidity = async () => {
            if (!token) {
                setIsTokenValid(false);
                return;
            }

            try {
                const response = await axios({
                    method: "GET",
                    url: "/WorkOST/use_token/checkToken",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    validateStatus: (status) => status === 200 || status === 401 // Разрешаем 401
                });

                setIsTokenValid(response.status === 200);
                if (response.status === 401) {
                    clearToken();
                }
            } catch (error) {
                // Игнорируем ошибки 401, логируем остальные
                if (!error.response || error.response.status !== 401) {
                    console.error("Ошибка при проверке токена:", error);
                }
                setIsTokenValid(false);
                clearToken();
            }
        };

        checkTokenValidity();
    }, [token, clearToken]);

    // Добавляем перехватчик для всех запросов
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(config => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        const responseInterceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    clearToken();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [token, clearToken]);

    useEffect(() => {
        // Устанавливаем data-атрибут для body
        document.body.setAttribute('data-page', pageName);

        // Или добавляем класс
        document.body.className = `page-${pageName}`;
    }, [pageName]);

    if (isTokenValid === null) {
        return <div>Проверка токена...</div>;
    }

    return (
        <BrowserRouter>
            <div className="App">
                {!token || !isTokenValid ? (
                    <LoginForm setToken={setToken} />
                ) : (
                    <>
                        <Header
                            token={token}
                            clearToken={clearToken}
                            pageName={pageName}
                            setPageName={setPageName}
                        />
                        <BodyConstruct
                            token={token}
                            pageName={pageName}
                        />
                    </>
                )}
            </div>
        </BrowserRouter>
    )
}

export default App