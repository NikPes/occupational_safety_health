import axios from "axios";
import { useNavigate } from 'react-router-dom';

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
            url: "/flaskCuda/logout",
            headers: {
                Authorization: 'Bearer ' + props.token
            }
        })
            .then(() => {
                props.clearToken()
                props.token()
                navigate('/login');
            }).catch((error) => {
            if (error.response) {
                console.log(error.response)
                console.log(error.response.status)
                console.log(error.response.headers)
            }
        })
    };


    return (
        <li className="exit">
            <ul>
                <li>
                    <a href="/logout" onClick={deleteToken}>Выход</a>
                </li>
            </ul>
        </li>
    )
}

export default UnLogin;