import React, { useState, useEffect } from "react";
import AddButton from "@/components/ComTable/subcomponents/AddButton/AddButton.jsx";
import Search from "@/components/ComTable/subcomponents/Search/Search";
import TableWithPagination from "@/components/ComTable/subcomponents/TableWithPagination/TableWithPagination";
import axios from "axios";
import './ComTable.css'

function ComTable({ token, table_name, count_sheet }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [columns, setColumns] = useState([]); // Состояние для заголовков таблицы
    const [refreshKey, setRefreshKey] = useState(0);

    // Запрос заголовков таблицы
    useEffect(() => {
        axios({
            method: "GET",
            url: "/WorkOST/table_bd_views/getNameHead",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                table_name: table_name,
            },
        })
            .then((response) => {
                setColumns(response.data); // Сохраняем заголовки
            })
            .catch((error) => {
                console.error("Ошибка при запросе заголовков:", error);
                setColumns([]); // Устанавливаем пустой список в случае ошибки
            });
    }, [token, table_name]);

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    // Если заголовки пустые, не рендерим компонент
    if (columns.length === 0) {
        return null;
    }
    const handleDataUpdated = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div>
            <div className="com-table">
                <AddButton token={token} table_name={table_name} onDataUpdated={handleDataUpdated} />
                <Search onSearch={handleSearch} />
            </div>
            <TableWithPagination
                token={token}
                table_name={table_name}
                searchQuery={searchQuery}
                refreshKey={refreshKey}
                count_sheet={count_sheet}
                columns={columns}
                onDataUpdated={handleDataUpdated}
            />
        </div>
    );
}

export default ComTable;