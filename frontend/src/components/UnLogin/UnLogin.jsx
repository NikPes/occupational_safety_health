import axios from "axios";
import { useNavigate } from 'react-router-dom';
import './UnLogin.css';

function UnLogin(props) {
    const navigate = useNavigate();

    const deleteToken = (event) => {
        event.preventDefault();
        if (!props.token) {
            console.error("Токен отсутствует");
            return;
        }
        axios({
            method: "POST",
            url: "/WorkOST/logout",
            headers: {
                Authorization: 'Bearer ' + props.token
            }
        })
            .then(() => {
                props.clearToken();
                navigate('/login');
            }).catch((error) => {
            if (error.response) {
                console.log(error.response);
            }
        });
    };

    const closeApplication = (event) => {
        event.preventDefault();
        if (window.confirm("Вы уверены, что хотите закрыть приложение?")) {
            window.close(); // Закрытие окна браузера
        }
    };

    return (
        <div className="UnLogin">
            <div className="menu">
                <div className="menu-title">
                    <span className="menu-text">Выход</span>
                </div>
                <ul className="menu-dropdown">
                    <li>
                        <a href="/logout" className="menu-item" onClick={deleteToken}>
                            Выйти из системы
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default UnLogin;