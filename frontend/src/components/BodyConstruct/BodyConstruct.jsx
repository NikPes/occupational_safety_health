import axios from "axios";
import React, {useEffect, useState, Suspense} from "react";
import LoadingCube from "../LoadingCube/LoadingCube"; // Импортируем компонент заглушки
import "./BodyConstruct.css"; // Импортируем стили

/**
 * @property {string} table_name - Название элемента меню.
 * @property {string} componentName - Название элемента меню.
 * @property {string} position_tab - Название элемента меню.
 */
// Импортируем компоненты
const ComTable = React.lazy(() => import('../ComTable/ComTable.jsx'));
const ComNodeSchemasBuilder = React.lazy(() => import('../ComNodeSchemasBuilder/ComNodeSchemasBuilder.jsx'));
const ComNodeBuilder = React.lazy(() => import('../ComNodeBuilder/ComNodeBuilder.jsx'));
// const ComGraphics = React.lazy(() => import('../ComGraphics/ComGraphics.jsx'));
// const ComConsole = React.lazy(() => import('../ComConsole/ComConsole.jsx'));
// const IntelligenceWork = React.lazy(() => import('../IntelligenceWork/IntelligenceWork.jsx'));
//
// Объект-маппинг для компонентов
const componentsMap = {
    ComTable,
    ComNodeBuilder,
    ComNodeSchemasBuilder,
    // ComGraphics,
    // ComConsole,
    // IntelligenceWork,
    // Добавьте другие компоненты по мере необходимости
};

// Компонент для отображения элемента pageStructure
function PageStructureItem({ item, token, table_name, count_sheet }) {
    const [componentName, setComponentName] = useState(null);

    useEffect(() => {
        // Получаем ID независимо от формата данных
        const typeDataId = item.id_type_data?.id || item.id_type_data;

        if (!typeDataId) {
            console.error("Missing type_data ID");
            return;
        }

        axios.get("/WorkOST/body_construct/getComponentName", {
            headers: { Authorization: `Bearer ${token}` },
            params: { type_data: typeDataId }
        })
        .then(response => setComponentName(response.data.componentName))
        .catch(error => console.error("Error:", error));
    }, [item.id_type_data, token]);

    if (!componentName) {
        return <LoadingCube />;
    }

    const Component = componentsMap[componentName];
    if (Component) {
        return (
            <Suspense fallback={<div>Загрузка компонента...</div>}>
                <Component data={item}
                           token={token}
                           table_name={table_name}
                           count_sheet={count_sheet}/>
            </Suspense>
        );
    } else {
        return <div>Компонент не найден: {componentName}</div>;
    }
}

function BodyConstruct(props) {
    const [pageStructure, setPageStructure] = useState([]);  // Состояние для структуры страницы

    // Загрузка структуры страницы при изменении props.pageName
    useEffect(() => {
        document.title = props.pageName; // Устанавливаем заголовок страницы
        getPageStructure();
    }, [props.pageName]);

    // Запрос структуры страницы
    const getPageStructure = () => {
        axios({
            method: "GET",
            url: "/WorkOST/body_construct/pageConstruction",
            headers: {
                Authorization: 'Bearer ' + props.token
            },
            params: {
                page_name: props.pageName, // Передаем название страницы
            }
        })
            .then((response) => {
                setPageStructure(response.data);  // Сохраняем структуру страницы
            })
            .catch((error) => {
                if (error.response) {
                    console.error("Ошибка при запросе структуры страницы:", error.response);
                }
            });
    };

    return (
        <div className={props.pageName}>
            {pageStructure.map((item) => (
                <div key={item.id} className={item.position_tab}>
                    <div className="PageStructureContainer">
                        <h2>{item.table_name}</h2>
                        <PageStructureItem item={item}
                                           token={props.token}
                                           table_name={item.table_name}
                                           count_sheet={item.count_sheet} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default BodyConstruct;