import { useState } from "react";
import "./Search.css";

function Search({ onSearch }) {
    const [searchValue, setSearchValue] = useState("");

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            executeSearch();
        }
    };

    const executeSearch = () => {
        onSearch(searchValue.trim()); // Передаем запрос только при явном действии
    };

    return (
        <div className="search-block-form">
            <div className="form-item">
                <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="inputField"
                />
            </div>
            <div className="form-actions">
                <input
                    type="submit"
                    onClick={executeSearch}
                    aria-label="Выполнить поиск"
                >
                </input>
            </div>
        </div>
    );
}

export default Search;