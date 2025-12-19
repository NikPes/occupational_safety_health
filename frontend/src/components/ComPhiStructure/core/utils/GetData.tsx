import { useState, useEffect } from 'react';
import axios from 'axios';

export const useGetDataBd = (json_data: any, token: string) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        axios({
            method: "GET",
            url: "/WorkOST/table_bd_views/getDataFromBase",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                json_data: JSON.stringify(json_data), // Сериализуем!
            },
        })
            .then((response) => {
                setData(response.data); // Получаем массив данных
                setLoading(false);
            })
            .catch((error) => {
                console.error("Ошибка при запросе данных:", error);
                setError(error.message);
                setData([]);
                setLoading(false);
            });
    }, [token, JSON.stringify(json_data)]);

    return { data, loading, error };
};

export const useGetUserStatus = (token: string) => {
    const [userStatus, setUserStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        axios({
            method: "GET",
            url: "/WorkOST/user_bd_views/getUserStatus",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                setUserStatus(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Ошибка при запросе статуса:", error);
                setError(error.message);
                setUserStatus(null);
                setLoading(false);
            });
    }, [token]);

    return { userStatus, loading, error };
};