import React from "react";
import "./LoadingCube.css"; // Импортируем стили

function LoadingCube() {
    return (
        <div className="loading-cube-container">
            <div className="loading-cube">
                <div className="face front"></div>
                <div className="face back"></div>
                <div className="face left"></div>
                <div className="face right"></div>
                <div className="face top"></div>
                <div className="face bottom"></div>
            </div>
            <p>Загрузка...</p>
        </div>
    );
}

export default LoadingCube;