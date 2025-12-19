import React, { useEffect, useState } from "react";
import axios from "axios";
import EditDelButtons from "@/components/ComTable/subcomponents/EditDelButtons/EditDelButtons";
import EditFunc from "@/components/ComTable/subcomponents/EditFunc/EditFunc";
import './TableWithPagination.css';

function TableWithPagination({
                                 token,
                                 table_name,
                                 searchQuery,
                                 onDataUpdated,
                                 refreshKey,
                                 count_sheet,
                                 columns
                             }) {
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editAccess, setEditAccess] = useState(null);
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState(null);

    const perPage = count_sheet || 10;

    const getRowNumber = (index) => {
        return (currentPage - 1) * perPage + index + 1;
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const renderCellValue = (row, columnName) => {
        const value = row[columnName];
        if (value === null || value === undefined) return '';

        if (typeof value === 'string' && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
            return value.slice(0, 5);
        }

        const relationData = row[`${columnName}_data`];
        if (relationData) {
            if (Array.isArray(relationData)) {
                return relationData.map(item => getDisplayValue(item)).join(', ');
            }
            return getDisplayValue(relationData);
        }
        return String(value);
    };

    const getDisplayValue = (data) => {
        if (!data || typeof data !== 'object') return '';
        const stringField = Object.entries(data).find(
            ([key, value]) => typeof value === 'string' && value.trim() !== '' && !key.startsWith('_')
        );
        if (stringField) return stringField[1];
        const numericField = Object.entries(data).find(
            ([key, value]) => typeof value === 'number' && !key.startsWith('_')
        );
        if (numericField) return numericField[1].toString();
        return data.id ? `ID: ${data.id}` : '';
    };

    useEffect(() => {
        if (columns.length > 0 && !sortConfig.key) {
            const firstColumn = columns[0].column_name;
            setSortConfig({
                key: firstColumn,
                direction: 'asc'
            });
        }
    }, [columns]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dataResponse = await axios.get('/WorkOST/table_bd_views/getDataTable', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        table_name,
                        page: currentPage,
                        per_page: perPage,
                        relations: true,
                        sort_by: sortConfig.key,
                        sort_order: sortConfig.direction,
                        search: searchQuery
                    }
                });

                setData(dataResponse.data.rows);
                setTotalPages(dataResponse.data.totalPages);
                setEditAccess(dataResponse.data.edit_access);
            } catch (error) {
                console.error('Error loading table data:', error);
            }
        };

        if (columns.length > 0 && sortConfig.key) {
            fetchData();
        }
    }, [token, table_name, searchQuery, currentPage, refreshKey, sortConfig, perPage, columns]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту запись?")) return;

        try {
            await axios.delete("/WorkOST/table_bd_edit/delRow", {
                headers: { Authorization: `Bearer ${token}` },
                params: { table_name, id }
            });
            if (onDataUpdated) onDataUpdated();
        } catch (error) {
            console.error('Ошибка при удалении:', error);
        }
    };

    const handleEdit = (id) => {
        setEditingRecordId(id);
        setEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setEditModalOpen(false);
        setEditingRecordId(null);
        if (onDataUpdated) onDataUpdated();
    };

    const handleEditClose = () => {
        setEditModalOpen(false);
        setEditingRecordId(null);
    };

    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages > 0) {
            pages.push(
                <button
                    key={`${table_name}-1`}
                    onClick={() => handlePageChange(1)}
                    className={currentPage === 1 ? "active" : ""}
                >
                    1
                </button>
            );
        }

        if (currentPage > maxVisiblePages) {
            pages.push(<span key={`${table_name}-ellipsis-start`}>...</span>);
        }

        const startPage = Math.max(2, currentPage - 2);
        const endPage = Math.min(totalPages - 1, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={`${table_name}-${i}`}
                    onClick={() => handlePageChange(i)}
                    className={i === currentPage ? "active" : ""}
                >
                    {i}
                </button>
            );
        }

        if (currentPage < totalPages - maxVisiblePages + 1) {
            pages.push(<span key={`${table_name}-ellipsis-end`}>...</span>);
        }

        if (totalPages > 1) {
            pages.push(
                <button
                    key={`${table_name}-${totalPages}`}
                    onClick={() => handlePageChange(totalPages)}
                    className={currentPage === totalPages ? "active" : ""}
                >
                    {totalPages}
                </button>
            );
        }

        return pages;
    };

    return (
        <div className="table_blu">
            <table>
                <thead className="table_blu_thead">
                <tr>
                    <th style={{width: '50px'}}>№</th>
                    {columns.map((column, index) => (
                        <th
                            key={index}
                            onClick={() => requestSort(column.column_name)}
                            style={{cursor: 'pointer'}}
                        >
                            {column.column_name_show}
                            {sortConfig.key === column.column_name && (
                                sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
                            )}
                        </th>
                    ))}
                    {editAccess && <th style={{width: '100px'}}>Правка</th>}
                </tr>
                </thead>
                <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={row.id || rowIndex}>
                        <td>{getRowNumber(rowIndex)}</td>
                        {columns.map(column => (
                            <td key={`${row.id}-${column.column_name}`}>
                                {renderCellValue(row, column.column_name)}
                            </td>
                        ))}
                        {editAccess && (
                            <td>
                                <EditDelButtons
                                    access_type={editAccess}
                                    onEdit={() => handleEdit(row.id)}
                                    onDelete={() => handleDelete(row.id)}
                                />
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
                <tfoot>
                <tr>
                    <td colSpan={columns.length + (editAccess ? 2 : 1)}>
                        <div className="pagination-container">
                            {renderPagination()}
                        </div>
                    </td>
                </tr>
                </tfoot>
            </table>

            {editModalOpen && (
                <EditFunc
                    token={token}
                    table_name={table_name}
                    record_id={editingRecordId}
                    isOpen={editModalOpen}
                    onClose={handleEditClose}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}

export default TableWithPagination;


// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import EditFunc from "@/components/ComTable/subcomponents/EditFunc/EditFunc.jsx";
// import './TableWithPagination.css';
//
// function TableWithPagination({
//                                  token,
//                                  table_name,
//                                  searchQuery,
//                                  onDataUpdated,
//                                  refreshKey,
//                                  count_sheet,
//                                  columns
//                              }) {
//     const [data, setData] = useState([]);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [totalPages, setTotalPages] = useState(1);
//     const [editAccess, setEditAccess] = useState(null);
//     const [sortConfig, setSortConfig] = useState({
//         key: null,
//         direction: 'asc'
//     });
//     const perPage = count_sheet || 10;
//     const getRowNumber = (index) => {
//         return (currentPage - 1) * perPage + index + 1;
//     };
//
//     const requestSort = (key) => {
//         let direction = 'asc';
//         if (sortConfig.key === key && sortConfig.direction === 'asc') {
//             direction = 'desc';
//         }
//         setSortConfig({ key, direction });
//         setCurrentPage(1);
//     };
//
//     const renderCellValue = (row, columnName) => {
//         const value = row[columnName];
//         if (value === null || value === undefined) return '';
//
//         // Обработка времени
//         if (typeof value === 'string' && value.match(/^\d{2}:\d{2}:\d{2}$/)) {
//             return value.slice(0, 5); // Отображаем только часы и минуты
//         }
//
//         const relationData = row[`${columnName}_data`];
//         if (relationData) {
//             if (Array.isArray(relationData)) {
//                 return relationData.map(item => getDisplayValue(item)).join(', ');
//             }
//             return getDisplayValue(relationData);
//         }
//         return String(value);
//     };
//
//     const getDisplayValue = (data) => {
//         if (!data || typeof data !== 'object') return '';
//         const stringField = Object.entries(data).find(
//             ([key, value]) => typeof value === 'string' && value.trim() !== '' && !key.startsWith('_')
//         );
//         if (stringField) return stringField[1];
//         const numericField = Object.entries(data).find(
//             ([key, value]) => typeof value === 'number' && !key.startsWith('_')
//         );
//         if (numericField) return numericField[1].toString();
//         return data.id ? `ID: ${data.id}` : '';
//     };
//
//     useEffect(() => {
//         if (columns.length > 0 && !sortConfig.key) {
//             const firstColumn = columns[0].column_name;
//             setSortConfig({
//                 key: firstColumn,
//                 direction: 'asc'
//             });
//         }
//     }, [columns]);
//
//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const dataResponse = await axios.get('/WorkOST/table_bd_views/getDataTable', {
//                     headers: { Authorization: `Bearer ${token}` },
//                     params: {
//                         table_name,
//                         page: currentPage,
//                         per_page: perPage,
//                         relations: true,
//                         sort_by: sortConfig.key,
//                         sort_order: sortConfig.direction,
//                         search: searchQuery
//                     }
//                 });
//
//                 setData(dataResponse.data.rows);
//                 setTotalPages(dataResponse.data.totalPages);
//                 setEditAccess(dataResponse.data.edit_access);
//             } catch (error) {
//                 console.error('Error loading table data:', error);
//             }
//         };
//
//         if (columns.length > 0 && sortConfig.key) {
//             fetchData();
//         }
//     }, [token, table_name, searchQuery, currentPage, refreshKey, sortConfig, perPage, columns]);
//
//     const handlePageChange = (page) => {
//         setCurrentPage(page);
//     };
//
//     const handleDelete = async (id) => {
//         if (!window.confirm("Вы уверены, что хотите удалить эту запись?")) return;
//
//         try {
//             await axios.delete("/WorkOST/table_bd_edit/delRow", {
//                 headers: { Authorization: `Bearer ${token}` },
//                 params: { table_name, id }
//             });
//             if (onDataUpdated) onDataUpdated();
//         } catch (error) {
//             console.error('Ошибка при удалении:', error);
//         }
//     };
//
//     const renderPagination = () => {
//         const pages = [];
//         const maxVisiblePages = 5;
//
//         if (totalPages > 0) {
//             pages.push(
//                 <button
//                     key={`${table_name}-1`}
//                     onClick={() => handlePageChange(1)}
//                     className={currentPage === 1 ? "active" : ""}
//                 >
//                     1
//                 </button>
//             );
//         }
//
//         if (currentPage > maxVisiblePages) {
//             pages.push(<span key={`${table_name}-ellipsis-start`}>...</span>);
//         }
//
//         const startPage = Math.max(2, currentPage - 2);
//         const endPage = Math.min(totalPages - 1, currentPage + 2);
//
//         for (let i = startPage; i <= endPage; i++) {
//             pages.push(
//                 <button
//                     key={`${table_name}-${i}`}
//                     onClick={() => handlePageChange(i)}
//                     className={i === currentPage ? "active" : ""}
//                 >
//                     {i}
//                 </button>
//             );
//         }
//
//         if (currentPage < totalPages - maxVisiblePages + 1) {
//             pages.push(<span key={`${table_name}-ellipsis-end`}>...</span>);
//         }
//
//         if (totalPages > 1) {
//             pages.push(
//                 <button
//                     key={`${table_name}-${totalPages}`}
//                     onClick={() => handlePageChange(totalPages)}
//                     className={currentPage === totalPages ? "active" : ""}
//                 >
//                     {totalPages}
//                 </button>
//             );
//         }
//
//         return pages;
//     };
//
//     return (
//         <div className="table_blu">
//             <table>
//                 <thead className="table_blu_thead">
//                 <tr>
//                     <th style={{width: '50px'}}>№</th>
//                     {columns.map((column, index) => (
//                         <th
//                             key={index}
//                             onClick={() => requestSort(column.column_name)}
//                             style={{cursor: 'pointer'}}
//                         >
//                             {column.column_name_show}
//                             {sortConfig.key === column.column_name && (
//                                 sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
//                             )}
//                         </th>
//                     ))}
//                     {editAccess && <th style={{width: '100px'}}>Правка</th>}
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {data.map((row, rowIndex) => (
//                     <tr key={row.id || rowIndex}>
//                         <td>{getRowNumber(rowIndex)}</td>
//                         {columns.map(column => (
//                             <td key={`${row.id}-${column.column_name}`}>
//                                 {renderCellValue(row, column.column_name)}
//                             </td>
//                         ))}
//                         {editAccess && (
//                             <td>
//                                 <EditFunc
//                                     id={row.id}
//                                     table_name={table_name}
//                                     token={token}
//                                     onDataUpdated={onDataUpdated}
//                                     onDelete={() => handleDelete(row.id)}
//                                 />
//                             </td>
//                         )}
//                     </tr>
//                 ))}
//                 </tbody>
//                 <tfoot>
//                 <tr>
//                     <td colSpan={columns.length + (editAccess ? 2 : 1)}>
//                         <div className="pagination-container">
//                             {renderPagination()}
//                         </div>
//                     </td>
//                 </tr>
//                 </tfoot>
//             </table>
//         </div>
//     );
// }
//
// export default TableWithPagination;