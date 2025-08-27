import './Header.css'
import MainMenu from '../MainMenu/MainMenu.jsx'
import UnLogin from "../UnLogin/UnLogin.jsx";
import {useEffect} from "react";

function Header(props) {

    useEffect(() => {
        const bodyElement = document.body;
        bodyElement.classList.add('img_fon');  // Добавляем класс
        bodyElement.setAttribute('lang', 'en');  // Устанавливаем атрибут lang

        return () => {
            bodyElement.classList.remove('img_fon');  // Удаляем класс
            bodyElement.removeAttribute('lang');  // Удаляем атрибут lang
        };
    }, [props.token]);
    return (
        <form className="main_nav">
            <nav className="img_overlay">
                <ul className="topmenu">
                    <MainMenu
                        token={props.token}
                        pageName={props.pageName}
                        setPageName={props.setPageName}
                    />
                </ul>
            </nav>
        </form>
    )
}

export default Header;